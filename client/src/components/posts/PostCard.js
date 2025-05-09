import {
  memo,
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { LikesContext } from "../../context/LikesContext";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { FaHeart, FaRegHeart, FaComment } from "react-icons/fa";
import { FaEllipsisH } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FaEdit, FaTrash } from "react-icons/fa";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import { AuthContext } from "../../context/AuthContext";
import pandaImg from "../../assets/andy.jpg";
import { getTransformedImageUrl } from "../../utils/cloudinary";
import { COLORS } from "../../theme";

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

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fontFaceStyles = css`
  @font-face {
    font-family: "ParadiseSignature";
    src: url("/fonts/Paradise Signature.otf") format("opentype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Autography";
    src: url("/fonts/Autography.woff2") format("woff2"),
      url("/fonts/Autography.woff") format("woff"),
      url("/fonts/Autography.ttf") format("truetype");
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

const PostCard = memo(({ post: initialPost, onDelete, onLike, index = 0 }) => {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [post, setPost] = useState(initialPost);
  const { isAuthenticated } = useContext(AuthContext);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
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
      // Clear any previous timeout to prevent multiple handlers
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }

      setIsPressing(true);

      // Set a shorter timeout for the long press detection
      longPressTimeoutRef.current = setTimeout(() => {
        setIsLongPressing(true);
        setShowFullscreen(true);
        setFullscreenIndex(currentMediaIndex);
      }, 300); // Reduced from 500ms to 300ms for quicker response
    },
    [currentMediaIndex]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      // Prevent default to stop any potential click events if we detected a long press
      if (isLongPressing) {
        e.preventDefault();
      }

      setIsPressing(false);

      // Clear the timeout to prevent it from firing after touch has ended
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }

      setIsLongPressing(false);
    },
    [isLongPressing]
  );

  const handleTouchMove = useCallback((e) => {
    // If user moves finger, cancel the long press
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
    if (!isAuthenticated || isProcessing || hasLiked) return;

    likePost(post._id, () => {
      // Update local post state
      setPost((prevPost) => ({
        ...prevPost,
        likes: (prevPost.likes || 0) + 1,
      }));

      // Also inform the parent if provided
      if (typeof onLike === "function") {
        onLike(post._id);
      }

      console.log("[LIKE] Like registered and like count updated.");
    });
  }, [post._id, isProcessing, hasLiked, isAuthenticated, likePost, onLike]);

  const handleDoubleTapLike = useCallback(() => {
    if (!isAuthenticated) return;

    if (!hasLiked && !isLiking) {
      handleLike();
    }

    setIsDoubleTapLiking(true);
    setTimeout(() => setIsDoubleTapLiking(false), 700);
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
      // Get the token
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      // Get the API base URL from the environment or use the default
      const baseURL = process.env.REACT_APP_API_URL || "";

      // Construct the proper URL - if baseURL is empty, it'll use a relative path
      const url = baseURL
        ? `${baseURL}/api/posts/${post._id}`
        : `/api/posts/${post._id}`;

      console.log(`Attempting to delete post with ID: ${post._id}`);
      console.log(`Using URL: ${url}`);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Add credentials to ensure cookies are sent with the request
        credentials: "include",
      });

      console.log(`Delete response status: ${response.status}`);

      if (response.ok) {
        // Call parent's onDelete if it exists
        if (typeof onDelete === "function") {
          onDelete(post._id);
        } else {
          console.warn("onDelete is not a function. Check parent component.");
        }

        // Close modal and show success message
        setShowDeleteModal(false);
        toast.success("Post deleted successfully");

        // Refresh the window
        window.location.reload();
      } else {
        // Try to parse error response
        let errorMessage = "Delete failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response isn't JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (e2) {
            // If we can't get text either, just use status
            errorMessage = `Delete failed: ${response.status}`;
          }
        }

        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
        });

        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(err.message || "Failed to delete post");
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
            isLoading={isLoading}
          >
            <MediaCarousel {...swipeHandlers}>
              <MediaTrack currentIndex={currentMediaIndex}>
                {post.media.map((media, index) => (
                  <MediaItem key={index}>
                    {media.mediaType === "image" ? (
                      <PostImage
                        src={getTransformedImageUrl(media.mediaUrl, {
                          width: 1080,
                          height: 1080,
                          crop: "fill",
                          gravity: "auto",
                          quality: "auto:good",
                          format: "auto",
                          dpr: "auto",
                          effect: "improve:outdoor:10",
                          color_adjustment: "saturation:10",
                          sharpen: 15,
                          flags: "progressive",
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
                          setIsLoading(false);
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

        <CardActions>
          <ActionButtons>
            {isAuthenticated ? (
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
            ) : (
              <LikeIcon>
                <FaHeart />
              </LikeIcon>
            )}

            <CommentButton to={`/post/${post._id}`}>
              <FaComment />
            </CommentButton>
          </ActionButtons>

          <LikesCount>
            <strong>{post.likes}</strong> {post.likes === 1 ? "like" : "likes"}
          </LikesCount>
        </CardActions>

        <CardContent>
          <PostLink to={`/post/${post._id}`}>
            <PostTitle>{post.caption}</PostTitle>
            {post.content && (
              <Content>
                {post.content.length > 220 ? (
                  <>
                    {post.content.slice(0, 220)}...
                    <ReadMoreLink to={`/post/${post._id}`}>
                      read more
                    </ReadMoreLink>
                  </>
                ) : (
                  post.content
                )}
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
                    crop: "limit",
                    quality: "auto:best",
                    format: "auto",
                    effect: "improve:outdoor:10",
                    color_adjustment: "saturation:5",
                  }
                )}
                alt={post.caption || "Fullscreen view"}
                style={{
                  transform: isZoomed ? "scale(2)" : "scale(1)",
                  transition: "transform 0.3s ease",
                }}
                loading="eager"
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  e.target.src = post.media[fullscreenIndex].mediaUrl;
                }}
              />

              {/* Add navigation buttons if there are multiple media items */}
              {post.media.length > 1 && (
                <>
                  <FullscreenNavButton
                    className="prev"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal from closing
                      if (fullscreenIndex > 0) {
                        setFullscreenIndex((prev) => prev - 1);
                      }
                    }}
                    disabled={fullscreenIndex === 0}
                    aria-label="Previous image"
                  >
                    <FaChevronLeft />
                  </FullscreenNavButton>

                  <FullscreenNavButton
                    className="next"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal from closing
                      if (fullscreenIndex < post.media.length - 1) {
                        setFullscreenIndex((prev) => prev + 1);
                      }
                    }}
                    disabled={fullscreenIndex === post.media.length - 1}
                    aria-label="Next image"
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

              {/* Add dots indicator for multiple images */}
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
const CardWrapper = styled.div`
  ${fontFaceStyles}
  background-color: transparent;
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  padding-bottom: 16px;
  transition: opacity 0.5s ease;
  animation: ${fadeIn} 0.6s ease-out;
  filter: none;
  border-radius: 0;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    width: 100%;
    margin: 0 auto;
    padding: 0 0 12px 0;
    max-width: 100%;
  }
