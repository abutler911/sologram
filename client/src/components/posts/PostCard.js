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
          <span>
            {post.likes} {post.likes === 1 ? "like" : "likes"}
          </span>
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
  max-width: 600px;
  display: flex;
  justify-content: center;
  border-radius: 16px;
  margin: 24px auto;
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  animation: ${fadeIn} 0.6s ease-out;
  contain: layout;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 94%;
    margin: 14px auto;
    padding: 0;
    max-width: 480px;
  }
`;

const Card = styled.article`
  position: relative;
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  border: 1px solid rgba(203, 213, 224, 0.4);
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1),
    box-shadow 0.3s ease-in-out;
  will-change: transform, box-shadow;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.1),
      ${COLORS.primaryBlue}10,
      ${COLORS.primaryTeal}15
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: source-out;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);

    &::after {
      background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0.2),
        ${COLORS.primaryBlue}20,
        ${COLORS.primaryTeal}30
      );
    }
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 12px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03);
    background: linear-gradient(
      160deg,
      ${COLORS.cardBackground} 0%,
      ${COLORS.elevatedBackground}80 100%
    );

    &:active {
      transform: scale(0.99);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(
    to bottom,
    rgba(26, 95, 122, 0.08),
    rgba(26, 95, 122, 0.03) 80%,
    rgba(26, 95, 122, 0.01)
  );
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      to right,
      ${COLORS.primaryBlue},
      ${COLORS.primaryTeal},
      ${COLORS.primaryGreen}
    );
    border-radius: 3px 3px 0 0;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 14px 16px;
    background: linear-gradient(
      to bottom,
      rgba(26, 95, 122, 0.12),
      rgba(26, 95, 122, 0.05) 80%,
      rgba(26, 95, 122, 0.01)
    );
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-bottom: 1px solid rgba(26, 95, 122, 0.15);
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
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 0.8px;
  line-height: 1;
  margin-top: 2px;
  color: ${COLORS.primaryBlue};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  will-change: transform, filter;

  &:hover {
    transform: scale(1.05) translateY(-1px);
    filter: brightness(1.15);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
`;

const ActionsButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background-color: rgba(226, 232, 240, 0.5);
    color: ${COLORS.primaryBlue};
    transform: scale(1.1);
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  right: 0;
  top: 38px;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.06);
  z-index: 10;
  overflow: hidden;
  width: 180px;
  transform-origin: top right;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ActionItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: ${COLORS.textSecondary};
  text-align: left;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;

  svg {
    margin-right: 12px;
    font-size: 0.9rem;
    color: ${COLORS.textSecondary};
    transition: all 0.2s ease;
  }

  &:hover {
    background-color: ${COLORS.primaryBlue}08;
    color: ${COLORS.primaryBlue};

    svg {
      color: ${COLORS.primaryBlue};
      transform: scale(1.1);
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
  background-color: rgba(0, 0, 0, 0.03);
  transition: opacity 0.2s ease;
  opacity: ${(props) => (props.isPressing ? 0.85 : 1)};
  will-change: transform, opacity;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 0;

    &:active {
      transform: scale(0.99);
    }
  }
`;

const MediaCarousel = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.01) 0%,
    rgba(0, 0, 0, 0.05) 100%
  );
`;

const MediaTrack = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #f8f9fa05, #e2e8f005);
`;

const PostImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  opacity: 0.92;
  transform: scale(1.01);
  will-change: opacity, transform;

  &.loaded {
    opacity: 1;
  }

  ${MediaContainer}:hover & {
    transform: scale(1.03);
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
  background-color: rgba(24, 92, 120, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 2;
  will-change: transform, opacity;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

  &:hover {
    opacity: 1 !important;
    background-color: ${COLORS.primaryBlue}cc;
    transform: translateY(-50%) scale(1.1);
  }

  ${MediaContainer}:hover & {
    opacity: 0.85;
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
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    opacity: 0.7;
    width: 36px;
    height: 36px;
    background: ${COLORS.primaryBlue}bb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:active {
      opacity: 1;
      transform: translateY(-50%) scale(0.95);
      background-color: ${COLORS.primaryBlue};
    }

    &:disabled {
      opacity: 0.2;
      background: rgba(60, 60, 70, 0.4);
    }

    &.prev {
      left: 8px;
    }

    &.next {
      right: 8px;
    }

    svg {
      font-size: 1rem;
    }
  }
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
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.35)"};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(props) =>
      props.active
        ? `linear-gradient(90deg, ${COLORS.primaryTeal}80, ${COLORS.primaryBlue}80)`
        : "transparent"};
    opacity: ${(props) => (props.active ? 1 : 0)};
    transition: opacity 0.2s ease;
  }

  &:hover {
    transform: scale(1.3);
    background-color: rgba(255, 255, 255, 1);

    &:after {
      opacity: 1;
    }
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 7px;
    height: 7px;
    margin: 0 1px;

    ${(props) =>
      props.active &&
      `
      transform: scale(1.2);
      box-shadow: 0 0 6px ${COLORS.primaryTeal}90;
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
  color: ${COLORS.primaryTeal};
  font-size: 72px;
  opacity: 0;
  animation: ${scaleIn} 1s ease forwards;
  z-index: 3;
  will-change: transform, opacity;
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.5));

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 90px;
    color: ${COLORS.accentTeal};

    svg {
      filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.5));
    }
  }
`;

const CardActions = styled.div`
  padding: 12px 16px 8px;
  border-bottom: 1px solid ${COLORS.divider}80;
  background-color: ${COLORS.cardBackground};
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
    props.liked ? COLORS.primaryTeal : COLORS.textSecondary};
  font-size: 1.4rem;
  cursor: ${(props) =>
    props.disabled && !props.liked ? "default" : "pointer"};
  padding: 6px;
  margin-left: -6px;
  display: flex;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform, color;

  &:hover {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(1.15)" : "none"};
    color: ${(props) =>
      !props.disabled && !props.liked ? COLORS.primaryTeal : ""};
  }

  &:active {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(0.9)" : "none"};
  }

  ${(props) =>
    props.liked &&
    `
    filter: drop-shadow(0 0 2px ${COLORS.primaryTeal}50);
  `}

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 1.5rem;
    padding: 6px;
    position: relative;

    ${(props) =>
      props.liked &&
      `
      animation: ${pulse} 0.8s ease-in-out;
      filter: drop-shadow(0 0 4px ${COLORS.primaryTeal}70);
    `}

    &:active {
      transform: ${(props) =>
        !props.disabled || props.liked ? "scale(0.85)" : "none"};
    }
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  background-color: ${COLORS.elevatedBackground}50;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  svg {
    margin-right: 6px;
    font-size: 0.75rem;
    color: ${COLORS.textSecondary};
  }

  &:hover {
    background-color: ${COLORS.elevatedBackground}80;
    transform: translateY(-1px);
  }
`;

const LikesCounter = styled.div`
  padding: 6px 16px 0;
  margin-top: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${COLORS.textSecondary};

  span {
    position: relative;

    &:after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, ${COLORS.primaryTeal}30, transparent);
      transform-origin: left;
      transform: scaleX(0);
      transition: transform 0.3s ease;
      opacity: 0;
    }

    &:hover:after {
      transform: scaleX(1);
      opacity: 1;
    }
  }
`;

const CardContent = styled.div`
  padding: 1.2rem 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    ${COLORS.cardBackground} 0%,
    ${COLORS.elevatedBackground}40 100%
  );
  border-top: 1px solid ${COLORS.divider}20;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 1rem 1rem 1.2rem;
    background: linear-gradient(
      160deg,
      ${COLORS.cardBackground} 0%,
      ${COLORS.elevatedBackground}80 100%
    );
    border-top: 1px solid ${COLORS.primaryBlue}10;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
`;

const PostTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 12px 0;
  line-height: 1.4;
  word-break: break-word;
  transition: transform 0.3s ease, color 0.2s ease;
  will-change: transform;
  position: relative;
  letter-spacing: -0.01em;
`;

const Content = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 8px 0;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: transform 0.2s ease;
  letter-spacing: 0.01em;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 8px;
`;

const Tag = styled.span`
  color: ${COLORS.primaryBlue};
  font-size: 0.75rem;
  transition: all 0.2s ease;
  will-change: transform;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${COLORS.primaryBlue}08;

  &:hover {
    color: ${COLORS.primaryTeal};
    transform: translateX(2px) translateY(-1px);
    background-color: ${COLORS.primaryBlue}12;
  }
`;

const ViewPostLink = styled(Link)`
  color: ${COLORS.textSecondary};
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 14px;
  text-decoration: none;
  align-self: flex-end;
  padding: 5px 14px;
  border-radius: 30px;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background-color: ${COLORS.elevatedBackground}70;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    text-decoration: none;
    color: white;
    background: linear-gradient(
      90deg,
      ${COLORS.primaryBlue},
      ${COLORS.primaryTeal}
    );
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(13, 115, 119, 0.2);

    &:before {
      left: 200%;
      transition: left 0.8s ease-in-out;
    }
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    font-size: 0.82rem;
    padding: 6px 16px;
    border-radius: 30px;
    font-weight: 500;
    background: linear-gradient(
      90deg,
      ${COLORS.primaryBlue}90,
      ${COLORS.primaryTeal}90
    );
    color: white;
    box-shadow: 0 2px 6px rgba(26, 95, 122, 0.2);
    margin-top: 16px;
    align-self: center;

    &:active {
      transform: translateY(2px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
`;

const ViewPostArrow = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  font-size: 14px;
  line-height: 1;
  margin-top: 1px;

  ${ViewPostLink}:hover & {
    transform: translateX(3px);
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
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 380px;
  z-index: 1001;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  border: 1px solid ${COLORS.divider};
  will-change: transform, opacity;
  animation: ${fadeIn} 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  position: relative;

  &:after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.8),
      rgba(255, 255, 255, 0.1)
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: source-out;
    pointer-events: none;
  }

  h3 {
    color: ${COLORS.textPrimary};
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 600;
    font-size: 1.25rem;
  }

  p {
    color: ${COLORS.textSecondary};
    margin-bottom: 24px;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    border-radius: 16px;
    padding: 24px 20px;
    background: linear-gradient(
      145deg,
      ${COLORS.cardBackground} 0%,
      ${COLORS.elevatedBackground}40 100%
    );
    border: 1px solid ${COLORS.primaryBlue}20;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);

    h3 {
      font-size: 1.3rem;
      margin-bottom: 20px;
      color: ${COLORS.primaryBlue};
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
  }
`;

const CancelButton = styled.button`
  background: none;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.divider};
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.primaryBlue};
  }

  @media (max-width: 480px) {
    margin-top: 8px;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: ${COLORS.error}10;
  color: ${COLORS.error};
  border: 1px solid ${COLORS.error}40;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background-color: ${COLORS.error};
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(224, 36, 36, 0.2);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
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
  backdrop-filter: blur(10px);
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border-radius: 2px;
`;

const FullscreenIndicator = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CloseFullscreenButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 26px;
  cursor: pointer;
  height: 42px;
  width: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  will-change: transform;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(26, 95, 122, 0.7);
    transform: scale(1.05);
  }
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;

  &:hover ${PostTitle} {
    transform: translateX(3px);
    color: ${COLORS.primaryBlue};
  }

  &:hover ${Content} {
    transform: translateX(3px);
  }
`;

const UserAvatarImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  border: 2px solid ${COLORS.primaryTeal}40;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  will-change: transform;

  &:hover {
    transform: scale(1.08);
    border-color: ${COLORS.primaryTeal};
    box-shadow: 0 3px 10px rgba(13, 115, 119, 0.25);
  }
`;

PostCard.displayName = "PostCard";

export default PostCard;
