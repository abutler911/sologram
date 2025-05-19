import { useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useUploadManager = (setMedia) => {
  // Initialize the ref
  const mountedRef = useRef(true);

  const uploadFile = async (file, id, fileType, onProgress) => {
    console.log(
      `Starting upload for file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
    );

    // Determine if this is a video file
    const isVideo = fileType === "video" || file.type.startsWith("video/");
    console.log(`File determined to be ${isVideo ? "video" : "image"}`);

    const formData = new FormData();
    formData.append("file", file);
    // Add file type information explicitly to the form data
    formData.append("fileType", isVideo ? "video" : "image");

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
        // Increase timeout for video files which may be larger
        timeout: isVideo ? 300000 : 60000, // 5 minutes for video, 1 minute for images
      });

      console.log("Server response received:", response.data);
      if (response.data && response.data.success) {
        return {
          mediaUrl: response.data.mediaUrl,
          cloudinaryId: response.data.cloudinaryId,
          mediaType: response.data.mediaType || (isVideo ? "video" : "image"),
        };
      } else {
        console.error("Upload failed with error:", response.data);
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (error) {
      if (error.response) {
        console.error("Upload error - server response:", error.response.data);
        throw new Error(
          error.response.data?.message || "Upload failed: Server error"
        );
      } else if (error.request) {
        console.error("Upload error - no response received:", error.request);
        throw new Error("Upload timed out or no response from server");
      } else {
        console.error("Upload error:", error.message);
        throw error;
      }
    }
  };

  const startUpload = async (file, id, fileType = null) => {
    console.log(`Starting upload process for ${file.name}`);

    // Determine file type if not provided
    const detectedType =
      fileType || (file.type.startsWith("video/") ? "video" : "image");
    console.log(`File type for upload: ${detectedType}`);

    // We'll always update progress regardless of mountedRef
    const onProgress = (percent) => {
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: percent } : item
        )
      );
    };

    try {
      const result = await uploadFile(file, id, detectedType, onProgress);
      console.log("Upload result:", result);

      // Update media state with result
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
          item.id === id
            ? {
                ...item,
                uploading: false,
                error: true,
                errorMessage: error.message || "Upload failed",
              }
            : item
        )
      );

      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
      throw error;
    }
  };

  // Return both functions and the ref
  return { startUpload, mountedRef };
};
