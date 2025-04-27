import {
  memo,
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from "react";
import { LikesContext } from "../../context/LikesContext";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { FaHeart, FaRegHeart } from "react-icons/fa/index.js";
import { FaEllipsisH } from "react-icons/fa/index.js";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa/index.js";
import { FaEdit, FaTrash } from "react-icons/fa/index.js";
import { FaCalendarAlt } from "react-icons/fa/index.js";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import { AuthContext } from "../../context/AuthContext";
import pandaImg from "../../assets/andy.jpg";
import { getTransformedImageUrl } from "../../utils/cloudinary";
import { COLORS, THEME } from "../../theme";

const AUTHOR_IMAGE = pandaImg;
const AUTHOR_NAME = "Andrew";

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

const shimmer = keyframes`
  0% { background-position: -100% 0 }
  100% { background-position: 200% 0 }
`;

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fontFaceStyles = css`
  @font-face {
    font-family: "ParadiseSignature";
    src: url("/src/assets/fonts/Paradise Signature.otf") format("opentype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Autography";
    src: url("/src/assets/fonts/Autography.otf") format("opentype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`;

const FullscreenModalComponent = ({ onClick, children }) => (
  <FullscreenModal onClick={onClick}>{children}</FullscreenModal>
);

const DeleteModalComponent = memo(({ onCancel, onDelete, post }) => (
  <DeleteModal>
    <DeleteModalContent>
      <h3>Delete Post</h3>
      <p>
        Are you sure you want to delete this post? This action cannot be undone.
      </p>
      <DeleteModalButtons>
        <CancelButton onClick={onCancel}>Cancel</CancelButton>
        <ConfirmDeleteButton onClick={onDelete}>
          Delete Post
        </ConfirmDeleteButton>
      </DeleteModalButtons>
    </DeleteModalContent>
    <Backdrop onClick={onCancel} />
  </DeleteModal>
));

const isMobile =
  typeof window !== "undefined" &&
  (window.innerWidth <= 768 ||
    window.matchMedia("(display-mode: standalone)").matches);

const PostCard = memo(({ post: initialPost, onDelete, index = 0 }) => {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [post, setPost] = useState(initialPost);
  const { isAuthenticated } = useContext(AuthContext);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
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

  const hasMultipleMedia = post.media && post.media.length > 1;
  const formattedDate = format(new Date(post.createdAt), "MMM d, yyyy");

  // Check if the user has already liked this post using the LikesContext
  useEffect(() => {
    if (isAuthenticated && post._id) {
      checkLikeStatus(post._id);
    }
  }, [isAuthenticated, post._id, checkLikeStatus]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) return;

    const options = {
      threshold: 0.1,
      rootMargin: "100px 0px",
    };

    const handleIntersection = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }
    };

    const observer = new IntersectionObserver(handleIntersection, options);

    if (cardRef.current && !isVisible) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      setIsPressing(true);

      longPressTimeoutRef.current = setTimeout(() => {
        setIsLongPressing(true);
        setShowFullscreen(true);
        setFullscreenIndex(currentMediaIndex);
      }, 500);
    },
    [currentMediaIndex]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPressing(false);

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const fullscreenSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (fullscreenIndex < post.media.length - 1) {
        setFullscreenIndex(fullscreenIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (fullscreenIndex > 0) {
        setFullscreenIndex(fullscreenIndex - 1);
      }
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

  // Updated handleLike with POST method instead of PUT
  const handleLike = useCallback(async () => {
    if (!isAuthenticated || isProcessing || hasLiked) return;

    likePost(post._id, () => {
      // On success callback, update the local post state
      setPost((prevPost) => ({
        ...prevPost,
        likes: (prevPost.likes || 0) + 1,
      }));
    });
  }, [post._id, isProcessing, hasLiked, isAuthenticated, likePost]);

  const handleDoubleTapLike = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!hasLiked && !isLiking) {
      handleLike();
    }
  }, [hasLiked, isLiking, handleLike, isAuthenticated]);

  const confirmDelete = useCallback(() => {
    setShowDeleteModal(true);
    setShowActions(false);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        if (typeof onDelete === "function") {
          onDelete(post._id);
        } else {
          console.warn("onDelete is not a function. Check parent component.");
        }
        setShowDeleteModal(false);
        toast.success("Post deleted successfully");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post");
      setShowDeleteModal(false);
    }
  }, [post._id, onDelete]);

  const handleNext = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (currentMediaIndex < post.media.length - 1) {
        setCurrentMediaIndex((prev) => prev + 1);
      }
    },
    [currentMediaIndex, post.media.length]
  );

  const handlePrev = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (currentMediaIndex > 0) {
        setCurrentMediaIndex((prev) => prev - 1);
      }
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

      if (hasMultipleMedia) {
        e.preventDefault();
      }
    },
    [isLongPressing, hasMultipleMedia]
  );

  return (
    <CardWrapper
      ref={cardRef}
      className={isVisible ? "visible" : ""}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      <Card>
        <CardHeader aria-label="Post header">
          <UserInfo>
            <UserAvatarImage
              src={AUTHOR_IMAGE}
              alt="Andrew's avatar"
              width="44"
              height="44"
              loading="eager"
            />
            <UsernameContainer>
              <Username className="autography-font">{AUTHOR_NAME}</Username>
              <DateBadge>
                <FaCalendarAlt />
                <span>{formattedDate}</span>
              </DateBadge>
            </UsernameContainer>
          </UserInfo>
          {isAuthenticated && (
            <ActionsContainer ref={actionsRef}>
              <ActionsButton
                onClick={() => setShowActions(!showActions)}
                aria-label="Post options"
              >
                <FaEllipsisH />
              </ActionsButton>
              {showActions && (
                <ActionsMenu>
                  <ActionItem as={Link} to={`/edit/${post._id}`}>
                    <FaEdit /> Edit Post
                  </ActionItem>
                  <ActionItem onClick={confirmDelete}>
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
          >
            <MediaCarousel {...swipeHandlers}>
              <MediaTrack currentIndex={currentMediaIndex}>
                {post.media.map((media, index) => (
                  <MediaItem key={index}>
                    {media.mediaType === "image" ? (
                      <PostImage
                        src={getTransformedImageUrl(media.mediaUrl, {
                          width: 614,
                          height: 614,
                          crop: "fill",
                          gravity: "auto:subject",
                          quality: "auto:good",
                          format: "auto",
                          dpr: "auto",
                          effect: "improve",
                          sharpen: 60,
                        })}
                        sizes="100vw"
                        alt={post.caption || "Post image"}
                        width="614"
                        height="614"
                        loading={
                          index === 0 && currentMediaIndex === 0
                            ? "eager"
                            : "lazy"
                        }
                        fetchpriority={
                          index === 0 && currentMediaIndex === 0
                            ? "high"
                            : "auto"
                        }
                        decoding="async"
                        className={media.filter}
                        onLoad={(e) => {
                          e.target.classList.add("loaded");
                        }}
                      />
                    ) : (
                      <PostVideo
                        src={media.mediaUrl}
                        controls
                        preload="metadata"
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
                  className="prev"
                  onClick={handlePrev}
                  disabled={currentMediaIndex === 0}
                  aria-label="Previous image"
                >
                  <FaChevronLeft />
                </NavigationArrow>
                <NavigationArrow
                  className="next"
                  onClick={handleNext}
                  disabled={currentMediaIndex === post.media.length - 1}
                  aria-label="Next image"
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
              <HeartAnimation>
                <FaHeart />
              </HeartAnimation>
            )}
          </MediaContainer>
        )}

        <CardActions>
          {/* Only show like button if user is authenticated */}
          {isAuthenticated && (
            <ActionGroup>
              <LikeButton
                onClick={handleLike}
                disabled={isProcessing || hasLiked}
                liked={hasLiked}
                processing={isProcessing}
                aria-label={hasLiked ? "Post liked" : "Like post"}
              >
                {hasLiked ? (
                  <FaHeart />
                ) : isProcessing ? (
                  <LoadingIcon />
                ) : (
                  <FaRegHeart />
                )}
              </LikeButton>
              <LikesCounter>
                <span>
                  {post.likes} {post.likes === 1 ? "like" : "likes"}
                </span>
              </LikesCounter>
            </ActionGroup>
          )}

          {/* If not authenticated, only show the likes count */}
          {!isAuthenticated && (
            <LikesCounterStandalone>
              <span>
                {post.likes} {post.likes === 1 ? "like" : "likes"}
              </span>
            </LikesCounterStandalone>
          )}
        </CardActions>

        <CardContent>
          <PostLink to={`/post/${post._id}`}>
            <PostTitle>{post.caption}</PostTitle>
            {post.content && <Content>{post.content}</Content>}
          </PostLink>

          {post.tags && post.tags.length > 0 && (
            <TagsContainer>
              {post.tags.map((tag, index) => (
                <Tag key={index}>#{tag}</Tag>
              ))}
            </TagsContainer>
          )}

          <ViewPostLink to={`/post/${post._id}`}>
            View Post
            <ViewPostArrow>→</ViewPostArrow>
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
                    crop: "fit",
                    gravity: "auto:subject",
                    quality: "auto:best",
                    format: "auto",
                    dpr: "auto",
                    effect: "improve",
                    sharpen: 70,
                  }
                )}
                alt={post.caption || "Fullscreen view"}
                style={{
                  transform: isZoomed ? "scale(2)" : "scale(1)",
                  transition: "transform 0.3s ease",
                }}
                loading="eager"
              />
              {post.media.length > 1 && (
                <FullscreenIndicator>
                  {fullscreenIndex + 1} / {post.media.length}
                </FullscreenIndicator>
              )}
            </FullscreenWrapper>
            <CloseFullscreenButton
              onClick={closeFullscreen}
              aria-label="Close fullscreen view"
            >
              ×
            </CloseFullscreenButton>
          </FullscreenModalComponent>
        </Suspense>
      )}

      {showDeleteModal && (
        <DeleteModalComponent
          onCancel={cancelDelete}
          onDelete={handleDelete}
          post={post}
        />
      )}
    </CardWrapper>
  );
});

