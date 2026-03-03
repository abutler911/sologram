// components/easter/Fireworks.js
// ─────────────────────────────────────────────────────────────────────────────
// 🎆  FIREWORKS v4 — The Full Show
//
// What changed from v3:
//   1. Color transitions — particles shift hue over their lifetime
//      (gold→red, white→blue, mint→purple, etc.) via RGB lerp
//   2. Gravity-affected trails — trail segments droop progressively
//      more the older they are, creating that classic "weeping" look
//   3. Sound engine — Web Audio API synthesized effects:
//      • Rising whistle on each rocket
//      • Deep boom on detonation (tuned to burst shape)
//      • Crackle pops for crackle shape
//      • Delay-line reverb tail on everything
//      All synthesized — zero audio files
//   4. Enhanced depth — far bursts muffled, perspective-narrowed,
//      render-sorted (far → smoke → close)
//
// Architecture: pre-allocated pools, RAF, clearRect, no GC.
// Audio: single AudioContext, pre-built effect chain, pooled oscillators.
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
const TRAIL_DROOP = 0.045; // extra gravity per trail segment (weeping)

// ── Wind ─────────────────────────────────────────────────────────────────────

const WIND_X = 0.15;
const WIND_Y = -0.08;

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

// ── Color transition pairs [startHex, endHex] ────────────────────────────────

const COLOR_TRANSITIONS = [
  ['#f2c94c', '#e98973'], // gold → salmon
  ['#ffffff', '#88b2cc'], // white → sky blue
  ['#7be0ad', '#c9a0ff'], // mint → lavender
  ['#ffad9e', '#ff6b8a'], // peach → hot pink
  ['#ff9f43', '#e98973'], // orange → salmon
  ['#a8cfd8', '#658ea9'], // light blue → steel
  ['#ffffff', '#f2c94c'], // white → gold
  ['#e7d4c0', '#ff9f43'], // cream → orange
  ['#c9a0ff', '#ff6b8a'], // lavender → pink
  ['#88b2cc', '#7be0ad'], // sky → mint
];

// ── Burst shapes ─────────────────────────────────────────────────────────────

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

// ── Depth ────────────────────────────────────────────────────────────────────

const pickDepth = () => {
  const r = Math.random();
  if (r < 0.25) return 0.5 + Math.random() * 0.15;
  if (r < 0.5) return 0.65 + Math.random() * 0.15;
  return 0.8 + Math.random() * 0.2;
};

// ── RGB helpers ──────────────────────────────────────────────────────────────

const rgbCache = {};
const toRgb = (hex) => {
  if (rgbCache[hex]) return rgbCache[hex];
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  rgbCache[hex] = rgb;
  return rgb;
};
PALETTE.forEach(toRgb);
COLOR_TRANSITIONS.forEach(([a, b]) => {
  toRgb(a);
  toRgb(b);
});

const lerpRgb = (a, b, t) => [
  (a[0] + (b[0] - a[0]) * t) | 0,
  (a[1] + (b[1] - a[1]) * t) | 0,
  (a[2] + (b[2] - a[2]) * t) | 0,
];

const pickTransition = () =>
  COLOR_TRANSITIONS[(Math.random() * COLOR_TRANSITIONS.length) | 0];

// ── Glow texture ─────────────────────────────────────────────────────────────

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

// ── Smoke texture ────────────────────────────────────────────────────────────

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

// ══════════════════════════════════════════════════════════════════════════════
// 🔊 SOUND ENGINE
// ══════════════════════════════════════════════════════════════════════════════

let audioCtx = null;
let masterGain = null;
let reverbGain = null;
let soundEnabled = false;

const initAudio = () => {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);

    // Delay-line reverb
    reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.15;

    const delays = [0.12, 0.24, 0.38].map((t) => {
      const d = audioCtx.createDelay(1.0);
      d.delayTime.value = t;
      return d;
    });

    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.25;

    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 2500;

    delays.forEach((d) => {
      reverbGain.connect(d);
      d.connect(lpf);
    });
    lpf.connect(feedback);
    feedback.connect(reverbGain);
    lpf.connect(masterGain);

    soundEnabled = true;
  } catch {
    soundEnabled = false;
  }
};

const destroyAudio = () => {
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch {}
    audioCtx = null;
    masterGain = null;
    reverbGain = null;
    soundEnabled = false;
  }
};

// Helper: create noise buffer
const makeNoise = (dur) => {
  const len = (audioCtx.sampleRate * dur) | 0;
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
};

// ── Rocket whistle ───────────────────────────────────────────────────────────

