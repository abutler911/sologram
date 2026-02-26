// components/posts/ThoughtCard.js
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  FaHeart,
  FaRegHeart,
  FaShare,
  FaEllipsisH,
  FaThumbtack,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import { moodEmojis, moodColors } from '../../utils/themeConstants';
import { COLORS } from '../../theme';
import { toast } from 'react-hot-toast';
import { useLikeBurst } from '../animations/LikeBurst';
import { formatDistanceToNow } from 'date-fns';

// ─── Design tokens — mirrors PostCard's NOIR palette ─────────────────────────
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

/**
 * ThoughtCard — Editorial Noir aesthetic
 *
 * Mirrors PostCard's design language:
 *   - Warm white (#faf9f7) card surface
 *   - Left mood bar — 2px, flat, full height
 *   - Cormorant Garamond display / DM Mono metadata / Instrument Sans body
 *   - Sharp corners throughout — no border-radius on the card itself
 *   - Tags: DM Mono bordered chips matching PostCard
 *   - Footer: mono timestamps + minimal icon actions
 */

const ThoughtCard = ({
  thought,
  defaultUser,
  formatDate,
  handleLike,
  handlePin,
  canCreateThought,
  onDelete,
}) => {
  const [likeAnimating, setLikeAnimating] = useState(false);
  const { triggerBurst, BurstPortal } = useLikeBurst();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const onLike = (e) => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 500);
    handleLike(thought._id);
    if (!thought.userHasLiked) triggerBurst(e);
  };

  const onShare = () => {
    const url = `${window.location.origin}/thoughts/${thought._id}`;
    if (navigator.share) {
      navigator
        .share({ title: 'SoloThought', text: thought.content, url })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success('Link copied!'))
        .catch(() => toast.error('Copy failed'));
    }
  };

  const relativeTime = formatDate
    ? formatDate(thought.createdAt)
    : formatDistanceToNow(new Date(thought.createdAt), { addSuffix: true });

  const moodColor = thought.mood
    ? moodColors[thought.mood]?.primary
    : NOIR.salmon;
  const moodEmoji = thought.mood ? moodEmojis[thought.mood] : null;
  const moodLabel = thought.mood
    ? thought.mood.charAt(0).toUpperCase() + thought.mood.slice(1)
    : null;

  // ── Content splitting: first line/sentence becomes display headline ──────
  // Priority: newline break → sentence break (. ! ?) → whole text as headline
  const splitContent = (text = '') => {
    const newlineIdx = text.indexOf('\n');
    if (newlineIdx > 0) {
      return {
        headline: text.slice(0, newlineIdx).trim(),
        body: text.slice(newlineIdx + 1).trim() || null,
      };
    }
    if (text.length <= 120) {
      return { headline: text.trim(), body: null };
    }
    const sentenceMatch = text.match(/^(.+?[.!?])\s+(.+)$/s);
    if (sentenceMatch) {
      return {
        headline: sentenceMatch[1].trim(),
        body: sentenceMatch[2].trim(),
      };
    }
    const chunk = text.slice(0, 120);
    const lastSpace = chunk.lastIndexOf(' ');
    const breakAt = lastSpace > 60 ? lastSpace : 120;
    return {
      headline: text.slice(0, breakAt).trim(),
      body: text.slice(breakAt).trim() || null,
    };
  };

  const { headline, body } = splitContent(thought.content);

  return (
    <Card $moodColor={moodColor} $pinned={thought.pinned}>
      {/* ── Pinned label ───────────────────────────────────────── */}
      {thought.pinned && (
        <PinnedLabel>
          <FaThumbtack /> Pinned
        </PinnedLabel>
      )}

      {/* ── Content — headline + optional body ──────────────── */}
      <Headline>{headline}</Headline>
      {body && <Body>{body}</Body>}

      {/* ── Optional image ─────────────────────────────────────── */}
      {thought.media?.mediaUrl && (
        <MediaWrap>
          <img src={thought.media.mediaUrl} alt='' />
        </MediaWrap>
      )}

      {/* ── Tags ───────────────────────────────────────────────── */}
      {thought.tags?.length > 0 && (
        <TagRow>
          {thought.tags.map((tag, i) => (
            <Tag key={i}>#{tag}</Tag>
          ))}
        </TagRow>
      )}

      {/* ── Footer: mood · time | actions ──────────────────────── */}
      <Footer>
        <FooterLeft>
          {moodEmoji && (
            <MoodChip $moodColor={moodColor}>
              <span>{moodEmoji}</span>
              <span>{moodLabel}</span>
            </MoodChip>
          )}
          <Timestamp>{relativeTime}</Timestamp>
        </FooterLeft>

        <FooterRight>
          {/* Like */}
          <ActionBtn
            onClick={(e) => onLike(e)}
            $active={thought.userHasLiked}
            $animating={likeAnimating}
            aria-label='Like'
          >
            {thought.userHasLiked ? <FaHeart /> : <FaRegHeart />}
            {thought.likes > 0 && <ActionCount>{thought.likes}</ActionCount>}
          </ActionBtn>

          {/* Share */}
          <ActionBtn onClick={onShare} aria-label='Share'>
            <FaShare />
          </ActionBtn>

          {/* Admin ··· */}
          {canCreateThought && (
            <MenuWrap ref={menuRef}>
              <ActionBtn
                onClick={() => setMenuOpen((s) => !s)}
                aria-label='More options'
              >
                <FaEllipsisH />
              </ActionBtn>

              {menuOpen && (
                <MenuDropdown>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      handlePin?.(thought._id);
                    }}
                  >
                    <FaThumbtack />
                    {thought.pinned ? 'Unpin' : 'Pin'}
                  </MenuItem>
                  <MenuItem
                    as={Link}
                    to={`/thoughts/${thought._id}/edit`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaEdit /> Edit
                  </MenuItem>
                  <MenuItem
                    $danger
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(thought._id);
                    }}
                  >
                    <FaTrash /> Delete
                  </MenuItem>
                </MenuDropdown>
              )}
            </MenuWrap>
          )}
        </FooterRight>
      </Footer>

      {/* ── LIKE BURST ──────────────────────────────────────────── */}
      <BurstPortal />
    </Card>
  );
};

