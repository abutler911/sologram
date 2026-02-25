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
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useSwipeable } from 'react-swipeable';

import { LikesContext } from '../../context/LikesContext';
import { useDeleteModal } from '../../context/DeleteModalContext';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getTransformedImageUrl } from '../../utils/cloudinary';
import { COLORS } from '../../theme';
import authorImg from '../../assets/andy.jpg';

const CommentModal = lazy(() =>
  import('./CommentModal').then((m) => ({ default: m.CommentModal }))
);

const AUTHOR_IMAGE = authorImg;
const AUTHOR_NAME = 'Andrew Butler';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  0%        { transform: scale(0);    opacity: 0; }
  15%       { transform: scale(1.3);  opacity: 1; }
  30%       { transform: scale(0.95);             }
  45%, 80%  { transform: scale(1);    opacity: 1; }
  100%      { transform: scale(0);    opacity: 0; }
`;

const heartPop = keyframes`
  0%   { transform: scale(1);   }
  30%  { transform: scale(1.4); }
  60%  { transform: scale(0.9); }
  100% { transform: scale(1);   }
`;

const rippleOut = keyframes`
  from { transform: translate(-50%,-50%) scale(0.4); opacity: 0.9; }
  to   { transform: translate(-50%,-50%) scale(3.2); opacity: 0;   }
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const PostCard = memo(({ post: initialPost, onDelete, onLike }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [post, setPost] = useState(initialPost);
  const [currentMediaIndex, setIdx] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isDoubleTapLiking, setDTLike] = useState(false);
  const [showCommentModal, setShowModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setLoadingC] = useState(false);
  const [captionExpanded, setCaptionExp] = useState(false);
  const [commentCount, setCommentCount] = useState(
    initialPost.commentCount || 0
  );

  const cardRef = useRef(null);
  const actionsRef = useRef(null);

  const { isAuthenticated, user } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();
  const { likePost, likedPosts, isProcessing } = useContext(LikesContext);

  const hasLiked = likedPosts[post?._id] || false;
  const formattedDate = format(
    new Date(post.eventDate || post.createdAt),
    'MMM d, yyyy'
  );
  const mediaCount = post.media?.length || 0;

  // ── Intersection observer — fade-up reveal ────────────────────────────────
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

  // ── Comments ──────────────────────────────────────────────────────────────

  const fetchComments = useCallback(async () => {
    if (!post._id) return;
    setLoadingC(true);
    try {
      const data = await api.getComments(post._id);
      const list = Array.isArray(data.comments) ? data.comments : [];
      setComments(list);
      if (typeof data.total === 'number') setCommentCount(data.total);
    } catch (err) {
      console.error('[fetchComments]', err);
      toast.error('Failed to load comments');
    } finally {
      setLoadingC(false);
    }
  }, [post._id]);

  const handleOpenComments = useCallback(() => {
    setShowModal(true);
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = useCallback(
    async (commentData) => {
      if (!isAuthenticated) {
        toast.error('You must be logged in to comment');
        return;
      }
      try {
        const data = await api.addComment(post._id, commentData);
        const newComment = data.comment;
        if (!newComment) throw new Error('Bad response from server');
        setComments((prev) => [newComment, ...prev]);
        setCommentCount((prev) => prev + 1);
        return newComment;
      } catch (err) {
        const msg = err?.response?.data?.message || 'Could not post comment';
        toast.error(msg);
        throw err;
      }
    },
    [post._id, isAuthenticated]
  );

  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
      toast.success('Comment removed');
    } catch {
      toast.error('Failed to delete comment');
    }
  }, []);

  const handleLikeComment = useCallback(
    async (commentId) => {
      if (!isAuthenticated) {
        toast.error('Log in to like comments');
        return;
      }
      try {
        const data = await api.likeComment(commentId);
        if (!data.comment) throw new Error('Bad response');
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? data.comment : c))
        );
      } catch {
        toast.error('Could not update like');
      }
    },
    [isAuthenticated]
  );

  // ── Post like ─────────────────────────────────────────────────────────────

  const handleLike = useCallback(() => {
    if (!isAuthenticated || isProcessing || hasLiked) return;
    likePost(post._id, (updatedPost) => {
      setPost((prev) => ({
        ...prev,
        likes: updatedPost?.likes ?? (prev.likes || 0) + 1,
      }));
      if (onLike) onLike(post._id);
    });
  }, [post._id, isProcessing, hasLiked, isAuthenticated, likePost, onLike]);

  const handleDoubleTapLike = useCallback(() => {
    if (!isAuthenticated) return;
    if (!hasLiked) handleLike();
    setDTLike(true);
    setTimeout(() => setDTLike(false), 900);
  }, [isAuthenticated, hasLiked, handleLike]);

  // ── Location ──────────────────────────────────────────────────────────────

  const handleLocationClick = useCallback((location) => {
    const enc = encodeURIComponent(location);
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    window.open(
      isIOS
        ? `https://maps.apple.com/?q=${enc}`
        : `https://www.google.com/maps/search/?api=1&query=${enc}`,
      '_blank'
    );
  }, []);

  // ── Delete post ───────────────────────────────────────────────────────────

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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setIdx((c) => Math.min(c + 1, mediaCount - 1)),
    onSwipedRight: () => setIdx((c) => Math.max(c - 1, 0)),
    trackMouse: true,
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <CardWrapper ref={cardRef} $visible={isVisible}>
      {/* ── MEDIA FRAME ──────────────────────────────────────────────────── */}
      <MediaFrame onDoubleClick={handleDoubleTapLike} {...swipeHandlers}>
        <MediaTrack
          style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
        >
          {post.media?.map((m, i) => (
            <MediaSlide key={m._id || i}>
              {m.mediaType === 'video' ? (
                <PostVid src={m.mediaUrl} controls preload='metadata' />
              ) : (
                <PostImg
                  src={getTransformedImageUrl(m.mediaUrl, {
                    width: 1080,
                    height: 1350,
                    crop: 'fill',
                  })}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  alt={post.title || 'Sologram post'}
                />
              )}
            </MediaSlide>
          ))}
        </MediaTrack>

        {/* Bottom gradient scrim */}
        <BottomScrim />

        {/* Author overlay — bottom-left */}
        <AuthorOverlay>
          <AvatarRing>
            <Avatar src={AUTHOR_IMAGE} alt={AUTHOR_NAME} />
          </AvatarRing>
          <AuthorMeta>
            <AuthorSig>{AUTHOR_NAME}</AuthorSig>
            <AuthorDate>
              {formattedDate}
              {post.location && (
                <LocationInline
                  onClick={() => handleLocationClick(post.location)}
                >
                  &nbsp;· <FaMapMarkerAlt size={9} /> {post.location}
                </LocationInline>
              )}
            </AuthorDate>
          </AuthorMeta>
        </AuthorOverlay>

        {/* Right-side action rail */}
        <ActionRail>
          <RailBtn
            onClick={handleLike}
            $active={hasLiked}
            aria-label='Like post'
          >
            <RailIcon $active={hasLiked} $color={COLORS.primarySalmon}>
              {hasLiked ? <FaHeart /> : <FaRegHeart />}
            </RailIcon>
            <RailCount>{post.likes || 0}</RailCount>
          </RailBtn>

          <RailBtn onClick={handleOpenComments} aria-label='Open comments'>
            <RailIcon $color={COLORS.primaryMint}>
              <FaComment />
            </RailIcon>
            <RailCount>{commentCount}</RailCount>
          </RailBtn>

          {isAuthenticated && (
            <ActionsWrapper ref={actionsRef}>
              <RailBtn
                onClick={() => setShowActions((v) => !v)}
                aria-label='More options'
              >
                <RailIcon $color={COLORS.textSecondary}>
                  <FaEllipsisV />
                </RailIcon>
              </RailBtn>

              {showActions && (
                <ActionsDropdown>
                  <Link
                    to={`/edit/${post._id}`}
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
        </ActionRail>

        {/* Carousel nav + dots */}
        {mediaCount > 1 && (
          <>
            {currentMediaIndex > 0 && (
              <NavBtn
                $side='left'
                onClick={() => setIdx((c) => c - 1)}
                aria-label='Previous'
              >
                <FaChevronLeft />
              </NavBtn>
            )}
            {currentMediaIndex < mediaCount - 1 && (
              <NavBtn
                $side='right'
                onClick={() => setIdx((c) => c + 1)}
                aria-label='Next'
              >
                <FaChevronRight />
              </NavBtn>
            )}
            <Dots>
              {post.media.map((_, i) => (
                <Dot key={i} $active={i === currentMediaIndex} />
              ))}
            </Dots>
          </>
        )}

        {/* Double-tap heart */}
        {isDoubleTapLiking && (
          <>
            <Ripple />
            <BigHeart>
              <FaHeart />
            </BigHeart>
          </>
        )}
      </MediaFrame>

      {/* ── CAPTION BAR ──────────────────────────────────────────────────── */}
      <ContentBody>
        <Link to={`/post/${post._id}`} style={{ textDecoration: 'none' }}>
          <Title>{post.title}</Title>
        </Link>

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
      </ContentBody>

      {/* ── COMMENT MODAL ────────────────────────────────────────────────── */}
      {showCommentModal && (
        <Suspense fallback={null}>
          <CommentModal
            isOpen={showCommentModal}
            onClose={() => setShowModal(false)}
            post={post}
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onLikeComment={handleLikeComment}
            isLoading={isLoadingComments}
          />
        </Suspense>
      )}
    </CardWrapper>
  );
});

PostCard.displayName = 'PostCard';
export default PostCard;

// ─── Styled Components ────────────────────────────────────────────────────────

const CardWrapper = styled.article`
  width: 100%;
  max-width: 500px;
  margin: 0 auto 2px;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: ${(p) => (p.$visible ? 'translateY(0)' : 'translateY(28px)')};
  transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);

  @font-face {
    font-family: 'Autography';
    src: url('/fonts/Autography.woff2') format('woff2');
    font-display: swap;
  }
`;

// ── Media ─────────────────────────────────────────────────────────────────────

const MediaFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #000;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
`;

const MediaTrack = styled.div`
  display: flex;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
`;

const MediaSlide = styled.div`
  flex: 0 0 100%;
  height: 100%;
`;

const PostImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const PostVid = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

// ── Overlays ──────────────────────────────────────────────────────────────────

const BottomScrim = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 45%;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.84) 0%,
    rgba(0, 0, 0, 0.42) 55%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
`;

const AuthorOverlay = styled.div`
  position: absolute;
  bottom: 18px;
  left: 14px;
  /* leave right gap for the action rail (≈72px) */
  right: 72px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
`;

const AvatarRing = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #000;
  display: block;
`;

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const AuthorSig = styled.span`
  font-family: 'Autography', cursive;
  font-size: 1.5rem;
  color: #fff;
  line-height: 1;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AuthorDate = styled.span`
  font-size: 0.67rem;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
`;

const LocationInline = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.67rem;
  color: ${COLORS.accentMint};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  &:hover {
    color: #fff;
  }
`;

// ── Right-side action rail ────────────────────────────────────────────────────

const ActionRail = styled.div`
  position: absolute;
  right: 12px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 3;
`;

const RailBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  -webkit-tap-highlight-color: transparent;
  /* min touch target */
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
`;

const RailIcon = styled.span`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: ${(p) => (p.$active ? p.$color : 'rgba(255,255,255,0.92)')};
  transition: color 0.18s, transform 0.18s, background 0.18s;

  ${(p) =>
    p.$active &&
    css`
      background: ${p.$color}28;
      animation: ${heartPop} 0.35s ease;
    `}

  ${RailBtn}:hover & {
    color: ${(p) => p.$color || '#fff'};
    background: rgba(0, 0, 0, 0.68);
    transform: scale(1.1);
  }
`;

const RailCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.75);
  line-height: 1;
