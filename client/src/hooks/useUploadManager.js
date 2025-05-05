import { useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useUploadManager = (setMedia) => {
  // Initialize the ref but do NOT use useEffect to manage it
  const mountedRef = useRef(true);

  const uploadFile = async (file, id, onProgress) => {
    console.log(
      `Starting upload for file: ${file.name}, size: ${file.size} bytes`
    );

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Sending file to server...");
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
        timeout: 60000, // 60 seconds
      });

      console.log("Server response received:", response.data);

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
      if (error.response) {
        console.error("Upload error - server response:", error.response.data);
      } else if (error.request) {
        console.error("Upload error - no response received:", error.request);
      } else {
        console.error("Upload error:", error.message);
      }
      throw error;
    }
  };

  const startUpload = async (file, id) => {
    console.log(`Starting upload process for ${file.name}`);

    // We'll always update progress regardless of mountedRef
    const onProgress = (percent) => {
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: percent } : item
        )
      );
    };

    try {
      const result = await uploadFile(file, id, onProgress);
      console.log("Upload result:", result);

      // IMPORTANT: We're ignoring mountedRef here
      console.log("Updating media state with result");
      setMedia((prev) => {
        return prev.map((item) =>
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
        );
      });

      toast.success("Upload complete");
      return result;
    } catch (error) {
      console.error("Start upload error:", error);

      setMedia((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, uploading: false, error: true } : item
        )
      );
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
      throw error;
    }
  };

  // Return both functions and the ref
  return { startUpload, mountedRef };
};
