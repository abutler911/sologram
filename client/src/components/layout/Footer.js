// client/src/components/layout/Footer.js
//
// NOIR-aligned footer — matches PostCard / ThoughtCard editorial aesthetic.
// Zero bloat: no icon library imports for decorative elements, memoized to
// prevent re-renders from parent layout changes, uses the same design tokens
// and typography stack as the rest of the feed.

import React, { memo } from 'react';
import styled from 'styled-components';

// ─── Design Tokens (mirrors PostCard / ThoughtCard) ───────────────────────────
const NOIR = {
  ink: '#0a0a0b',
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  border: 'rgba(10,10,11,0.08)',
  salmon: '#e87c5a',
  sage: '#7aab8c',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Footer = memo(() => {
  const year = new Date().getFullYear();

  return (
    <Root>
      <Inner>
        {/* Thin gradient rule — same salmon→sage used in card headers */}
        <Rule />

        <Nav aria-label='Footer'>
          <NavLink href='/about'>About</NavLink>
          <Sep aria-hidden='true'>·</Sep>
          <NavLink href='/privacy'>Privacy</NavLink>
          <Sep aria-hidden='true'>·</Sep>
          <NavLink href='/terms'>Terms</NavLink>
          <Sep aria-hidden='true'>·</Sep>
          <NavLink href='mailto:abutler911@gmail.com'>Contact</NavLink>
          <Sep aria-hidden='true'>·</Sep>
          <NavLink
            href='https://github.com/abutler911'
            target='_blank'
            rel='noopener noreferrer'
          >
            GitHub
          </NavLink>
        </Nav>

        <Meta>
          <span>Independently developed by Andrew</span>
          <span>&copy; {year} SoloGram</span>
        </Meta>

        <Tagline>One Voice. Infinite Moments.</Tagline>
      </Inner>

      {/* Clears the mobile bottom tab bar */}
      <TabBarSpacer />
    </Root>
  );
});

Footer.displayName = 'Footer';
export default Footer;

// ─── Styled Components ────────────────────────────────────────────────────────

const Root = styled.footer`
  background: ${NOIR.warmWhite};
  border-top: 1px solid ${NOIR.border};
  padding: 28px 0 0;

  /* Match sidebar offsets used by ContentArea / Shell */
  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const Inner = styled.div`
  max-width: 470px;
  margin: 0 auto;
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`;

const Rule = styled.div`
  width: 40px;
  height: 1.5px;
  background: linear-gradient(90deg, ${NOIR.salmon}, ${NOIR.sage});
  opacity: 0.6;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0;
`;

const NavLink = styled.a`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  text-decoration: none;
  padding: 4px 8px;
  transition: color 0.15s;

  &:hover {
    color: ${NOIR.salmon};
  }
`;

const Sep = styled.span`
  color: ${NOIR.dust};
  font-size: 0.6rem;
  user-select: none;
`;

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  span {
    font-family: 'DM Mono', 'Courier New', monospace;
    font-size: 0.58rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: ${NOIR.ash};
    opacity: 0.6;
  }
`;

const Tagline = styled.p`
  margin: 0;
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 400;
  font-size: 0.85rem;
  color: ${NOIR.charcoal};
  opacity: 0.4;
  letter-spacing: -0.01em;
`;

/* Pushes content above the mobile bottom tab bar */
const TabBarSpacer = styled.div`
  height: calc(60px + env(safe-area-inset-bottom, 20px));

  @media (min-width: 960px) {
    height: 0;
  }
`;