const playRocketWhistle = (depth, durationMs = 600) => {
  if (!soundEnabled) return;
  const now = audioCtx.currentTime;
  const dur = (durationMs / 1000) * (0.8 + depth * 0.2);
  const vol = 0.06 * depth;

  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300 + Math.random() * 200, now);
  osc.frequency.exponentialRampToValueAtTime(
    800 + Math.random() * 600,
    now + dur
  );

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.setValueAtTime(vol * 0.8, now + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  // Hiss layer
  const noise = audioCtx.createBufferSource();
  noise.buffer = makeNoise(dur);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.5, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  const bpf = audioCtx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 3000;
  bpf.Q.value = 2;

  osc.connect(gain);
  gain.connect(masterGain);
  gain.connect(reverbGain);
  noise.connect(bpf);
  bpf.connect(noiseGain);
  noiseGain.connect(masterGain);

  osc.start(now);
  osc.stop(now + dur + 0.05);
  noise.start(now);
  noise.stop(now + dur + 0.05);
};

// ── Burst boom ───────────────────────────────────────────────────────────────

const playBoom = (depth, shape) => {
  if (!soundEnabled) return;
  const now = audioCtx.currentTime;
  const vol = (0.15 + Math.random() * 0.08) * depth * depth;

  // Sub thump
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  const freq = shape === 'willow' ? 50 : shape === 'ring' ? 70 : 60;
  osc.frequency.setValueAtTime(freq + Math.random() * 30, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);

  const oscGain = audioCtx.createGain();
  oscGain.gain.setValueAtTime(vol, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  // Crack
  const crackDur = 0.08 + Math.random() * 0.06;
  const crack = audioCtx.createBufferSource();
  crack.buffer = makeNoise(crackDur);

  const crackGain = audioCtx.createGain();
  crackGain.gain.setValueAtTime(vol * 1.2, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + crackDur + 0.05);

  // Muffle far
  const lpf = audioCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 1000 + depth * 4000;

  osc.connect(oscGain);
  oscGain.connect(lpf);
  crack.connect(crackGain);
  crackGain.connect(lpf);
  lpf.connect(masterGain);
  lpf.connect(reverbGain);

  osc.start(now);
  osc.stop(now + 0.5);
  crack.start(now);
  crack.stop(now + crackDur + 0.1);
};

// ── Crackle pops ─────────────────────────────────────────────────────────────

const playCrackle = (depth) => {
  if (!soundEnabled) return;
  const now = audioCtx.currentTime;
  const vol = 0.04 * depth;
  const popCount = 8 + ((Math.random() * 8) | 0);

  for (let i = 0; i < popCount; i++) {
    const t = now + Math.random() * 0.5;
    const popDur = 0.01 + Math.random() * 0.015;

    const pop = audioCtx.createBufferSource();
    pop.buffer = makeNoise(popDur);

    const popGain = audioCtx.createGain();
    popGain.gain.setValueAtTime(vol * (0.5 + Math.random() * 0.5), t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + popDur + 0.02);

    const hpf = audioCtx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 2000 + Math.random() * 3000;

    pop.connect(hpf);
    hpf.connect(popGain);
    popGain.connect(masterGain);

    pop.start(t);
    pop.stop(t + popDur + 0.05);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// OBJECT POOLS
// ══════════════════════════════════════════════════════════════════════════════

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
  for (let i = 0; i < ROCKET_POOL; i++)
    if (!rockets[i].alive) return rockets[i];
  return null;
};

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
  startRgb: [0, 0, 0],
  endRgb: [0, 0, 0],
  useTransition: false,
  trail: new Float64Array(TRAIL_LEN * 2),
  trailVy: new Float64Array(TRAIL_LEN),
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
  for (let i = 0; i < PARTICLE_POOL; i++)
    if (!particles[i].alive) return particles[i];
  return null;
};

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
  for (let i = 0; i < SPARK_POOL; i++) if (!sparks[i].alive) return sparks[i];
  return null;
};

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
  tint: [160, 150, 140],
});
const smokes = Array.from({ length: SMOKE_POOL }, makeSmoke);
const acquireSmoke = () => {
  for (let i = 0; i < SMOKE_POOL; i++) if (!smokes[i].alive) return smokes[i];
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
  s.tint = [
    Math.round(140 + (rgb[0] - 140) * 0.15),
    Math.round(135 + (rgb[1] - 135) * 0.15),
    Math.round(130 + (rgb[2] - 130) * 0.15),
  ];
};

const spawnSmokeCluster = (x, y, depth, rgb) => {
  const count = 3 + ((Math.random() * 4) | 0);
  for (let i = 0; i < count; i++) spawnSmoke(x, y, depth, rgb);
};

