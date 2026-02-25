// components/common/LoadingSpinner.js
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { COLORS } from '../../theme';

/**
 * LoadingSpinner
 *
 * Props (all optional — fully backward-compatible):
 *   size        {string}  — spinner diameter,        default "44px"
 *   speed       {string}  — rotation speed,          default "0.9s"
 *   text        {string}  — label below spinner,     default "Loading"
 *   textSize    {string}  — label font-size,         default "0.85rem"
 *   overlay     {bool}    — fixed full-screen cover, default false
 *   fullHeight  {bool}    — wrapper fills viewport,  default false
 *   height      {string}  — wrapper min-height,      default "200px"
 *   noMinHeight {bool}    — strip wrapper min-height, default false
 *   showDots    {bool}    — animated ellipsis,       default true
 *   color       {string}  — override accent colour   (rarely needed)
 *
 * Design
 *   Two concentric SVG arcs:
 *     • Outer arc — salmon, spins clockwise
 *     • Inner arc — mint,   spins counter-clockwise (slower)
 *   Clean fade-in text label + optional animated ellipsis.
 *   Overlay mode uses the dark theme background, not the old cream colour.
 */

// ── Keyframes ──────────────────────────────────────────────────────────────────
const spinCW = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const spinCCW = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const dotCycle = keyframes`
  0%,  19% { content: "";   }
  20%, 39% { content: ".";  }
  40%, 59% { content: ".."; }
  60%, 79% { content: "..."; }
  80%,100% { content: "";   }
`;

// ── Styled components ──────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  /* Sizing / positioning */
  min-height: ${(p) => {
    if (p.$noMinHeight) return '0';
    if (p.$fullHeight)
      return '100%'; /* relative to parent — avoids vh overflow in sidebar layouts */
    return p.$height || '200px';
  }};
  padding: ${(p) => (p.$noMinHeight ? '0' : '24px')};

  /* Overlay mode — dark-theme backdrop */
  ${(p) =>
    p.$overlay &&
    `
    position: fixed;
    inset: 0;
    background: ${COLORS.background}e6;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 1200;
  `}
`;

/* Outer SVG ring — spins clockwise */
const OuterRing = styled.svg`
  animation: ${spinCW} ${(p) => p.$speed} linear infinite;
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
`;

/* Inner SVG ring — spins counter-clockwise, slower */
const InnerRing = styled.svg`
  animation: ${spinCCW} ${(p) => p.$speed} linear infinite;
  animation-duration: ${(p) => {
    /* ~1.6× slower than the outer ring */
    const ms = parseFloat(p.$speed) * 1.6;
    return p.$speed.endsWith('ms') ? `${ms}ms` : `${ms}s`;
  }};
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
`;

const RingWrap = styled.div`
  position: relative;
  width: ${(p) => p.$size};
  height: ${(p) => p.$size};
  flex-shrink: 0;
`;

const Label = styled.span`
  font-size: ${(p) => p.$textSize};
  font-weight: 500;
  color: ${COLORS.textSecondary};
  letter-spacing: 0.4px;
  animation: ${fadeUp} 0.4s ease both;
  animation-delay: 0.1s;

  &::after {
    content: '';
    display: inline-block;
    width: 1.5ch;
    text-align: left;
    animation: ${dotCycle} 1.6s steps(1) infinite;
  }
`;

const LabelNoAnim = styled.span`
  font-size: ${(p) => p.$textSize};
  font-weight: 500;
  color: ${COLORS.textSecondary};
  letter-spacing: 0.4px;
  animation: ${fadeUp} 0.4s ease both;
  animation-delay: 0.1s;
`;

// ── Component ──────────────────────────────────────────────────────────────────

const LoadingSpinner = ({
  size = '44px',
  speed = '0.9s',
  text = 'Loading',
  textSize = '0.85rem',
  overlay = false,
  fullHeight = false,
  height = '200px',
  noMinHeight = false,
  showDots = true,
  color, // accent override (falls back to primarySalmon)
}) => {
  /* Convert size string → number for SVG math */
  const px = parseFloat(size) || 44;
  const cx = px / 2;
  const outerR = cx - 4; /* outer arc radius */
  const innerR = cx - 12; /* inner arc radius */

  const stroke = Math.max(2.5, px * 0.07); /* proportional stroke width */
  const trackClr = COLORS.elevatedBackground;
  const outerClr = color || COLORS.primarySalmon;
  const innerClr = COLORS.primaryMint;

  /* Arc dash helpers — a 220° arc out of 360° */
  const outerCirc = 2 * Math.PI * outerR;
  const innerCirc = 2 * Math.PI * innerR;
  const outerDash = `${(220 / 360) * outerCirc} ${outerCirc}`;
  const innerDash = `${(140 / 360) * innerCirc} ${innerCirc}`;

  return (
    <Wrapper
      $overlay={overlay}
      $fullHeight={fullHeight}
      $height={height}
      $noMinHeight={noMinHeight}
      role='status'
      aria-label={text || 'Loading'}
    >
      <RingWrap $size={size}>
        {/* ── Outer track + arc ─────────────────────── */}
        <OuterRing
          $speed={speed}
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
        >
          {/* full track */}
          <circle
            cx={cx}
            cy={cx}
            r={outerR}
            fill='none'
            stroke={trackClr}
            strokeWidth={stroke}
          />
          {/* spinning arc */}
          <circle
            cx={cx}
            cy={cx}
            r={outerR}
            fill='none'
            stroke={outerClr}
            strokeWidth={stroke}
            strokeLinecap='round'
            strokeDasharray={outerDash}
            strokeDashoffset='0'
          />
        </OuterRing>

        {/* ── Inner track + arc ─────────────────────── */}
        <InnerRing
          $speed={speed}
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
        >
          {/* full track */}
          <circle
            cx={cx}
            cy={cx}
            r={innerR}
            fill='none'
            stroke={trackClr}
            strokeWidth={stroke}
          />
          {/* spinning arc */}
          <circle
            cx={cx}
            cy={cx}
            r={innerR}
            fill='none'
            stroke={innerClr}
            strokeWidth={stroke}
            strokeLinecap='round'
            strokeDasharray={innerDash}
            strokeDashoffset='0'
          />
        </InnerRing>
      </RingWrap>

      {/* ── Label ────────────────────────────────────── */}
      {text &&
        (showDots ? (
          <Label $textSize={textSize}>{text}</Label>
        ) : (
          <LabelNoAnim $textSize={textSize}>{text}</LabelNoAnim>
        ))}
    </Wrapper>
  );
};

export default LoadingSpinner;
