// client/src/hooks/useUploadManager.js
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

export function useUploadManager(setMedia, { concurrency = 3 } = {}) {
  const mountedRef = useRef(true);
  const queueRef = useRef([]);
  const inFlightRef = useRef(new Map());
  const [active, setActive] = useState(0);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset =
    import.meta.env.MODE === "production"
      ? import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      : import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_DEV ||
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Keep UI in sync
  const updateItem = useCallback(
    (id, patch) => {
      setMedia((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    [setMedia]
  );

  const pump = useCallback(() => {
    if (!mountedRef.current) return;
    if (active >= concurrency) return;

    const next = queueRef.current.shift();
    if (!next) return;

    setActive((a) => a + 1);

    const { id, file, mediaType, resolve, reject } = next;
    const source = axios.CancelToken.source();
    inFlightRef.current.set(id, source);

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    form.append("tags", import.meta.env.MODE === "production" ? "prod" : "dev");

    updateItem(id, { uploading: true, progress: 1, error: false });

    axios
      .post(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, form, {
        cancelToken: source.token,
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 50;
          updateItem(id, { progress: pct });
        },
      })
      .then(({ data }) => {
        if (!mountedRef.current) return;
        updateItem(id, {
          uploading: false,
          progress: 100,
          mediaUrl: data.secure_url,
          cloudinaryId: data.public_id,
          mediaType:
            mediaType || (data.resource_type === "video" ? "video" : "image"),
          error: false,
        });
        resolve({ url: data.secure_url, publicId: data.public_id });
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        console.error("Upload error:", err);
        updateItem(id, { uploading: false, error: true });
        reject(err);
      })
      .finally(() => {
        inFlightRef.current.delete(id);
        setActive((a) => a - 1);
        // continue pumping
        setTimeout(pump, 0);
      });
  }, [active, concurrency, preset, cloudName, updateItem]);

  const startUpload = useCallback(
    (file, id, mediaType) => {
      return new Promise((resolve, reject) => {
        queueRef.current.push({ file, id, mediaType, resolve, reject });
        pump();
      });
    },
    [pump]
  );

  const cancelUpload = useCallback(
    (id) => {
      const token = inFlightRef.current.get(id);
      if (token) {
        token.cancel("Cancelled by user");
        inFlightRef.current.delete(id);
        updateItem(id, { uploading: false, error: true });
        setActive((a) => Math.max(0, a - 1));
        setTimeout(pump, 0);
      } else {
        // If not in-flight, remove from queue if present
        const idx = queueRef.current.findIndex((q) => q.id === id);
        if (idx >= 0) queueRef.current.splice(idx, 1);
      }
    },
    [updateItem, pump]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // cancel any in-flight
      for (const [, token] of inFlightRef.current) token.cancel("Unmount");
      inFlightRef.current.clear();
      queueRef.current = [];
    };
  }, []);

  return { startUpload, cancelUpload, mountedRef, activeCount: active };
}
