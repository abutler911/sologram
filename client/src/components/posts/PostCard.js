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
  FaEllipsisH,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useSwipeable } from 'react-swipeable';
import { LikesContext } from '../../context/LikesContext';
import { useDeleteModal } from '../../context/DeleteModalContext';
import { AuthContext } from '../../context/AuthContext';
import authorImg from '../../assets/andy.jpg';
import { getTransformedImageUrl } from '../../utils/cloudinary';
import { api } from '../../services/api';

import { COLORS } from '../../theme';
const CommentModal = lazy(() =>
  import('./CommentModal').then((module) => ({ default: module.CommentModal }))
);
const AUTHOR_IMAGE = authorImg;
const AUTHOR_NAME = 'Andrew';

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  15% { transform: scale(1.3); opacity: 1; }
  30% { transform: scale(0.95); }
  45%, 80% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const fontFaceStyles = css`
  @font-face {
    font-family: 'ParadiseSignature';
    src: url('/fonts/Paradise Signature.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Autography';
    src: url('/fonts/Autography.woff2') format('woff2'),
      url('/fonts/Autography.woff') format('woff'),
      url('/fonts/Autography.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`;

function getCommentCountFromPost(p = {}) {
  const a = Number.isFinite(p?.commentsCount) ? p.commentsCount : null;
  const b = Number.isFinite(p?.commentCount) ? p.commentCount : null;
  const c = Array.isArray(p?.comments) ? p.comments.length : null;
  return a ?? b ?? c ?? 0;
}

const FullscreenModalComponent = ({ onClick, children }) => (
  <FullscreenModal onClick={onClick}>{children}</FullscreenModal>
);

