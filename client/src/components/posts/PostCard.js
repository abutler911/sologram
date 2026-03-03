// components/posts/PostCard.js
// Thin orchestrator - delegates media to MediaCarousel, comments to usePostComments.
import React, {
  memo,
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaEllipsisV,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { useDeleteModal } from '../../context/DeleteModalContext';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { COLORS } from '../../theme';
import { useLikeBurst } from '../animations/LikeBurst';
import useEngagement from '../../hooks/useEngagement';
import usePostComments from '../../hooks/usePostComments';
import MediaCarousel from './MediaCarousel';
import openLocationMap from '../../utils/openLocationMap';

const CommentModal = lazy(() =>
  import('./CommentModal').then((m) => ({ default: m.CommentModal }))
);

// ── Design Tokens ─────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const PostCard = memo(({ post: initialPost, onDelete, onLike }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [post] = useState(initialPost);
  const [showActions, setShowActions] = useState(false);
  const [showCommentModal, setShowModal] = useState(false);
  const [captionExpanded, setCaptionExp] = useState(false);

  const cardRef = useRef(null);
  const actionsRef = useRef(null);

  const { isAuthenticated } = useContext(AuthContext);
  const { triggerBurst, BurstPortal } = useLikeBurst();
  const { showDeleteModal } = useDeleteModal();

  // ── Engagement ────────────────────────────────────────────────────────────
  const { liked, count, toggle, loading, seed } = useEngagement(
    'post',
    post._id
  );

  useEffect(() => {
    seed(false, post.likes || 0);
  }, [post._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Comments ──────────────────────────────────────────────────────────────
  const {
    comments,
    commentCount,
    isLoading: isLoadingComments,
    fetchComments,
    addComment,
    deleteComment,
    likeComment,
    seedCount,
  } = usePostComments('post', post._id, { isAuthenticated });

  useEffect(() => {
    seedCount(initialPost.commentCount || 0);
  }, [initialPost.commentCount, seedCount]);

  const formattedDate = format(
    new Date(post.eventDate || post.createdAt),
    'MMM d, yyyy'
  );

  // ── Intersection observer ─────────────────────────────────────────────────
  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setIsVisible(true);
          ob.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    if (cardRef.current) ob.observe(cardRef.current);
    return () => ob.disconnect();
  }, []);

  // ── Click-away for actions dropdown ───────────────────────────────────────
  useEffect(() => {
    if (!showActions) return;
    const h = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target))
        setShowActions(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showActions]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLike = useCallback(async () => {
    if (!isAuthenticated || loading) return;
    const result = await toggle();
    if (result !== false && onLike) onLike(post._id);
  }, [isAuthenticated, loading, toggle, onLike, post._id]);

  const handleDoubleTapLike = useCallback(() => {
    if (!liked) handleLike();
  }, [liked, handleLike]);

  const handleOpenComments = useCallback(() => {
    setShowModal(true);
    fetchComments();
  }, [fetchComments]);

  const handleDeletePost = useCallback(() => {
    showDeleteModal({
      title: 'Delete Post?',
      message:
        'This will permanently remove this post and all its interactions.',
      confirmText: 'Delete Post',
      onConfirm: async () => {
        try {
          await api.deletePost(post._id);
          if (onDelete) onDelete(post._id);
          toast.success('Post removed');
        } catch {
          toast.error('Failed to delete post');
        }
      },
    });
    setShowActions(false);
  }, [post._id, showDeleteModal, onDelete]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <CardWrapper ref={cardRef} $visible={isVisible}>
      <MediaCarousel
        media={post.media}
        formattedDate={formattedDate}
        postTitle={post.title}
        onDoubleTapLike={handleDoubleTapLike}
        isAuthenticated={isAuthenticated}
      />

      <ContentBody>
        <Link to={'/post/' + post._id} style={{ textDecoration: 'none' }}>
          <Title>{post.title}</Title>
        </Link>

        <Dateline>
          {post.location && (
            <DatelineLocation onClick={() => openLocationMap(post.location)}>
              <FaMapMarkerAlt />
              {post.location}
            </DatelineLocation>
          )}
          {post.location && <DatelineDot>&middot;</DatelineDot>}
          <span>{formattedDate}</span>
        </Dateline>

        {(post.caption || post.content) && (
          <CaptionWrap>
            <CaptionText $expanded={captionExpanded}>
              {post.caption || post.content}
            </CaptionText>
            {(post.caption || post.content || '').length > 120 && (
              <ExpandBtn onClick={() => setCaptionExp((v) => !v)}>
                {captionExpanded ? 'less' : 'more'}
              </ExpandBtn>
            )}
          </CaptionWrap>
        )}

        {post.tags?.length > 0 && (
          <TagRow>
            {post.tags.map((t, i) => (
              <Tag key={i}>#{t}</Tag>
            ))}
          </TagRow>
        )}

        <ActionBar>
          <ActionBtn
            onClick={(e) => {
              handleLike();
              if (!liked && isAuthenticated && !loading) triggerBurst(e);
            }}
            $active={liked}
            disabled={!isAuthenticated || loading}
            aria-label='Like post'
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
            <span>{count}</span>
          </ActionBtn>

          <ActionBtn onClick={handleOpenComments} aria-label='Open comments'>
            <FaComment />
            <span>{commentCount}</span>
          </ActionBtn>

          <ActionSep />

          {isAuthenticated && (
            <ActionsWrapper ref={actionsRef}>
              <MoreBtn
                onClick={() => setShowActions((v) => !v)}
                aria-label='More options'
              >
                <FaEllipsisV />
              </MoreBtn>

              {showActions && (
                <ActionsDropdown>
                  <Link
                    to={'/edit/' + post._id}
                    onClick={() => setShowActions(false)}
                  >
                    <FaEdit /> Edit
                  </Link>
                  <button onClick={handleDeletePost} className='warn'>
                    <FaTrash /> Delete
                  </button>
                </ActionsDropdown>
              )}
            </ActionsWrapper>
          )}
        </ActionBar>
      </ContentBody>

      {showCommentModal && (
        <Suspense fallback={null}>
          <CommentModal
            isOpen={showCommentModal}
            onClose={() => setShowModal(false)}
            post={post}
            comments={comments}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onLikeComment={likeComment}
            isLoading={isLoadingComments}
          />
        </Suspense>
      )}

      <BurstPortal />
    </CardWrapper>
  );
});

