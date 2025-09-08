// client/src/hooks/useUploadManager.js
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

export function useUploadManager(setMedia, { concurrency = 3 } = {}) {
  const mountedRef = useRef(true);
  const queueRef = useRef([]);
  const inFlightRef = useRef(new Map());
  const [active, setActive] = useState(0);

  // CRA or Vite
  const ENV =
    (typeof import.meta !== "undefined" && import.meta.env) ||
    process.env ||
    {};

  const CLOUDINARY_CLOUD_NAME =
    ENV.VITE_CLOUDINARY_CLOUD_NAME || ENV.REACT_APP_CLOUDINARY_CLOUD_NAME;

  const CLOUDINARY_UPLOAD_PRESET =
    ENV.VITE_CLOUDINARY_UPLOAD_PRESET || ENV.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  const APP_MODE = (ENV.MODE || ENV.NODE_ENV || "development").toLowerCase();

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.warn(
      "Missing Cloudinary env vars. Set REACT_APP_* (CRA) or VITE_* (Vite).",
      {
        CLOUDINARY_CLOUD_NAME: !!CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_UPLOAD_PRESET: !!CLOUDINARY_UPLOAD_PRESET,
      }
    );
  }

  const updateItem = useCallback(
    (id, patch) => {
      setMedia((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    [setMedia]
  );

  const pump = useCallback(() => {
    if (!mountedRef.current || active >= concurrency) return;

    const next = queueRef.current.shift();
    if (!next) return;

    setActive((a) => a + 1);

    const { id, file, mediaType, resolve, reject } = next;

    // axios v1+ cancellation
    const controller = new AbortController();
    inFlightRef.current.set(id, controller);

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    form.append("tags", APP_MODE === "production" ? "prod" : "dev");

    updateItem(id, { uploading: true, progress: 1, error: false });

    axios
      .post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        form,
        {
          signal: controller.signal,
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 50;
            updateItem(id, { progress: pct });
          },
        }
      )
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
        if (err.name === "CanceledError") return;
        console.error("Upload error:", err);
        updateItem(id, { uploading: false, error: true });
        reject(err);
      })
      .finally(() => {
        inFlightRef.current.delete(id);
        setActive((a) => a - 1);
        setTimeout(pump, 0);
      });
  }, [
    active,
    concurrency,
    CLOUDINARY_UPLOAD_PRESET,
    CLOUDINARY_CLOUD_NAME,
    APP_MODE,
    updateItem,
  ]);

  const startUpload = useCallback(
    (file, id, mediaType) =>
      new Promise((resolve, reject) => {
        queueRef.current.push({ file, id, mediaType, resolve, reject });
        pump();
      }),
    [pump]
  );

  const cancelUpload = useCallback(
    (id) => {
      const controller = inFlightRef.current.get(id);
      if (controller) {
        controller.abort();
        inFlightRef.current.delete(id);
        updateItem(id, { uploading: false, error: true });
        setActive((a) => Math.max(0, a - 1));
        setTimeout(pump, 0);
      } else {
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
      for (const [, controller] of inFlightRef.current) controller.abort();
      inFlightRef.current.clear();
      queueRef.current = [];
    };
  }, []);

  return { startUpload, cancelUpload, mountedRef, activeCount: active };
}
