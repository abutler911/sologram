// server/controllers/cloudinaryController.js
const { cloudinary } = require("../config/cloudinary");

// pull all pages for a given resource_type + prefix
async function fetchAllResources({
  resource_type,
  prefix = "sologram/",
  max_results = 500,
}) {
  const out = [];
  let next_cursor;
  do {
    const res = await cloudinary.api.resources({
      resource_type,
      type: "upload",
      prefix, // <-- this is the right way to scope to a "folder"
      max_results,
      next_cursor,
    });
    if (res?.resources?.length) out.push(...res.resources);
    next_cursor = res.next_cursor;
  } while (next_cursor);
  return out;
}

// Build UTC bounds from local YYYY-MM-DD sent by client (already ISO-safe on client)
function toDateOrNull(v) {
  try {
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}

exports.getCloudinaryAssets = async (req, res) => {
  try {
    console.log("Starting Cloudinary assets fetch");

    // ---- Fetch everything under sologram/ (images + videos) with proper pagination
    const [images, videos] = await Promise.all([
      fetchAllResources({ resource_type: "image" }),
      fetchAllResources({ resource_type: "video" }),
    ]);

    // Combine & keep only items under sologram/
    let allResources = [...images, ...videos].filter(
      (r) => r.public_id && r.public_id.startsWith("sologram/")
    );

    // ---- Filtering
    const { type, dateRange, startDate, endDate } = req.query;

    if (type && type !== "all") {
      allResources = allResources.filter((a) => a.resource_type === type);
      console.log(`Filtered by type=${type}: ${allResources.length}`);
    }

    // Build date window
    let fromDate = null;
    let toDate = null;

    // Explicit start/end take precedence if present
    const explicitStart = toDateOrNull(startDate);
    const explicitEnd = toDateOrNull(endDate);

    if (explicitStart) fromDate = explicitStart;
    if (explicitEnd) {
      // ensure inclusive end-of-day if a plain date was sent
      const e = new Date(explicitEnd);
      if (
        e.getUTCHours() === 0 &&
        e.getUTCMinutes() === 0 &&
        e.getUTCSeconds() === 0 &&
        e.getUTCMilliseconds() === 0
      ) {
        e.setUTCHours(23, 59, 59, 999);
      }
      toDate = e;
    }

    // If not explicitly set, fall back to dateRange presets
    if (!fromDate && dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "today") {
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      } else if (dateRange === "thisWeek") {
        // start of week (Sunday, local)
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - now.getDay());
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      } else if (dateRange === "thisMonth") {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        toDate = new Date(now);
        toDate.setHours(23, 59, 59, 999);
      } else if (dateRange === "custom") {
        // already handled by explicit bounds above
      }
    }

    if (fromDate) {
      allResources = allResources.filter(
        (a) => new Date(a.created_at) >= fromDate
      );
    }
    if (toDate) {
      allResources = allResources.filter(
        (a) => new Date(a.created_at) <= toDate
      );
    }

    // ---- Stats + sort
    allResources.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const statistics = {
      imageCount: allResources.filter((r) => r.resource_type === "image")
        .length,
      videoCount: allResources.filter((r) => r.resource_type === "video")
        .length,
      totalStorage: allResources.reduce((sum, r) => sum + (r.bytes || 0), 0),
    };

    // ---- Pagination (app-level)
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 30, 10);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const totalCount = allResources.length;
    const totalPages = Math.ceil(totalCount / limit);
    const results = allResources.slice(startIndex, endIndex);

    return res.json({
      success: true,
      results,
      totalCount,
      hasMore: page < totalPages,
      page,
      limit,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching Cloudinary assets:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching Cloudinary assets",
      error: error.toString(),
    });
  }
};

// Delete a Cloudinary asset
exports.deleteCloudinaryAsset = async (req, res) => {
  try {
    // public IDs can contain slashes; route params are URL-encoded
    const rawId = req.params.publicId;
    const publicId = decodeURIComponent(rawId || "");

    if (!publicId) {
      return res
        .status(400)
        .json({ success: false, message: "Public ID is required" });
    }

    // Guard: only allow sologram/*
    if (!publicId.startsWith("sologram/")) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete assets outside of SoloGram folder",
      });
    }

    // Try image first
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true, // purge CDN
      });
      if (result.result === "ok") {
        return res.json({
          success: true,
          message: "Asset deleted successfully",
          result,
        });
      }
    } catch (e) {
      // fall through
    }

    // Try video
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
        invalidate: true,
      });
      if (result.result === "ok") {
        return res.json({
          success: true,
          message: "Asset deleted successfully",
          result,
        });
      }
      return res
        .status(400)
        .json({ success: false, message: "Failed to delete asset", result });
    } catch (err) {
      console.error("Error deleting video asset:", err);
      return res.status(500).json({
        success: false,
        message: "Error deleting asset",
        error: err.toString(),
      });
    }
  } catch (error) {
    console.error("Error deleting Cloudinary asset:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting Cloudinary asset",
      error: error.toString(),
    });
  }
};