`;

const Card = styled.article`
  position: relative;
  background-color: transparent;
  border-radius: 0;
  overflow: visible;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: none;
  transition: none;
  border: none;

  &:before {
    display: none;
  }

  &:hover {
    transform: none;
    box-shadow: none;
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: transparent;
  position: relative;
  border-bottom: none;

  &:before {
    display: none;
  }

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
  font-family: "Autography", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 0.2px;
  margin: 0;
  line-height: 1.1;
  color: ${COLORS.textPrimary};

  &:hover {
    color: ${COLORS.textPrimary};
    text-shadow: none;
  }
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
    background-color: rgba(0, 0, 0, 0.2);
    color: ${COLORS.accentMint};
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
    color: ${COLORS.accentMint};

    svg {
      color: ${COLORS.accentMint};
    }
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.divider};
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

  // Keep loading animation
  &:before {
    content: "";
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
      props.isLoading ? "loadingAnimation 1.5s infinite" : "none"};
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
  border-radius: 0;
  box-shadow: none;
  transform: scale(1);

  &.loaded {
    opacity: 1;
    transform: scale(1);
  }

  ${MediaContainer}:hover & {
    transform: scale(1);
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
    background-color: ${COLORS.primaryMint};
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
    props.active ? COLORS.accentMint : "rgba(255, 255, 255, 0.5)"};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.2);
    background-color: ${(props) =>
      props.active ? COLORS.accentMint : "rgba(255, 255, 255, 0.8)"};
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
  color: ${COLORS.accentMint};
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
  padding: 12px 16px 4px;
  background-color: transparent;
  border-bottom: none;
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
    props.disabled && !props.liked ? "default" : "pointer"};
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(1.15)" : "none"};
    color: ${(props) =>
      !props.disabled && !props.liked ? COLORS.heartRed : ""};
  }

  &:active {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(0.9)" : "none"};
  }
`;

const LikeIcon = styled.div`
  color: ${COLORS.heartRed};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
`;

const CommentButton = styled(Link)`
  color: ${COLORS.textTertiary};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  text-decoration: none;

  &:hover {
    transform: scale(1.15);
    color: ${COLORS.textSecondary};
  }
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
  padding: 0 16px 8px;
  display: flex;
  flex-direction: column;
  background-color: transparent;
`;

const PostTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 6px 0;
  line-height: 1.4;
  word-break: break-word;
  transition: none;
  letter-spacing: 0;
`;

const Content = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 8px 0;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: none;
  letter-spacing: 0;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 16px;
`;

const Tag = styled.span`
  color: ${COLORS.textPrimary};
  font-size: 0.5rem;
  transition: all 0.2s ease;
  font-weight: 400;
  padding: 4px 10px;
  border-radius: 4px;
  background-color: ${COLORS.buttonHover};

  &:hover {
    background-color: ${COLORS.primaryMint}30;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
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

  /* Remove default tap highlight on mobile devices */
  -webkit-tap-highlight-color: transparent;
  outline: none;

  /* Provide custom active state styling instead */
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

const UserAvatarImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: none;
  box-shadow: none;
  transition: none;

  &:hover {
    transform: none;
    box-shadow: none;
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
  0% {
    transform: scale(0) translate(0, 0);
    opacity: 1;
  }
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

  /* Remove default tap highlight on mobile devices */
  -webkit-tap-highlight-color: transparent;
  outline: none;

  /* Provide custom active state styling instead */
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
    props.active ? COLORS.primaryMint : "rgba(255, 255, 255, 0.5)"};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);

  /* Remove default tap highlight on mobile devices */
  -webkit-tap-highlight-color: transparent;
  outline: none;

  &:hover {
    transform: scale(1.2);
    background-color: ${(props) =>
      props.active ? COLORS.accentMint : "rgba(255, 255, 255, 0.8)"};
  }

  &:active {
    transform: scale(0.9);
  }
`;

PostCard.displayName = "PostCard";

export default PostCard;
