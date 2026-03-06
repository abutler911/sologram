// hooks/useEngagement.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified engagement hook — handles likes for any content type.
// Replaces the old LikesContext which only worked for posts.
//
// Usage:
//   const { liked, count, toggle, loading } = useEngagement('post', postId);
//   const { liked, count, toggle }          = useEngagement('thought', thoughtId);
//
// Features:
//   - Optimistic UI updates (instant feedback, rollback on error)
//   - Per-item processing locks (no double-taps)
//   - Caches state across renders
//   - Works with any targetType the server supports
//   - Ref-based reads inside toggle to avoid stale closures
//   - Interaction tracking prevents stale seed() from overwriting toggle results
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

// Module-level cache — shared across all hook instances, persists for session.
// Key format: "post:abc123" → { liked: true, count: 5 }
const cache = new Map();
const processing = new Set();

// Keys the user has toggled this session. seed() will NOT overwrite these
// because the toggle result (server-confirmed) is more authoritative than
// whatever the feed endpoint returns on the next page load.
const interacted = new Set();

const key = (type, id) => `${type}:${id}`;

export function useEngagement(targetType, targetId) {
  const { isAuthenticated } = useContext(AuthContext);
  const k = key(targetType, targetId);

  // Local state seeded from cache
  const [liked, setLiked] = useState(() => cache.get(k)?.liked ?? false);
  const [count, setCount] = useState(() => cache.get(k)?.count ?? 0);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // ── Refs that stay in sync with state ───────────────────────────────────
  // These let toggle() read current values without stale closure issues.
  const likedRef = useRef(liked);
  const countRef = useRef(count);

  useEffect(() => {
    likedRef.current = liked;
  }, [liked]);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sync from cache when targetId changes
  useEffect(() => {
    const cached = cache.get(k);
    if (cached) {
      setLiked(cached.liked);
      setCount(cached.count);
    }
  }, [k]);

  // Update both local state and cache
  const update = useCallback(
    (l, c) => {
      cache.set(k, { liked: l, count: c });
      if (mountedRef.current) {
        setLiked(l);
        setCount(c);
      }
    },
    [k]
  );

  // ── Toggle like ───────────────────────────────────────────────────────────

  const toggle = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like this');
      return false;
    }

    if (processing.has(k)) return false;
    processing.add(k);
    setLoading(true);

    // Read from refs — always current, no stale closure
    const prevLiked = likedRef.current;
    const prevCount = countRef.current;
    update(!prevLiked, prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const data = await api.toggleLike(targetType, targetId);
      // Server is source of truth
      update(data.liked, data.count);
      // Mark as interacted so future seed() calls don't overwrite
      interacted.add(k);
      return data.liked;
    } catch (err) {
      // Rollback
      update(prevLiked, prevCount);
      toast.error('Could not update like');
      return false;
    } finally {
      processing.delete(k);
      if (mountedRef.current) setLoading(false);
    }
  }, [isAuthenticated, k, update, targetType, targetId]);

  // ── Seed from server ──────────────────────────────────────────────────────
  // Call once per item to set initial state from the feed response.
  //
  // IMPORTANT: If the user has already toggled this item during the current
  // session, skip the seed — the cache holds server-confirmed data from the
  // toggle response, which is more trustworthy than whatever the feed
  // endpoint sent (which may not even include hasLiked if optionalAuth
  // isn't wired up).

  const seed = useCallback(
    (likedVal, countVal) => {
      if (interacted.has(k)) return;
      update(likedVal, countVal);
    },
    [k, update]
  );

  return { liked, count, toggle, loading, seed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch check — call once when a list of items loads.
//
// Usage in a feed component:
//   import { batchSeedLikes } from '../hooks/useEngagement';
//
//   useEffect(() => {
//     if (isAuthenticated && posts.length) {
//       batchSeedLikes('post', posts.map(p => p._id));
//     }
//   }, [posts, isAuthenticated]);
//
// Each useEngagement hook instance will pick up the cached values.
// ─────────────────────────────────────────────────────────────────────────────

export async function batchSeedLikes(targetType, ids) {
  if (!ids.length) return;

  // Skip IDs the user has interacted with OR already cached
  const uncached = ids.filter((id) => {
    const k = key(targetType, id);
    return !interacted.has(k) && !cache.has(k);
  });
  if (!uncached.length) return;

  try {
    const targets = uncached.map((id) => ({ type: targetType, id }));
    const data = await api.batchCheckLikes(targets);

    if (data.results) {
      data.results.forEach((r) => {
        const k = key(r.type, r.id);
        // Don't overwrite if user interacted while this request was in flight
        if (interacted.has(k)) return;
        const existing = cache.get(k);
        cache.set(k, {
          liked: r.liked,
          count: existing?.count ?? 0, // count will be set by individual items via seed
        });
      });
    }
  } catch (err) {
    // Non-critical — items just won't show pre-filled like state
    console.error('[batchSeedLikes]', err);
  }
}

// Clear all caches on logout
export function clearEngagementCache() {
  cache.clear();
  processing.clear();
  interacted.clear();
}

export default useEngagement;
