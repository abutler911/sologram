// client/src/components/animations/LikeBurst.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, css } from 'styled-components';

// ─── Particle config ──────────────────────────────────────────────────────────

const HEART_COUNT = 10;
const CONFETTI_COUNT = 28;

const HEART_COLORS = ['#e87c5a', '#e05c7a', '#f4a261', '#c9184a', '#ff6b9d'];
const CONFETTI_COLORS = [
  '#e87c5a',
  '#7aab8c',
  '#c9a84c',
  '#e05c7a',
  '#f4a261',
  '#52b788',
  '#ffd166',
  '#ef476f',
];
const CONFETTI_SHAPES = ['rect', 'rect', 'circle', 'rect', 'strip'];

// ─── Math helpers ─────────────────────────────────────────────────────────────

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const randFrom = (arr) => arr[randInt(0, arr.length)];
const randAngle = () => rand(0, Math.PI * 2);

// Build a deterministic set of particles once per burst so React
// doesn't re-randomise on every render tick.
const buildParticles = (cx, cy) => {
  const hearts = Array.from({ length: HEART_COUNT }, (_, i) => {
    const angle = (i / HEART_COUNT) * Math.PI * 2 + rand(-0.3, 0.3);
    const distance = rand(52, 110);
    return {
      id: `h${i}`,
      type: 'heart',
      x: cx,
      y: cy,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - rand(20, 50), // bias upward
      size: rand(10, 22),
      color: randFrom(HEART_COLORS),
      delay: rand(0, 0.12),
      dur: rand(0.7, 1.1),
    };
  });

  const confetti = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle = rand(-Math.PI, 0); // fan upward from click point
    const speed = rand(60, 160);
    const shape = randFrom(CONFETTI_SHAPES);
    return {
      id: `c${i}`,
      type: 'confetti',
      shape,
      x: cx + rand(-20, 20),
      y: cy,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      width: shape === 'strip' ? rand(3, 5) : rand(6, 12),
      height: shape === 'strip' ? rand(14, 22) : rand(6, 12),
      color: randFrom(CONFETTI_COLORS),
      rotate: rand(0, 360),
      spin: rand(-540, 540),
      delay: rand(0, 0.1),
      dur: rand(0.8, 1.3),
    };
  });

  return [...hearts, ...confetti];
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useLikeBurst()
 *
 * Returns:
 *   triggerBurst(e)  — call from the like button's onClick, passing the event
 *   BurstPortal      — render this anywhere in your JSX (it self-manages)
 *
 * Usage:
 *   const { triggerBurst, BurstPortal } = useLikeBurst();
 *   ...
 *   <LikeButton onClick={(e) => { handleLike(); triggerBurst(e); }}>♥</LikeButton>
 *   <BurstPortal />
 */
export const useLikeBurst = () => {
  const [bursts, setBursts] = useState([]);

  const triggerBurst = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const id = Date.now();

    setBursts((prev) => [
      ...prev,
      { id, cx, cy, particles: buildParticles(cx, cy) },
    ]);

    // Auto-remove after animation completes
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 1600);
  }, []);

  const BurstPortal = useCallback(() => {
    if (!bursts.length) return null;
    return createPortal(
      <BurstLayer>
        {bursts.map((burst) =>
          burst.particles.map((p) =>
            p.type === 'heart' ? (
              <HeartParticle key={p.id} p={p} />
            ) : (
              <ConfettiParticle key={p.id} p={p} />
            )
          )
        )}
      </BurstLayer>,
      document.body
    );
  }, [bursts]);

  return { triggerBurst, BurstPortal };
};

// ─── Heart particle ───────────────────────────────────────────────────────────

const heartFly = (p) => keyframes`
  0%   { transform: translate(0, 0)               scale(0.2); opacity: 1; }
  35%  { transform: translate(${p.dx * 0.5}px, ${
  p.dy * 0.5
}px) scale(1.15); opacity: 1; }
  70%  { transform: translate(${p.dx * 0.85}px, ${
  p.dy * 0.85 + 20
}px) scale(0.9); opacity: 0.7; }
  100% { transform: translate(${p.dx}px, ${
  p.dy + 45
}px) scale(0.5); opacity: 0; }
`;

const HeartParticle = ({ p }) => (
  <HeartDot
    style={{
      left: p.x,
      top: p.y,
      width: p.size,
      height: p.size,
      color: p.color,
      animationDuration: `${p.dur}s`,
      animationDelay: `${p.delay}s`,
    }}
    $anim={heartFly(p)}
  >
    ♥
  </HeartDot>
);

const HeartDot = styled.div`
  position: fixed;
  display: grid;
  place-items: center;
  font-size: ${(p) => p.style?.width}px;
  line-height: 1;
  pointer-events: none;
  transform-origin: center;
  animation: ${(p) => p.$anim} ${(p) => p.style?.animationDuration}
    cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: ${(p) => p.style?.animationDelay};
  will-change: transform, opacity;
`;

// ─── Confetti particle ────────────────────────────────────────────────────────

const confettiFly = (p) => keyframes`
  0%   {
    transform: translate(0, 0) rotate(${p.rotate}deg);
    opacity: 1;
  }
  20%  {
    opacity: 1;
  }
  100% {
    transform: translate(${p.dx}px, ${p.dy + 120}px) rotate(${
  p.rotate + p.spin
}deg);
    opacity: 0;
  }
`;

const ConfettiParticle = ({ p }) => (
  <ConfettiDot
    style={{
      left: p.x - p.width / 2,
      top: p.y - p.height / 2,
      width: p.width,
      height: p.height,
      background: p.color,
      borderRadius:
        p.shape === 'circle' ? '50%' : p.shape === 'strip' ? '2px' : '2px',
      animationDuration: `${p.dur}s`,
      animationDelay: `${p.delay}s`,
    }}
    $anim={confettiFly(p)}
  />
);

const ConfettiDot = styled.div`
  position: fixed;
  pointer-events: none;
  transform-origin: center;
  animation: ${(p) => p.$anim} ${(p) => p.style?.animationDuration}
    cubic-bezier(0.2, 0.8, 0.4, 1) both;
  animation-delay: ${(p) => p.style?.animationDelay};
  will-change: transform, opacity;
`;

// ─── Portal layer ─────────────────────────────────────────────────────────────

const BurstLayer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998; /* just below the plane, above everything else */
  overflow: hidden;
`;
