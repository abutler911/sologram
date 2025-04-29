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
    };

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

    // Fetch resources with simple parameters to minimize errors
    let resources = [];

    if (type === "video" || type === "all") {
      try {
        const videoResponse = await cloudinary.api.resources({
          ...options,
          resource_type: "video",
        });
        resources = [...resources, ...videoResponse.resources];
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
        resources = [...resources, ...imageResponse.resources];
      } catch (imageError) {
        console.error("Error fetching image resources:", imageError);
      }
    }

    // Sort by created_at (newest first)
    resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