const PostCard = memo(({ post: initialPost, onDelete, onLike, index = 0 }) => {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [post, setPost] = useState(initialPost);
  const { isAuthenticated } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDoubleTapLiking, setIsDoubleTapLiking] = useState(false);
  const actionsRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const longPressTimeoutRef = useRef(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const { checkLikeStatus, likePost, likedPosts, isProcessing } =
    useContext(LikesContext);
  const hasLiked = likedPosts[post?._id] || false;

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const hasMultipleMedia = post.media && post.media.length > 1;
  const formattedDate = format(new Date(post.createdAt), 'MMM d, yyyy');

  useEffect(() => {
    if (isAuthenticated && post._id) {
      checkLikeStatus(post._id);
    }
  }, [isAuthenticated, post._id, checkLikeStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCommentCount = useCallback(async () => {
    if (!post?._id) return;
    try {
      const { count } = await api.getCommentCount(post._id);
      if (Number.isFinite(count)) setCommentCount(count);
    } catch (e) {
      // Non-critical
    }
  }, [post?._id]);

  useEffect(() => {
    if (isVisible) fetchCommentCount();
  }, [isVisible, fetchCommentCount, post?._id]);

  useEffect(() => {
    if (!cardRef.current || typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '120px 0px' }
    );
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  const fetchComments = useCallback(async () => {
    if (!post._id) return;
    setIsLoadingComments(true);
    try {
      const data = await api.getComments(post._id);
      const list = Array.isArray(data.comments) ? data.comments : [];
      setComments(list);
      const serverCount = Number.isFinite(data.count)
        ? data.count
        : Number.isFinite(data.total)
        ? data.total
        : list.length;
      setCommentCount(serverCount);
    } catch (err) {
      console.error('Error fetching comments:', err);
      toast.error('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  }, [post._id]);

  const handleOpenComments = useCallback(() => {
    setShowCommentModal(true);
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = useCallback(
    async (commentData) => {
      try {
        const data = await api.addComment(post._id, commentData);
        const newComment = data.comment || data;
        setComments((prev) => [newComment, ...prev]);
        setCommentCount((prev) => prev + 1);
        fetchCommentCount();
        return newComment;
      } catch (err) {
        console.error('Error adding comment:', err);
        throw err;
      }
    },
    [post._id, fetchCommentCount]
  );

  const handleLikeComment = useCallback(
    async (commentId) => {
      if (!isAuthenticated) return;
      try {
        const data = await api.likeComment(commentId);
        const updated = data.comment || data;
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? updated : c))
        );
      } catch (err) {
        console.error('Error liking comment:', err);
        toast.error('Failed to like comment');
      }
    },
    [isAuthenticated]
  );

  const handleDeleteComment = useCallback(
    async (commentId) => {
      try {
        await api.deleteComment(commentId);
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setCommentCount((prev) => Math.max(0, prev - 1));
        fetchCommentCount();
        toast.success('Comment deleted');
      } catch (err) {
        console.error('Error deleting comment:', err);
        toast.error('Failed to delete comment');
      }
    },
    [fetchCommentCount]
  );

  const handleLocationClick = useCallback((location) => {
    const encodedLocation = encodeURIComponent(location);
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.open(
        `https://maps.apple.com/?q=${encodedLocation}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else if (/android/i.test(userAgent)) {
      const intent = `intent://maps.google.com/maps?q=${encodedLocation}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
      const fallback = `https://maps.google.com/maps?q=${encodedLocation}`;
      try {
        window.location.href = intent;
        setTimeout(
          () => window.open(fallback, '_blank', 'noopener,noreferrer'),
          500
        );
      } catch (e) {
        window.open(fallback, '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      if (longPressTimeoutRef.current)
        clearTimeout(longPressTimeoutRef.current);
      setIsPressing(true);
      longPressTimeoutRef.current = setTimeout(() => {
        setIsLongPressing(true);
        setShowFullscreen(true);
        setFullscreenIndex(currentMediaIndex);
      }, 300);
    },
    [currentMediaIndex]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (isLongPressing) e.preventDefault();
      setIsPressing(false);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      setIsLongPressing(false);
    },
    [isLongPressing]
  );

  const TruncatedText = ({ text, maxLength, linkTo }) => {
    if (!text) return null;
    if (text.length <= maxLength) return <span>{text}</span>;
    return (
      <>
        <span>{text.substring(0, maxLength)}...</span>
        <ReadMoreLink to={linkTo}>read more</ReadMoreLink>
      </>
    );
  };

  const handleTouchMove = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const fullscreenSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (fullscreenIndex < post.media.length - 1)
        setFullscreenIndex(fullscreenIndex + 1);
    },
    onSwipedRight: () => {
      if (fullscreenIndex > 0) setFullscreenIndex(fullscreenIndex - 1);
    },
    preventDefaultTouchmoveEvent: !isZoomed,
    trackMouse: true,
    trackTouch: true,
  });

  const handleFullscreenDoubleTap = useCallback(() => {
    setIsZoomed(!isZoomed);
  }, [isZoomed]);

  const closeFullscreen = useCallback(() => {
    setShowFullscreen(false);
    setIsZoomed(false);
  }, []);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated || isProcessing || hasLiked) return;
    likePost(post._id, () => {
      setPost((prevPost) => ({
        ...prevPost,
        likes: (prevPost.likes || 0) + 1,
      }));
      if (typeof onLike === 'function') onLike(post._id);
    });
  }, [post._id, isProcessing, hasLiked, isAuthenticated, likePost, onLike]);

  const handleDoubleTapLike = useCallback(() => {
    if (!isAuthenticated) return;
    if (!hasLiked) handleLike();
    setIsDoubleTapLiking(true);
    setTimeout(() => setIsDoubleTapLiking(false), 700);
  }, [hasLiked, handleLike, isAuthenticated]);

  const handleDeletePost = useCallback(() => {
    const postPreview =
      post.title || post.caption || post.content || 'this post';
    const truncatedPreview =
      postPreview.length > 50
        ? postPreview.substring(0, 50) + '...'
        : postPreview;
    showDeleteModal({
      title: 'Delete Post',
      message:
        'Are you sure you want to delete this post? This action cannot be undone and all likes, comments, and interactions will be permanently lost.',
      confirmText: 'Delete Post',
      cancelText: 'Keep Post',
      itemName: truncatedPreview,
      onConfirm: async () => {
        try {
          await api.deletePost(post._id);
          if (typeof onDelete === 'function') onDelete(post._id);
          toast.success('Post deleted');
        } catch (err) {
          console.error('Error deleting post:', err);
          toast.error(err.message || 'Failed to delete post');
        }
      },
      onCancel: () => setShowActions(false),
      destructive: true,
    });
    setShowActions(false);
  }, [post, onDelete, showDeleteModal]);

  const handleNext = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (currentMediaIndex < post.media.length - 1)
        setCurrentMediaIndex((prev) => prev + 1);
    },
    [currentMediaIndex, post.media.length]
  );

  const handlePrev = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (currentMediaIndex > 0) setCurrentMediaIndex((prev) => prev - 1);
    },
    [currentMediaIndex]
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    trackTouch: true,
  });

  const handleMediaClick = useCallback(
    (e) => {
      if (isLongPressing) {
        e.preventDefault();
        return;
      }
      if (hasMultipleMedia) e.preventDefault();
    },
    [isLongPressing, hasMultipleMedia]
  );

  return (
    <CardWrapper ref={cardRef} className={isVisible ? 'visible' : ''}>
      <Card>
        <CardHeader aria-label='Post header'>
          <UserInfo>
            <UserAvatarImage
              src={AUTHOR_IMAGE}
              alt="Andrew's avatar"
              width='44'
              height='44'
              loading='eager'
            />
            <UsernameContainer>
              <Username className='autography-font'>{AUTHOR_NAME}</Username>
              <DateBadge>
                <span>{formattedDate}</span>
              </DateBadge>
            </UsernameContainer>
          </UserInfo>
          {isAuthenticated && (
            <ActionsContainer ref={actionsRef}>
              <ActionsButton
                onClick={() => setShowActions(!showActions)}
                aria-label='Post options'
              >
                <FaEllipsisH />
              </ActionsButton>
              {showActions && (
                <ActionsMenu>
                  <ActionItem as={Link} to={`/edit/${post._id}`}>
                    <FaEdit /> Edit Post
                  </ActionItem>
                  <ActionItem onClick={handleDeletePost}>
                    <FaTrash /> Delete Post
                  </ActionItem>
                </ActionsMenu>
              )}
            </ActionsContainer>
          )}
        </CardHeader>

        {post.media && post.media.length > 0 && (
          <MediaContainer
            to={`/post/${post._id}`}
            onClick={handleMediaClick}
            onDoubleClick={handleDoubleTapLike}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onTouchCancel={handleTouchEnd}
            isPressing={isPressing}
            isLoading={isLoading}
          >
            <MediaCarousel {...swipeHandlers}>
              <MediaTrack currentIndex={currentMediaIndex}>
                {post.media.map((media, index) => (
                  <MediaItem key={index}>
                    {media.mediaType === 'image' ? (
                      <PostImage
                        src={getTransformedImageUrl(media.mediaUrl, {
                          width: 1080,
                          height: 1080,
                          crop: 'fill',
                          gravity: 'auto',
                          quality: 'auto:good',
                          format: 'auto',
                          dpr: 'auto',
                          effect: 'improve:outdoor:10',
                          color_adjustment: 'saturation:10',
                          sharpen: 15,
                          flags: 'progressive',
                        })}
                        sizes='100vw'
                        alt={post.caption || 'Post image'}
                        width='614'
                        height='614'
                        loading={
                          index === 0 && currentMediaIndex === 0
                            ? 'eager'
                            : 'lazy'
                        }
                        fetchpriority={
                          index === 0 && currentMediaIndex === 0
                            ? 'high'
                            : 'auto'
                        }
                        decoding='async'
                        className={media.filter}
                        onLoad={(e) => {
                          e.target.classList.add('loaded');
                          setIsLoading(false);
                        }}
                      />
                    ) : (
                      <PostVideo
                        src={media.mediaUrl}
                        controls
                        preload='metadata'
                        className={media.filter}
                      />
                    )}
                  </MediaItem>
                ))}
              </MediaTrack>
            </MediaCarousel>

            {hasMultipleMedia && (
              <>
                <NavigationArrow
                  className='prev'
                  onClick={handlePrev}
                  disabled={currentMediaIndex === 0}
                  aria-label='Previous image'
                >
                  <FaChevronLeft />
                </NavigationArrow>
                <NavigationArrow
                  className='next'
                  onClick={handleNext}
                  disabled={currentMediaIndex === post.media.length - 1}
                  aria-label='Next image'
                >
                  <FaChevronRight />
                </NavigationArrow>
                <ProgressIndicator>
                  {post.media.map((_, index) => (
                    <ProgressDot
                      key={index}
                      active={index === currentMediaIndex}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentMediaIndex(index);
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </ProgressIndicator>
              </>
            )}

            {isDoubleTapLiking && (
              <>
                <HeartAnimation>
                  <FaHeart />
                </HeartAnimation>
                <BurstWrapper>
                  {[...Array(8)].map((_, i) => (
                    <BurstHeart key={i} index={i} />
                  ))}
                </BurstWrapper>
              </>
            )}
          </MediaContainer>
        )}

        {post.location && (
          <LocationBar
            onClick={() => handleLocationClick(post.location)}
            title={`Open "${post.location}" in maps`}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLocationClick(post.location);
              }
            }}
          >
            <LocationIcon>
              <FaMapMarkerAlt />
            </LocationIcon>
            <LocationText>{post.location}</LocationText>
            <LocationIndicator>
              <FaExternalLinkAlt />
            </LocationIndicator>
          </LocationBar>
        )}

        <CardActions>
          <ActionButtons>
            {isAuthenticated ? (
              <LikeButton
                onClick={handleLike}
                disabled={isProcessing || hasLiked}
                liked={hasLiked}
                processing={isProcessing}
                aria-label={hasLiked ? 'Post liked' : 'Like post'}
              >
                {hasLiked ? (
                  <FaHeart />
                ) : isProcessing ? (
                  <LoadingIcon />
                ) : (
                  <FaRegHeart />
                )}
              </LikeButton>
            ) : (
              <LikeIcon>
                <FaHeart />
              </LikeIcon>
            )}
            <CommentButton
              onClick={handleOpenComments}
              aria-label='Open comments'
            >
              <FaComment />
              {commentCount > 0 && <CommentCount>{commentCount}</CommentCount>}
            </CommentButton>
          </ActionButtons>
          <LikesCount>
            <strong>{post.likes}</strong> {post.likes === 1 ? 'like' : 'likes'}
          </LikesCount>
        </CardActions>

        <CardContent>
          <PostLink to={`/post/${post._id}`}>
            {post.title && <PostTitle>{post.title}</PostTitle>}
            {post.caption && (
              <Caption>
                <TruncatedText
                  text={post.caption}
                  maxLength={280}
                  linkTo={`/post/${post._id}`}
                />
              </Caption>
            )}
            {post.content && (
              <Content>
                <TruncatedText
                  text={post.content}
                  maxLength={220}
                  linkTo={`/post/${post._id}`}
                />
              </Content>
            )}
          </PostLink>

          {post.tags && post.tags.length > 0 && (
            <TagsContainer>
              {post.tags.map((tag, index) => (
                <Tag key={index}>#{tag}</Tag>
              ))}
            </TagsContainer>
          )}

          <ViewPostLink to={`/post/${post._id}`}>
            View Post<ViewPostArrow>→</ViewPostArrow>
          </ViewPostLink>
        </CardContent>
      </Card>

      {showFullscreen && (
        <Suspense fallback={<div>Loading...</div>}>
          <FullscreenModalComponent onClick={closeFullscreen}>
            <FullscreenWrapper
              {...fullscreenSwipeHandlers}
              onDoubleClick={handleFullscreenDoubleTap}
            >
              <FullscreenImage
                src={getTransformedImageUrl(
                  post.media[fullscreenIndex].mediaUrl,
                  {
                    width: 1200,
                    height: 1200,
                    crop: 'limit',
                    quality: 'auto:best',
                    format: 'auto',
                    effect: 'improve:outdoor:10',
                    color_adjustment: 'saturation:5',
                  }
                )}
                alt={post.caption || 'Fullscreen view'}
                style={{
                  transform: isZoomed ? 'scale(2)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
                loading='eager'
                onError={(e) => {
                  e.target.src = post.media[fullscreenIndex].mediaUrl;
                }}
              />
              {post.media.length > 1 && (
                <>
                  <FullscreenNavButton
                    className='prev'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fullscreenIndex > 0) setFullscreenIndex((p) => p - 1);
                    }}
                    disabled={fullscreenIndex === 0}
                    aria-label='Previous image'
                  >
                    <FaChevronLeft />
                  </FullscreenNavButton>
                  <FullscreenNavButton
                    className='next'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fullscreenIndex < post.media.length - 1)
                        setFullscreenIndex((p) => p + 1);
                    }}
                    disabled={fullscreenIndex === post.media.length - 1}
                    aria-label='Next image'
                  >
                    <FaChevronRight />
                  </FullscreenNavButton>
                </>
              )}
              {post.media.length > 1 && (
                <FullscreenIndicator>
                  {fullscreenIndex + 1} / {post.media.length}
                </FullscreenIndicator>
              )}
              {post.media.length > 1 && (
                <FullscreenProgressIndicator>
                  {post.media.map((_, index) => (
                    <FullscreenProgressDot
                      key={index}
                      active={index === fullscreenIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenIndex(index);
                      }}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </FullscreenProgressIndicator>
              )}
            </FullscreenWrapper>
            <CloseFullscreenButton
              onClick={(e) => {
                e.stopPropagation();
                closeFullscreen();
              }}
              aria-label='Close fullscreen view'
            >
              ×
            </CloseFullscreenButton>
          </FullscreenModalComponent>
        </Suspense>
      )}

      {showCommentModal && (
        <Suspense fallback={<div>Loading comments...</div>}>
          <CommentModal
            isOpen={showCommentModal}
            onClose={() => setShowCommentModal(false)}
            post={post}
            comments={comments}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            isLoading={isLoadingComments}
          />
        </Suspense>
      )}
    </CardWrapper>
  );
});