`;

// ── Admin actions dropdown ────────────────────────────────────────────────────

const ActionsWrapper = styled.div`
  position: relative;
`;

const ActionsDropdown = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  min-width: 140px;
  overflow: hidden;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.65);
  animation: ${dropIn} 0.18s ease;
  z-index: 10;

  a,
  button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    color: ${COLORS.textPrimary};
    font-size: 0.875rem;
    text-decoration: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }
  .warn {
    color: ${COLORS.error};
  }
`;

// ── Carousel nav ──────────────────────────────────────────────────────────────

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(4px);
  border: none;
  color: #fff;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.15s, transform 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.72);
    transform: translateY(-50%) scale(1.08);
  }
`;

const Dots = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 2;
`;

const Dot = styled.div`
  height: 4px;
  width: ${(p) => (p.$active ? '20px' : '4px')};
  border-radius: 2px;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.38)')};
  transition: width 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease;
`;

// ── Double-tap like ───────────────────────────────────────────────────────────

const Ripple = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border: 3px solid ${COLORS.primarySalmon};
  border-radius: 50%;
  pointer-events: none;
  z-index: 4;
  animation: ${rippleOut} 0.75s ease-out forwards;
`;

const BigHeart = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${COLORS.primarySalmon};
  font-size: 88px;
  filter: drop-shadow(0 0 24px ${COLORS.primarySalmon}99);
  pointer-events: none;
  z-index: 4;
  animation: ${scaleIn} 0.8s ease forwards;
`;

// ── Caption bar ───────────────────────────────────────────────────────────────

const ContentBody = styled.div`
  background: ${COLORS.cardBackground};
  padding: 13px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 5px;
  transition: color 0.2s;
  &:hover {
    color: ${COLORS.primaryMint};
  }
`;

const CaptionWrap = styled.div`
  margin-bottom: 8px;
`;

const CaptionText = styled.p`
  font-size: 0.875rem;
  line-height: 1.55;
  color: ${COLORS.textSecondary};
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
  font-size: 0.8rem;
  font-weight: 700;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  margin-top: 2px;
  display: block;
  transition: color 0.15s;
  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const Tag = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${COLORS.textTertiary};
  transition: color 0.2s, border-color 0.2s;
  &:hover {
    color: ${COLORS.accentMint};
    border-color: ${COLORS.primaryMint}55;
  }
`;
