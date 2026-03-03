// hooks/useUploadCleanup.js
// Tracks cloudinaryIds uploaded during a creation session.
// If the component unmounts without calling `markSaved()`,
// all tracked uploads are batch-deleted as orphans.
//
// Also registers a beforeunload handler so closing the tab
// fires a best-effort cleanup via navigator.sendBeacon.
import { useRef, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const useUploadCleanup = () => {
  const idsRef = useRef(new Set());
  const savedRef = useRef(false);

  // Call after each successful Cloudinary upload
  const trackUpload = useCallback((cloudinaryId) => {
    if (cloudinaryId) idsRef.current.add(cloudinaryId);
  }, []);

  // Call when removing a single media item during editing
  const untrackUpload = useCallback((cloudinaryId) => {
    if (cloudinaryId) idsRef.current.delete(cloudinaryId);
  }, []);

  // Call when the post/story is successfully saved
  const markSaved = useCallback(() => {
    savedRef.current = true;
    idsRef.current.clear();
  }, []);

  // Fire-and-forget cleanup for a set of IDs
  const cleanupIds = useCallback((ids) => {
    ids.forEach((id) => {
      api.deleteOrphanedMedia(id).catch((err) => {
        console.warn('[useUploadCleanup] failed to delete', id, err?.message);
      });
    });
  }, []);

  // beforeunload — best-effort cleanup when closing tab
  useEffect(() => {
    const onBeforeUnload = () => {
      if (savedRef.current || idsRef.current.size === 0) return;

      // sendBeacon is fire-and-forget — works even during tab close
      const ids = Array.from(idsRef.current);
      const payload = JSON.stringify({ cloudinaryIds: ids });

      // Try sendBeacon to the batch cleanup endpoint
      const beaconUrl = '/api/cleanup/orphaned-uploads';
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon?.(beaconUrl, blob);

      // If sendBeacon isn't available or fails, try sync XHR as last resort
      if (!sent) {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', beaconUrl, false); // sync
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(payload);
        } catch {
          // Nothing more we can do
        }
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Component unmount — clean up if not saved
  useEffect(() => {
    return () => {
      if (savedRef.current || idsRef.current.size === 0) return;
      const orphanIds = new Set(idsRef.current);
      cleanupIds(orphanIds);
    };
  }, [cleanupIds]);

  return { trackUpload, untrackUpload, markSaved };
};

export default useUploadCleanup;
