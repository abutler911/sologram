import { useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useUploadManager = (setMedia) => {
  const mountedRef = useRef(true);

  const uploadFile = async (file, id, onProgress) => {
    console.log(
      `Starting upload for file: ${file.name}, size: ${file.size} bytes`
    );

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Sending file to server...");
      // Upload to our own server endpoint instead of directly to Cloudinary
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress(percent);
            console.log(`Upload progress: ${percent}%`);
          }
        },
        // Add timeout to prevent stalled uploads
        timeout: 60000, // 60 seconds
      });

      console.log("Server response received:", response.data);

      // Server should return the required data in the same format we had before
      if (response.data && response.data.success) {
        return {
          mediaUrl: response.data.mediaUrl,
          cloudinaryId: response.data.cloudinaryId,
          mediaType: response.data.mediaType,
        };
      } else {
        console.error("Upload failed with error:", response.data);
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (error) {
      // Detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Upload error - server response:", error.response.data);
        console.error("Upload error - status:", error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Upload error - no response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Upload error:", error.message);
      }
      throw new Error(
        error.response?.data?.message || error.message || "Upload failed"
      );
    }
  };

  const startUpload = async (file, id) => {
    console.log(`Starting upload process for ${file.name}`);

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
      console.log("Upload result:", result);

      if (!mountedRef.current) {
        console.log("Component unmounted, not updating state");
        return result;
      }

      console.log("Updating media state with result");
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                uploading: false,
                mediaUrl: result.mediaUrl,
                cloudinaryId: result.cloudinaryId,
                mediaType: result.mediaType,
                type: result.mediaType,
              }
            : item
        )
      );

      toast.success("Upload complete");
      return result;
    } catch (error) {
      console.error("Start upload error:", error);

      if (mountedRef.current) {
        console.log("Marking upload as failed in state");
        setMedia((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, uploading: false, error: true } : item
          )
        );
        toast.error(`Upload failed: ${error.message || "Unknown error"}`);
      }

      throw error;
    }
  };

  return { startUpload, mountedRef };
};
