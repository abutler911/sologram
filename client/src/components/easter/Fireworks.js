// components/easter/Fireworks.js
// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based fireworks overlay — fully transparent background.
//
// Uses clearRect every frame (no opaque fill) so the app shows through.
// Each particle stores a short position history for comet-tail trails.
//
// Trigger: rendered when visible, calls `onDone` when the show ends.
// Perf:    pre-allocated pool, no allocations in the hot loop, additive blend.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';

// ── Tuning ───────────────────────────────────────────────────────────────────

const SHOW_DURATION = 4500;
const LAUNCH_INTERVAL = 300;
const PARTICLES_PER = 56;
const POOL_SIZE = 900;
const GRAVITY = 0.04;
const FRICTION = 0.98;
const BASE_SPEED = 4.5;
const TRAIL_LENGTH = 5;

// ── Brand palette ────────────────────────────────────────────────────────────

const PALETTE = [
  '#e98973', // primarySalmon
  '#ffad9e', // accentSalmon
  '#88b2cc', // primaryMint
  '#a8cfd8', // accentMint
  '#658ea9', // primaryBlueGray
  '#e7d4c0', // primaryKhaki
  '#ffffff', // spark white
  '#f2c94c', // warm gold
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const rgbCache = {};
const toRgb = (hex) => {
  if (rgbCache[hex]) return rgbCache[hex];
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  rgbCache[hex] = rgb;
  return rgb;
};
PALETTE.forEach(toRgb);

// ── Particle pool ────────────────────────────────────────────────────────────

const makeParticle = () => ({
  alive: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  alpha: 0,
  decay: 0,
  radius: 0,
  color: '',
  rgb: [0, 0, 0],
  trail: new Float64Array(TRAIL_LENGTH * 2),
  trailLen: 0,
});

const pool = Array.from({ length: POOL_SIZE }, makeParticle);

const acquire = () => {
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!pool[i].alive) return pool[i];
  }
  return null;
};

const burst = (x, y) => {
  const hex = PALETTE[(Math.random() * PALETTE.length) | 0];
  const rgb = toRgb(hex);
  for (let i = 0; i < PARTICLES_PER; i++) {
    const p = acquire();
    if (!p) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = BASE_SPEED * (0.35 + Math.random() * 0.65);
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.alpha = 1;
    p.decay = 0.013 + Math.random() * 0.016;
    p.radius = 1.4 + Math.random() * 1.6;
    p.color = hex;
    p.rgb = rgb;
    p.trailLen = 0;
  }
};

// ── Component ────────────────────────────────────────────────────────────────

const Fireworks = ({ onDone }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const safetyRef = useRef(0);

  const resize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.style.width = `${window.innerWidth}px`;
    c.style.height = `${window.innerHeight}px`;
    const ctx = c.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < POOL_SIZE; i++) pool[i].alive = false;

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    let elapsed = 0;
    let lastLaunch = 0;
    let prev = performance.now();

    const loop = (now) => {
      const dt = now - prev;
      prev = now;
      elapsed += dt;

      // ── Clear to fully transparent each frame ───────────────────────
      ctx.clearRect(0, 0, w(), h());

      // ── Launch bursts ───────────────────────────────────────────────
      if (
        elapsed - lastLaunch > LAUNCH_INTERVAL &&
        elapsed < SHOW_DURATION - 800
      ) {
        lastLaunch = elapsed;
        const count = 1 + ((Math.random() * 2) | 0);
        for (let n = 0; n < count; n++) {
          burst(
            w() * 0.12 + Math.random() * w() * 0.76,
            h() * 0.1 + Math.random() * h() * 0.5
          );
        }
      }

      // ── Update & draw ───────────────────────────────────────────────
      let liveCount = 0;

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.alive) continue;
        liveCount++;

        // Push current pos into trail history
        if (p.trailLen < TRAIL_LENGTH) {
          p.trail[p.trailLen * 2] = p.x;
          p.trail[p.trailLen * 2 + 1] = p.y;
          p.trailLen++;
        } else {
          for (let t = 0; t < (TRAIL_LENGTH - 1) * 2; t++) {
            p.trail[t] = p.trail[t + 2];
          }
          p.trail[(TRAIL_LENGTH - 1) * 2] = p.x;
          p.trail[(TRAIL_LENGTH - 1) * 2 + 1] = p.y;
        }

        // Physics
        p.vy += GRAVITY;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          p.alive = false;
          continue;
        }

        const [r, g, b] = p.rgb;

        // Draw trail dots (oldest → newest, progressively brighter)
        ctx.globalCompositeOperation = 'source-over';
        for (let t = 0; t < p.trailLen; t++) {
          const frac = t / p.trailLen;
          const a = p.alpha * frac * 0.3;
          const rad = p.radius * (0.3 + frac * 0.5);
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.trail[t * 2], p.trail[t * 2 + 1], rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fill();
        }

        // Draw head — additive blend for glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();

        // Soft halo around head
        ctx.globalAlpha = p.alpha * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.globalAlpha = 1;

      // ── End condition ───────────────────────────────────────────────
      if (elapsed >= SHOW_DURATION && liveCount === 0) {
        onDone?.();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    safetyRef.current = window.setTimeout(
      () => onDone?.(),
      SHOW_DURATION + 3000
    );

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(safetyRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [onDone, resize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
};

export default Fireworks;
