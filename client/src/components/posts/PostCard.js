import React, { useState, useContext, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import {
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
} from "react-icons/fa";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import { AuthContext } from "../../context/AuthContext";
import pandaImg from "../../assets/andy.jpg";
import { getTransformedImageUrl } from "../../utils/cloudinary";
import { COLORS, THEME } from "../../theme"; // Import the theme

// Constants for personalization
const AUTHOR_IMAGE = pandaImg;
const AUTHOR_NAME = "Andrew";

// Animation keyframes
const scaleIn = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  15% {
    transform: scale(1.3);
    opacity: 1;
  }
  30% {
    transform: scale(0.95);
  }
  45%, 80% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
`;

// Define the font-face directly in the styles
const fontFaceStyles = css`
  @font-face {
    font-family: "ParadiseSignature";
    src: url("/src/assets/fonts/Paradise Signature.otf") format("opentype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`;

const PostCard = ({ post: initialPost, onDelete, index = 0 }) => {
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

  // Format date as MMM d, yyyy (e.g., "Mar 15, 2025")
  const formattedDate = format(new Date(post.createdAt), "MMM d, yyyy");

  // Close the actions menu when clicking outside
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

  const handleTouchStart = (e) => {
    setIsPressing(true);

    longPressTimeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setShowFullscreen(true);
      // Store the current index when opening fullscreen
      setFullscreenIndex(currentMediaIndex);
    }, 500);
  };

  const handleTouchEnd = () => {
    setIsPressing(false);

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsPressing(false);
  };

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

  const handleFullscreenDoubleTap = () => {
    setIsZoomed(!isZoomed);
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
    setIsZoomed(false);
  };

  const handleLike = async () => {
    // Prevent multiple clicks or if already liked
    if (isLiking || hasLiked) return;

    setIsLiking(true);

    try {
      const response = await axios.put(`/api/posts/${post._id}/like`);
      if (response.data.success) {
        setPost({ ...post, likes: post.likes + 1 });
        setHasLiked(true);
      }
    } catch (err) {
      console.error("Error liking post:", err);

      if (
        err.response?.status === 400 &&
        err.response?.data?.message?.includes("already liked")
      ) {
        setHasLiked(true);
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to like post");
        setTimeout(() => setIsLiking(false), 2000);
      }
    }
  };

  const handleDoubleTapLike = () => {
    if (!hasLiked && !isLiking) {
      setIsDoubleTapLiking(true);
      handleLike();

      // Reset animation after it completes
      setTimeout(() => {
        setIsDoubleTapLiking(false);
      }, 1000);
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
    setShowActions(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/posts/${post._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (typeof onDelete === "function") {
        onDelete(post._id);
      } else {
        console.warn("onDelete is not a function. Check parent component.");
      }

      setShowDeleteModal(false);
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error("Error deleting post:", err);

      if (err.response) {
        toast.error(err.response.data.message || "Failed to delete post");
      } else {
        toast.error("Failed to delete post");
      }

      setShowDeleteModal(false);
    }
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handlePrev = (e) => {
    if (e) e.preventDefault();
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Configure swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    trackTouch: true,
  });

  const handleMediaClick = (e) => {
    if (isLongPressing) {
      // Don't navigate if it was a long press
      e.preventDefault();
      return;
    }

    if (hasMultipleMedia) {
      e.preventDefault();
    }
  };

  return (
    <CardWrapper>
      <Card>
        <CardHeader>
          <UserInfo>
            <UserAvatarImage src={AUTHOR_IMAGE} alt="Andrew's avatar" />
            <Username className="paradise-font">{AUTHOR_NAME}</Username>
          </UserInfo>
          {isAuthenticated && (
            <ActionsContainer ref={actionsRef}>
              <ActionsButton onClick={() => setShowActions(!showActions)}>
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
              <MediaTrack
                style={{
                  transform: `translateX(-${currentMediaIndex * 100}%)`,
                }}
              >
                {post.media.map((media, index) => (
                  <MediaItem key={index}>
                    {media.mediaType === "image" ? (
                      <PostImage
                        src={getTransformedImageUrl(media.mediaUrl, {
                          width: 614,
                          height: 614,
                          crop: "thumb",
                          quality: "auto",
                          format: "auto",
                          gravity: "auto",
                        })}
                        alt={post.caption}
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

      {/* Fullscreen image modal */}
      {showFullscreen && (
        <FullscreenModal onClick={closeFullscreen}>
          <FullscreenWrapper
            {...fullscreenSwipeHandlers}
            onDoubleClick={handleFullscreenDoubleTap}
          >
            <FullscreenImage
              src={post.media[fullscreenIndex].mediaUrl}
              alt={post.caption || "Fullscreen view"}
              style={{
                transform: isZoomed ? "scale(2)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            />
            {post.media.length > 1 && (
              <FullscreenIndicator>
                {fullscreenIndex + 1} / {post.media.length}
              </FullscreenIndicator>
            )}
          </FullscreenWrapper>
          <CloseFullscreenButton onClick={closeFullscreen}>
            ×
          </CloseFullscreenButton>
        </FullscreenModal>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal>
          <DeleteModalContent>
            <h3>Delete Post</h3>
            <p>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <DeleteModalButtons>
              <CancelButton onClick={cancelDelete}>Cancel</CancelButton>
              <ConfirmDeleteButton onClick={handleDelete}>
                Delete Post
              </ConfirmDeleteButton>
            </DeleteModalButtons>
          </DeleteModalContent>
          <Backdrop onClick={cancelDelete} />
        </DeleteModal>
      )}
    </CardWrapper>
  );
};

// New wrapper component to handle mobile layout
const CardWrapper = styled.div`
  ${fontFaceStyles}
  width: 100%;
  display: flex;
  justify-content: center;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    justify-content: stretch;
    width: 100vw;
    margin: 0;
    padding: 0;
  }
`;

// Styled Components
const Card = styled.article`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  overflow: hidden;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 614px;
  box-shadow: 0 1px 2px ${COLORS.shadow};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px ${COLORS.shadow};
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    max-width: 100%;
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin-bottom: 0;
    box-shadow: none;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${COLORS.divider};
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
  letter-spacing: 0.7px;
  line-height: 1.3;
  margin-top: 2px;
  color: ${COLORS.primaryPurple};

  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s ease, filter 0.3s ease;

  &:hover {
    transform: scale(1.07);
    filter: brightness(1.1);
  }
`;

const ActionsButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.elevatedBackground};
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 4px;
  box-shadow: 0 2px 12px ${COLORS.shadow};
  z-index: 10;
  overflow: hidden;
  width: 180px;
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
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.primaryPurple}20;
    color: ${COLORS.primaryPurple};
  }

  svg {
    margin-right: 12px;
    color: ${COLORS.textSecondary};
  }

  &:hover svg {
    color: ${COLORS.primaryPurple};
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
  transition: opacity 0.2s ease;
  opacity: ${(props) => (props.isPressing ? 0.8 : 1)};
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
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
`;

const PostImage = styled.img`
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
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;

  &:hover {
    opacity: 0.9 !important;
    background-color: rgba(0, 0, 0, 0.7);
  }

  ${Card}:hover & {
    opacity: 0.7;
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

  @media (max-width: 768px) {
    opacity: 0.7;
    width: 36px;
    height: 36px;
  }
`;

const IndicatorDots = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
  z-index: 2;
`;

const Dot = styled.button`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primaryPurple : "rgba(255, 255, 255, 0.4)"};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    width: 8px;
    height: 8px;
  }
`;

const HeartAnimation = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${COLORS.primaryPurple};
  font-size: 80px;
  opacity: 0;
  animation: ${scaleIn} 1s ease forwards;
  z-index: 3;

  svg {
    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  }
`;

const CardActions = styled.div`
  padding: 8px 16px;
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
  color: ${(props) =>
    props.liked ? COLORS.primaryPurple : COLORS.textPrimary};
  font-size: 1.5rem;
  cursor: ${(props) =>
    props.disabled && !props.liked ? "default" : "pointer"};
  padding: 8px;
  margin-left: -8px;
  display: flex;
  align-items: center;
  transition: transform 0.2s;

  &:hover {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(1.1)" : "none"};
  }

  &:active {
    transform: ${(props) =>
      !props.disabled || props.liked ? "scale(0.9)" : "none"};
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;

  svg {
    margin-right: 4px;
    font-size: 0.75rem;
  }
`;

const LikesCounter = styled.div`
  padding: 0 16px;
  margin-top: 8px;
  font-size: 0.875rem;
  color: ${COLORS.textPrimary};
`;

const CardContent = styled.div`
  padding: 1rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 0.75rem 1rem 1rem;
  }
`;

const PostTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 12px 0;
  line-height: 1.3;
  word-break: break-word;
  transition: transform 0.2s ease;
`;

const Content = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.875rem;
  margin: 8px 0;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: transform 0.2s ease;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
`;

const Tag = styled.span`
  color: ${COLORS.primaryBlue};
  font-size: 0.875rem;
`;

const ViewPostLink = styled(Link)`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  margin-top: 8px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: ${COLORS.primaryBlue};
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
  padding: 24px;
  width: 90%;
  max-width: 400px;
  z-index: 1001;
  text-align: center;

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
    background-color: ${COLORS.primaryBlue}10;
  }
`;

const ConfirmDeleteButton = styled.button`
  background: none;
  color: #ed4956;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  border-top: 1px solid ${COLORS.divider};

  &:hover {
    background-color: rgba(237, 73, 86, 0.1);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  z-index: 1000;
`;

const PostLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;

  &:hover ${PostTitle}, &:hover ${Content} {
    transform: translateX(2px);
  }
`;

const UserAvatarImage = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid ${COLORS.primaryPurple};
`;

const FullscreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const FullscreenImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const CloseFullscreenButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
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
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
`;

export default PostCard;
