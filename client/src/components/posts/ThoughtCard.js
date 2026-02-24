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
import { formatDistanceToNow } from 'date-fns';

/**
 * ThoughtCard — SoloGram original aesthetic
 *
 * Single-author journal entry design:
 *   - Left 3px bar in the mood's color — tone at a glance
 *   - Content first, no header above it
 *   - Metadata (mood · time · actions) quietly at the bottom
 *   - No avatar column — there's only one author
 *
 * Props (backward-compatible):
 *   thought, defaultUser, formatDate, handleLike,
 *   handleRetweet, handlePin, canCreateThought, onDelete
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close ··· menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const onLike = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 500);
    handleLike(thought._id);
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
    : COLORS.primarySalmon;
  const moodEmoji = thought.mood ? moodEmojis[thought.mood] : null;
  const moodLabel = thought.mood
    ? thought.mood.charAt(0).toUpperCase() + thought.mood.slice(1)
    : null;

  return (
    <Card $moodColor={moodColor} $pinned={thought.pinned}>
      {/* ── Pinned label ──────────────────────────────────────── */}
      {thought.pinned && (
        <PinnedLabel>
          <FaThumbtack /> Pinned
        </PinnedLabel>
      )}

      {/* ── Content — the hero ────────────────────────────────── */}
      <Content>{thought.content}</Content>

      {/* ── Optional image ────────────────────────────────────── */}
      {thought.media?.mediaUrl && (
        <MediaWrap>
          <img src={thought.media.mediaUrl} alt='' />
        </MediaWrap>
      )}

      {/* ── Tags ──────────────────────────────────────────────── */}
      {thought.tags?.length > 0 && (
        <TagRow>
          {thought.tags.map((tag, i) => (
            <Tag key={i} $moodColor={moodColor}>
              #{tag}
            </Tag>
          ))}
        </TagRow>
      )}

      {/* ── Footer: mood · time | actions ─────────────────────── */}
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
            onClick={onLike}
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
                    to={`/thoughts/edit/${thought._id}`}
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
    </Card>
  );
};

export default ThoughtCard;

// ─────────────────────────────────────────────────────────────────────────────
// Keyframes
// ─────────────────────────────────────────────────────────────────────────────
const heartPop = keyframes`
  0%   { transform: scale(1); }
  35%  { transform: scale(1.4); }
  65%  { transform: scale(0.88); }
  100% { transform: scale(1); }
`;

const menuSlide = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)  scale(1); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────
const Card = styled.article`
  position: relative;
  padding: 16px 16px 14px 20px;
  border-radius: 10px;

  /*
   * Layered background:
   *   1. cardBackground — lifts the card off the page
   *   2. mood color wash at 5% opacity — felt more than seen
   * We use a CSS gradient trick to stack them without needing
   * two elements: color-mix would need a modern browser, so we
   * just overlay the mood tint on the solid base.
   */
  background: linear-gradient(
      135deg,
      ${(p) => p.$moodColor || COLORS.primarySalmon}14 0%,
      ${(p) => p.$moodColor || COLORS.primarySalmon}09 60%,
      transparent 100%
    ),
    ${COLORS.cardBackground};

  transition: background 0.2s;

  /* Left mood bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    background: ${(p) => p.$moodColor || COLORS.primarySalmon};
    border-radius: 0 2px 2px 0;
    opacity: ${(p) => (p.$pinned ? 1 : 0.5)};
    transition: opacity 0.2s;
  }

  &:hover {
    background: linear-gradient(
        135deg,
        ${(p) => p.$moodColor || COLORS.primarySalmon}22 0%,
        ${(p) => p.$moodColor || COLORS.primarySalmon}12 60%,
        transparent 100%
      ),
      ${COLORS.cardBackground};
    &::before {
      opacity: 1;
    }
  }

  /* Pinned: slightly stronger wash + full bar */
  ${(p) =>
    p.$pinned &&
    `
    background:
      linear-gradient(
        135deg,
        ${p.$moodColor || COLORS.primarySalmon}28 0%,
        ${p.$moodColor || COLORS.primarySalmon}14 60%,
        transparent 100%
      ),
      ${COLORS.cardBackground};
  `}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Pinned
// ─────────────────────────────────────────────────────────────────────────────
const PinnedLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;

  svg {
    font-size: 0.6rem;
    color: ${COLORS.primarySalmon};
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Content — the hero
// ─────────────────────────────────────────────────────────────────────────────
const Content = styled.p`
  margin: 0 0 12px;
  color: ${COLORS.textPrimary};
  font-size: 0.9375rem;
  line-height: 1.45;
  letter-spacing: -0.1px;
  white-space: pre-wrap;
  word-break: break-word;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────────────────────────────────────
const MediaWrap = styled.div`
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${COLORS.border};

  img {
    width: 100%;
    max-height: 380px;
    object-fit: cover;
    display: block;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Tags
// ─────────────────────────────────────────────────────────────────────────────
const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const Tag = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${(p) => p.$moodColor || COLORS.primaryBlueGray};
  opacity: 0.85;
  cursor: pointer;
  transition: opacity 0.12s;
  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const MoodChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 5px;
  border-radius: 99px;
  background: ${(p) => p.$moodColor || COLORS.primarySalmon}18;
  border: 1px solid ${(p) => p.$moodColor || COLORS.primarySalmon}30;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${(p) => p.$moodColor || COLORS.primarySalmon};
  white-space: nowrap;
  flex-shrink: 0;

  span:first-child {
    font-size: 0.78rem;
  }
`;

const Timestamp = styled.time`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Action buttons
// ─────────────────────────────────────────────────────────────────────────────
const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  color: ${(p) => (p.$active ? COLORS.heartRed : COLORS.textTertiary)};
  transition: color 0.12s, background 0.12s;

  ${(p) =>
    p.$animating &&
    css`
      svg {
        animation: ${heartPop} 0.45s ease;
      }
    `}

  &:hover {
    background: ${COLORS.elevatedBackground};
    color: ${(p) => (p.$active ? COLORS.heartRed : COLORS.textSecondary)};
  }
`;

const ActionCount = styled.span`
  font-size: 0.78rem;
  font-weight: 500;
`;

// ─────────────────────────────────────────────────────────────────────────────
// ··· Menu
// ─────────────────────────────────────────────────────────────────────────────
const MenuWrap = styled.div`
  position: relative;
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 50;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  min-width: 140px;
  padding: 5px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  animation: ${menuSlide} 0.13s ease;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 11px;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  color: ${(p) => (p.$danger ? COLORS.error : COLORS.textPrimary)};
  transition: background 0.1s;

  svg {
    font-size: 0.75rem;
    color: ${(p) => (p.$danger ? COLORS.error : COLORS.textTertiary)};
  }

  &:hover {
    background: ${(p) =>
      p.$danger ? `${COLORS.error}12` : COLORS.elevatedBackground};
  }
`;
