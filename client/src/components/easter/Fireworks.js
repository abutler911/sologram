// components/easter/Fireworks.js
// ─────────────────────────────────────────────────────────────────────────────
// 🎆  FIREWORKS v2 — The "holy shit" edition
//
// What changed from v1:
//   1. Rising rockets with spark trails before each burst
//   2. Multiple burst shapes: peony, ring, willow, crossette, crackle
//   3. Secondary explosions — some particles re-burst mid-flight
//   4. Screen flash pulse on each detonation
//   5. Radial-gradient glow particles instead of flat circles
//   6. Shimmer sparkles that twinkle as they fall
//   7. Grand finale: rapid-fire barrage in the last second
//
// Architecture stays the same: pre-allocated pools, RAF, clearRect, no GC.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';

// ── Timing ───────────────────────────────────────────────────────────────────

const SHOW_DURATION = 6000;
const LAUNCH_INTERVAL = 400;
const FINALE_START = 4200; // rapid-fire begins here
const FINALE_INTERVAL = 90;

// ── Physics ──────────────────────────────────────────────────────────────────

const GRAVITY = 0.038;
const FRICTION = 0.978;
const BASE_SPEED = 5.0;
const TRAIL_LEN = 6;

// ── Pool sizes ───────────────────────────────────────────────────────────────

const ROCKET_POOL = 40;
const PARTICLE_POOL = 1800;
const SPARK_POOL = 600;

// ── Brand palette ────────────────────────────────────────────────────────────

const PALETTE = [
  '#e98973',
  '#ffad9e',
  '#88b2cc',
  '#a8cfd8',
  '#658ea9',
  '#e7d4c0',
  '#ffffff',
  '#f2c94c',
  '#ff6b8a',
  '#7be0ad',
  '#c9a0ff',
  '#ff9f43',
];

// ── Burst shape enum ─────────────────────────────────────────────────────────

const SHAPES = ['peony', 'ring', 'willow', 'crossette', 'crackle'];
const SHAPE_WEIGHTS = [0.3, 0.2, 0.18, 0.15, 0.17]; // probability distribution

const pickShape = () => {
  let r = Math.random();
  for (let i = 0; i < SHAPES.length; i++) {
    r -= SHAPE_WEIGHTS[i];
    if (r <= 0) return SHAPES[i];
  }
  return 'peony';
};

// ── RGB cache ────────────────────────────────────────────────────────────────

const rgbCache = {};
const toRgb = (hex) => {
  if (rgbCache[hex]) return rgbCache[hex];
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  rgbCache[hex] = rgb;
  return rgb;
};
PALETTE.forEach(toRgb);

// ── Gradient cache (pre-rendered glow textures) ──────────────────────────────
// Rendering radialGradient per particle per frame is expensive. Instead we
// pre-render a white soft-circle into an offscreen canvas and tint it at draw
// time via globalCompositeOperation.

let glowCanvas = null;
let glowSize = 0;

const ensureGlowTexture = () => {
  if (glowCanvas) return;
  glowSize = 64;
  glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowSize;
  glowCanvas.height = glowSize;
  const g = glowCanvas.getContext('2d');
  const half = glowSize / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.25)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, glowSize, glowSize);
};

// ── Rocket pool ──────────────────────────────────────────────────────────────
// Rockets rise from the bottom, leave a spark trail, then burst.

const makeRocket = () => ({
  alive: false,
  x: 0,
  y: 0,
  targetY: 0,
  vx: 0,
  vy: 0,
  color: '',
  rgb: [0, 0, 0],
  shape: 'peony',
  trail: new Float64Array(10 * 2),
  trailLen: 0,
  age: 0,
});

const rockets = Array.from({ length: ROCKET_POOL }, makeRocket);

const acquireRocket = () => {
  for (let i = 0; i < ROCKET_POOL; i++) {
    if (!rockets[i].alive) return rockets[i];
  }
  return null;
};

// ── Main particle pool ───────────────────────────────────────────────────────

const makeParticle = () => ({
  alive: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  alpha: 1,
  decay: 0,
  radius: 0,
  color: '',
  rgb: [0, 0, 0],
  trail: new Float64Array(TRAIL_LEN * 2),
  trailLen: 0,
  shimmer: false,
  shimmerPhase: 0,
  canReburst: false,
  reburstAt: 0, // alpha threshold to trigger secondary explosion
  gravity: GRAVITY, // per-particle gravity (willow uses more)
  friction: FRICTION,
});

const particles = Array.from({ length: PARTICLE_POOL }, makeParticle);