// ══════════════════════════════════════════════════════════════════════════════
// BURST FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

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
  spawnSmokeCluster(x, y, depth, rgb);
  playBoom(depth, shape);
  if (shape === 'crackle') playCrackle(depth);
};

const spawnParticle = (x, y, vx, vy, hex, rgb, depth, overrides = {}) => {
  const p = acquireParticle();
  if (!p) return null;
  p.alive = true;
  p.x = x;
  p.y = y;
  p.vx = vx * depth;
  p.vy = vy * depth;
  p.alpha = depth * (0.85 + Math.random() * 0.15);
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

  // Color transition (70% chance)
  if (overrides.useTransition !== false && Math.random() < 0.7) {
    const [sHex, eHex] = pickTransition();
    p.startRgb = toRgb(sHex);
    p.endRgb = toRgb(eHex);
    p.useTransition = true;
  } else {
    p.startRgb = rgb;
    p.endRgb = rgb;
    p.useTransition = false;
  }
  return p;
};

const burstPeony = (x, y, hex, rgb, depth) => {
  const n = ((55 + ((Math.random() * 20) | 0)) * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = BASE_SPEED * (0.3 + Math.random() * 0.7);
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, hex, rgb, depth, {
      canReburst: Math.random() < 0.12,
      reburstAt: 0.3 + Math.random() * 0.15,
    });
  }
};

const burstRing = (x, y, hex, rgb, depth) => {
  const n = (40 * (0.7 + depth * 0.3)) | 0;
  const sp = BASE_SPEED * 0.85;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    spawnParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, hex, rgb, depth, {
      decay: 0.009 + Math.random() * 0.006,
      radius: 2.0 + Math.random() * 0.8,
    });
  }
  const inner = (20 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < inner; i++) {
    const a = Math.random() * Math.PI * 2;
    const s2 = sp * (0.2 + Math.random() * 0.35);
    spawnParticle(x, y, Math.cos(a) * s2, Math.sin(a) * s2, hex, rgb, depth, {
      decay: 0.02 + Math.random() * 0.015,
      radius: 1.0 + Math.random() * 0.8,
    });
  }
};

const burstWillow = (x, y, hex, rgb, depth) => {
  const n = (50 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = BASE_SPEED * (0.5 + Math.random() * 0.5);
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, hex, rgb, depth, {
      decay: 0.005 + Math.random() * 0.005,
      gravity: GRAVITY * 2.2,
      friction: 0.973,
      shimmer: true,
      radius: 1.3 + Math.random() * 1.0,
    });
  }
};

const burstCrossette = (x, y, hex, rgb, depth) => {
  const arms = 4 + ((Math.random() * 3) | 0);
  const base = Math.random() * Math.PI * 2;
  for (let a = 0; a < arms; a++) {
    const angle = base + (a / arms) * Math.PI * 2;
    const s = BASE_SPEED * 0.9;
    spawnParticle(
      x,
      y,
      Math.cos(angle) * s,
      Math.sin(angle) * s,
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
  const fill = (25 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < fill; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = BASE_SPEED * (0.15 + Math.random() * 0.3);
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, hex, rgb, depth, {
      decay: 0.018 + Math.random() * 0.012,
      radius: 1.0 + Math.random() * 0.6,
    });
  }
};

const burstCrackle = (x, y, hex, rgb, depth) => {
  const core = (30 * (0.6 + depth * 0.4)) | 0;
  for (let i = 0; i < core; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = BASE_SPEED * (0.3 + Math.random() * 0.5);
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, hex, rgb, depth, {
      decay: 0.015 + Math.random() * 0.01,
    });
  }
  const sHex = Math.random() < 0.5 ? '#ffffff' : '#f2c94c';
  const sRgb = toRgb(sHex);
  const sn = (60 * (0.5 + depth * 0.5)) | 0;
  for (let i = 0; i < sn; i++) {
    const sp = acquireSpark();
    if (!sp) break;
    const a = Math.random() * Math.PI * 2;
    const s = (1.5 + Math.random() * 3.5) * depth;
    sp.alive = true;
    sp.x = x + (Math.random() - 0.5) * 8;
    sp.y = y + (Math.random() - 0.5) * 8;
    sp.vx = Math.cos(a) * s;
    sp.vy = Math.sin(a) * s;
    sp.alpha = depth * (0.8 + Math.random() * 0.2);
    sp.decay = 0.025 + Math.random() * 0.035;
    sp.radius = (0.6 + Math.random() * 0.8) * depth;
    sp.color = sHex;
    sp.rgb = sRgb;
    sp.depth = depth;
  }
};

