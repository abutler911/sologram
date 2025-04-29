const { cloudinary } = require("../config/cloudinary");

// Get all Cloudinary assets with optimized filtering
exports.getCloudinaryAssets = async (req, res) => {
  try {
    console.log("Starting Cloudinary assets fetch");

    // Initialize resources array
    let allResources = [];

    // Get images with folder parameter including pagination
    try {
      console.log("Fetching images using folder parameter...");
      const folderResponse = await cloudinary.api.resources({
        resource_type: "image",
        max_results: 500, // Standard limit that most Cloudinary plans support
        type: "upload",
        folder: "sologram",
      });

      if (folderResponse.resources && folderResponse.resources.length > 0) {
        console.log(
          `Found ${folderResponse.resources.length} images with folder parameter`
        );
        allResources = [...allResources, ...folderResponse.resources];

        // Get next page if available
        if (folderResponse.next_cursor) {
          console.log("Getting next page of images...");
          const nextPageResponse = await cloudinary.api.resources({
            resource_type: "image",
            max_results: 500,
            type: "upload",
            folder: "sologram",
            next_cursor: folderResponse.next_cursor,
          });

          if (
            nextPageResponse.resources &&
            nextPageResponse.resources.length > 0
          ) {
            console.log(
              `Found ${nextPageResponse.resources.length} more images in next page`
            );

            // Add only unique resources
            const existingIds = new Set(allResources.map((r) => r.public_id));
            const newResources = nextPageResponse.resources.filter(
              (r) => !existingIds.has(r.public_id)
            );

            console.log(
              `Adding ${newResources.length} unique resources from next page`
            );
            allResources = [...allResources, ...newResources];
          }
        }
      }
    } catch (error) {
      console.error(
        "Error fetching images with folder parameter:",
        error.message
      );
    }

    // Get videos with folder parameter
    try {
      console.log("Fetching videos...");
      const videoResponse = await cloudinary.api.resources({
        resource_type: "video",
        max_results: 100,
        type: "upload",
        folder: "sologram",
      });

      if (videoResponse.resources && videoResponse.resources.length > 0) {
        console.log(`Found ${videoResponse.resources.length} videos`);

        // Add only unique resources
        const existingIds = new Set(allResources.map((r) => r.public_id));
        const newResources = videoResponse.resources.filter(
          (r) => !existingIds.has(r.public_id)
        );

        console.log(`Adding ${newResources.length} unique videos`);
        allResources = [...allResources, ...newResources];
      }
    } catch (error) {
      console.error("Error fetching videos:", error.message);
    }

    // Backup: Use prefix parameter for any missing assets
    if (allResources.length < 240) {
      try {
        console.log("Using prefix parameter to find any missing assets...");
        const prefixResponse = await cloudinary.api.resources({
          resource_type: "image",
          max_results: 500,
          type: "upload",
          prefix: "sologram/",
        });

        if (prefixResponse.resources) {
          const existingIds = new Set(allResources.map((r) => r.public_id));
          const newResources = prefixResponse.resources.filter(
            (r) => !existingIds.has(r.public_id)
          );

          console.log(
            `Found ${newResources.length} additional images with prefix parameter`
          );
          allResources = [...allResources, ...newResources];
        }
      } catch (error) {
        console.error("Error with prefix parameter:", error.message);
      }
    }

    // Final verification to ensure we only have sologram assets
    const verifiedResources = allResources.filter(
      (asset) =>
        asset.folder === "sologram" ||
        asset.public_id.includes("sologram/") ||
        (asset.tags && asset.tags.includes("sologram"))
    );

    console.log(
      `Final count: ${verifiedResources.length} verified sologram assets`
    );

    // Sort by created_at (newest first)
    verifiedResources.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // Process filters from request
    const { type, dateRange, startDate, endDate } = req.query;
    let filteredResources = verifiedResources;

    // Filter by type if specified
    if (type && type !== "all") {
      filteredResources = filteredResources.filter(
        (asset) => asset.resource_type === type
      );
      console.log(
        `Filtered by type ${type}: ${filteredResources.length} assets`
      );
    }

    // Filter by date if specified
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
        filteredResources = filteredResources.filter(
          (asset) => new Date(asset.created_at) >= fromDate
        );
      }

      if (dateRange === "custom" && endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);

        filteredResources = filteredResources.filter(
          (asset) => new Date(asset.created_at) <= toDate
        );
      }

      console.log(`Filtered by date: ${filteredResources.length} assets`);
    }

    // Calculate statistics
    const statistics = {
      imageCount: filteredResources.filter((r) => r.resource_type === "image")
        .length,
      videoCount: filteredResources.filter((r) => r.resource_type === "video")
        .length,
      totalStorage: filteredResources.reduce(
        (sum, r) => sum + (r.bytes || 0),
        0
      ),
    };

    // Handle pagination
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 30);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedResources = filteredResources.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredResources.length / limit);

    return res.json({
      success: true,
      results: paginatedResources,
      totalCount: filteredResources.length,
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
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    // Safety check for sologram folder
    if (!publicId.includes("sologram")) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete assets outside of SoloGram folder",
      });
    }

    // Try with image resource type first
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      if (result.result === "ok") {
        return res.json({
          success: true,
          message: "Asset deleted successfully",
          result,
        });
      }
    } catch (err) {
      console.error("Error deleting image, trying video...", err);
    }

    // If image delete fails, try video
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
      });

      if (result.result === "ok") {
        return res.json({
          success: true,
          message: "Asset deleted successfully",
          result,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Failed to delete asset",
          result,
        });
      }
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
