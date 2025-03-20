import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  FaHeart,
  FaEdit,
  FaTrash,
  FaCalendarAlt, // Changed from FaClock to FaCalendarAlt
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { format } from "date-fns"; // Changed from formatDistance to format
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import { AuthContext } from "../../context/AuthContext";

const PostCard = ({ post: initialPost, onDelete }) => {
  const [post, setPost] = useState(initialPost);
  const { isAuthenticated } = useContext(AuthContext);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const hasMultipleMedia = post.media && post.media.length > 1;
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  // Format date as MMM d, yyyy (e.g., "Mar 15, 2025")
  const formattedDate = format(new Date(post.createdAt), "MMM d, yyyy");

  const handleLike = async () => {
    // Prevent multiple clicks or if already liked
    if (isLiking || hasLiked) return;

    setIsLiking(true);

    try {
      const response = await axios.put(`/api/posts/${post._id}/like`);
      if (response.data.success) {
        setPost({ ...post, likes: post.likes + 1 });
        setHasLiked(true); // Mark as liked to prevent further clicks
        // We don't need to reset isLiking since hasLiked will keep it disabled
      }
    } catch (err) {
      console.error("Error liking post:", err);

      // Check if the error is because they already liked the post
      if (
        err.response?.status === 400 &&
        err.response?.data?.message?.includes("already liked")
      ) {
        setHasLiked(true); // Prevent further clicks
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to like post");
        // Only reset isLiking after a delay to prevent rapid retries
        setTimeout(() => setIsLiking(false), 2000);
      }
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      console.log("Deleting post with ID:", post._id);

      await axios.delete(`/api/posts/${post._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("Post deleted successfully!");

      if (typeof onDelete === "function") {
        onDelete(post._id); // Call parent function to update UI
      } else {
        console.warn("onDelete is not a function. Check parent component.");
      }

      setShowDeleteModal(false);
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error("Error deleting post:", err);

      if (err.response) {
        console.error("Server response:", err.response.data);
        toast.error(err.response.data.message || "Failed to delete post");
      } else {
        toast.error("Failed to delete post");
      }

      setShowDeleteModal(false);
    }
  };

  const handleNext = (e) => {
    if (e) e.preventDefault(); // Prevent navigation to post detail
    if (currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handlePrev = (e) => {
    if (e) e.preventDefault(); // Prevent navigation to post detail
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
    // Only prevent default if we have multiple media
    // Otherwise, allow navigation to post detail
    if (hasMultipleMedia) {
      e.preventDefault();
    }
  };

  return (
    <>
      <Card>
        {post.media && post.media.length > 0 && (
          <MediaContainer to={`/post/${post._id}`} onClick={handleMediaClick}>
            <MediaCarousel {...swipeHandlers}>
              <MediaTrack
                style={{
                  transform: `translateX(-${currentMediaIndex * 100}%)`,
                }}
              >
                {post.media.map((media, index) => (
                  <MediaItem key={index}>
                    {media.mediaType === "image" ? (
                      <PostImage src={media.mediaUrl} alt={post.caption} />
                    ) : (
                      <PostVideo src={media.mediaUrl} controls />
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
                >
                  <FaChevronLeft />
                </NavigationArrow>
                <NavigationArrow
                  className="next"
                  onClick={handleNext}
                  disabled={currentMediaIndex === post.media.length - 1}
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
                    />
                  ))}
                </IndicatorDots>
              </>
            )}
          </MediaContainer>
        )}

        <CardContent>
          <Caption to={`/post/${post._id}`}>{post.caption}</Caption>

          {post.content && (
            <Content>
              {post.content.length > 150
                ? `${post.content.substring(0, 150)}...`
                : post.content}
            </Content>
          )}

          {post.tags && post.tags.length > 0 && (
            <TagsContainer>
              {post.tags.map((tag, index) => (
                <Tag key={index}>#{tag}</Tag>
              ))}
            </TagsContainer>
          )}

          <CardFooter>
            <MetaData>
              <TimeStamp>
                <FaCalendarAlt />
                <span>{formattedDate}</span>
              </TimeStamp>

              <LikesCount
                onClick={handleLike}
                disabled={isLiking || hasLiked}
                liked={hasLiked}
              >
                <FaHeart />
                <span>{post.likes}</span>
              </LikesCount>
            </MetaData>

            {isAuthenticated && (
              <Actions>
                <EditButton to={`/edit/${post._id}`}>
                  <FaEdit />
                </EditButton>

                <DeleteButton onClick={confirmDelete}>
                  <FaTrash />
                </DeleteButton>
              </Actions>
            )}
          </CardFooter>
        </CardContent>
      </Card>

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
    </>
  );
};

// Styled Components
const Card = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%; /* Take full height of grid cell */
  width: 100%; /* Ensure full width */

  /* Ensure proper rendering in PWA and mobile environments */
  max-width: 100vw;
  box-sizing: border-box;
  margin: 0 auto;

  /* On small mobile screens, increase width to fill more screen space */
  @media (max-width: 480px) {
    width: 100%;
    border-radius: 6px; /* Slightly smaller border radius on small screens */
  }

  /* For PWA specifically - this helps address possible viewport issues */
  @media screen and (display-mode: standalone) {
    width: 96vw; /* Use viewport width units for PWA mode */
    max-width: 600px; /* Cap maximum width */
    margin: 0 auto;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
`;

const MediaContainer = styled(Link)`
  display: block;
  width: 100%;
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1; /* Square aspect ratio like Instagram */
  flex-shrink: 0; /* Prevent the media container from shrinking */
  background-color: #121212; /* Dark background for loading state */
`;

// Carousel Components
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
  transition: transform 0.3s ease-out;
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
`;

const NavigationArrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.7);
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

  ${Card}:hover & {
    opacity: 0.8;
  }

  &:hover {
    opacity: 1 !important;
  }

  &.prev {
    left: 10px;
  }

  &.next {
    right: 10px;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  /* Make arrows more visible and touchable on mobile */
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    opacity: 0.7; /* Always show on mobile */

    &.prev {
      left: 8px;
    }

    &.next {
      right: 8px;
    }
  }
`;

const IndicatorDots = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
  z-index: 2;
`;

const Dot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? "#ff7e5f" : "rgba(255, 255, 255, 0.7)"};
  border: none;
  cursor: pointer;
  padding: 0;

  /* Larger dots on mobile for better touch targets */
  @media (max-width: 768px) {
    width: 10px;
    height: 10px;
    margin: 0 3px;
  }
`;

const PostImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover; /* This crops the image to fill the container */
  position: absolute;
  top: 0;
  left: 0;
`;

const PostVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover; /* This crops the video to fill the container */
  position: absolute;
  top: 0;
  left: 0;
`;

const CardContent = styled.div`
  padding: 1.25rem;
  flex-grow: 1; /* Allow content to grow but maintain consistent card heights */
  display: flex;
  flex-direction: column;

  /* Adjust padding on mobile */
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const Caption = styled(Link)`
  display: block;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #ffffff;
  text-decoration: none;

  &:hover {
    color: #ff7e5f;
  }

  /* Set max-height and handle overflow for consistent height */
  max-height: 3.75rem; /* Approximately 2 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  /* Slightly smaller font on very small screens */
  @media (max-width: 360px) {
    font-size: 1.125rem;
  }
`;

const Content = styled.p`
  color: #aaaaaa;
  margin-bottom: 1rem;
  line-height: 1.5;

  /* Set max-height and handle overflow for consistent height */
  max-height: 4.5rem; /* Approximately 3 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  overflow: hidden;
  max-height: 2.5rem; /* Limit the visible tags */
`;

const Tag = styled.span`
  background-color: #333333;
  color: #aaaaaa;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #333333;
  padding-top: 1rem;
  margin-top: auto; /* Push the footer to the bottom of the card */

  /* Additional spacing on small screens */
  @media (max-width: 480px) {
    padding-top: 0.75rem;
  }
`;

const MetaData = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* Allow wrapping on very small screens */

  /* More space on very small screens */
  @media (max-width: 360px) {
    margin-right: 0.5rem;
  }
`;

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  color: #888888;
  font-size: 0.875rem;
  margin-right: 1rem;

  svg {
    margin-right: 0.25rem;
  }

  /* Adjustments for mobile */
  @media (max-width: 480px) {
    font-size: 0.8125rem;
    margin-right: 0.75rem;
  }
`;

const LikesCount = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${(props) => (props.liked ? "#ff5e3a" : "#ff7e5f")};
  font-size: 0.875rem;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  transition: color 0.2s ease;
  padding: 0;
  opacity: ${(props) => (props.disabled && !props.liked ? 0.7 : 1)};

  &:hover {
    color: ${(props) => (!props.disabled ? "#ff5e3a" : "")};
  }

  svg {
    margin-right: 0.25rem;
    ${(props) => (props.liked ? "fill: #ff5e3a;" : "")}
  }

  /* Ensure good touch target size on mobile */
  @media (max-width: 480px) {
    font-size: 0.8125rem;
    min-height: 1.5rem;
    display: flex;
    align-items: center;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center; /* Ensure vertical alignment */
  margin-left: 0.5rem; /* Provide some separation from metadata */
`;

const EditButton = styled(Link)`
  color: #4a90e2;
  transition: color 0.3s ease;
  padding: 0.25rem 0.5rem; /* Add padding for larger touch target */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;

  /* Increase spacing between buttons */
  margin-right: 0.75rem;

  &:hover {
    color: #3a70b2;
  }

  /* Adjustments for mobile */
  @media (max-width: 480px) {
    padding: 0.3rem 0.6rem;
  }
`;

const DeleteButton = styled.button`
  color: #e74c3c;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0.25rem 0.5rem; /* Add padding for larger touch target */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;

  &:hover {
    color: #c0392b;
  }

  /* Adjustments for mobile */
  @media (max-width: 480px) {
    padding: 0.3rem 0.6rem;
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
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h3 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  p {
    color: #dddddd;
    margin-bottom: 1.5rem;
  }

  /* Adjustments for mobile */
  @media (max-width: 480px) {
    padding: 1.5rem;
    width: 85%;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444444;
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
`;

export default PostCard;
