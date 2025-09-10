const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const cloudinaryController = require("../controllers/cloudinaryController");
const { cloudinary } = require("../config/cloudinary");

router.use(protect);
router.use(authorize("admin"));

const SOLO_PREFIX = process.env.CLOUDINARY_BASE_FOLDER || "sologram";

router.get("/debug", async (req, res) => {
  try {
    const roots = await cloudinary.api.root_folders();

    let subs = { folders: [] };
    try {
      subs = await cloudinary.api.sub_folders(SOLO_PREFIX);
    } catch (e) {}

    const img = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: `${SOLO_PREFIX}/`,
      max_results: 10,
    });

    const vid = await cloudinary.api.resources({
      type: "upload",
      resource_type: "video",
      prefix: `${SOLO_PREFIX}/`,
      max_results: 10,
    });

    res.json({
      success: true,
      baseFolder: SOLO_PREFIX,
      rootFolders: roots.folders?.map((f) => f.name) || [],
      subFolders: subs.folders?.map((f) => f.name) || [],
      images: {
        count: img.resources?.length || 0,
        sample: (img.resources || []).slice(0, 3).map((r) => ({
          public_id: r.public_id,
          folder: r.folder,
          url: r.secure_url,
        })),
      },
      videos: {
        count: vid.resources?.length || 0,
        sample: (vid.resources || []).slice(0, 3).map((r) => ({
          public_id: r.public_id,
          folder: r.folder,
          url: r.secure_url,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/", cloudinaryController.getCloudinaryAssets);
router.delete("/:publicId(*)", cloudinaryController.deleteCloudinaryAsset);

module.exports = router;
