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
  const [hasLiked, setHasLiked] = useState(false);
  const [isDoubleTapLiking, setIsDoubleTapLiking] = useState(false);
  const actionsRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const longPressTimeoutRef = useRef(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const hasMultipleMedia = post.media && post.media.length > 1;
  const formattedDate = format(new Date(post.createdAt), "MMM d, yyyy");

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

  const handleLike = useCallback(async () => {
    if (isLiking || hasLiked) return;

    setIsLiking(true);

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        setPost((prevPost) => ({ ...prevPost, likes: prevPost.likes + 1 }));
        setHasLiked(true);
      }
    } catch (err) {
      console.error("Error liking post:", err);

      if (err.message?.includes("already liked")) {
        setHasLiked(true);
        toast.error(err.message);
      } else {
        toast.error("Failed to like post");
        setTimeout(() => setIsLiking(false), 2000);
      }
    }
  }, [post._id, isLiking, hasLiked]);

  const handleDoubleTapLike = useCallback(() => {
    if (!hasLiked && !isLiking) {
      setIsDoubleTapLiking(true);
      handleLike();

      setTimeout(() => {
        setIsDoubleTapLiking(false);
      }, 1000);
    }
  }, [hasLiked, isLiking, handleLike]);

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
            <Username className="paradise-font">{AUTHOR_NAME}</Username>
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
                          crop: "thumb",
                          quality: "auto",
                          format: "webp",
                          gravity: "auto",
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
                <IndicatorDots>
                  {post.media.map((_, index) => (
                    <Dot
                      key={index}
                      active={index === currentMediaIndex}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentMediaIndex(index);
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </IndicatorDots>
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
          <ActionGroup>
            <LikeButton
              onClick={handleLike}
              disabled={isLiking || hasLiked}
              liked={hasLiked}
              aria-label={hasLiked ? "Post liked" : "Like post"}
            >
              {hasLiked ? <FaHeart /> : <FaRegHeart />}
            </LikeButton>
            <DateDisplay>
              <FaCalendarAlt />
              <span>{formattedDate}</span>
            </DateDisplay>
          </ActionGroup>
        </CardActions>

        <LikesCounter>
          <strong>
            {post.likes} {post.likes === 1 ? "like" : "likes"}
          </strong>
        </LikesCounter>

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

          <ViewPostLink to={`/post/${post._id}`}>View post</ViewPostLink>
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
                    quality: "auto",
                    format: "webp",
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

const CardWrapper = styled.div`
  ${fontFaceStyles}
  width: 100%;
  display: flex;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid ${COLORS.primaryPurple}30;
  padding: 10px;
  margin: 10px 0;
  background: ${COLORS.background}50;
  transition: opacity 0.4s ease, transform 0.4s ease, box-shadow 0.3s ease;
  will-change: transform, opacity;
  contain: layout;

  &:hover {
    box-shadow: 0 0 20px ${COLORS.primaryPurple}20;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }
`;

const Card = styled.article`
  background-color: ${THEME.post.background};
  border-radius: 12px;
  border: 1px solid ${THEME.post.border};
  overflow: hidden;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 614px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  will-change: transform;
  contain: content;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    max-width: 100%;
    width: 100vw;
    border-radius: 0;
    margin-bottom: 0;
    border-left: none;
    border-right: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    background: linear-gradient(
      160deg,
      ${THEME.post.background} 0%,
      ${COLORS.cardBackground} 100%
    );

    &:active {
      transform: scale(0.99);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid ${COLORS.divider};
  background-color: ${THEME.post.header};

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 16px;
    background: linear-gradient(
      90deg,
      ${THEME.post.header} 0%,
      ${COLORS.primaryPurple}20 50%,
      ${THEME.post.header} 100%
    );
    border-radius: 0;
    border-bottom: 1px solid ${COLORS.primaryPurple}30;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const ActionsContainer = styled.div`
  position: relative;
`;

const Username = styled.span`
  font-family: "Autography", cursive;
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 0.8px;
  line-height: 1.3;
  margin-top: 2px;
  color: ${COLORS.primaryPurple};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, filter 0.3s ease;
  will-change: transform, filter;

  &:hover {
    transform: scale(1.08);
    filter: brightness(1.2);
  }
`;

const ActionsButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 1.1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s, transform 0.2s;

  &:hover {
    background-color: ${COLORS.elevatedBackground};
    transform: scale(1.1);
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 10;
  overflow: hidden;
  width: 180px;
  backdrop-filter: blur(5px);
`;

const ActionItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: ${COLORS.textPrimary};
  text-align: left;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${COLORS.primaryPurple}30;
    color: ${COLORS.accentPurple};
  }

  svg {
    margin-right: 12px;
    color: ${COLORS.textSecondary};
  }

  &:hover svg {
    color: ${COLORS.accentPurple};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.divider};
  }
`;

const MediaContainer = styled(Link)`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: block;
  overflow: hidden;
  background-color: #000;
  flex-shrink: 0;
  transition: opacity 0.2s ease, transform 0.3s ease;
  opacity: ${(props) => (props.isPressing ? 0.8 : 1)};
  will-change: transform, opacity;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 0;
    box-shadow: none;
    width: 100%;

    &:active {
      transform: scale(0.98);
    }
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
  transition: transform 0.3s ease;
  will-change: transform;
  transform: translateX(-${(props) => props.currentIndex * 100}%);
  contain: layout;
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
  contain: content;
`;

const PostImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  will-change: transform;
  opacity: 0.6;

  &.loaded {
    opacity: 1;
  }

  &.filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale {
    filter: grayscale(1);
  }

  &.filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }
`;

const PostVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale {
    filter: grayscale(1);
  }

  &.filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }
