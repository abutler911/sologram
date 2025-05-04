import { useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useUploadManager = (setMedia) => {
  const mountedRef = useRef(true);

  const uploadFile = async (file, id, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_post_upload");
    formData.append("folder", "sologram");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/ds5rxplmr/auto/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.lengthComputable && onProgress) {
              const percent = Math.round((event.loaded * 100) / event.total);
              onProgress(percent);
            }
          },
        }
      );

      const data = response.data;
      return {
        mediaUrl: data.secure_url,
        cloudinaryId: data.public_id,
        mediaType: file.type.startsWith("video") ? "video" : "image",
      };
    } catch (error) {
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
      if (!mountedRef.current) return;

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
    } catch (error) {
      if (mountedRef.current) {
        setMedia((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, uploading: false, error: true } : item
          )
        );
        toast.error("Upload failed");
      }
    }
  };

  return { startUpload, mountedRef };
};