// ── Re-burst ─────────────────────────────────────────────────────────────────

const reburst = (p) => {
  const hex2 = PALETTE[(Math.random() * PALETTE.length) | 0];
  const rgb2 = toRgb(hex2);
  const n = 12 + ((Math.random() * 10) | 0);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.5 + Math.random() * 2.0;
    spawnParticle(
      p.x,
      p.y,
      Math.cos(a) * s,
      Math.sin(a) * s,
      hex2,
      rgb2,
      p.depth,
      {
        decay: 0.02 + Math.random() * 0.015,
        radius: 0.9 + Math.random() * 1.0,
      }
    );
  }
  spawnSmoke(p.x, p.y, p.depth, rgb2);
};

// ── Flash ────────────────────────────────────────────────────────────────────

let flashes = [];
const addFlash = (x, y, depth) => {
  flashes.push({ alpha: 0.35 * depth, x, y, depth });
};

// ── Launch ───────────────────────────────────────────────────────────────────

const launchRocket = (screenW, screenH) => {
  const r = acquireRocket();
  if (!r) return;
  const hex = PALETTE[(Math.random() * PALETTE.length) | 0];
  const depth = pickDepth();
  r.alive = true;
  const xSpread = 0.1 + (1 - depth) * 0.15;
  r.x = screenW * xSpread + Math.random() * screenW * (1 - xSpread * 2);
  r.y = screenH + 10;
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
  playRocketWhistle(depth);
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

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
    initAudio();
    resize();
    window.addEventListener('resize', resize);

    // Reset pools
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

    // ── Particle update + draw ────────────────────────────────────────
    function drawParticle(p) {
      // Trail with vy history for droop
      if (p.trailLen < TRAIL_LEN) {
        p.trail[p.trailLen * 2] = p.x;
        p.trail[p.trailLen * 2 + 1] = p.y;
        p.trailVy[p.trailLen] = p.vy;
        p.trailLen++;
      } else {
        for (let t = 0; t < (TRAIL_LEN - 1) * 2; t++)
          p.trail[t] = p.trail[t + 2];
        for (let t = 0; t < TRAIL_LEN - 1; t++) p.trailVy[t] = p.trailVy[t + 1];
        p.trail[(TRAIL_LEN - 1) * 2] = p.x;
        p.trail[(TRAIL_LEN - 1) * 2 + 1] = p.y;
        p.trailVy[TRAIL_LEN - 1] = p.vy;
      }

      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.canReburst && p.alpha <= p.reburstAt && p.alpha > 0) {
        p.canReburst = false;
        reburst(p);
        addFlash(p.x, p.y, p.depth);
      }

      if (p.alpha <= 0) {
        p.alive = false;
        if (Math.random() < 0.06) spawnSmoke(p.x, p.y, p.depth, p.rgb);
        return;
      }

      // Color transition
      const t = 1 - p.alpha;
      let pr, pg, pb;
      if (p.useTransition) {
        const c = lerpRgb(p.startRgb, p.endRgb, t);
        pr = c[0];
        pg = c[1];
        pb = c[2];
      } else {
        [pr, pg, pb] = p.rgb;
      }

      let drawAlpha = p.alpha;
      if (p.shimmer) {
        p.shimmerPhase += 0.15;
        drawAlpha *= 0.5 + 0.5 * Math.sin(p.shimmerPhase);
      }

      // Gravity-affected trail — older segments droop quadratically
      for (let i = 0; i < p.trailLen; i++) {
        const age = p.trailLen - i;
        const droop = age * age * TRAIL_DROOP * p.depth;
        const frac = i / p.trailLen;
        const a = drawAlpha * frac * 0.25;
        const rad = p.radius * (0.25 + frac * 0.5);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(
          p.trail[i * 2],
          p.trail[i * 2 + 1] + droop,
          rad,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fill();
      }

      // Glow
      const gd = p.radius * 5;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = drawAlpha * 0.6;
      ctx.drawImage(glowCanvas, p.x - gd / 2, p.y - gd / 2, gd, gd);

      // Core
      ctx.globalAlpha = drawAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Color ring
      ctx.globalAlpha = drawAlpha * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
    }

    // ── Spark update + draw ───────────────────────────────────────────
    function drawSpark(s, idx, now) {
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

      const tw = 0.5 + 0.5 * Math.sin(now * 0.02 + idx * 1.7);
      const [sr, sg, sb] = s.rgb;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = s.alpha * tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // ── Rocket update + draw ──────────────────────────────────────────
    function drawRocket(r, dt) {
      r.age += dt;
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

      const hs = 2.5 * r.depth;
      const cs = 1.2 * r.depth;
      const [rr, rg, rb] = r.rgb;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = r.depth;
      ctx.beginPath();
      ctx.arc(r.x, r.y, hs, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${rr},${rg},${rb})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r.x, r.y, cs, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      if (r.y <= r.targetY || r.vy >= 0) {
        r.alive = false;
        doBurst(r.x, r.y, r.shape, r.color, r.rgb, r.depth);
        addFlash(r.x, r.y, r.depth);
      }
    }

    // ── Main loop ─────────────────────────────────────────────────────
    const loop = (now) => {
      const dt = now - prev;
      prev = now;
      elapsed += dt;

      const isFinale = elapsed >= FINALE_START && elapsed < SHOW_DURATION - 400;
      const interval = isFinale ? FINALE_INTERVAL : LAUNCH_INTERVAL;

      ctx.clearRect(0, 0, w(), h());

      // Launch
      if (elapsed - lastLaunch > interval && elapsed < SHOW_DURATION - 400) {
        lastLaunch = elapsed;
        const n = isFinale
          ? 2 + ((Math.random() * 3) | 0)
          : 1 + ((Math.random() * 1.5) | 0);
        for (let i = 0; i < n; i++) launchRocket(w(), h());
      }

      // Flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.alpha -= 0.025;
        if (f.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const fr = w() * 0.4 * f.depth;
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, fr);
        grad.addColorStop(0, `rgba(255,255,255,${f.alpha})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w(), h());
        ctx.globalCompositeOperation = 'source-over';
      }

      let liveCount = 0;

      // PASS 1 — FAR (depth < 0.75)
      for (let i = 0; i < ROCKET_POOL; i++) {
        if (rockets[i].alive && rockets[i].depth < 0.75)
          drawRocket(rockets[i], dt);
      }
      for (let i = 0; i < PARTICLE_POOL; i++) {
        if (!particles[i].alive || particles[i].depth >= 0.75) continue;
        liveCount++;
        drawParticle(particles[i]);
      }
      for (let i = 0; i < SPARK_POOL; i++) {
        if (!sparks[i].alive || sparks[i].depth >= 0.75) continue;
        liveCount++;
        drawSpark(sparks[i], i, now);
      }

      // PASS 2 — SMOKE
      for (let i = 0; i < SMOKE_POOL; i++) {
        const s = smokes[i];
        if (!s.alive) continue;
        liveCount++;
        s.turbulencePhase += 0.008;
        s.x += s.vx + Math.sin(s.turbulencePhase * 1.3) * 0.15;
        s.y += s.vy + Math.cos(s.turbulencePhase * 0.9) * 0.1;
        if (s.radius < s.maxRadius) s.radius += s.expandRate * s.depth;
        s.alpha -= s.decay;
        if (s.alpha <= 0) {
          s.alive = false;
          continue;
        }
        ctx.globalAlpha = s.alpha;
        ctx.drawImage(
          smokeCanvas,
          s.x - s.radius,
          s.y - s.radius,
          s.radius * 2,
          s.radius * 2
        );
      }
      ctx.globalAlpha = 1;

      // PASS 3 — CLOSE (depth >= 0.75)
      for (let i = 0; i < ROCKET_POOL; i++) {
        if (rockets[i].alive && rockets[i].depth >= 0.75)
          drawRocket(rockets[i], dt);
      }
      for (let i = 0; i < PARTICLE_POOL; i++) {
        if (!particles[i].alive || particles[i].depth < 0.75) continue;
        liveCount++;
        drawParticle(particles[i]);
      }
      for (let i = 0; i < SPARK_POOL; i++) {
        if (!sparks[i].alive || sparks[i].depth < 0.75) continue;
        liveCount++;
        drawSpark(sparks[i], i, now);
      }

      ctx.globalAlpha = 1;

      // End check
      let rocketsAlive = 0;
      for (let i = 0; i < ROCKET_POOL; i++)
        if (rockets[i].alive) rocketsAlive++;
      let smokeAlive = 0;
      for (let i = 0; i < SMOKE_POOL; i++) if (smokes[i].alive) smokeAlive++;

      if (
        elapsed >= SHOW_DURATION &&
        liveCount === 0 &&
        rocketsAlive === 0 &&
        smokeAlive === 0 &&
        flashes.length === 0
      ) {
        destroyAudio();
        onDone?.();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    safetyRef.current = window.setTimeout(() => {
      destroyAudio();
      onDone?.();
    }, SHOW_DURATION + 5000);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(safetyRef.current);
      destroyAudio();
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
