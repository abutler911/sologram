const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const cloudinaryController = require("../controllers/cloudinaryController");

// All routes are protected and require admin role
router.use(protect);
router.use(authorize("admin"));

// Get all Cloudinary assets with filtering and pagination
router.get("/", cloudinaryController.getCloudinaryAssets);

// Delete a Cloudinary asset
router.delete("/:publicId(*)", cloudinaryController.deleteCloudinaryAsset);

router.get("/debug", async (req, res) => {
  try {
    // Get all folders to check structure
    const folders = await cloudinary.api.root_folders();

    // Get resources with folder parameter
    const folderResources = await cloudinary.api.resources({
      type: "upload",
      folder: "sologram",
      max_results: 10,
    });

    // Get resources with prefix parameter
    const prefixResources = await cloudinary.api.resources({
      type: "upload",
      prefix: "sologram/",
      max_results: 10,
    });

    // Return all information for debugging
    res.json({
      success: true,
      folders: folders.folders,
      folderMethod: {
        count: folderResources.resources?.length || 0,
        sample: folderResources.resources?.slice(0, 3).map((r) => ({
          public_id: r.public_id,
          folder: r.folder,
          url: r.url,
        })),
      },
      prefixMethod: {
        count: prefixResources.resources?.length || 0,
        sample: prefixResources.resources?.slice(0, 3).map((r) => ({
          public_id: r.public_id,
          folder: r.folder,
          url: r.url,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