PostCard.displayName = 'PostCard';
export default PostCard;

// ── Animations ────────────────────────────────────────────────────────────────

const heartPop = keyframes`
  0%   { transform: scale(1);   }
  30%  { transform: scale(1.4); }
  60%  { transform: scale(0.9); }
  100% { transform: scale(1);   }
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

// ── Styled Components ─────────────────────────────────────────────────────────

const CardWrapper = styled.article`
  width: 100%;
  background: ${NOIR.warmWhite};
  overflow: hidden;
  position: relative;

  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: ${(p) => (p.$visible ? 'translateY(0)' : 'translateY(28px)')};
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, ${NOIR.salmon} 0%, ${NOIR.sage} 100%);
    z-index: 10;
  }

  @media (max-width: 639px) {
    max-width: 100%;
    margin: 0 0 2px;
    border-radius: 0;
    box-shadow: none;
  }

  @media (min-width: 640px) and (max-width: 1023px) {
    max-width: 560px;
    margin: 0 auto 24px;
    border-radius: 0;
    box-shadow: 0 2px 0 0 ${NOIR.salmon}, 0 20px 48px rgba(0, 0, 0, 0.13);
  }

  @media (min-width: 1024px) {
    max-width: 480px;
    margin: 0 auto 32px;
    border-radius: 0;
    box-shadow: 0 2px 0 0 ${NOIR.salmon}, 0 30px 80px rgba(0, 0, 0, 0.18);
  }
`;

const ContentBody = styled.div`
  background: ${NOIR.warmWhite};
  padding: 18px 20px 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: ${NOIR.border};
  }
`;

const Title = styled.h2`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-weight: 600;
  font-size: 1.45rem;
  color: ${NOIR.ink};
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 8px;
  display: block;
  transition: color 0.2s;

  &:hover {
    color: ${NOIR.salmon};
  }
`;

const CaptionWrap = styled.div`
  margin-bottom: 12px;
`;

const CaptionText = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.82rem;
  line-height: 1.65;
  color: ${NOIR.charcoal};
  font-weight: 400;
  letter-spacing: 0.01em;
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${(p) => (p.$expanded ? 'unset' : '3')};
  overflow: hidden;
`;

const ExpandBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: 'DM Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: lowercase;
  color: ${NOIR.ash};
  cursor: pointer;
  margin-top: 4px;
  display: block;
  transition: color 0.15s;
  &:hover {
    color: ${NOIR.ink};
  }
`;

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
  border-radius: 2px;
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

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding-top: 14px;
  border-top: 1px solid ${NOIR.border};
  margin-top: 4px;
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 0;
  color: ${(p) => (p.$active ? NOIR.salmon : NOIR.charcoal)};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  transition: color 0.2s;

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    transition: transform 0.2s;
    ${(p) =>
      p.$active &&
      css`
        animation: ${heartPop} 0.35s ease;
      `}
  }

  & + & {
    margin-left: 20px;
  }

  &:hover:not(:disabled) {
    color: ${(p) => (p.$active ? NOIR.salmon : NOIR.ink)};
    svg {
      transform: scale(1.15);
    }
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const ActionSep = styled.span`
  flex: 1;
`;

const Dateline = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  line-height: 1;
`;

const DatelineLocation = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: ${NOIR.ash};
  transition: color 0.2s;
  svg {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
  }
  &:hover {
    color: ${NOIR.sage};
  }
`;

const DatelineDot = styled.span`
  color: ${NOIR.dust};
  font-size: 0.65rem;
  line-height: 1;
`;

const ActionsWrapper = styled.div`
  position: relative;
  margin-left: 8px;
`;

const MoreBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  color: ${NOIR.ash};
  border-radius: 0;
  transition: color 0.15s, background 0.15s;
  svg {
    width: 12px;
    height: 12px;
  }
  &:hover {
    color: ${NOIR.ink};
    background: rgba(10, 10, 11, 0.05);
  }
`;

const ActionsDropdown = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: ${NOIR.warmWhite};
  border: 1px solid ${NOIR.dust};
  border-radius: 0;
  min-width: 130px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(10, 10, 11, 0.14);
  animation: ${dropIn} 0.16s ease;
  z-index: 10;

  a,
  button {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 11px 14px;
    border: none;
    background: none;
    color: ${NOIR.charcoal};
    font-family: 'Instrument Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    text-decoration: none;
    text-align: left;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: background 0.12s;
    svg {
      width: 12px;
      height: 12px;
      opacity: 0.7;
    }
    &:hover {
      background: rgba(10, 10, 11, 0.04);
    }
  }

  .warn {
    color: #c0392b;
  }
`;
