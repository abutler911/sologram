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

    // Basic error handling
    if (!cloudinary || !cloudinary.api) {
      console.error("Cloudinary configuration is missing or invalid");
      return res.status(500).json({
        success: false,
        message: "Cloudinary configuration error",
      });
    }

    // Start with basic parameters
    const options = {
      max_results: parseInt(limit, 10),
      type: "upload",
      // Add a prefix to only get media from SoloGram-specific folders
      prefix: "sologram", // Change this to match your actual folder structure
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
        options.start_at = fromDate.toISOString();
      }

      if (dateRange === "custom" && endDate) {
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        options.end_at = toDate.toISOString();
      }
    }

    // Try to get statistics first to check connection
    let statistics = null;
    try {
      const usageResponse = await cloudinary.api.usage();
      statistics = {
        imageCount: usageResponse.resources.image.count || 0,
        videoCount: usageResponse.resources.video.count || 0,
        totalStorage:
          (usageResponse.resources.image.bandwidth || 0) +
          (usageResponse.resources.video.bandwidth || 0),
      };
    } catch (statsError) {
      console.error("Error fetching Cloudinary usage statistics:", statsError);
      // Continue even if stats fail
    }

    // If no specific folder prefix is configured, try to get all assets related to SoloGram
    // by using tags, context metadata, or other identifiers
    if (!options.prefix) {
      // Look for assets with a sologram tag (if you use tagging in your app)
      options.tags = true;
    }

    // Fetch resources with specified parameters
    let resources = [];

    if (type === "video" || type === "all") {
      try {
        const videoResponse = await cloudinary.api.resources({
          ...options,
          resource_type: "video",
        });

        // Log for debugging
        console.log(
          `Found ${videoResponse.resources?.length || 0} video resources`
        );

        if (videoResponse.resources && videoResponse.resources.length > 0) {
          resources = [...resources, ...videoResponse.resources];
        }
      } catch (videoError) {
        console.error("Error fetching video resources:", videoError);
      }
    }

    if (type === "image" || type === "all") {
      try {
        const imageResponse = await cloudinary.api.resources({
          ...options,
          resource_type: "image",
        });

        // Log for debugging
        console.log(
          `Found ${imageResponse.resources?.length || 0} image resources`
        );

        if (imageResponse.resources && imageResponse.resources.length > 0) {
          resources = [...resources, ...imageResponse.resources];
        }
      } catch (imageError) {
        console.error("Error fetching image resources:", imageError);
      }
    }

    // Post-process results to filter out non-SoloGram media if needed
    // This is a fallback if the prefix doesn't work
    /* 
    resources = resources.filter(asset => {
      // Example: Check if the asset has SoloGram-specific tags or metadata
      return asset.tags?.includes('sologram') || 
             asset.public_id.includes('sologram') ||
             asset.folder?.includes('sologram');
    });
    */

    // Sort by created_at (newest first)
    resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Get SoloGram-specific statistics if possible
    if (statistics) {
      // These are general account stats, not specifically for SoloGram
      // You might want to calculate SoloGram-specific stats based on the filtered resources
      const sologramStats = {
        imageCount: resources.filter((r) => r.resource_type === "image").length,
        videoCount: resources.filter((r) => r.resource_type === "video").length,
        // Estimate storage based on bytes
        totalStorage: resources.reduce((sum, r) => sum + (r.bytes || 0), 0),
        // Keep the account totals for reference
        accountTotals: statistics,
      };

      statistics = sologramStats;
    }

    return res.json({
      success: true,
      results: resources,
      totalCount: resources.length,
      hasMore: false, // Simplified, not using cursor for now
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      statistics: statistics || {
        imageCount: 0,
        videoCount: 0,
        totalStorage: 0,
      },
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

    // Add safety check to prevent deletion of non-SoloGram assets
    if (!publicId.includes("sologram")) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete assets outside of SoloGram scope",
      });
    }

    if (!cloudinary || !cloudinary.uploader) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary configuration error",
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
    } catch (imageError) {
      console.error("Error deleting image, trying video...", imageError);
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
    } catch (videoError) {
      console.error("Error deleting video asset:", videoError);
      return res.status(500).json({
        success: false,
        message: "Error deleting asset",
        error: videoError.toString(),
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
