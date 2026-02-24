// components/posts/ThoughtCard.js
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRetweet,
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
 * ThoughtCard — Twitter / Threads layout
 *
 * Layout:
 *   [avatar col]  [content col]
 *                   name · @handle · time  [···]
 *                   content text
 *                   optional image
 *                   #tags
 *                   [💬 n] [🔁 n] [❤️ n] [↑]
 *
 * Props (fully backward-compatible):
 *   thought, defaultUser, formatDate (optional — uses date-fns if omitted),
 *   handleLike, handleRetweet, handlePin, canCreateThought, onDelete
 */

const ThoughtCard = ({
  thought,
  defaultUser,
  formatDate,
  handleLike,
  handleRetweet,
  handlePin,
  canCreateThought,
}) => {
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Click-outside to close the ··· menu
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
    setTimeout(() => setLikeAnimating(false), 600);
    handleLike(thought._id);
  };

  const onShare = () => {
    const url = `${window.location.origin}/thoughts/${thought._id}`;
    if (navigator.share) {
      navigator
        .share({ title: 'SoloThought', text: thought.content, url })
        .then(() => toast.success('Shared!'))
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success('Link copied!'))
        .catch(() => toast.error('Copy failed'));
    }
  };

  const onRepost = () => {
    handleRetweet?.(thought._id);
    toast.success('Reposted!');
  };

  const onPin = () => {
    setMenuOpen(false);
    handlePin?.(thought._id);
  };

  const onDelete = () => {
    setMenuOpen(false);
    onDelete?.(thought._id);
  };

  // Relative time — use formatDate prop if provided, otherwise date-fns
  const relativeTime = formatDate
    ? formatDate(thought.createdAt)
    : formatDistanceToNow(new Date(thought.createdAt), { addSuffix: true });

  const moodColor = thought.mood ? moodColors[thought.mood]?.primary : null;
  const handle =
    defaultUser?.username?.toLowerCase().replace(/\s+/g, '') || 'user';
  const initials = defaultUser?.username?.slice(0, 1).toUpperCase() || 'A';

  return (
    <Row $pinned={thought.pinned}>
      {/* Pinned indicator */}
      {thought.pinned && (
        <PinnedRow>
          <FaThumbtack />
          <span>Pinned thought</span>
        </PinnedRow>
      )}

      <RowInner>
        {/* ── Left: avatar column ───────────────────── */}
        <AvatarCol>
          <AvatarCircle>
            {defaultUser?.avatar ? (
              <img src={defaultUser.avatar} alt={defaultUser.username} />
            ) : (
              initials
            )}
          </AvatarCircle>
          {/* Thread line (visual only — stretches to bottom of content) */}
          <ThreadLine />
        </AvatarCol>

        {/* ── Right: content column ─────────────────── */}
        <ContentCol>
          {/* Header row */}
          <MetaRow>
            <MetaLeft>
              <AuthorName>{defaultUser?.username || 'Andrew'}</AuthorName>
              <AuthorHandle>@{handle}</AuthorHandle>
              <MetaDot>·</MetaDot>
              <Timestamp title={thought.createdAt}>{relativeTime}</Timestamp>
              {thought.mood && (
                <>
                  <MetaDot>·</MetaDot>
                  <MoodPill $color={moodColor}>
                    {moodEmojis[thought.mood]}
                  </MoodPill>
                </>
              )}
            </MetaLeft>

            {/* ··· admin menu */}
            {canCreateThought && (
              <MenuWrap ref={menuRef}>
                <MenuBtn
                  onClick={() => setMenuOpen((s) => !s)}
                  aria-label='More options'
                >
                  <FaEllipsisH />
                </MenuBtn>
                {menuOpen && (
                  <MenuDropdown>
                    <MenuItem onClick={onPin}>
                      <FaThumbtack />
                      {thought.pinned ? 'Unpin' : 'Pin'}
                    </MenuItem>
                    <MenuItem as={Link} to={`/thoughts/edit/${thought._id}`}>
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
          </MetaRow>

          {/* Content */}
          <Content>{thought.content}</Content>

          {/* Optional image */}
          {thought.media?.mediaUrl && (
            <MediaWrap>
              <img src={thought.media.mediaUrl} alt='Thought media' />
            </MediaWrap>
          )}

          {/* Tags */}
          {thought.tags?.length > 0 && (
            <TagRow>
              {thought.tags.map((tag, i) => (
                <Tag key={i}>#{tag}</Tag>
              ))}
            </TagRow>
          )}

          {/* Action bar */}
          <Actions>
            <ActionBtn aria-label='Reply'>
              <FaRegComment />
              <ActionCount>{thought.comments?.length || 0}</ActionCount>
            </ActionBtn>

            <ActionBtn
              $color={COLORS.primaryMint}
              onClick={onRepost}
              aria-label='Repost'
            >
              <FaRetweet />
              <ActionCount>{thought.shares || 0}</ActionCount>
            </ActionBtn>

            <ActionBtn
              $color={COLORS.heartRed}
              onClick={onLike}
              $active={thought.userHasLiked}
              $animating={likeAnimating}
              aria-label='Like'
            >
              {thought.userHasLiked ? <FaHeart /> : <FaRegHeart />}
              <ActionCount>{thought.likes || 0}</ActionCount>
            </ActionBtn>

            <ActionBtn
              $color={COLORS.primaryBlueGray}
              onClick={onShare}
              aria-label='Share'
            >
              <FaShare />
            </ActionBtn>
          </Actions>
        </ContentCol>
      </RowInner>
    </Row>
  );
};

export default ThoughtCard;

// ─────────────────────────────────────────────────────────────────────────────
// Keyframes
// ─────────────────────────────────────────────────────────────────────────────
const heartPop = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); }
`;

const fadeSlide = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const Row = styled.article`
  padding: 14px 16px 0;
  border-bottom: 1px solid ${COLORS.border};
  cursor: default;

  /* Pinned posts get a subtle salmon left accent */
  ${(p) =>
    p.$pinned &&
    css`
      border-left: 2.5px solid ${COLORS.primarySalmon};
    `}

  &:hover {
    background: ${COLORS.cardBackground}80;
  }
`;

const PinnedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-left: 52px; /* align with content col */

  svg {
    font-size: 0.65rem;
  }
`;

const RowInner = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

/* ── Avatar column ── */
const AvatarCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 40px;
`;

const AvatarCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ThreadLine = styled.div`
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: ${COLORS.border};
  margin-top: 6px;
  border-radius: 1px;
  opacity: 0.5;
`;

/* ── Content column ── */
const ContentCol = styled.div`
  flex: 1;
  min-width: 0;
  padding-bottom: 14px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 6px;
  min-width: 0;
`;

const MetaLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
`;

const AuthorName = styled.span`
  font-size: 0.86rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  white-space: nowrap;
`;

const AuthorHandle = styled.span`
  font-size: 0.8rem;
  color: ${COLORS.textTertiary};
  white-space: nowrap;
`;

const MetaDot = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
`;

const Timestamp = styled.time`
  font-size: 0.78rem;
  color: ${COLORS.textTertiary};
  white-space: nowrap;
`;

const MoodPill = styled.span`
  font-size: 0.85rem;
  line-height: 1;
  /* subtle tint ring */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(p) => (p.$color ? `${p.$color}18` : 'transparent')};