export default ThoughtCard;

// ─── Animations ───────────────────────────────────────────────────────────────

const heartPop = keyframes`
  0%   { transform: scale(1);   }
  35%  { transform: scale(1.4); }
  65%  { transform: scale(0.88); }
  100% { transform: scale(1);   }
`;

const menuSlide = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = styled.article`
  position: relative;
  padding: 18px 20px 16px 24px;
  background: ${NOIR.warmWhite};

  /* No border-radius — sharp editorial geometry */
  border-radius: 0;

  /* Left mood bar — full height, 2px, flat */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${(p) => p.$moodColor || NOIR.salmon};
    opacity: ${(p) => (p.$pinned ? 1 : 0.45)};
    transition: opacity 0.2s;
  }

  /* Hairline bottom separator */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 24px;
    right: 20px;
    height: 1px;
    background: ${NOIR.border};
  }

  &:hover::before {
    opacity: 1;
  }

  /* Pinned: very subtle warm tint */
  ${(p) =>
    p.$pinned &&
    css`
      background: linear-gradient(
        to right,
        rgba(232, 124, 90, 0.04) 0%,
        ${NOIR.warmWhite} 80px
      );
    `}
`;

// ─── Pinned label ─────────────────────────────────────────────────────────────

const PinnedLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  margin-bottom: 10px;

  svg {
    font-size: 0.58rem;
    color: ${NOIR.salmon};
    opacity: 0.7;
  }
`;

// ─── Content — headline + body ───────────────────────────────────────────────

/* First line/sentence: Cormorant Garamond display size — the entry point */
const Headline = styled.p`
  margin: 0 0 10px;
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.25rem;
  font-weight: 600;
  font-style: italic;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: ${NOIR.ink};
  word-break: break-word;
`;

/* Remainder of the thought: Instrument Sans body */
const Body = styled.p`
  margin: 0 0 14px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 400;
  line-height: 1.65;
  letter-spacing: 0.01em;
  color: ${NOIR.charcoal};
  white-space: pre-wrap;
  word-break: break-word;
  opacity: 0.85;
`;

// ─── Media ────────────────────────────────────────────────────────────────────

const MediaWrap = styled.div`
  margin-bottom: 14px;
  overflow: hidden;
  /* Sharp corners — no border-radius */
  border: 1px solid ${NOIR.dust};

  img {
    width: 100%;
    max-height: 380px;
    object-fit: cover;
    display: block;
    /* Match PostCard image treatment */
    filter: saturate(0.88) contrast(1.04);
    transition: filter 0.3s ease;
  }

  &:hover img {
    filter: saturate(1) contrast(1.02);
  }
`;

// ─── Tags — mirrors PostCard Tag exactly ──────────────────────────────────────

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 14px;
`;

const Tag = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  padding: 3px 9px;
  border-radius: 0;
  border: 1px solid ${NOIR.dust};
  color: ${NOIR.ash};
  text-transform: lowercase;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;

  &:hover {
    color: ${NOIR.sage};
    border-color: ${NOIR.sage};
    background: rgba(122, 171, 140, 0.06);
  }
`;

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid ${NOIR.border};
  margin-top: 2px;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
`;

// ─── Mood chip — borderless DM Mono, mood color text ─────────────────────────

const MoodChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.$moodColor || NOIR.salmon};
  white-space: nowrap;
  flex-shrink: 0;
  /* No pill border — just color + emoji, very minimal */
  opacity: 0.8;

  span:first-child {
    font-size: 0.75rem;
    opacity: 1;
  }
`;

const Timestamp = styled.time`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.05em;
  color: ${NOIR.ash};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
`;

// ─── Action buttons ───────────────────────────────────────────────────────────

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  color: ${(p) => (p.$active ? NOIR.salmon : NOIR.ash)};
  transition: color 0.15s;

  svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  ${(p) =>
    p.$animating &&
    css`
      svg {
        animation: ${heartPop} 0.45s ease;
      }
    `}

  &:hover {
    color: ${(p) => (p.$active ? NOIR.salmon : NOIR.ink)};
    svg {
      transform: scale(1.15);
    }
  }
`;

const ActionCount = styled.span`
  font-size: 0.65rem;
  line-height: 1;
`;

// ─── Admin dropdown ───────────────────────────────────────────────────────────

const MenuWrap = styled.div`
  position: relative;
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 50;
  background: ${NOIR.warmWhite};
  border: 1px solid ${NOIR.dust};
  border-radius: 0; /* sharp — matches PostCard ActionsDropdown */
  min-width: 130px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(10, 10, 11, 0.14);
  animation: ${menuSlide} 0.13s ease;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 11px 14px;
  background: none;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  color: ${(p) => (p.$danger ? '#c0392b' : NOIR.charcoal)};
  transition: background 0.12s;

  svg {
    width: 11px;
    height: 11px;
    opacity: 0.6;
    color: ${(p) => (p.$danger ? '#c0392b' : NOIR.ash)};
  }

  &:hover {
    background: rgba(10, 10, 11, 0.04);
  }
`;
