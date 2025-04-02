export const uploadToCloudinary = async (file) => {
  try {
    const clonedFile = new File([file], file.name, { type: file.type });

    const formData = new FormData();
    formData.append("file", clonedFile);
    formData.append("upload_preset", "unsigned_post_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/ds5rxplmr/auto/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      console.error("Cloudinary upload failed:", data);
      throw new Error(
        data.error?.message || "Upload failed - no URL returned."
      );
    }

    return {
      mediaUrl: data.secure_url,
      cloudinaryId: data.public_id,
      mediaType: file.type.startsWith("video") ? "video" : "image",
    };
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
};