`;

/* ··· menu */
const MenuWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const MenuBtn = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  background: none;
  color: ${COLORS.textTertiary};
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.primarySalmon};
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  min-width: 150px;
  padding: 6px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  animation: ${fadeSlide} 0.14s ease;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.1s;
  color: ${(p) => (p.$danger ? COLORS.error : COLORS.textPrimary)};

  svg {
    font-size: 0.8rem;
    color: ${(p) => (p.$danger ? COLORS.error : COLORS.textTertiary)};
  }

  &:hover {
    background: ${(p) =>
      p.$danger ? `${COLORS.error}12` : COLORS.elevatedBackground};
  }
`;

/* Content */
const Content = styled.p`
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0 0 10px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const MediaWrap = styled.div`
  margin-bottom: 10px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${COLORS.border};

  img {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    display: block;
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
`;

const Tag = styled.span`
  font-size: 0.85rem;
  color: ${COLORS.primaryBlueGray};
  font-weight: 500;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

/* Action bar */
const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  margin: 2px -8px 0;
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 99px;
  font-size: 0.85rem;
  transition: color 0.12s, background 0.12s;

  color: ${(p) => {
    if (p.$active) return p.$color || COLORS.primarySalmon;
    return COLORS.textTertiary;
  }};

  ${(p) =>
    p.$animating &&
    css`
      svg {
        animation: ${heartPop} 0.5s ease;
      }
    `}

  &:hover {
    color: ${(p) => p.$color || COLORS.primarySalmon};
    background: ${(p) =>
      p.$color ? `${p.$color}14` : `${COLORS.primarySalmon}14`};
  }
`;

const ActionCount = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
`;
