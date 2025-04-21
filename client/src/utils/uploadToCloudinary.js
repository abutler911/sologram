export const uploadToCloudinary = async (file, onProgress, cancelToken) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_post_upload");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.cloudinary.com/v1_1/ds5rxplmr/auto/upload");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    });

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText || "{}");
        if (xhr.status === 200 && res.secure_url) {
          const result = {
            mediaUrl: res.secure_url,
            cloudinaryId: res.public_id,
            mediaType: file.type.startsWith("video") ? "video" : "image",
          };
          console.log("✅ Upload successful:", res.secure_url);
          resolve(result);
        } else {
          const errorMsg =
            res.error?.message || `Upload failed (status ${xhr.status})`;
          console.error("❌ Cloudinary Error:", errorMsg);
          reject(new Error(errorMsg));
        }
      } catch (parseErr) {
        console.error("❌ Failed to parse Cloudinary response:", parseErr);
        reject(new Error("Invalid response from Cloudinary"));
      }
    };

    xhr.onerror = () => {
      console.error("❌ Network error during Cloudinary upload");
      reject(new Error("Upload network error"));
    };

    // Properly handle cancellation
    if (cancelToken) {
      cancelToken.promise
        .then(() => {
          xhr.abort();
          reject(new Error("Upload cancelled"));
        })
        .catch(() => {});
    }

    xhr.send(formData);
  });
};
