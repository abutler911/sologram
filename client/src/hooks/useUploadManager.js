// client/src/hooks/useUploadManager.js
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

/**
 * Upload manager for Cloudinary unsigned uploads.
 * Env required (CRA or Vite):
 *   REACT_APP_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_CLOUD_NAME
 *   REACT_APP_CLOUDINARY_UPLOAD_PRESET / VITE_CLOUDINARY_UPLOAD_PRESET
 *
 * @param {Function} setMedia React setState from PostCreator to patch items
 * @param {Object}   options
 * @param {number}   options.concurrency  concurrent uploads
 * @param {string}   options.folder       optional Cloudinary folder (e.g. "sologram")
 */
export function useUploadManager(
  setMedia,
  { concurrency = 3, folder = "" } = {}
) {
  const mountedRef = useRef(true);
  const queueRef = useRef([]); // { id, file, mediaType, resolve, reject }
  const inFlightRef = useRef(new Map()); // id -> AbortController
  const [active, setActive] = useState(0);

  // ---- ENV ----
  const ENV =
    (typeof import.meta !== "undefined" && import.meta.env) ||
    (typeof process !== "undefined" && process.env) ||
    {};

  const cloudName =
    ENV.VITE_CLOUDINARY_CLOUD_NAME || ENV.REACT_APP_CLOUDINARY_CLOUD_NAME;

  const preset =
    ENV.VITE_CLOUDINARY_UPLOAD_PRESET || ENV.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    // eslint-disable-next-line no-console
    console.warn(
      "Missing Cloudinary env vars. Set REACT_APP_* (CRA) or VITE_* (Vite).",
      {
        CLOUDINARY_CLOUD_NAME: !!cloudName,
        CLOUDINARY_UPLOAD_PRESET: !!preset,
      }
    );
  }

  // ---- Axios instance that never sends Authorization ----
  const cloudinaryAxios = useRef(
    axios.create({
      baseURL: cloudName
        ? `https://api.cloudinary.com/v1_1/${cloudName}`
        : undefined,
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).current;

  // Strip any inherited Authorization defaults (belt + suspenders)
  try {
    if (cloudinaryAxios.defaults?.headers?.common?.Authorization) {
      delete cloudinaryAxios.defaults.headers.common.Authorization;
    }
  } catch {}

  cloudinaryAxios.interceptors.request.use((config) => {
    if (config.headers?.Authorization) delete config.headers.Authorization;
    if (config.headers?.common?.Authorization)
      delete config.headers.common.Authorization;
    return config;
  });

  // ---- helpers ----
  const isProd =
    (ENV.MODE || ENV.NODE_ENV || "").toLowerCase() === "production";

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
    const controller = new AbortController();
    inFlightRef.current.set(id, controller);

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    if (folder) form.append("folder", folder);
    form.append("tags", isProd ? "prod" : "dev");

    updateItem(id, { uploading: true, progress: 1, error: false });

    cloudinaryAxios
      .post(`/auto/upload`, form, {
        signal: controller.signal,
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
          mediaUrl: data.secure_url, // public URL
          cloudinaryId: data.public_id, // keep for future transforms
          mediaType:
            mediaType || (data.resource_type === "video" ? "video" : "image"),
          error: false,
        });
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          resourceType: data.resource_type,
        });
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        // eslint-disable-next-line no-console
        console.error("Upload error:", err);
        updateItem(id, { uploading: false, error: true });
        reject(err);
      })
      .finally(() => {
        inFlightRef.current.delete(id);
        setActive((a) => Math.max(0, a - 1));
        // keep the queue flowing
        setTimeout(pump, 0);
      });
  }, [
    active,
    concurrency,
    preset,
    folder,
    isProd,
    cloudName,
    updateItem,
    cloudinaryAxios,
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
      // abort all in-flight
      for (const [, controller] of inFlightRef.current) controller.abort();
      inFlightRef.current.clear();
      queueRef.current = [];
    };
  }, []);

  return { startUpload, cancelUpload, mountedRef, activeCount: active };
}

/**
 * Helper to inject a transformation into a Cloudinary secure_url.
 * Example:
 * withCloudinaryTransform(url, "w_1080,h_1080,c_fill,g_auto,q_auto:good,f_auto");
 */
export function withCloudinaryTransform(secureUrl, transformString) {
  if (!secureUrl || !transformString) return secureUrl;
  const parts = secureUrl.split("/upload/");
  if (parts.length !== 2) return secureUrl;
  return `${parts[0]}/upload/${transformString}/${parts[1]}`;
}
