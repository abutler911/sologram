const { cloudinary } = require("../config/cloudinary");

// Get all Cloudinary assets with filtering and pagination
exports.getCloudinaryAssets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      type,
      dateRange,
      startDate,
      endDate,
    } = req.query;

    // Prepare search parameters
    let searchParams = {
      resource_type: type === "all" ? undefined : type,
      max_results: parseInt(limit),
      next_cursor: req.query.cursor || undefined,
      type: "upload", // Only get uploaded assets, not derived ones
      prefix: "sologram", // Only get assets from the SoloGram folder
    };

    // Add date filtering if specified
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let fromDate;

      switch (dateRange) {
        case "today":
          fromDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "thisWeek":
          // Start of current week (Sunday)
          fromDate = new Date(now);
          fromDate.setDate(now.getDate() - now.getDay());
          fromDate.setHours(0, 0, 0, 0);
          break;
        case "thisMonth":
          // Start of current month
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "custom":
          if (startDate) {
            fromDate = new Date(startDate);
          }
          break;
      }

      if (fromDate) {
        searchParams.start_at = fromDate.toISOString();
      }

      if (dateRange === "custom" && endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        searchParams.end_at = toDate.toISOString();
      }
    }

    // Get assets count for statistics
    const imageStats = await cloudinary.api.usage();

    // Query for images and videos separately if type is "all"
    let results = [];
    let totalCount = 0;
    let cursor;

    if (type === "video" || type === "all") {
      const videoResponse = await cloudinary.api.resources({
        ...searchParams,
        resource_type: "video",
      });

      if (type === "all") {
        results = [...results, ...videoResponse.resources];
        totalCount += videoResponse.total_count;
        cursor = videoResponse.next_cursor;
      } else {
        results = videoResponse.resources;
        totalCount = videoResponse.total_count;
        cursor = videoResponse.next_cursor;
      }
    }

    if (type === "image" || type === "all") {
      const imageResponse = await cloudinary.api.resources({
        ...searchParams,
        resource_type: "image",
      });

      if (type === "all") {
        results = [...results, ...imageResponse.resources];
        totalCount += imageResponse.total_count;
        cursor = imageResponse.next_cursor || cursor;
      } else {
        results = imageResponse.resources;
        totalCount = imageResponse.total_count;
        cursor = imageResponse.next_cursor;
      }
    }

    // Sort results by created_at (newest first)
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Extract statistics
    const statistics = {
      imageCount: imageStats.resources.image.count,
      videoCount: imageStats.resources.video.count,
      totalStorage:
        imageStats.resources.image.bandwidth +
        imageStats.resources.video.bandwidth,
    };

    return res.json({
      results,
      totalCount,
      hasMore: !!cursor,
      nextCursor: cursor,
      page: parseInt(page),
      limit: parseInt(limit),
      statistics,
    });
  } catch (error) {
    console.error("Error fetching Cloudinary assets:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching Cloudinary assets",
    });
  }
};

// Delete a Cloudinary asset
exports.deleteCloudinaryAsset = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    // Determine resource type
    let resourceType = "image";
    try {
      // Try to get the resource to determine its type
      await cloudinary.api.resource(publicId);
    } catch (error) {
      // If not found as image, try video
      if (error.http_code === 404) {
        resourceType = "video";
      } else {
        throw error;
      }
    }

    // Delete the asset
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok") {
      return res.status(400).json({
        success: false,
        message: "Failed to delete asset",
        result,
      });
    }

    return res.json({
      success: true,
      message: "Asset deleted successfully",
      result,
    });
  } catch (error) {
    console.error("Error deleting Cloudinary asset:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting Cloudinary asset",
    });
  }
};