// STYLED COMPONENTS
const LikesCounterStandalone = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  background-color: ${COLORS.elevatedBackground};
  padding: 8px 14px;
  border-radius: 20px;
  transition: all 0.2s ease;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin: 0 auto;

  span {
    position: relative;

    &:after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 1px;
      background-color: ${COLORS.accentTeal};
      transform-origin: left;
      transform: scaleX(0);
      transition: transform 0.3s ease;
      opacity: 0.8;
    }

    &:hover:after {
      transform: scaleX(1);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
`;

// Include all other styled components from the original file
const CardWrapper = styled.div`
  ${fontFaceStyles}
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;
  margin: 24px auto;
  transition: opacity 0.5s ease, transform 0.5s ease;
  animation: ${fadeIn} 0.6s ease-out;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.6));

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 94%;
    margin: 18px auto;
    padding: 0;
    max-width: 480px;
  }
`;

const Card = styled.article`
  position: relative;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px ${COLORS.shadow}, 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform, box-shadow;
  border: 3px solid ${COLORS.primaryTeal}; // More pronounced border
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-5px) scale(1.01);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 8px;
    border-width: 2px;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);

    &:active {
      transform: scale(0.99);
    }
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: ${COLORS.elevatedBackground};
  position: relative;
  border-bottom: 1px solid ${COLORS.border};

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background-color: ${COLORS.primaryTeal};
    opacity: 0.9;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 14px 16px;
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
  font-family: "Autography", cursive;
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 0.5px;
  margin: 0;
  line-height: 1.1;
  color: ${COLORS.textPrimary};
  transition: all 0.3s ease;

  &:hover {
    color: ${COLORS.accentTeal};
    text-shadow: 0 2px 8px ${COLORS.accentTeal}40;
  }
