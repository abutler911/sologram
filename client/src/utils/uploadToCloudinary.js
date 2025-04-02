export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_post_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/ds5rxplmr/auto/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return {
    mediaUrl: data.secure_url,
    cloudinaryId: data.public_id,
    mediaType: file.type.startsWith("video") ? "video" : "image",
  };
};
