// components/easter/Fireworks.js
// ─────────────────────────────────────────────────────────────────────────────
// 🎆  FIREWORKS v3 — Smoke & Depth edition
//
// What changed from v2:
//   1. Smoke system — soft expanding clouds linger after bursts fade,
//      giving the sky history and atmosphere
//   2. Depth layering — rockets spawn at varying "distances" (0.5–1.0),
//      affecting size, brightness, speed, and gravity. Far bursts are
//      dimmer and smaller, creating a 3D parallax sky
//   3. Smoke drift — smoke puffs drift with slight wind and expand
//      organically, with turbulence noise for realism
//   4. Residual glow — burst origins leave a brief warm glow halo
//      that fades through the smoke
//   5. Depth-sorted rendering — far layer draws first, close layer
//      on top, smoke sandwiched between for correct occlusion
//
// Architecture: same pre-allocated pools, RAF, clearRect, no GC.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';

// ── Timing ───────────────────────────────────────────────────────────────────

const SHOW_DURATION = 6000;
const LAUNCH_INTERVAL = 400;
const FINALE_START = 4200;
const FINALE_INTERVAL = 90;

// ── Physics ──────────────────────────────────────────────────────────────────

const GRAVITY = 0.038;
const FRICTION = 0.978;
const BASE_SPEED = 5.0;
const TRAIL_LEN = 6;

// ── Wind (affects smoke drift) ───────────────────────────────────────────────

const WIND_X = 0.15; // gentle rightward drift
const WIND_Y = -0.08; // slight upward (heat convection)

// ── Pool sizes ───────────────────────────────────────────────────────────────

const ROCKET_POOL = 40;
const PARTICLE_POOL = 1800;
const SPARK_POOL = 600;
const SMOKE_POOL = 200;

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
const SHAPE_WEIGHTS = [0.3, 0.2, 0.18, 0.15, 0.17];

const pickShape = () => {
  let r = Math.random();
  for (let i = 0; i < SHAPES.length; i++) {
    r -= SHAPE_WEIGHTS[i];
    if (r <= 0) return SHAPES[i];
  }
  return 'peony';
};

// ── Depth helpers ────────────────────────────────────────────────────────────
// depth: 1.0 = foreground (full size/brightness)
//        0.5 = far background (half size, dimmer, slower)

const pickDepth = () => {
  const r = Math.random();
  if (r < 0.25) return 0.5 + Math.random() * 0.15; // 25% far background
  if (r < 0.5) return 0.65 + Math.random() * 0.15; // 25% mid-background
  return 0.8 + Math.random() * 0.2; // 50% foreground
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

// ── Pre-rendered smoke texture ───────────────────────────────────────────────
// Soft radial blob — drawn once, reused per smoke puff via drawImage + alpha

let smokeCanvas = null;
let smokeTexSize = 0;

const ensureSmokeTexture = () => {
  if (smokeCanvas) return;
  smokeTexSize = 128;
  smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = smokeTexSize;
  smokeCanvas.height = smokeTexSize;
  const g = smokeCanvas.getContext('2d');
  const half = smokeTexSize / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(180,170,160,0.45)');
  grad.addColorStop(0.3, 'rgba(160,150,140,0.2)');
  grad.addColorStop(0.6, 'rgba(140,135,130,0.08)');
  grad.addColorStop(1, 'rgba(120,115,110,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, smokeTexSize, smokeTexSize);
};

// ── Rocket pool ──────────────────────────────────────────────────────────────

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
  depth: 1.0,
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
  reburstAt: 0,
  gravity: GRAVITY,
  friction: FRICTION,
  depth: 1.0,
});

const particles = Array.from({ length: PARTICLE_POOL }, makeParticle);

const acquireParticle = () => {
  for (let i = 0; i < PARTICLE_POOL; i++) {
    if (!particles[i].alive) return particles[i];
  }
  return null;
};

// ── Spark pool ───────────────────────────────────────────────────────────────

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
  depth: 1.0,
});

const sparks = Array.from({ length: SPARK_POOL }, makeSpark);