`;

const DateBadge = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textTertiary};
  font-size: 0.7rem;
  margin-top: 1px;
  font-weight: 500;

  svg {
    margin-right: 4px;
    font-size: 0.7rem;
    color: ${COLORS.accentTeal};
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
    background-color: rgba(0, 0, 0, 0.2);
    color: ${COLORS.accentTeal};
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  background-color: ${COLORS.cardBackground};
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  overflow: hidden;
  width: 180px;
  transform-origin: top right;
  animation: ${fadeIn} 0.2s ease-out;
  border: 1px solid ${COLORS.border};
`;

const ActionItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: ${COLORS.textPrimary};
  text-align: left;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: all 0.2s ease;

  svg {
    margin-right: 12px;
    font-size: 0.9rem;
    color: ${COLORS.textSecondary};
    transition: all 0.2s ease;
  }

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.accentTeal};

    svg {
      color: ${COLORS.accentTeal};
    }
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.divider};
  }
`;

const MediaContainer = styled(Link)`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  display: block;
  overflow: hidden;
  background-color: #000;
  transition: opacity 0.2s ease;
  opacity: ${(props) => (props.isPressing ? 0.9 : 1)};
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
  transition: opacity 0.5s ease, transform 0.5s ease;
  opacity: 0.98;

  &.loaded {
    opacity: 1;
  }

  ${MediaContainer}:hover & {
    transform: scale(1.02);
  }

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
    background-color: ${COLORS.primaryTeal};
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
    props.active ? COLORS.accentTeal : "rgba(255, 255, 255, 0.5)"};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.2);
    background-color: ${(props) =>
      props.active ? COLORS.accentTeal : "rgba(255, 255, 255, 0.8)"};
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 8px;
    height: 8px;

    &:active {
      transform: scale(0.9);
    }
  }