const acquireParticle = () => {
  for (let i = 0; i < PARTICLE_POOL; i++) {
    if (!particles[i].alive) return particles[i];
  }
  return null;
};

// ── Spark pool (tiny twinkle dots from rockets + crackle) ────────────────────

const makeSpark = () => ({
  alive: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  alpha: 1,
  decay: 0,
  radius: 0,
  color: '',
  rgb: [0, 0, 0],
});

const sparks = Array.from({ length: SPARK_POOL }, makeSpark);

const acquireSpark = () => {
  for (let i = 0; i < SPARK_POOL; i++) {
    if (!sparks[i].alive) return sparks[i];
  }
  return null;
};

// ── Burst functions (shapes) ─────────────────────────────────────────────────

const doBurst = (x, y, shape, hex, rgb) => {
  switch (shape) {
    case 'peony':
      burstPeony(x, y, hex, rgb);
      break;
    case 'ring':
      burstRing(x, y, hex, rgb);
      break;
    case 'willow':
      burstWillow(x, y, hex, rgb);
      break;
    case 'crossette':
      burstCrossette(x, y, hex, rgb);
      break;
    case 'crackle':
      burstCrackle(x, y, hex, rgb);
      break;
    default:
      burstPeony(x, y, hex, rgb);
  }
};

const spawnParticle = (x, y, vx, vy, hex, rgb, overrides = {}) => {
  const p = acquireParticle();
  if (!p) return null;
  p.alive = true;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.alpha = 1;
  p.decay = overrides.decay ?? 0.011 + Math.random() * 0.013;
  p.radius = overrides.radius ?? 1.6 + Math.random() * 1.8;
  p.color = hex;
  p.rgb = rgb;
  p.trailLen = 0;
  p.shimmer = overrides.shimmer ?? false;
  p.shimmerPhase = Math.random() * Math.PI * 2;
  p.canReburst = overrides.canReburst ?? false;
  p.reburstAt = overrides.reburstAt ?? 0;
  p.gravity = overrides.gravity ?? GRAVITY;
  p.friction = overrides.friction ?? FRICTION;
  return p;
};

// Peony: classic spherical burst
const burstPeony = (x, y, hex, rgb) => {
  const count = 55 + ((Math.random() * 20) | 0);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = BASE_SPEED * (0.3 + Math.random() * 0.7);
    spawnParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex,
      rgb,
      {
        canReburst: Math.random() < 0.12,
        reburstAt: 0.3 + Math.random() * 0.15,
      }
    );
  }
};

// Ring: particles arranged in a circle with uniform speed
const burstRing = (x, y, hex, rgb) => {
  const count = 40;
  const speed = BASE_SPEED * 0.85;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    spawnParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex,
      rgb,
      {
        decay: 0.009 + Math.random() * 0.006,
        radius: 2.0 + Math.random() * 0.8,
      }
    );
  }
  // Inner fill — smaller, faster-decaying
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = speed * (0.2 + Math.random() * 0.35);
    spawnParticle(x, y, Math.cos(angle) * sp, Math.sin(angle) * sp, hex, rgb, {
      decay: 0.02 + Math.random() * 0.015,
      radius: 1.0 + Math.random() * 0.8,
    });
  }
};

// Willow: droopy trails with heavy gravity
const burstWillow = (x, y, hex, rgb) => {
  const count = 50;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = BASE_SPEED * (0.5 + Math.random() * 0.5);
    spawnParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex,
      rgb,
      {
        decay: 0.005 + Math.random() * 0.005, // very slow fade — long tails
        gravity: GRAVITY * 2.2, // droops hard
        friction: 0.973,
        shimmer: true,
        radius: 1.3 + Math.random() * 1.0,
      }
    );
  }
};

// Crossette: 4 arms that each split again
const burstCrossette = (x, y, hex, rgb) => {
  const arms = 4 + ((Math.random() * 3) | 0);
  const baseAngle = Math.random() * Math.PI * 2;
  for (let a = 0; a < arms; a++) {
    const angle = baseAngle + (a / arms) * Math.PI * 2;
    const speed = BASE_SPEED * 0.9;
    spawnParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex,
      rgb,
      {
        decay: 0.013 + Math.random() * 0.008,
        radius: 2.2,
        canReburst: true,
        reburstAt: 0.45 + Math.random() * 0.1,
      }
    );
  }
  // Filler particles
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = BASE_SPEED * (0.15 + Math.random() * 0.3);
    spawnParticle(x, y, Math.cos(angle) * sp, Math.sin(angle) * sp, hex, rgb, {
      decay: 0.018 + Math.random() * 0.012,
      radius: 1.0 + Math.random() * 0.6,
    });
  }
};