const acquireSpark = () => {
  for (let i = 0; i < SPARK_POOL; i++) {
    if (!sparks[i].alive) return sparks[i];
  }
  return null;
};

// ── Smoke pool ───────────────────────────────────────────────────────────────
// Smoke puffs expand and fade slowly, drift with wind

const makeSmoke = () => ({
  alive: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 0,
  maxRadius: 0,
  expandRate: 0,
  alpha: 0,
  decay: 0,
  depth: 1.0,
  turbulencePhase: 0,
  tint: [160, 150, 140], // warm grey tint (can be colored by burst)
});

const smokes = Array.from({ length: SMOKE_POOL }, makeSmoke);

const acquireSmoke = () => {
  for (let i = 0; i < SMOKE_POOL; i++) {
    if (!smokes[i].alive) return smokes[i];
  }
  return null;
};

const spawnSmoke = (x, y, depth, rgb) => {
  const s = acquireSmoke();
  if (!s) return;
  s.alive = true;
  s.x = x + (Math.random() - 0.5) * 20 * depth;
  s.y = y + (Math.random() - 0.5) * 15 * depth;
  s.vx = WIND_X * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.3;
  s.vy = WIND_Y * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.2;
  s.radius = 8 * depth + Math.random() * 12 * depth;
  s.maxRadius = 40 * depth + Math.random() * 50 * depth;
  s.expandRate = 0.08 + Math.random() * 0.12;
  s.alpha = (0.12 + Math.random() * 0.15) * depth;
  s.decay = 0.0006 + Math.random() * 0.0008;
  s.depth = depth;
  s.turbulencePhase = Math.random() * Math.PI * 2;
  // Tint smoke with a muted version of the burst color
  s.tint = [
    Math.round(140 + (rgb[0] - 140) * 0.15),
    Math.round(135 + (rgb[1] - 135) * 0.15),
    Math.round(130 + (rgb[2] - 130) * 0.15),
  ];
};

// Spawn a cluster of smoke puffs at a burst origin
const spawnSmokeCluster = (x, y, depth, rgb) => {
  const count = 3 + ((Math.random() * 4) | 0);
  for (let i = 0; i < count; i++) {
    spawnSmoke(x, y, depth, rgb);
  }
};

// ── Burst functions (shapes) — now depth-aware ───────────────────────────────

const doBurst = (x, y, shape, hex, rgb, depth) => {
  switch (shape) {
    case 'peony':
      burstPeony(x, y, hex, rgb, depth);
      break;
    case 'ring':
      burstRing(x, y, hex, rgb, depth);
      break;
    case 'willow':
      burstWillow(x, y, hex, rgb, depth);
      break;
    case 'crossette':
      burstCrossette(x, y, hex, rgb, depth);
      break;
    case 'crackle':
      burstCrackle(x, y, hex, rgb, depth);
      break;
    default:
      burstPeony(x, y, hex, rgb, depth);
  }
  // Spawn smoke at burst origin
  spawnSmokeCluster(x, y, depth, rgb);
};

const spawnParticle = (x, y, vx, vy, hex, rgb, depth, overrides = {}) => {
  const p = acquireParticle();
  if (!p) return null;
  p.alive = true;
  p.x = x;
  p.y = y;
  p.vx = vx * depth; // far = slower
  p.vy = vy * depth;
  p.alpha = depth * (0.85 + Math.random() * 0.15); // far = dimmer
  p.decay =
    (overrides.decay ?? 0.011 + Math.random() * 0.013) * (1.1 - depth * 0.1);
  p.radius = (overrides.radius ?? 1.6 + Math.random() * 1.8) * depth;
  p.color = hex;
  p.rgb = rgb;
  p.trailLen = 0;
  p.shimmer = overrides.shimmer ?? false;
  p.shimmerPhase = Math.random() * Math.PI * 2;
  p.canReburst = overrides.canReburst ?? false;
  p.reburstAt = overrides.reburstAt ?? 0;
  p.gravity = (overrides.gravity ?? GRAVITY) * depth;
  p.friction = overrides.friction ?? FRICTION;
  p.depth = depth;
  return p;
};