`;

const HeartAnimation = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${COLORS.accentTeal};
  font-size: 80px;
  opacity: 0;
  animation: ${scaleIn} 1s ease forwards;
  z-index: 3;
  filter: drop-shadow(0 0 15px rgba(0, 0, 0, 0.7));

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 90px;
  }
`;

const CardActions = styled.div`
  padding: 14px 16px 6px;
  background-color: ${COLORS.cardBackground};
  border-bottom: 1px solid ${COLORS.divider};
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => (props.liked ? COLORS.primaryTeal : COLORS.textTertiary)};
  font-size: 1.5rem;
  cursor: ${(props) =>
    props.disabled && !props.liked ? "default" : "pointer"};
  padding: 6px;
  margin-left: -6px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(1.15)" : "none"};
    color: ${(props) =>
      !props.disabled && !props.liked ? COLORS.accentTeal : ""};
  }

  &:active {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(0.9)" : "none"};
  }

  ${(props) =>
    props.liked &&
    css`
      filter: drop-shadow(0 0 10px rgba(33, 212, 199, 0.5));
    `}

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 1.6rem;

    ${(props) =>
      props.liked &&
      css`
        animation: ${pulse} 0.8s ease-in-out;
      `}
  }
`;

const LikesCounter = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  background-color: ${COLORS.elevatedBackground};
  padding: 8px 14px;
  border-radius: 20px;
  transition: all 0.2s ease;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  span {
    position: relative;

    &:after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 1px;
      background-color: ${COLORS.accentTeal};
      transform-origin: left;
      transform: scaleX(0);
      transition: transform 0.3s ease;
      opacity: 0.8;
    }

    &:hover:after {
      transform: scaleX(1);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
`;

const CardContent = styled.div`
  padding: 22px 16px 24px;
  display: flex;
  flex-direction: column;
  background-color: ${COLORS.cardBackground};
`;

const PostTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 12px 0;
  line-height: 1.4;
  word-break: break-word;
  transition: color 0.2s ease;
  letter-spacing: -0.01em;
`;

const Content = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 8px 0;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.2s ease;
  letter-spacing: 0.01em;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 16px;
`;

const Tag = styled.span`
  color: ${COLORS.textPrimary};
  font-size: 0.8rem;
  transition: all 0.2s ease;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  background-color: ${COLORS.buttonHover};

  &:hover {
    background-color: ${COLORS.primaryTeal}30;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ViewPostLink = styled(Link)`
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 16px;
  text-decoration: none;
  align-self: center;
  padding: 10px 18px;
  border-radius: 4px;
  transition: all 0.25s ease;
  background-color: ${COLORS.primaryTeal};
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  box-shadow: 0 4px 12px ${COLORS.primaryTeal}40;

  &:hover {
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: 0 6px 14px ${COLORS.primaryTeal}60;
    background-color: ${COLORS.accentTeal};
  }

  &:before {
    content: "";
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border: 1px solid ${COLORS.accentTeal}40;
    border-radius: 6px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:before {
    opacity: 1;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 0.85rem;
    padding: 10px 18px;
    border-radius: 4px;
    align-self: center;

    &:active {
      transform: translateY(2px);
      box-shadow: 0 2px 6px ${COLORS.primaryTeal}40;
    }
  }
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

const DeleteModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DeleteModalContent = styled.div`
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  padding: 28px;
  width: 90%;
  max-width: 380px;
  z-index: 1001;
  text-align: center;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
  border: 2px solid ${COLORS.border};

  h3 {
    color: ${COLORS.textPrimary};
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 600;
    font-size: 1.3rem;
  }

  p {
    color: ${COLORS.textSecondary};
    margin-bottom: 24px;
    font-size: 1rem;
    line-height: 1.5;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 8px;
    padding: 24px 20px;

    h3 {
      font-size: 1.4rem;
      margin-bottom: 20px;
    }

    p {
      font-size: 1rem;
      margin-bottom: 30px;
    }

    animation: ${slideIn} 0.3s ease-out forwards;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column-reverse;
    gap: 10px;
  }
`;

const CancelButton = styled.button`
  background: none;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: ${COLORS.error};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background-color: ${COLORS.error}ee;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(207, 102, 121, 0.3);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
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

  &:hover {
    background-color: ${COLORS.primaryTeal};
    transform: scale(1.05);
  }
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;

  &:hover ${PostTitle} {
    color: ${COLORS.accentTeal};
  }
`;

const UserAvatarImage = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 14px;
  border: 3px solid ${COLORS.primaryTeal};
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 0 15px ${COLORS.primaryTeal}80;
  }
`;

PostCard.displayName = "PostCard";

export default PostCard;
