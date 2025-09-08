// src/components/posts/PostCreator/utils/preview.js
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

export const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

export const createSafeBlobUrl = (file) => {
  try {
    if (file.type.startsWith("image/")) {
      if (isMobileDevice()) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      } else {
        return Promise.resolve(URL.createObjectURL(file));
      }
    }
    return Promise.resolve(URL.createObjectURL(file));
  } catch {
    return Promise.resolve(null);
  }
};

export const getSafeImageSrc = (mediaItem) => {
  if (mediaItem.mediaUrl) return mediaItem.mediaUrl;
  if (mediaItem.previewUrl) return mediaItem.previewUrl;
  return PLACEHOLDER_IMG;
};
