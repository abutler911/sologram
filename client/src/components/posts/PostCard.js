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

const revealUp = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
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

        {/* Grain overlay */}
        <GrainOverlay />

        {/* Bottom gradient scrim */}
        <BottomScrim />

        {/* Carousel dots — top center */}
        {mediaCount > 1 && (
          <Dots>
            {post.media.map((_, i) => (
              <Dot key={i} $active={i === currentMediaIndex} />
            ))}
          </Dots>
        )}

        {/* Media index counter — top right */}
        {mediaCount > 1 && (
          <MediaIndex>
            {String(currentMediaIndex + 1).padStart(2, '0')} /{' '}
            {String(mediaCount).padStart(2, '0')}
          </MediaIndex>
        )}

        {/* Author overlay — bottom-left */}
        <AuthorOverlay>
          <AvatarWrap>
            <Avatar src={AUTHOR_IMAGE} alt={AUTHOR_NAME} />
          </AvatarWrap>
          <AuthorMeta>
            <AuthorSig>{AUTHOR_NAME}</AuthorSig>
            <AuthorDate>{formattedDate}</AuthorDate>
          </AuthorMeta>
        </AuthorOverlay>

        {/* Carousel nav arrows */}
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

      {/* ── CONTENT BODY ─────────────────────────────────────────────────── */}
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

        {/* ── ACTION BAR — horizontal ──────────────────────────────────── */}
        <ActionBar>
          <ActionBtn
            onClick={handleLike}
            $active={hasLiked}
            disabled={!isAuthenticated || isProcessing}
            aria-label='Like post'
          >
            {hasLiked ? <FaHeart /> : <FaRegHeart />}
            <span>{post.likes || 0}</span>
          </ActionBtn>

          <ActionBtn onClick={handleOpenComments} aria-label='Open comments'>
            <FaComment />
            <span>{commentCount}</span>
          </ActionBtn>

          <ActionSep />

          {post.location && (
            <LocationBtn onClick={() => handleLocationClick(post.location)}>
              <FaMapMarkerAlt />
              {post.location}
            </LocationBtn>
          )}

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
        </ActionBar>
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

// ─── Design Tokens ────────────────────────────────────────────────────────────

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

// ─── Styled Components ────────────────────────────────────────────────────────

const CardWrapper = styled.article`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Instrument+Sans:wght@400;500;600&display=swap');

  width: 100%;
  max-width: 480px;
  margin: 0 auto 32px;
  background: ${NOIR.warmWhite};
  overflow: hidden;

  /* Sharp top, barely-there bottom rounding */
  border-radius: 0 0 4px 4px;

  /* Accent line at top — the card's signature */
  box-shadow: 0 2px 0 0 ${NOIR.salmon}, 0 30px 80px rgba(0, 0, 0, 0.18);

  /* Reveal animation */
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: ${(p) => (p.$visible ? 'translateY(0)' : 'translateY(28px)')};
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  /* Pseudo-element for the gradient top rule */
  position: relative;
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
  /* Slight desaturation — editorial, not saturated social */
  filter: saturate(0.88) contrast(1.04);
  transition: filter 0.4s ease;

  ${CardWrapper}:hover & {
    filter: saturate(1) contrast(1.02);
  }
`;

const PostVid = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

// ── Overlays ──────────────────────────────────────────────────────────────────

/* Film grain — adds analog texture without a real image */
const GrainOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
  mix-blend-mode: overlay;
`;

const BottomScrim = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 52%;
  background: linear-gradient(
    to top,
    rgba(10, 10, 11, 0.76) 0%,
    rgba(10, 10, 11, 0.32) 48%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 3;
`;

// ── Carousel dots — top center ────────────────────────────────────────────────

const Dots = styled.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  z-index: 5;
`;

const Dot = styled.div`
  height: 3px;
  border-radius: 2px;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.35)')};
  width: ${(p) => (p.$active ? '22px' : '3px')};
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease;
`;

// ── Media index counter — top right ──────────────────────────────────────────

const MediaIndex = styled.span`
  position: absolute;
  top: 15px;
  right: 16px;
  z-index: 5;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
`;

// ── Author overlay — bottom-left ──────────────────────────────────────────────

const AuthorOverlay = styled.div`
  position: absolute;
  bottom: 20px;
  left: 18px;
  /* leave right gap for nav arrows if needed */
  right: 56px;
  display: flex;
  align-items: flex-end;
  gap: 11px;
  z-index: 5;
`;

const AvatarWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  /* Do not inherit media desaturation */
  filter: none !important;
`;

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const AuthorSig = styled.span`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 300;
  font-size: 1.55rem;
  color: #fff;
  line-height: 1;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AuthorDate = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.52);
  text-transform: uppercase;
`;

// ── Carousel nav arrows ───────────────────────────────────────────────────────

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(10, 10, 11, 0.44);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 4;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: rgba(10, 10, 11, 0.7);
    transform: translateY(-50%) scale(1.08);
  }
`;

// ── Double-tap like ───────────────────────────────────────────────────────────

const Ripple = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border: 2px solid ${NOIR.salmon};
  border-radius: 50%;
  pointer-events: none;
  z-index: 6;
  animation: ${rippleOut} 0.75s ease-out forwards;
`;

const BigHeart = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${NOIR.salmon};
  font-size: 88px;
  filter: drop-shadow(0 0 24px ${NOIR.salmon}99);
  pointer-events: none;
  z-index: 6;
  animation: ${scaleIn} 0.8s ease forwards;
`;

// ── Content Body ──────────────────────────────────────────────────────────────

const ContentBody = styled.div`
  background: ${NOIR.warmWhite};
  padding: 18px 20px 20px;
  position: relative;

  /* Hairline rule at top */
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

// ── Action bar — horizontal ───────────────────────────────────────────────────

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

  /* Slight icon pop on liked */
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

const LocationBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  padding: 5px 0;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;

  svg {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }

  &:hover {
    color: ${NOIR.sage};
  }
`;

// ── Admin actions dropdown ────────────────────────────────────────────────────

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
  border-radius: 2px;
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
  border-radius: 4px;
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