const burstPeony = (x, y, hex, rgb, depth) => {
  const count = ((55 + ((Math.random() * 20) | 0)) * (0.6 + depth * 0.4)) | 0;
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
      depth,
      {
        canReburst: Math.random() < 0.12,
        reburstAt: 0.3 + Math.random() * 0.15,
      }
    );
  }
};

const burstRing = (x, y, hex, rgb, depth) => {
  const count = (40 * (0.7 + depth * 0.3)) | 0;
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
      depth,
      {
        decay: 0.009 + Math.random() * 0.006,
        radius: 2.0 + Math.random() * 0.8,
      }
    );
  }
  const innerCount = (20 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < innerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = speed * (0.2 + Math.random() * 0.35);
    spawnParticle(
      x,
      y,
      Math.cos(angle) * sp,
      Math.sin(angle) * sp,
      hex,
      rgb,
      depth,
      {
        decay: 0.02 + Math.random() * 0.015,
        radius: 1.0 + Math.random() * 0.8,
      }
    );
  }
};

const burstWillow = (x, y, hex, rgb, depth) => {
  const count = (50 * (0.6 + depth * 0.4)) | 0;
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
      depth,
      {
        decay: 0.005 + Math.random() * 0.005,
        gravity: GRAVITY * 2.2,
        friction: 0.973,
        shimmer: true,
        radius: 1.3 + Math.random() * 1.0,
      }
    );
  }
};

const burstCrossette = (x, y, hex, rgb, depth) => {
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
      depth,
      {
        decay: 0.013 + Math.random() * 0.008,
        radius: 2.2,
        canReburst: true,
        reburstAt: 0.45 + Math.random() * 0.1,
      }
    );
  }
  const fillerCount = (25 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < fillerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = BASE_SPEED * (0.15 + Math.random() * 0.3);
    spawnParticle(
      x,
      y,
      Math.cos(angle) * sp,
      Math.sin(angle) * sp,
      hex,
      rgb,
      depth,
      {
        decay: 0.018 + Math.random() * 0.012,
        radius: 1.0 + Math.random() * 0.6,
      }
    );
  }
};

const burstCrackle = (x, y, hex, rgb, depth) => {
  const coreCount = (30 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < coreCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = BASE_SPEED * (0.3 + Math.random() * 0.5);
    spawnParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      hex,
      rgb,
      depth,
      {
        decay: 0.015 + Math.random() * 0.01,
      }
    );
  }
  const sparkHex = Math.random() < 0.5 ? '#ffffff' : '#f2c94c';
  const sparkRgb = toRgb(sparkHex);
  const sparkCount = (60 * (0.5 + depth * 0.5)) | 0;
  for (let i = 0; i < sparkCount; i++) {
    const s = acquireSpark();
    if (!s) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = (1.5 + Math.random() * 3.5) * depth;
    s.alive = true;
    s.x = x + (Math.random() - 0.5) * 8;
    s.y = y + (Math.random() - 0.5) * 8;
    s.vx = Math.cos(angle) * speed;
    s.vy = Math.sin(angle) * speed;
    s.alpha = depth * (0.8 + Math.random() * 0.2);
    s.decay = 0.025 + Math.random() * 0.035;
    s.radius = (0.6 + Math.random() * 0.8) * depth;
    s.color = sparkHex;
    s.rgb = sparkRgb;
    s.depth = depth;
  }
};

// ── Secondary burst (re-burst) — inherits depth ─────────────────────────────

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
      p.depth,
      {
        decay: 0.02 + Math.random() * 0.015,
        radius: 0.9 + Math.random() * 1.0,
      }
    );
  }
  // Small smoke puff at re-burst
  spawnSmoke(p.x, p.y, p.depth, rgb2);
};

// ── Flash tracker ────────────────────────────────────────────────────────────

let flashes = [];
const addFlash = (x, y, depth) => {
  flashes.push({ alpha: 0.35 * depth, x, y, depth });
};

// ── Launch a rocket ──────────────────────────────────────────────────────────

