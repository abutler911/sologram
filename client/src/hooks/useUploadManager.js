// client/src/hooks/useUploadManager.js
//
// Cloudinary direct-upload manager with concurrency-limited queue.
//
// CHANGES FROM PREVIOUS VERSION:
//
// 1. PUMP STALL FIX: `activeCount` is now a ref, not state. The old
//    version had `active` (state) in pump's useCallback deps, so
//    `.finally(() => setTimeout(pump, 0))` captured a stale `pump`
//    whose closure saw an outdated `active` value. The queue would
//    stall at `active >= concurrency` because the old closure never
//    saw the decremented count. Refs don't cause this because reading
//    `.current` always returns the latest value.
//
// 2. FIX #5 — SEPARATED PROGRESS STATE: Progress ticks no longer
//    patch the media array. Instead, progress lives in `uploadProgress`
//    (a separate state atom: Record<id, number>). The media array is
//    only touched on completion (mediaUrl/cloudinaryId) and error.
//    This means form fields that depend on `media` stop re-rendering
//    on every progress tick.
//
// INTERFACE:
//   const { startUpload, cancelUpload, uploadProgress, mountedRef } =
//     useUploadManager(setMedia);
//
//   uploadProgress: Record<string, number>  — id → 0-100, entries
//     removed on completion/error. Pass to MediaItem as a prop.

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

  // ── FIX: Active count is a ref, not state ──────────────────────────────
  // This is the core stall fix. pump() reads activeRef.current, which is
  // always fresh — no stale closures, no dependency on a state value that
  // triggers useCallback recreation.
  const activeRef = useRef(0);

  // ── FIX #5: Progress in a separate atom ────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState({});

  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    console.warn('Missing Cloudinary env vars', {
      CLOUDINARY_CLOUD_NAME: !!cloudName,
      CLOUDINARY_UPLOAD_PRESET: !!preset,
    });
  }

  const cloudinaryAxios = useRef(
    axios.create({
      baseURL: cloudName
        ? `https://api.cloudinary.com/v1_1/${cloudName}`
        : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).current;

  // Strip any auth headers that might leak from a global axios instance
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

  // ── Single atomic patch for media array ────────────────────────────────
  // Only called on completion and error — never on progress ticks.
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
      if (prev[id] === pct) return prev; // bail — same value, skip render
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
  // No state deps — reads activeRef.current directly. This function
  // reference is stable for the lifetime of the component.
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

      // Mark as uploading in media array (single touch)
      updateItem(id, { uploading: true, error: false });
      setProgress(id, 1);

      cloudinaryAxios
        .post('/auto/upload', form, {
          signal: controller.signal,
          onUploadProgress: (e) => {
            if (!mountedRef.current || !e.total) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            // FIX #5: Only progress state updated — media array untouched
            setProgress(id, pct);
          },
        })
        .then(({ data }) => {
          if (!mountedRef.current) return;
          // Single atomic media update on success
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
          updateItem(id, { uploading: false, error: true });
          clearProgress(id);
          reject(err);
        })
        .finally(() => {
          inFlightRef.current.delete(id);
          activeRef.current = Math.max(0, activeRef.current - 1);
          // pump is stable — no stale closure risk here anymore
          pump();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concurrency, preset, folder, updateItem, setProgress, clearProgress]);

  // ── Public: enqueue an upload ──────────────────────────────────────────
  const startUpload = useCallback(
    (file, id, mediaType) =>
      new Promise((resolve, reject) => {
        queueRef.current.push({ file, id, mediaType, resolve, reject });
        pump();
      }),
    [pump]
  );

  // ── Public: cancel a pending or in-flight upload ───────────────────────
  const cancelUpload = useCallback(
    (id) => {
      const controller = inFlightRef.current.get(id);
      if (controller) {
        // In-flight — abort the XHR
        controller.abort();
        inFlightRef.current.delete(id);
        activeRef.current = Math.max(0, activeRef.current - 1);
        updateItem(id, { uploading: false, error: true });
        clearProgress(id);
        pump(); // drain next queued item into the freed slot
      } else {
        // Still queued — just remove from queue
        const idx = queueRef.current.findIndex((q) => q.id === id);
        if (idx >= 0) queueRef.current.splice(idx, 1);
        clearProgress(id);
      }
    },
    [updateItem, clearProgress, pump]
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────
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