`;

const NavigationArrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(60, 40, 90, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s, transform 0.2s;
  z-index: 2;
  will-change: transform, opacity;

  &:hover {
    opacity: 0.95 !important;
    background-color: ${COLORS.primaryPurple}A0;
    transform: translateY(-50%) scale(1.1);
  }

  ${Card}:hover & {
    opacity: 0.8;
  }

  &.prev {
    left: 16px;
  }

  &.next {
    right: 16px;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    opacity: 0.9;
    width: 46px;
    height: 46px;
    background: ${COLORS.primaryPurple}99;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);

    &:active {
      opacity: 1;
      transform: translateY(-50%) scale(0.95);
      background-color: ${COLORS.primaryPurple};
    }

    &.prev {
      left: 10px;
    }

    &.next {
      right: 10px;
    }

    svg {
      font-size: 1.2rem;
    }
  }
`;

const IndicatorDots = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 2;
`;

const Dot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primaryPurple : "rgba(255, 255, 255, 0.4)"};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);

  &:hover {
    transform: scale(1.2);
    background-color: ${(props) =>
      props.active ? COLORS.accentPurple : "rgba(255, 255, 255, 0.6)"};
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 12px;
    height: 12px;
    margin: 0 2px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);

    ${(props) =>
      props.active &&
      `
      background-color: ${COLORS.primaryPurple};
      box-shadow: 0 0 8px ${COLORS.primaryPurple}90;
    `}

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
  color: ${COLORS.primaryPurple};
  font-size: 90px;
  opacity: 0;
  animation: ${scaleIn} 1s ease forwards;
  z-index: 3;
  will-change: transform, opacity;

  svg {
    filter: drop-shadow(0 0 12px rgba(0, 0, 0, 0.6));
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 120px;
    color: ${COLORS.accentPurple};

    svg {
      filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.8));
    }
  }
`;

const CardActions = styled.div`
  padding: 10px 18px;
  border-bottom: 1px solid ${COLORS.divider};
  background-color: ${THEME.post.footer};
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  color: ${(props) =>
    props.liked ? COLORS.primaryPurple : COLORS.textPrimary};
  font-size: 1.6rem;
  cursor: ${(props) =>
    props.disabled && !props.liked ? "default" : "pointer"};
  padding: 8px;
  margin-left: -8px;
  display: flex;
  align-items: center;
  transition: transform 0.3s, color 0.3s;
  will-change: transform;

  &:hover {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(1.15)" : "none"};
    color: ${(props) =>
      !props.disabled && !props.liked ? COLORS.accentPurple : ""};
  }

  &:active {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(0.9)" : "none"};
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 1.8rem;
    padding: 10px;
    position: relative;

    ${(props) =>
      props.liked &&
      `
      animation: ${pulse} 0.8s ease-in-out;
      filter: drop-shadow(0 0 8px ${COLORS.primaryPurple}90);
    `}

    &:active {
      transform: ${(props) =>
        !props.disabled || props.liked ? "scale(0.8)" : "none"};
    }
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  background-color: ${COLORS.cardBackground}90;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  svg {
    margin-right: 6px;
    font-size: 0.8rem;
    color: ${COLORS.accentPurple};
  }
`;