// Crackle: lots of tiny bright sparks
const burstCrackle = (x, y, hex, rgb) => {
  // Core burst
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = BASE_SPEED * (0.3 + Math.random() * 0.5);
    spawnParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex,
      rgb,
      {
        decay: 0.015 + Math.random() * 0.01,
      }
    );
  }
  // Crackle sparks — tiny, bright white/gold, fast decay
  const sparkHex = Math.random() < 0.5 ? '#ffffff' : '#f2c94c';
  const sparkRgb = toRgb(sparkHex);
  for (let i = 0; i < 60; i++) {
    const s = acquireSpark();
    if (!s) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    s.alive = true;
    s.x = x + (Math.random() - 0.5) * 8;
    s.y = y + (Math.random() - 0.5) * 8;
    s.vx = Math.cos(angle) * speed;
    s.vy = Math.sin(angle) * speed;
    s.alpha = 1;
    s.decay = 0.025 + Math.random() * 0.035;
    s.radius = 0.6 + Math.random() * 0.8;
    s.color = sparkHex;
    s.rgb = sparkRgb;
  }
};

// ── Secondary burst (re-burst) ───────────────────────────────────────────────

const reburst = (p) => {
  const hex2 = PALETTE[(Math.random() * PALETTE.length) | 0];
  const rgb2 = toRgb(hex2);
  const count = 12 + ((Math.random() * 10) | 0);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.0;
    spawnParticle(
      p.x,
      p.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex2,
      rgb2,
      {
        decay: 0.02 + Math.random() * 0.015,
        radius: 0.9 + Math.random() * 1.0,
      }
    );
  }
};

// ── Flash tracker ────────────────────────────────────────────────────────────

let flashes = []; // { alpha, x, y }
const addFlash = (x, y) => {
  flashes.push({ alpha: 0.35, x, y });
};

// ── Launch a rocket ──────────────────────────────────────────────────────────