// ── STYLED COMPONENTS ─────────────────────────────────────────────────────────

const CardWrapper = styled.div`
  ${fontFaceStyles}
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  /* Clear bottom separator between cards */
  border-bottom: 1px solid ${COLORS.divider};
  transition: opacity 0.5s ease;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 100%;
    max-width: 100%;
    padding: 0;
  }
`;

const Card = styled.article`
  position: relative;
  background-color: ${COLORS.cardBackground};
  overflow: visible;
  width: 100%;
  display: flex;
  flex-direction: column;
  /* Subtle border gives cards definition on desktop */
  border: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-left: none;
    border-right: none;
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${COLORS.cardBackground};

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 12px 16px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const UsernameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActionsContainer = styled.div`
  position: relative;
`;

const Username = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: -0.1px;
  margin: 0;
  line-height: 1.2;
  color: ${COLORS.textPrimary};
`;

const DateBadge = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textTertiary};
  font-size: 0.7rem;
  margin-top: 2px;
  font-weight: normal;
  svg {
    display: none;
  }
`;

const ActionsButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  &:hover {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.primarySalmon};
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  z-index: 10;
  overflow: hidden;
  width: 170px;
  padding: 5px;
  transform-origin: top right;
  animation: ${fadeIn} 0.15s ease-out;
  border: 1px solid ${COLORS.border};
`;