const launchRocket = (screenW, screenH) => {
  const r = acquireRocket();
  if (!r) return;
  const hex = PALETTE[(Math.random() * PALETTE.length) | 0];
  const depth = pickDepth();
  r.alive = true;
  // Far rockets launch from narrower horizontal band (perspective)
  const xSpread = 0.1 + (1 - depth) * 0.15;
  r.x = screenW * xSpread + Math.random() * screenW * (1 - xSpread * 2);
  r.y = screenH + 10;
  // Far rockets burst higher (appear further away, smaller in sky)
  r.targetY =
    screenH * (0.05 + (1 - depth) * 0.1) +
    Math.random() * screenH * 0.35 * depth;
  r.vx = (Math.random() - 0.5) * 1.2 * depth;
  r.vy = -(6 + Math.random() * 4) * (0.7 + depth * 0.3);
  r.color = hex;
  r.rgb = toRgb(hex);
  r.shape = pickShape();
  r.depth = depth;
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
    ensureSmokeTexture();
    resize();
    window.addEventListener('resize', resize);

    // Reset all pools
    for (let i = 0; i < ROCKET_POOL; i++) rockets[i].alive = false;
    for (let i = 0; i < PARTICLE_POOL; i++) particles[i].alive = false;
    for (let i = 0; i < SPARK_POOL; i++) sparks[i].alive = false;
    for (let i = 0; i < SMOKE_POOL; i++) smokes[i].alive = false;
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

      // ── Draw flashes ───────────────────────────────────────────────
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.alpha -= 0.025;
        if (f.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const flashRadius = w() * 0.4 * f.depth;
        const grad = ctx.createRadialGradient(
          f.x,
          f.y,
          0,
          f.x,
          f.y,
          flashRadius
        );
        grad.addColorStop(0, `rgba(255,255,255,${f.alpha})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w(), h());
        ctx.globalCompositeOperation = 'source-over';
      }

      // ══════════════════════════════════════════════════════════════════
      // RENDER ORDER: far particles → smoke → close particles
      // This creates the depth sandwich effect
      // ══════════════════════════════════════════════════════════════════

      let liveCount = 0;

      // ── PASS 1: Draw FAR particles + sparks (depth < 0.75) ─────────
      for (let i = 0; i < PARTICLE_POOL; i++) {
        const p = particles[i];
        if (!p.alive || p.depth >= 0.75) continue;
        liveCount++;
        updateAndDrawParticle(ctx, p);
      }

      for (let i = 0; i < SPARK_POOL; i++) {
        const s = sparks[i];
        if (!s.alive || s.depth >= 0.75) continue;
        liveCount++;
        updateAndDrawSpark(ctx, s, i, now);
      }

      // ── Draw FAR rockets ────────────────────────────────────────────
      for (let i = 0; i < ROCKET_POOL; i++) {
        const r = rockets[i];
        if (!r.alive || r.depth >= 0.75) continue;
        updateAndDrawRocket(ctx, r, dt, w);
      }

      // ── PASS 2: Draw smoke (between layers) ────────────────────────
      for (let i = 0; i < SMOKE_POOL; i++) {
        const s = smokes[i];
        if (!s.alive) continue;
        liveCount++;

        // Turbulence — organic wobble
        s.turbulencePhase += 0.008;
        const wobbleX = Math.sin(s.turbulencePhase * 1.3) * 0.15;
        const wobbleY = Math.cos(s.turbulencePhase * 0.9) * 0.1;

        s.x += s.vx + wobbleX;
        s.y += s.vy + wobbleY;

        // Expand
        if (s.radius < s.maxRadius) {
          s.radius += s.expandRate * s.depth;
        }

        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          s.alive = false;
          continue;
        }

        // Draw smoke puff using pre-rendered texture
        const drawSize = s.radius * 2;
        ctx.globalAlpha = s.alpha;
        ctx.drawImage(
          smokeCanvas,
          s.x - s.radius,
          s.y - s.radius,
          drawSize,
          drawSize
        );
      }
      ctx.globalAlpha = 1;

      // ── PASS 3: Draw CLOSE particles + sparks (depth >= 0.75) ──────
      for (let i = 0; i < PARTICLE_POOL; i++) {
        const p = particles[i];
        if (!p.alive || p.depth < 0.75) continue;
        liveCount++;
        updateAndDrawParticle(ctx, p);
      }

      for (let i = 0; i < SPARK_POOL; i++) {
        const s = sparks[i];
        if (!s.alive || s.depth < 0.75) continue;
        liveCount++;
        updateAndDrawSpark(ctx, s, i, now);
      }

      // ── Draw CLOSE rockets ──────────────────────────────────────────
      for (let i = 0; i < ROCKET_POOL; i++) {
        const r = rockets[i];
        if (!r.alive || r.depth < 0.75) continue;
        updateAndDrawRocket(ctx, r, dt, w);
      }

      ctx.globalAlpha = 1;

      // ── Count rockets alive ─────────────────────────────────────────
      let rocketsAlive = 0;
      for (let i = 0; i < ROCKET_POOL; i++) {
        if (rockets[i].alive) rocketsAlive++;
      }

      // ── Count smoke alive ───────────────────────────────────────────
      let smokeAlive = 0;
      for (let i = 0; i < SMOKE_POOL; i++) {
        if (smokes[i].alive) smokeAlive++;
      }

      // ── End condition ───────────────────────────────────────────────
      if (
        elapsed >= SHOW_DURATION &&
        liveCount === 0 &&
        rocketsAlive === 0 &&
        smokeAlive === 0 &&
        flashes.length === 0
      ) {
        onDone?.();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    // ── Particle update + draw (extracted to avoid duplication) ────────
    function updateAndDrawParticle(ctx, p) {
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
        addFlash(p.x, p.y, p.depth);
      }

      if (p.alpha <= 0) {
        p.alive = false;
        // Spawn a tiny smoke puff where particle dies (occasionally)
        if (Math.random() < 0.06) {
          spawnSmoke(p.x, p.y, p.depth, p.rgb);
        }
        return;
      }

      const [pr, pg, pb] = p.rgb;

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

      // Glow head
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

    // ── Spark update + draw ───────────────────────────────────────────
    function updateAndDrawSpark(ctx, s, idx, now) {
      s.vy += GRAVITY * 0.6;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.decay;

      if (s.alpha <= 0) {
        s.alive = false;
        return;
      }

      const twinkle = 0.5 + 0.5 * Math.sin(now * 0.02 + idx * 1.7);
      const [sr, sg, sb] = s.rgb;

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // ── Rocket update + draw ──────────────────────────────────────────
    function updateAndDrawRocket(ctx, r, dt, w) {
      r.age += dt;

      // Trail history
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
      r.vy += 0.06;

      // Emit rocket spark trail
      if (Math.random() < 0.7) {
        const s = acquireSpark();
        if (s) {
          s.alive = true;
          s.x = r.x + (Math.random() - 0.5) * 3 * r.depth;
          s.y = r.y;
          s.vx = (Math.random() - 0.5) * 0.8;
          s.vy = (0.5 + Math.random() * 1.5) * r.depth;
          s.alpha = (0.8 + Math.random() * 0.2) * r.depth;
          s.decay = 0.035 + Math.random() * 0.03;
          s.radius = (0.5 + Math.random() * 0.8) * r.depth;
          s.color = r.color;
          s.rgb = r.rgb;
          s.depth = r.depth;
        }
      }

      // Draw rocket head — size scales with depth
      const headSize = 2.5 * r.depth;
      const coreSize = 1.2 * r.depth;
      const [rr, rg, rb] = r.rgb;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = r.depth;
      ctx.beginPath();
      ctx.arc(r.x, r.y, headSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${rr},${rg},${rb})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r.x, r.y, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Burst condition
      if (r.y <= r.targetY || r.vy >= 0) {
        r.alive = false;
        doBurst(r.x, r.y, r.shape, r.color, r.rgb, r.depth);
        addFlash(r.x, r.y, r.depth);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    safetyRef.current = window.setTimeout(
      () => onDone?.(),
      SHOW_DURATION + 5000 // extra time for smoke to clear
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
