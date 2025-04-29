const { cloudinary } = require("../config/cloudinary");

// Get all Cloudinary assets with filtering and pagination
exports.getCloudinaryAssets = async (req, res) => {
  try {
    // Simple options
    const options = {
      max_results: 100,
      // Use exact folder path instead of prefix
      folder: "sologram",
      type: "upload",
    };

    // Fetch images
    let resources = [];

    try {
      const imageResponse = await cloudinary.api.resources({
        ...options,
        resource_type: "image",
      });

      if (imageResponse.resources) {
        resources = [...resources, ...imageResponse.resources];
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }

    // Fetch videos
    try {
      const videoResponse = await cloudinary.api.resources({
        ...options,
        resource_type: "video",
      });

      if (videoResponse.resources) {
        resources = [...resources, ...videoResponse.resources];
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }

    // Sort by created_at (newest first)
    resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      results: resources,
      totalCount: resources.length,
      hasMore: false,
      page: 1,
      limit: 100,
      statistics: {
        imageCount: resources.filter((r) => r.resource_type === "image").length,
        videoCount: resources.filter((r) => r.resource_type === "video").length,
        totalStorage: resources.reduce((sum, r) => sum + (r.bytes || 0), 0),
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

    // Safety check for sologram folder
    if (!publicId.includes("sologram/")) {
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