const ActionItem = styled.button`
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: none;
  color: ${COLORS.textPrimary};
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.1s;
  svg {
    margin-right: 10px;
    font-size: 0.82rem;
    color: ${COLORS.textTertiary};
  }
  &:hover {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.textPrimary};
  }
  &:last-child:hover {
    color: ${COLORS.error};
    svg {
      color: ${COLORS.error};
    }
  }
`;

const MediaContainer = styled(Link)`
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  display: block;
  overflow: hidden;
  background-color: transparent;
  transition: opacity 0.2s ease;
  opacity: ${(props) => (props.isPressing ? 0.9 : 1)};
  border: none;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(
      to right,
      transparent,
      ${COLORS.primaryMint},
      transparent
    );
    transform: translateX(-100%);
    animation: ${(props) =>
      props.isLoading ? 'loadingAnimation 1.5s infinite' : 'none'};
  }
`;

const MediaCarousel = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const MediaTrack = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  will-change: transform;
  transform: translateX(-${(props) => props.currentIndex * 100}%);
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
`;

const PostImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.5s ease;
  opacity: 0;
  &.loaded {
    opacity: 1;
  }
  &.filter-warm {
    filter: saturate(1.2) sepia(0.15) contrast(1.05);
  }
  &.filter-cool {
    filter: saturate(0.9) hue-rotate(10deg) brightness(1.05);
  }
  &.filter-grayscale {
    filter: grayscale(0.9);
  }
  &.filter-vintage {
    filter: sepia(0.35) saturate(1.3) contrast(1.1);
  }
  &.filter-clarendon {
    filter: contrast(1.2) saturate(1.35);
  }
  &.filter-gingham {
    filter: brightness(1.05) sepia(0.2);
  }
  &.filter-moon {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }
`;

const PostVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  &.filter-warm {
    filter: saturate(1.1) sepia(0.15) contrast(1.05);
  }
  &.filter-cool {
    filter: saturate(0.95) hue-rotate(15deg) brightness(1.05);
  }
  &.filter-grayscale {
    filter: grayscale(0.8);
  }
  &.filter-vintage {
    filter: sepia(0.25) saturate(1.1) contrast(1.1);
  }
`;

const NavigationArrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 2;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  &:hover {
    opacity: 1 !important;
    background-color: rgba(255, 255, 255, 0.18);
  }
  ${MediaContainer}:hover & {
    opacity: 0.9;
  }
  &.prev {
    left: 12px;
  }
  &.next {
    right: 12px;
  }
  &:disabled {
    opacity: 0.15;
    cursor: not-allowed;
    background-color: rgba(0, 0, 0, 0.4);
  }
  @media (max-width: 768px), screen and (display-mode: standalone) {
    opacity: 0.7;
    width: 36px;
    height: 36px;
    &:active {
      transform: translateY(-50%) scale(0.95);
    }
    &.prev {
      left: 8px;
    }
    &.next {
      right: 8px;
    }
  }
`;

const LoadingIcon = styled(FaRegHeart)`
  animation: ${pulse} 0.8s ease-in-out infinite;
  opacity: 0.7;
`;

