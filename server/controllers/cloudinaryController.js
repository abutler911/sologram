const { cloudinary } = require("../config/cloudinary");

// Get all Cloudinary assets with multiple filtering techniques
exports.getCloudinaryAssets = async (req, res) => {
  try {
    console.log("Starting Cloudinary assets fetch");

    // Get all resources without folder filter first
    let allResources = [];

    // First try: Get resources with direct folder parameter
    try {
      console.log("Trying folder parameter...");
      const folderResponse = await cloudinary.api.resources({
        resource_type: "image",
        max_results: 800,
        type: "upload",
        folder: "sologram",
      });

      if (folderResponse.resources && folderResponse.resources.length > 0) {
        console.log(
          `Found ${folderResponse.resources.length} images with folder parameter`
        );
        allResources = [...allResources, ...folderResponse.resources];
      }
      try {
        console.log("Trying subfolder search...");
        const subfoldersResponse = await cloudinary.api.subfolders({
          folder: "sologram",
        });

        if (
          subfoldersResponse.folders &&
          subfoldersResponse.folders.length > 0
        ) {
          console.log(`Found ${subfoldersResponse.folders.length} subfolders`);

          // For each subfolder, get its resources
          for (const subfolder of subfoldersResponse.folders) {
            try {
              const subfolderPath = subfolder.path;
              console.log(`Checking subfolder: ${subfolderPath}`);

              const subfolderImagesResponse = await cloudinary.api.resources({
                resource_type: "image",
                max_results: 100,
                type: "upload",
                folder: subfolderPath,
              });

              if (
                subfolderImagesResponse.resources &&
                subfolderImagesResponse.resources.length > 0
              ) {
                console.log(
                  `Found ${subfolderImagesResponse.resources.length} images in subfolder ${subfolderPath}`
                );

                // Add only resources not already in the array
                const existingIds = new Set(
                  allResources.map((r) => r.public_id)
                );
                const newResources = subfolderImagesResponse.resources.filter(
                  (r) => !existingIds.has(r.public_id)
                );

                console.log(
                  `Adding ${newResources.length} unique new resources from subfolder ${subfolderPath}`
                );
                allResources = [...allResources, ...newResources];
              }

              // Also check for videos in this subfolder
              const subfolderVideosResponse = await cloudinary.api.resources({
                resource_type: "video",
                max_results: 100,
                type: "upload",
                folder: subfolderPath,
              });

              if (
                subfolderVideosResponse.resources &&
                subfolderVideosResponse.resources.length > 0
              ) {
                console.log(
                  `Found ${subfolderVideosResponse.resources.length} videos in subfolder ${subfolderPath}`
                );

                // Add only resources not already in the array
                const existingIds = new Set(
                  allResources.map((r) => r.public_id)
                );
                const newResources = subfolderVideosResponse.resources.filter(
                  (r) => !existingIds.has(r.public_id)
                );

                console.log(
                  `Adding ${newResources.length} unique new videos from subfolder ${subfolderPath}`
                );
                allResources = [...allResources, ...newResources];
              }
            } catch (error) {
              console.error(
                `Error fetching resources from subfolder ${subfolder.path}:`,
                error.message
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching subfolders:", error.message);
      }
    } catch (error) {
      console.error("Error fetching with folder parameter:", error.message);
    }

    // Second try: Get with prefix
    try {
      console.log("Trying prefix parameter...");
      const prefixResponse = await cloudinary.api.resources({
        resource_type: "image",
        max_results: 500,
        type: "upload",
        prefix: "sologram/",
      });

      if (prefixResponse.resources && prefixResponse.resources.length > 0) {
        console.log(
          `Found ${prefixResponse.resources.length} images with prefix parameter`
        );

        // Add only resources not already in the array
        const existingIds = new Set(allResources.map((r) => r.public_id));
        const newResources = prefixResponse.resources.filter(
          (r) => !existingIds.has(r.public_id)
        );

        console.log(
          `Adding ${newResources.length} unique new resources from prefix search`
        );
        allResources = [...allResources, ...newResources];
      }
    } catch (error) {
      console.error("Error fetching with prefix parameter:", error.message);
    }

    // Third try: Get videos with folder parameter
    try {
      console.log("Trying video folder parameter...");
      const videoFolderResponse = await cloudinary.api.resources({
        resource_type: "video",
        max_results: 100,
        type: "upload",
        folder: "sologram",
      });

      if (
        videoFolderResponse.resources &&
        videoFolderResponse.resources.length > 0
      ) {
        console.log(
          `Found ${videoFolderResponse.resources.length} videos with folder parameter`
        );

        // Add only resources not already in the array
        const existingIds = new Set(allResources.map((r) => r.public_id));
        const newResources = videoFolderResponse.resources.filter(
          (r) => !existingIds.has(r.public_id)
        );

        allResources = [...allResources, ...newResources];
      }
    } catch (error) {
      console.error(
        "Error fetching videos with folder parameter:",
        error.message
      );
    }

    // Fourth try: Get videos with prefix
    try {
      console.log("Trying video prefix parameter...");
      const videoPrefixResponse = await cloudinary.api.resources({
        resource_type: "video",
        max_results: 100,
        type: "upload",
        prefix: "sologram/",
      });

      if (
        videoPrefixResponse.resources &&
        videoPrefixResponse.resources.length > 0
      ) {
        console.log(
          `Found ${videoPrefixResponse.resources.length} videos with prefix parameter`
        );

        // Add only resources not already in the array
        const existingIds = new Set(allResources.map((r) => r.public_id));
        const newResources = videoPrefixResponse.resources.filter(
          (r) => !existingIds.has(r.public_id)
        );

        console.log(
          `Adding ${newResources.length} unique new video resources from prefix search`
        );
        allResources = [...allResources, ...newResources];
      }
    } catch (error) {
      console.error(
        "Error fetching videos with prefix parameter:",
        error.message
      );
    }

    // Final fallback - get everything and filter
    if (allResources.length === 0) {
      try {
        console.log("Fallback: fetching all resources and filtering...");
        const allImagesResponse = await cloudinary.api.resources({
          resource_type: "image",
          max_results: 500,
          type: "upload",
        });

        if (allImagesResponse.resources) {
          const soloGramImages = allImagesResponse.resources.filter(
            (r) => r.folder === "sologram" || r.public_id.includes("sologram/")
          );

          console.log(
            `Filtered ${soloGramImages.length} sologram images from ${allImagesResponse.resources.length} total images`
          );
          allResources = [...allResources, ...soloGramImages];
        }

        const allVideosResponse = await cloudinary.api.resources({
          resource_type: "video",
          max_results: 100,
          type: "upload",
        });

        if (allVideosResponse.resources) {
          const existingIds = new Set(allResources.map((r) => r.public_id));
          const soloGramVideos = allVideosResponse.resources.filter(
            (r) =>
              (r.folder === "sologram" || r.public_id.includes("sologram/")) &&
              !existingIds.has(r.public_id)
          );

          console.log(
            `Filtered ${soloGramVideos.length} sologram videos from ${allVideosResponse.resources.length} total videos`
          );
          allResources = [...allResources, ...soloGramVideos];
        }
      } catch (error) {
        console.error("Error in fallback fetching:", error.message);
      }
    }

    // Final verification filter to ensure we only have sologram assets
    const verifiedResources = allResources.filter((asset) => {
      return (
        asset.folder === "sologram" ||
        asset.public_id.includes("sologram/") ||
        (asset.tags && asset.tags.includes("sologram"))
      );
    });

    console.log(
      `Final count: ${verifiedResources.length} verified sologram assets out of ${allResources.length} fetched`
    );

    // Sort by created_at (newest first)
    verifiedResources.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return res.json({
      success: true,
      results: verifiedResources,
      totalCount: verifiedResources.length,
      hasMore: false,
      statistics: {
        imageCount: verifiedResources.filter((r) => r.resource_type === "image")
          .length,
        videoCount: verifiedResources.filter((r) => r.resource_type === "video")
          .length,
        totalStorage: verifiedResources.reduce(
          (sum, r) => sum + (r.bytes || 0),
          0
        ),
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
