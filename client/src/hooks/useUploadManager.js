import { useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useUploadManager = (setMedia) => {
  const mountedRef = useRef(true);

  const uploadFile = async (file, id, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload to our own server endpoint instead of directly to Cloudinary
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress(percent);
          }
        },
      });

      // Server should return the required data in the same format we had before
      if (response.data && response.data.success) {
        return {
          mediaUrl: response.data.mediaUrl,
          cloudinaryId: response.data.cloudinaryId,
          mediaType: response.data.mediaType,
        };
      } else {
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (error) {
      console.error(
        "Upload error:",
        error.response?.data || error.message || error
      );
      throw new Error("Upload failed");
    }
  };

  const startUpload = async (file, id) => {
    const onProgress = (percent) => {
      if (!mountedRef.current) return;
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: percent } : item
        )
      );
    };

    try {
      const result = await uploadFile(file, id, onProgress);

      if (!mountedRef.current) return result;

      setMedia((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                mediaUrl: result.mediaUrl,
                cloudinaryId: result.cloudinaryId,
                mediaType: result.mediaType,
                type: result.mediaType,
                uploading: false,
              }
            : item
        )
      );

      toast.success("Upload complete");
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setMedia((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, uploading: false, error: true } : item
          )
        );
        toast.error("Upload failed");
      }
      throw error;
    }
  };

  return { startUpload, mountedRef };
};