const ProgressIndicator = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 2;
`;

const ProgressDot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? '#fff' : 'rgba(255, 255, 255, 0.45)'};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  &:hover {
    transform: scale(1.2);
    background-color: ${(props) =>
      props.active ? '#fff' : 'rgba(255, 255, 255, 0.75)'};
  }
`;

const HeartAnimation = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${COLORS.primarySalmon};
  font-size: 80px;
  opacity: 0;
  animation: ${scaleIn} 1s ease forwards;
  z-index: 3;
  filter: drop-shadow(0 0 20px ${COLORS.primarySalmon}60);
  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 90px;
  }
`;

const CardActions = styled.div`
  padding: 12px 16px 4px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => (props.liked ? COLORS.heartRed : COLORS.textTertiary)};
  font-size: 1.5rem;
  cursor: ${(props) =>
    props.disabled && !props.liked ? 'default' : 'pointer'};
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  /* Larger tap target on mobile */
  min-width: 44px;
  min-height: 44px;
  &:hover {
    transform: ${(props) =>
      !props.disabled || props.liked ? 'scale(1.12)' : 'none'};
    color: ${(props) =>
      !props.disabled && !props.liked ? COLORS.primarySalmon : ''};
  }
  &:active {
    transform: ${(props) =>
      !props.disabled || props.liked ? 'scale(0.9)' : 'none'};
  }
`;

const LikeIcon = styled.div`
  color: ${COLORS.heartRed};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
`;

const CommentButton = styled.button`
  color: ${COLORS.textTertiary};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  /* Larger tap target on mobile */
  min-width: 44px;
  min-height: 44px;
  &:hover {
    transform: scale(1.12);
    color: ${COLORS.primarySalmon};
  }
`;

const CommentCount = styled.span`
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
  font-weight: 500;
`;

const LikesCount = styled.div`
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 8px;
  strong {
    font-weight: 600;
  }
`;

const CardContent = styled.div`
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  background-color: ${COLORS.cardBackground};
`;

const PostTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 8px 0;
  line-height: 1.3;
  word-break: break-word;
`;

const Content = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 8px 0;
  word-break: break-word;
`;

const Caption = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 8px 0;
  word-break: break-word;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 12px;
`;

// ── CHANGED: font-size was 0.5rem (bug), now 0.75rem. Added mint left-border accent.
const Tag = styled.span`
  color: ${COLORS.textSecondary};
  font-size: 0.75rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 4px;
  background-color: ${COLORS.elevatedBackground};
  border-left: 2px solid ${COLORS.primaryMint};
  transition: all 0.2s ease;
  &:hover {
    background-color: ${COLORS.primaryMint}20;
    color: ${COLORS.accentMint};
    transform: translateY(-1px);
  }
`;

const ViewPostLink = styled(Link)`
  display: none;
`;

