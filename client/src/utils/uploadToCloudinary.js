export const uploadToCloudinary = async (file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_post_upload");

    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.cloudinary.com/v1_1/ds5rxplmr/auto/upload");

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && res.secure_url) {
            resolve({
              mediaUrl: res.secure_url,
              cloudinaryId: res.public_id,
              mediaType: file.type.startsWith("video") ? "video" : "image",
            });
            console.log("Upload successful:", res.secure_url);
          } else {
            reject(new Error(res.error?.message || "Upload failed"));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(formData);
    });
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
};
