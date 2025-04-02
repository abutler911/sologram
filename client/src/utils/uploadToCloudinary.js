// utils/uploadToCloudinary.js
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_post_upload");

  try {
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    return {
      mediaUrl: data.secure_url,
      cloudinaryId: data.public_id,
      mediaType: file.type.startsWith("video") ? "video" : "image",
    };
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    throw err;
  }
};