const LikesCounter = styled.div`
  padding: 8px 18px 0;
  margin-top: 4px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
`;

const CardContent = styled.div`
  padding: 1.2rem 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    ${THEME.post.background} 0%,
    ${COLORS.cardBackground} 100%
  );
  border-top: 1px solid ${COLORS.divider}40;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 1rem 1rem 1.2rem;
    background: linear-gradient(
      160deg,
      ${THEME.post.background} 0%,
      ${COLORS.cardBackground}EE 100%
    );
    border-top: 1px solid ${COLORS.primaryPurple}20;
    border-radius: 0;
  }
`;

const PostTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 14px 0;
  line-height: 1.3;
  word-break: break-word;
  transition: transform 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  will-change: transform;
`;

const Content = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  margin: 10px 0;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: transform 0.2s ease;
  will-change: transform;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0 8px;
`;

const Tag = styled.span`
  color: ${COLORS.accentBlue};
  font-size: 0.85rem;
  transition: color 0.2s ease, transform 0.2s ease;
  will-change: transform;

  &:hover {
    color: ${COLORS.primaryBlue};
    transform: translateX(2px);
  }
`;

const ViewPostLink = styled(Link)`
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  margin-top: 12px;
  text-decoration: none;
  align-self: flex-end;
  padding: 4px 10px;
  border-radius: 12px;
  transition: all 0.2s ease;
  background-color: ${COLORS.elevatedBackground}50;
  will-change: transform;

  &:hover {
    text-decoration: none;
    color: ${COLORS.textPrimary};
    background-color: ${COLORS.elevatedBackground};
    transform: translateY(-2px);
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 0.9rem;
    padding: 8px 14px;
    border-radius: 20px;
    font-weight: 500;
    background: linear-gradient(
      135deg,
      ${COLORS.primaryPurple}80 0%,
      ${COLORS.primaryPurple}40 100%
    );
    color: ${COLORS.textPrimary};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    margin-top: 16px;
    align-self: center;

    &:active {
      transform: translateY(2px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
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
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  padding: 28px;
  width: 90%;
  max-width: 400px;
  z-index: 1001;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  border: 1px solid ${COLORS.divider};
  will-change: transform, opacity;

  h3 {
    color: ${COLORS.textPrimary};
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 600;
  }

  p {
    color: ${COLORS.textSecondary};
    margin-bottom: 24px;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 16px;
    padding: 24px 20px;
    background: linear-gradient(
      145deg,
      ${COLORS.cardBackground} 0%,
      ${COLORS.elevatedBackground} 100%
    );
    border: 1px solid ${COLORS.primaryPurple}30;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7),
      inset 0 1px 1px ${COLORS.primaryPurple}20;

    h3 {
      font-size: 1.3rem;
      margin-bottom: 20px;
      color: ${COLORS.accentPurple};
    }

    p {
      font-size: 1.05rem;
      margin-bottom: 30px;
    }

    animation: ${slideIn} 0.3s ease-out forwards;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CancelButton = styled.button`
  background: none;
  color: ${COLORS.primaryBlue};
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;

  &:hover {
    background-color: ${COLORS.primaryBlue}20;
  }
`;

const ConfirmDeleteButton = styled.button`
  background: none;
  color: ${COLORS.error};
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  border-top: 1px solid ${COLORS.divider};

  &:hover {
    background-color: ${COLORS.error}20;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(3px);
  z-index: 1000;
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;

  &:hover ${PostTitle} {
    transform: translateX(3px);
    color: ${COLORS.textPrimary};
  }

  &:hover ${Content} {
    transform: translateX(3px);
  }
`;

const UserAvatarImage = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid ${COLORS.primaryPurple};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, border-color 0.3s ease;
  will-change: transform;

  &:hover {
    transform: scale(1.08);
    border-color: ${COLORS.accentPurple};
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
  backdrop-filter: blur(10px);
`;

const FullscreenImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
`;

const CloseFullscreenButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${COLORS.elevatedBackground}80;
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
  height: 50px;
  width: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  will-change: transform;

  &:hover {
    background: ${COLORS.elevatedBackground};
    transform: scale(1.1);
  }
`;

const FullscreenWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const FullscreenIndicator = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${COLORS.elevatedBackground}CC;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

PostCard.displayName = "PostCard";

export default PostCard;