const ViewPostArrow = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  font-size: 16px;
  line-height: 1;
  ${ViewPostLink}:hover & {
    transform: translateX(4px);
  }
`;

const FullscreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.3s ease-out;
`;

const FullscreenWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const FullscreenImage = styled.img`
  max-width: 95%;
  max-height: 90%;
  object-fit: contain;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border-radius: 2px;
`;

const FullscreenIndicator = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
`;

const CloseFullscreenButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  height: 48px;
  width: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  &:active {
    background-color: ${COLORS.primaryMint}80;
    transform: scale(0.95);
  }
  &:hover {
    background-color: ${COLORS.primaryMint};
    transform: scale(1.05);
  }
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
  &:hover ${PostTitle} {
    color: ${COLORS.accentMint};
  }
`;

// ── CHANGED: salmon ring on avatar — gives every card a branded anchor point
const UserAvatarImage = styled.img`
  border: 2px solid ${COLORS.primarySalmon}60;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid ${COLORS.primarySalmon};
  box-shadow: 0 0 0 1px ${COLORS.background};
  transition: border-color 0.2s ease;
  &:hover {
    border-color: ${COLORS.accentSalmon};
  }
`;

const BurstWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 4;
`;

const BurstHeart = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: ${COLORS.heartRed};
  border-radius: 50%;
  opacity: 0;
  animation: ${(props) => burst(props.index)} 700ms ease forwards;
`;

const burst = (index) => keyframes`
  0% { transform: scale(0) translate(0, 0); opacity: 1; }
  80% {
    transform: scale(1) translate(${
      Math.cos((index / 8) * 2 * Math.PI) * 40
    }px, ${Math.sin((index / 8) * 2 * Math.PI) * 40}px);
    opacity: 1;
  }
  100% {
    transform: scale(0.5) translate(${
      Math.cos((index / 8) * 2 * Math.PI) * 50
    }px, ${Math.sin((index / 8) * 2 * Math.PI) * 50}px);
    opacity: 0;
  }
`;

const ReadMoreLink = styled(Link)`
  color: ${COLORS.accentSalmon};
  font-weight: 600;
  font-size: 0.8rem;
  text-decoration: none;
  margin-left: 4px;
  &:hover {
    color: ${COLORS.primarySalmon};
    text-decoration: underline;
  }
`;

const FullscreenNavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  z-index: 10;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  &:active {
    background-color: ${COLORS.primaryMint}80;
    transform: translateY(-50%) scale(0.95);
  }
  &:hover {
    opacity: 1;
    background-color: ${COLORS.primaryMint};
  }
  &.prev {
    left: 20px;
  }
  &.next {
    right: 20px;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background-color: rgba(0, 0, 0, 0.3);
  }
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const FullscreenProgressIndicator = styled.div`
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  z-index: 10;
`;

const FullscreenProgressDot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primaryMint : 'rgba(255, 255, 255, 0.5)'};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  &:hover {
    transform: scale(1.2);
    background-color: ${(props) =>
      props.active ? COLORS.accentMint : 'rgba(255, 255, 255, 0.8)'};
  }
  &:active {
    transform: scale(0.9);
  }
`;

const LocationBar = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background-color: ${COLORS.primaryKhaki}15;
  border-top: 1px solid ${COLORS.divider};
  border-bottom: 1px solid ${COLORS.divider};
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
  &:hover {
    background-color: ${COLORS.primaryKhaki}25;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: translateY(0);
    background-color: ${COLORS.primaryKhaki}35;
  }
`;

const LocationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: ${COLORS.primarySalmon};
  font-size: 14px;
  transition: all 0.2s ease;
  ${LocationBar}:hover & {
    color: ${COLORS.accentSalmon};
    transform: scale(1.1);
  }
`;

const LocationText = styled.div`
  font-size: 13px;
  color: ${COLORS.textSecondary};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
  ${LocationBar}:hover & {
    color: ${COLORS.textPrimary};
  }
`;

const LocationIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: ${COLORS.textTertiary};
  font-size: 10px;
  opacity: 0;
  transition: all 0.2s ease;
  transform: translateX(-4px);
  ${LocationBar}:hover & {
    opacity: 0.7;
    transform: translateX(0);
  }
`;

PostCard.displayName = 'PostCard';

export default PostCard;
