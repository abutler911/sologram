import { useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useUploadManager = (setMedia) => {
  const mountedRef = useRef(true);
  const uploadQueue = useRef([]);
  const activeUploads = useRef(0);
  const MAX_CONCURRENT_UPLOADS = 3;

  const uploadFile = async (file, id, fileType, onProgress) => {
    const isVideo = fileType === "video" || file.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", isVideo ? "video" : "image");

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
      timeout: isVideo ? 300000 : 60000,
    });

    if (response.data?.success) {
      return {
        mediaUrl: response.data.mediaUrl,
        cloudinaryId: response.data.cloudinaryId,
        mediaType: response.data.mediaType || (isVideo ? "video" : "image"),
      };
    }

    throw new Error(response.data?.message || "Upload failed");
  };

  const processQueue = () => {
    if (
      uploadQueue.current.length === 0 ||
      activeUploads.current >= MAX_CONCURRENT_UPLOADS
    )
      return;

    const next = uploadQueue.current.shift();
    activeUploads.current++;

    uploadFile(next.file, next.id, next.fileType, next.onProgress)
      .then((result) => {
        setMedia((prev) =>
          prev.map((item) =>
            item.id === next.id
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
        toast.success(`Uploaded: ${next.file.name}`);
        next.resolve(result);
      })
      .catch((error) => {
        setMedia((prev) =>
          prev.map((item) =>
            item.id === next.id
              ? {
                  ...item,
                  uploading: false,
                  error: true,
                  errorMessage: error.message || "Upload failed",
                }
              : item
          )
        );
        toast.error(`Upload failed: ${error.message}`);
        next.reject(error);
      })
      .finally(() => {
        activeUploads.current--;
        processQueue(); // process the next file
      });
  };

  const startUpload = (file, id, fileType = null) => {
    const detectedType =
      fileType || (file.type.startsWith("video/") ? "video" : "image");

    const onProgress = (percent) => {
      setMedia((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: percent } : item
        )
      );
    };

    return new Promise((resolve, reject) => {
      uploadQueue.current.push({
        file,
        id,
        fileType: detectedType,
        onProgress,
        resolve,
        reject,
      });

      processQueue(); // trigger processing
    });
  };

  return { startUpload, mountedRef };
};
