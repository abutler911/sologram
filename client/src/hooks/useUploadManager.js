// client/src/hooks/useUploadManager.js
//
// Cloudinary direct-upload manager with concurrency-limited queue.
//
// KEY FIXES:
// 1. Axios instance + interceptor created ONCE via guarded lazy init.
//    The old code had interceptors.request.use() in the component body,
//    adding a new interceptor on every render. After dozens of progress
//    ticks this stacked hundreds of interceptors — causing sluggishness
//    and eventual request failures.
//
// 2. pumpRef pattern: .finally() calls pumpRef.current (always latest)
//    instead of closing over a potentially stale pump reference.
//
// 3. activeRef (ref, not state) — pump reads .current directly, no
//    stale closure, no dependency-triggered recreation.
//
// 4. Separated progress state — progress ticks never touch media array.

import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

export function useUploadManager(
  setMedia,
  {
    concurrency = 3,
    folder = process.env.REACT_APP_CLOUDINARY_BASE_FOLDER || 'sologram',
  } = {}
) {
  const mountedRef = useRef(true);
  const queueRef = useRef([]);
  const inFlightRef = useRef(new Map());
  const activeRef = useRef(0);
  const pumpRef = useRef(null);

  const [uploadProgress, setUploadProgress] = useState({});

  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    console.warn('Missing Cloudinary env vars', {
      CLOUDINARY_CLOUD_NAME: !!cloudName,
      CLOUDINARY_UPLOAD_PRESET: !!preset,
    });
  }

  // ── Axios instance + interceptor: created ONCE ─────────────────────────
  // CRITICAL: everything inside this if-block runs exactly once. The old
  // code had the interceptor.use() call in the component body (outside
  // the guard), so it stacked a new interceptor on every render.
  const cloudinaryAxios = useRef(null);
  if (!cloudinaryAxios.current) {
    const instance = axios.create({
      baseURL: cloudName
        ? `https://api.cloudinary.com/v1_1/${cloudName}`
        : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Strip auth headers — added once, runs once per request
    instance.interceptors.request.use((config) => {
      if (config.headers?.Authorization) delete config.headers.Authorization;
      if (config.headers?.common?.Authorization)
        delete config.headers.common.Authorization;
      return config;
    });
    try {
      if (instance.defaults?.headers?.common?.Authorization) {
        delete instance.defaults.headers.common.Authorization;
      }
    } catch {}
    cloudinaryAxios.current = instance;
  }

  // ── Media array patch (completion + error only) ────────────────────────
  const updateItem = useCallback(
    (id, patch) => {
      setMedia((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    [setMedia]
  );

  // ── Progress helpers (separate state, cheap updates) ───────────────────
  const setProgress = useCallback((id, pct) => {
    setUploadProgress((prev) => {
      if (prev[id] === pct) return prev;
      return { ...prev, [id]: pct };
    });
  }, []);

  const clearProgress = useCallback((id) => {
    setUploadProgress((prev) => {
      if (!(id in prev)) return prev;
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // ── Queue pump ─────────────────────────────────────────────────────────
  const pump = useCallback(() => {
    if (!mountedRef.current) return;

    while (activeRef.current < concurrency && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      activeRef.current++;

      const { id, file, mediaType, resolve, reject } = next;
      const controller = new AbortController();
      inFlightRef.current.set(id, controller);

      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', preset);
      if (folder) form.append('folder', folder);

      updateItem(id, { uploading: true, error: false });
      setProgress(id, 1);

      cloudinaryAxios.current
        .post('/auto/upload', form, {
          signal: controller.signal,
          onUploadProgress: (e) => {
            if (!mountedRef.current || !e.total) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            // Throttle: only update on every 3% or at 100%.
            // Without this, 3 concurrent uploads fire hundreds of
            // state updates per second, each triggering a parent
            // re-render that recomputes props for all MediaItems.
            if (pct < 100 && pct % 3 !== 0) return;
            setProgress(id, pct);
          },
        })
        .then(({ data }) => {
          if (!mountedRef.current) return;
          updateItem(id, {
            uploading: false,
            mediaUrl: data.secure_url,
            cloudinaryId: data.public_id,
            mediaType:
              mediaType || (data.resource_type === 'video' ? 'video' : 'image'),
            error: false,
          });
          clearProgress(id);
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            resourceType: data.resource_type,
          });
        })
        .catch((err) => {
          if (!mountedRef.current) return;
          const wasCanceled =
            axios.isCancel?.(err) || err?.code === 'ERR_CANCELED';
          if (!wasCanceled) {
            updateItem(id, { uploading: false, error: true });
            clearProgress(id);
          }
          reject(err);
        })
        .finally(() => {
          if (inFlightRef.current.delete(id)) {
            activeRef.current = Math.max(0, activeRef.current - 1);
          }
          // Always call latest pump via ref — never a stale closure
          pumpRef.current?.();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concurrency, preset, folder, updateItem, setProgress, clearProgress]);

  // Keep pumpRef in sync on every render
  pumpRef.current = pump;

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
        activeRef.current = Math.max(0, activeRef.current - 1);
        updateItem(id, { uploading: false, error: true });
        clearProgress(id);
        pump();
      } else {
        const idx = queueRef.current.findIndex((q) => q.id === id);
        if (idx >= 0) {
          const [removed] = queueRef.current.splice(idx, 1);
          removed.reject(new Error('Upload canceled'));
        }
        clearProgress(id);
      }
    },
    [updateItem, clearProgress, pump]
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

  return { startUpload, cancelUpload, uploadProgress, mountedRef };
}

export function withCloudinaryTransform(secureUrl, transformString) {
  if (!secureUrl || !transformString) return secureUrl;
  const parts = secureUrl.split('/upload/');
  if (parts.length !== 2) return secureUrl;
  return `${parts[0]}/upload/${transformString}/${parts[1]}`;
}
