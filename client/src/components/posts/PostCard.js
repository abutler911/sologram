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
import styled, { keyframes } from 'styled-components';
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaEllipsisH,
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

const fadeIn = keyframes`from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}`;
const scaleIn = keyframes`
  0%{transform:scale(0);opacity:0}
  15%{transform:scale(1.25);opacity:1}
  30%{transform:scale(0.95)}
  45%,80%{transform:scale(1);opacity:1}
  100%{transform:scale(0);opacity:0}
`;
const mintRipple = keyframes`
  from{transform:translate(-50%,-50%) scale(0.5);opacity:0.8}
  to{transform:translate(-50%,-50%) scale(2.8);opacity:0}
`;

const PostCard = memo(({ post: initialPost, onDelete, onLike }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [post, setPost] = useState(initialPost);
  const [currentMediaIndex, setIdx] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isDoubleTapLiking, setDTLike] = useState(false);
  const [showCommentModal, setShowModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setLoadingC] = useState(false);
  // Initialize from Post.commentCount, but always sync from server on open
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

  // Intersection observer — lazy reveal animation
  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setIsVisible(true);
          ob.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) ob.observe(cardRef.current);
    return () => ob.disconnect();
  }, []);

  // Click-away for actions dropdown
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
      // Always trust the server's total for the count
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
        console.error('[addComment]', err?.response?.data || err.message);
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
    } catch (err) {
      console.error('[deleteComment]', err?.response?.data || err.message);
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
      } catch (err) {
        console.error('[likeComment]', err?.response?.data || err.message);
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
      title: 'Delete Log Entry?',
      message:
        'This will permanently remove this post and all its interactions.',
      confirmText: 'Delete Post',
      onConfirm: async () => {
        try {
          await api.deletePost(post._id);
          if (onDelete) onDelete(post._id);
          toast.success('Log entry removed');
        } catch {
          toast.error('Failed to delete entry');
        }
      },
    });
    setShowActions(false);
  }, [post._id, showDeleteModal, onDelete]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () =>
      setIdx((c) => Math.min(c + 1, (post.media?.length || 1) - 1)),
    onSwipedRight: () => setIdx((c) => Math.max(c - 1, 0)),
    trackMouse: true,
  });

  return (
    <CardWrapper ref={cardRef} className={isVisible ? 'visible' : ''}>
      <Card>
        <CardHeader>
          <SignatureArea>
            <AvatarContainer>
              <Avatar src={AUTHOR_IMAGE} alt={AUTHOR_NAME} />
              <StatusDot />
            </AvatarContainer>
            <HeaderInfo>
              <Signature>{AUTHOR_NAME}</Signature>
              <MetaRow>
                <DateText>{formattedDate}</DateText>
                {post.location && (
                  <>
                    <DotDivider>•</DotDivider>
                    <InlineLocation
                      onClick={() => handleLocationClick(post.location)}
                    >
                      <FaMapMarkerAlt size={9} /> {post.location}
                    </InlineLocation>
                  </>
                )}
              </MetaRow>
            </HeaderInfo>
          </SignatureArea>

          {isAuthenticated && (
            <ActionsWrapper ref={actionsRef}>
              <MenuToggle
                onClick={() => setShowActions((v) => !v)}
                aria-label='Post options'
              >
                <FaEllipsisH />
              </MenuToggle>
              {showActions && (
                <Dropdown>
                  <Link to={`/edit/${post._id}`}>
                    <FaEdit /> Edit Post
                  </Link>
                  <button onClick={handleDeletePost} className='warn'>
                    <FaTrash /> Delete Post
                  </button>
                </Dropdown>
              )}
            </ActionsWrapper>
          )}
        </CardHeader>

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
                      height: 1080,
                      crop: 'fill',
                    })}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    alt={post.title || 'Sologram post'}
                  />
                )}
              </MediaSlide>
            ))}
          </MediaTrack>

          {post.media?.length > 1 && (
            <>
              {currentMediaIndex > 0 && (
                <NavBtn $side='left' onClick={() => setIdx((c) => c - 1)}>
                  <FaChevronLeft />
                </NavBtn>
              )}
              {currentMediaIndex < post.media.length - 1 && (
                <NavBtn $side='right' onClick={() => setIdx((c) => c + 1)}>
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

          {isDoubleTapLiking && (
            <>
              <RippleEffect />
              <BigHeart>
                <FaHeart />
              </BigHeart>
            </>
          )}
        </MediaFrame>

        <ContentBody>
          <Link to={`/post/${post._id}`} style={{ textDecoration: 'none' }}>
            <Title>{post.title}</Title>
          </Link>
          <CaptionText>{post.caption || post.content}</CaptionText>

          {post.tags?.length > 0 && (
            <TagBox>
              {post.tags.map((t, i) => (
                <Tag key={i}>#{t}</Tag>
              ))}
            </TagBox>
          )}

          <Footer>
            <BtnGroup>
              <ActionBtn
                onClick={handleLike}
                $active={hasLiked}
                $color={COLORS.primarySalmon}
              >
                {hasLiked ? <FaHeart /> : <FaRegHeart />}
                <span>{post.likes || 0}</span>
              </ActionBtn>
              <ActionBtn
                onClick={handleOpenComments}
                $color={COLORS.primaryMint}
              >
                <FaComment />
                <span>{commentCount}</span>
              </ActionBtn>
            </BtnGroup>
          </Footer>
        </ContentBody>
      </Card>

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

// ─── Styled Components ───────────────────────────────────────────────────────

const CardWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto 32px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s cubic-bezier(0.2, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.2, 1, 0.3, 1);
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
  @font-face {
    font-family: 'Autography';
    src: url('/fonts/Autography.woff2') format('woff2');
    font-display: swap;
  }
`;
const Card = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;
const CardHeader = styled.div`
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;
const SignatureArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;
const AvatarContainer = styled.div`
  position: relative;
`;
const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${COLORS.cardBackground};
  box-shadow: 0 0 0 2px ${COLORS.primarySalmon};
`;
const StatusDot = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: ${COLORS.primaryMint};
  border: 2px solid ${COLORS.cardBackground};
  border-radius: 50%;
`;
const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;
const Signature = styled.div`
  font-family: 'Autography', cursive;
  font-size: 1.8rem;
  color: ${COLORS.textPrimary};
  line-height: 1;
`;
const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;
const DateText = styled.div`
  font-size: 0.65rem;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 1px;
`;
const DotDivider = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.6rem;
`;
const InlineLocation = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.65rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  &:hover {
    color: ${COLORS.primaryMint};
  }
`;
const ActionsWrapper = styled.div`
  position: relative;
`;
const MenuToggle = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 8px;
  &:hover {
    color: ${COLORS.primaryMint};
  }
`;
const Dropdown = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  z-index: 50;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.2s ease-out;
  a,
  button {
    padding: 12px 16px;
    border: none;
    background: none;
    color: ${COLORS.textPrimary};
    text-decoration: none;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
  .warn {
    color: ${COLORS.primarySalmon};
  }
`;
const MediaFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  background: #000;
  overflow: hidden;
`;
const MediaTrack = styled.div`
  display: flex;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.2, 1, 0.3, 1);
`;
const MediaSlide = styled.div`
  flex: 0 0 100%;
  height: 100%;
`;
const PostImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const PostVid = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}:12px;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;
const Dots = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
`;
const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) =>
    p.$active ? COLORS.primaryMint : 'rgba(255,255,255,0.3)'};
  transition: background 0.2s;
`;
const RippleEffect = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  border: 3px solid ${COLORS.primaryMint};
  border-radius: 50%;
  pointer-events: none;
  animation: ${mintRipple} 0.8s ease-out forwards;
`;
const BigHeart = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${COLORS.primarySalmon};
  font-size: 80px;
  animation: ${scaleIn} 0.8s ease forwards;
`;
const ContentBody = styled.div`
  padding: 24px 20px;
`;
const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  margin-bottom: 6px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  &:hover {
    color: ${COLORS.primaryMint};
  }
`;
const CaptionText = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: ${COLORS.textSecondary};
  margin-bottom: 20px;
  white-space: pre-wrap;
`;
const TagBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;
const Tag = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${COLORS.textTertiary};
  transition: 0.3s;
  &:hover {
    color: ${COLORS.primaryMint};
    border-color: ${COLORS.primaryMint};
    transform: translateY(-2px);
  }
`;
const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;
const BtnGroup = styled.div`
  display: flex;
  gap: 24px;
`;
const ActionBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3rem;
  color: ${(p) => (p.$active ? p.$color : COLORS.textTertiary)};
  transition: color 0.2s, transform 0.2s;
  span {
    font-size: 0.9rem;
    font-weight: 800;
    color: ${COLORS.textSecondary};
  }
  &:hover {
    color: ${(p) => p.$color};
    transform: scale(1.1);
  }
`;