const launchRocket = (screenW, screenH) => {
  const r = acquireRocket();
  if (!r) return;
  const hex = PALETTE[(Math.random() * PALETTE.length) | 0];
  r.alive = true;
  r.x = screenW * 0.1 + Math.random() * screenW * 0.8;
  r.y = screenH + 10;
  r.targetY = screenH * 0.08 + Math.random() * screenH * 0.38;
  r.vx = (Math.random() - 0.5) * 1.2;
  r.vy = -(6 + Math.random() * 4);
  r.color = hex;
  r.rgb = toRgb(hex);
  r.shape = pickShape();
  r.trailLen = 0;
  r.age = 0;
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

    ensureGlowTexture();
    resize();
    window.addEventListener('resize', resize);

    // Reset all pools
    for (let i = 0; i < ROCKET_POOL; i++) rockets[i].alive = false;
    for (let i = 0; i < PARTICLE_POOL; i++) particles[i].alive = false;
    for (let i = 0; i < SPARK_POOL; i++) sparks[i].alive = false;
    flashes = [];

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    let elapsed = 0;
    let lastLaunch = 0;
    let prev = performance.now();

    const loop = (now) => {
      const dt = now - prev;
      prev = now;
      elapsed += dt;

      const isFinale = elapsed >= FINALE_START && elapsed < SHOW_DURATION - 400;
      const interval = isFinale ? FINALE_INTERVAL : LAUNCH_INTERVAL;

      ctx.clearRect(0, 0, w(), h());

      // ── Launch rockets ──────────────────────────────────────────────
      if (elapsed - lastLaunch > interval && elapsed < SHOW_DURATION - 400) {
        lastLaunch = elapsed;
        const count = isFinale
          ? 2 + ((Math.random() * 3) | 0)
          : 1 + ((Math.random() * 1.5) | 0);
        for (let n = 0; n < count; n++) {
          launchRocket(w(), h());
        }
      }

      // ── Draw flashes (screen flash on burst) ───────────────────────
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.alpha -= 0.025;
        if (f.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, w() * 0.4);
        grad.addColorStop(0, `rgba(255,255,255,${f.alpha})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w(), h());
        ctx.globalCompositeOperation = 'source-over';
      }

      // ── Update & draw rockets ───────────────────────────────────────
      for (let i = 0; i < ROCKET_POOL; i++) {
        const r = rockets[i];
        if (!r.alive) continue;

        r.age += dt;

        // Store trail
        if (r.trailLen < 10) {
          r.trail[r.trailLen * 2] = r.x;
          r.trail[r.trailLen * 2 + 1] = r.y;
          r.trailLen++;
        } else {
          for (let t = 0; t < 18; t++) r.trail[t] = r.trail[t + 2];
          r.trail[18] = r.x;
          r.trail[19] = r.y;
        }

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.06; // slight deceleration upward

        // Emit rocket spark trail
        if (Math.random() < 0.7) {
          const s = acquireSpark();
          if (s) {
            s.alive = true;
            s.x = r.x + (Math.random() - 0.5) * 3;
            s.y = r.y;
            s.vx = (Math.random() - 0.5) * 0.8;
            s.vy = 0.5 + Math.random() * 1.5;
            s.alpha = 0.8 + Math.random() * 0.2;
            s.decay = 0.035 + Math.random() * 0.03;
            s.radius = 0.5 + Math.random() * 0.8;
            s.color = r.color;
            s.rgb = r.rgb;
          }
        }

        // Draw rocket head
        const [rr, rg, rb] = r.rgb;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${rr},${rg},${rb})`;
        ctx.fill();
        // Bright white core
        ctx.beginPath();
        ctx.arc(r.x, r.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Burst condition: reached target height or stalled
        if (r.y <= r.targetY || r.vy >= 0) {
          r.alive = false;
          doBurst(r.x, r.y, r.shape, r.color, r.rgb);
          addFlash(r.x, r.y);
        }
      }

      // ── Update & draw main particles ────────────────────────────────
      let liveCount = 0;

      for (let i = 0; i < PARTICLE_POOL; i++) {
        const p = particles[i];
        if (!p.alive) continue;
        liveCount++;

        // Trail history
        if (p.trailLen < TRAIL_LEN) {
          p.trail[p.trailLen * 2] = p.x;
          p.trail[p.trailLen * 2 + 1] = p.y;
          p.trailLen++;
        } else {
          for (let t = 0; t < (TRAIL_LEN - 1) * 2; t++)
            p.trail[t] = p.trail[t + 2];
          p.trail[(TRAIL_LEN - 1) * 2] = p.x;
          p.trail[(TRAIL_LEN - 1) * 2 + 1] = p.y;
        }

        p.vy += p.gravity;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        // Secondary explosion check
        if (p.canReburst && p.alpha <= p.reburstAt && p.alpha > 0) {
          p.canReburst = false;
          reburst(p);
          addFlash(p.x, p.y);
        }

        if (p.alpha <= 0) {
          p.alive = false;
          continue;
        }

        const [pr, pg, pb] = p.rgb;

        // Shimmer effect — oscillate alpha for sparkle
        let drawAlpha = p.alpha;
        if (p.shimmer) {
          p.shimmerPhase += 0.15;
          drawAlpha *= 0.5 + 0.5 * Math.sin(p.shimmerPhase);
        }

        // Draw trail
        for (let t = 0; t < p.trailLen; t++) {
          const frac = t / p.trailLen;
          const a = drawAlpha * frac * 0.25;
          const rad = p.radius * (0.25 + frac * 0.5);
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.trail[t * 2], p.trail[t * 2 + 1], rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
          ctx.fill();
        }

        // Draw glow head using pre-rendered texture
        const glowDraw = p.radius * 5;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = drawAlpha * 0.6;
        ctx.drawImage(
          glowCanvas,
          p.x - glowDraw / 2,
          p.y - glowDraw / 2,
          glowDraw,
          glowDraw
        );

        // Bright core
        ctx.globalAlpha = drawAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Colored ring
        ctx.globalAlpha = drawAlpha * 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
      }

      // ── Update & draw sparks ────────────────────────────────────────
      for (let i = 0; i < SPARK_POOL; i++) {
        const s = sparks[i];
        if (!s.alive) continue;
        liveCount++;

        s.vy += GRAVITY * 0.6;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          s.alive = false;
          continue;
        }

        // Sparks twinkle
        const twinkle =
          0.5 + 0.5 * Math.sin(performance.now() * 0.02 + i * 1.7);
        const [sr, sg, sb] = s.rgb;

        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.globalAlpha = 1;

      // ── Check rockets still alive ───────────────────────────────────
      let rocketsAlive = 0;
      for (let i = 0; i < ROCKET_POOL; i++) {
        if (rockets[i].alive) rocketsAlive++;
      }

      // ── End condition ───────────────────────────────────────────────
      if (
        elapsed >= SHOW_DURATION &&
        liveCount === 0 &&
        rocketsAlive === 0 &&
        flashes.length === 0
      ) {
        onDone?.();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    safetyRef.current = window.setTimeout(
      () => onDone?.(),
      SHOW_DURATION + 4000
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
