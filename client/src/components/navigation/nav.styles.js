// navigation/nav.styles.js
// Shared keyframes and atoms consumed by multiple nav sub-components.
import styled, { keyframes } from 'styled-components';
import { COLORS } from '../../theme';

// ── Keyframes ────────────────────────────────────────────────────────────────
export const fadeIn = keyframes`
  from { opacity: 0 }
  to   { opacity: 1 }
`;
export const slideUp = keyframes`
  from { transform: translateY(100%) }
  to   { transform: translateY(0) }
`;
export const popIn = keyframes`
  from { transform: scale(.95); opacity: 0 }
  to   { transform: scale(1);   opacity: 1 }
`;
export const dropDown = keyframes`
  from { transform: translateY(-8px); opacity: 0 }
  to   { transform: translateY(0);    opacity: 1 }
`;

// ── Shared atoms ─────────────────────────────────────────────────────────────
export const LogoText = styled.span`
  font-family: 'Autography', cursive;
  font-size: 1.6rem;
  line-height: 1.3;
  letter-spacing: 0;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;
