import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import styled, { keyframes, css } from "styled-components";
import { FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useDeleteModal } from "../../context/DeleteModalContext";
import { COLORS } from "../../theme";

const EnhancedStories = ({ isPWA = false }) => {
  // State
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [localIsPWA, setLocalIsPWA] = useState(
    window.matchMedia("(display-mode: standalone)").matches
  );

  // References and hooks
  const storiesRef = useRef(null);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal(); // Add this hook
  const isAdmin = isAuthenticated && user && user.role === "admin";
  const navigate = useNavigate();

  // PWA detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setLocalIsPWA(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Define nextStoryItem as useCallback
  const nextStoryItem = useCallback(() => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setTimeLeft(10);
    } else {
      setActiveStory(null);
      setActiveStoryIndex(0);
    }
  }, [activeStory, activeStoryIndex]);

  // Fetch stories when component mounts
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/stories");

        if (response.data.success) {
          const now = new Date();
          const activeStories = response.data.data.filter(
            (story) => new Date(story.expiresAt) > now
          );

          // Sort stories to prioritize unwatched stories from friends
          const sortedStories = sortStoriesByPriority(activeStories);
          setStories(sortedStories);
          setError(null);
        } else {
          throw new Error(response.data.message || "Failed to fetch stories");
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        setError("Unable to load stories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Handle story auto-progression timer
  useEffect(() => {
    let timer;
    let animationFrameId;

    if (activeStory) {
      if (!activeStory.media || activeStoryIndex >= activeStory.media.length) {
        // Safety check - close the story viewer if there's no media
        closeStory();
        return;
      }

      const currentMedia = activeStory.media[activeStoryIndex];
      // Set longer duration for videos (don't auto-progress)
      const isVideo = currentMedia && currentMedia.mediaType === "video";

      if (!isVideo) {
        // Start time for the animation
        const startTime = Date.now();
        // Total duration for this story item (10 seconds)
        const duration = 10000;

        // Animation function using requestAnimationFrame for smooth progress
        const animate = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / duration, 1);

          setTimeLeft(10 - progress * 10);

          if (progress < 1) {
            // Continue animation
            animationFrameId = requestAnimationFrame(animate);
          } else {
            // Move to next story item when animation completes
            nextStoryItem();
          }
        };

        // Start the animation
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    return () => {
      clearTimeout(timer);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeStory, activeStoryIndex, nextStoryItem]);

  // Handle body scroll lock when story is open
  useEffect(() => {
    if (activeStory) {
      // Prevent body scrolling when story is open
      document.body.style.overflow = "hidden";

      // Add extra padding for iOS notch
      if (localIsPWA || isPWA) {
        document.body.style.paddingTop = "env(safe-area-inset-top, 0)";
      }
    } else {
      // Restore body scrolling when story is closed
      document.body.style.overflow = "";
      document.body.style.paddingTop = "";
    }

    return () => {
      // Clean up when component unmounts
      document.body.style.overflow = "";
      document.body.style.paddingTop = "";
    };
  }, [activeStory, localIsPWA, isPWA]);

  // Utility functions
  const sortStoriesByPriority = (storiesData) => {
    if (!user) return storiesData;

    return [...storiesData].sort((a, b) => {
      // Your own story first
      if (a.userId === user._id) return -1;
      if (b.userId === user._id) return 1;

      // Then unwatched stories from friends
      const aIsUnwatched = !a.viewers?.includes(user._id);
      const bIsUnwatched = !b.viewers?.includes(user._id);

      if (aIsUnwatched && !bIsUnwatched) return -1;
      if (!aIsUnwatched && bIsUnwatched) return 1;

      // Then sort by recency
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const openStory = (story) => {
    setActiveStory(story);
    setActiveStoryIndex(0);
    setTimeLeft(10);
  };

  const closeStory = () => {
    setActiveStory(null);
    setActiveStoryIndex(0);
  };

  const handleNext = () => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setTimeLeft(10);
    } else {
      closeStory();
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setTimeLeft(10);
    }
  };

  // Replace the old delete modal functions with this new one
  const handleDeleteStory = () => {
    if (!activeStory || !isAdmin) return;

    const storyTitle = activeStory.title || "this story";
    const expirationTime = getExpirationTime(activeStory);

    showDeleteModal({
      title: "Delete Story",
      message:
        "Are you sure you want to delete this story? This action cannot be undone and the story will be permanently removed from all viewers.",
      confirmText: "Delete Story",
      cancelText: "Keep Story",
      itemName: `${storyTitle} (expires in ${expirationTime})`,
      onConfirm: async () => {
        setDeleting(true);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.delete(
            `/api/stories/${activeStory._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            // Update the UI by removing the deleted story
            setStories((prevStories) =>
              prevStories.filter((story) => story._id !== activeStory._id)
            );

            // Close the story view
            closeStory();
            toast.success("Story deleted successfully");
          } else {
            throw new Error(response.data.message || "Failed to delete story");
          }
        } catch (error) {
          console.error("Error deleting story:", error);
          toast.error("Failed to delete story. Please try again.");
        } finally {
          setDeleting(false);
        }
      },
      onCancel: () => {
        console.log("Story deletion cancelled");
      },
      destructive: true,
    });
  };

  // Remove the old delete modal functions - we don't need these anymore
  // const openDeleteModal = () => { ... }
  // const closeDeleteModal = () => { ... }
  // const handleDeleteStory = async () => { ... }

  // Calculate the expiration time for a story
  const getExpirationTime = (story) => {
    if (!story || !story.expiresAt) return "Unknown";

    const expiresAt = new Date(story.expiresAt);
    const now = new Date();

    // Calculate the time difference in hours and minutes
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return "Expiring...";
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  // Function to get thumbnail URL for a media item
  const getThumbnailUrl = (media) => {
    if (!media) return "/placeholder-image.jpg";

    if (media.mediaType === "image") {
      return media.mediaUrl;
    } else if (media.mediaType === "video") {
      // Check if it's a Cloudinary URL (they typically contain 'cloudinary.com')
      const url = media.mediaUrl;

      if (url && url.includes("cloudinary.com")) {
        // Extract relevant parts of the URL
        const urlParts = url.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");

        if (uploadIndex !== -1) {
          // Insert thumbnail transformation after 'upload'
          urlParts.splice(uploadIndex + 1, 0, "w_400,h_400,c_fill,g_auto,so_1");

          // Get file extension
          const filename = urlParts[urlParts.length - 1];
          const extension = filename.split(".").pop();

          // Replace extension if it's a video format
          const videoExtensions = ["mp4", "mov", "avi", "webm"];
          if (videoExtensions.includes(extension.toLowerCase())) {
            urlParts[urlParts.length - 1] = filename.replace(
              `.${extension}`,
              ".jpg"
            );
          }

          return urlParts.join("/");
        }
      }

      // Return a default video thumbnail if we couldn't transform the URL
      return "/video-thumbnail-placeholder.jpg";
    }

    // Default case (should not happen)
    return media.mediaUrl;
  };

  const handleCreateStory = () => {
    navigate("/create-story");
  };

  // Render loading state
  if (loading) {
    return (
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <StoriesWrapper>
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <StoryItemSkeleton key={index} />
            ))}
        </StoriesWrapper>
      </StoriesContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <ErrorMessage>{error}</ErrorMessage>
      </StoriesContainer>
    );
  }

  // Render empty state
  if (stories.length === 0 && !isAuthenticated) {
    return null; // Don't show anything if no stories and not authenticated
  }

  if (stories.length === 0 && isAuthenticated) {
    return (
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <ScrollableContainer>
          <StoriesWrapper ref={storiesRef}>
            <CreateStoryItem onClick={handleCreateStory}>
              <CreateStoryAvatarWrapper>
                <CreateStoryButton>
                  <FaPlus />
                </CreateStoryButton>
              </CreateStoryAvatarWrapper>
              <CreateStoryLabel>Your Story</CreateStoryLabel>
            </CreateStoryItem>
          </StoriesWrapper>
        </ScrollableContainer>
      </StoriesContainer>
    );
  }

  return (
    <>
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <ScrollableContainer>
          <StoriesWrapper ref={storiesRef}>
            {isAuthenticated && (
              <CreateStoryItem onClick={handleCreateStory}>
                <CreateStoryAvatarWrapper>
                  <CreateStoryButton>
                    <FaPlus />
                  </CreateStoryButton>
                </CreateStoryAvatarWrapper>
                <CreateStoryLabel>Your Story</CreateStoryLabel>
              </CreateStoryItem>
            )}

            {stories.map((story, index) => {
              const firstMedia = story.media && story.media[0];
              const thumbnailUrl = firstMedia
                ? getThumbnailUrl(firstMedia)
                : "/placeholder-image.jpg";
              const username = story.username || "Andrew";
              const isOwnStory = user && story.userId === user._id;
              const isViewed = user && story.viewers?.includes(user._id);

              return (
                <StoryItem
                  key={story._id}
                  onClick={() => openStory(story)}
                  viewed={isViewed}
                  isOwn={isOwnStory}
                >
                  <StoryAvatarWrapper viewed={isViewed} isOwn={isOwnStory}>
                    <StoryAvatar
                      src={thumbnailUrl}
                      alt={story.title || "Story"}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentNode.classList.add("image-fallback");
                      }}
                    />
                  </StoryAvatarWrapper>
                  <StoryUsername>{username}</StoryUsername>
                </StoryItem>
              );
            })}
          </StoriesWrapper>
        </ScrollableContainer>
      </StoriesContainer>

      {/* Story Viewer Modal */}
      {activeStory && (
        <StoryModal>
          <ProgressBarContainer>
            {activeStory.media.map((_, index) => {
              const progress =
                index < activeStoryIndex
                  ? 1
                  : index === activeStoryIndex &&
                    activeStory.media[index].mediaType !== "video"
                  ? (10 - timeLeft) / 10
                  : 0;

              return (
                <ProgressBarBackground key={index} complete={progress >= 1}>
                  <ProgressFill progress={progress} complete={progress >= 1} />
                </ProgressBarBackground>
              );
            })}
          </ProgressBarContainer>

          <StoryHeader>
            <StoryHeaderContent>
              <div className="story-user">{activeStory.title || "Story"}</div>
              <StoryTimestamp>{getExpirationTime(activeStory)}</StoryTimestamp>
            </StoryHeaderContent>
          </StoryHeader>

          <ControlsBar>
            <CloseButton onClick={closeStory}>
              <FaTimes />
            </CloseButton>

            {isAdmin && (
              <DeleteButton
                onClick={handleDeleteStory}
                disabled={deleting}
                title="Delete this story"
              >
                <FaTrash />
              </DeleteButton>
            )}
          </ControlsBar>

          <StoryContent>
            {activeStory.media[activeStoryIndex].mediaType === "video" ? (
              <StoryVideo
                src={activeStory.media[activeStoryIndex].mediaUrl}
                controls
                autoPlay
                onEnded={handleNext}
                playsInline
              />
            ) : (
              <FullScreenImage
                src={activeStory.media[activeStoryIndex].mediaUrl}
                alt={activeStory.title}
              />
            )}
          </StoryContent>

          <StoryNavigation>
            <NavArea onClick={handlePrev} side="left" />
            <NavArea onClick={handleNext} side="right" />
          </StoryNavigation>
        </StoryModal>
      )}
    </>
  );
};

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Instagram-style Styled Components
const StoriesContainer = styled.section`
  background-color: transparent;
  border-radius: 0;
  padding: 8px 0 12px; // Just enough padding for spacing
  margin: 0; // No margins
  box-shadow: none;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05); // Subtle separator like Instagram

  @media (max-width: 768px) {
    padding: 8px 0 10px;
  }

  @media (max-width: 480px) {
    padding: 6px 0 8px;
  }
`;

const ScrollableContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: auto;
`;

const StoriesWrapper = styled.div`
  display: flex;
  gap: 12px; // Instagram-like spacing
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none; // Hide scrollbar
  -ms-overflow-style: none; // Hide scrollbar
  padding: 4px 16px; // Instagram-like padding
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    display: none; // Hide scrollbar
  }

  @media (max-width: 768px) {
    gap: 10px;
    padding: 4px 12px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    padding: 4px 8px;
  }
`;

const StoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex: 0 0 auto;
  width: 66px; // Instagram-like size
  transition: opacity 0.2s ease; // Only fade opacity on hover
  position: relative;
  z-index: 2;

  &:hover {
    opacity: 0.9; // Subtle hover effect like Instagram
  }

  @media (max-width: 768px) {
    width: 64px;
  }

  @media (max-width: 480px) {
    width: 62px;
  }
`;

const StoryAvatarWrapper = styled.div`
  width: 62px; // Instagram size
  height: 62px;
  border-radius: 50%;
  padding: 2px; // Instagram's thin border
  margin-bottom: 6px; // Space between avatar and username
  position: relative;
  background: ${(props) => {
    // Instagram-like gradient for stories
    if (props.isOwn)
      return `linear-gradient(45deg, #C13584, #E1306C, #FD1D1D, #F56040, #FCAF45)`;
    if (!props.viewed)
      return `linear-gradient(45deg, #C13584, #E1306C, #FD1D1D, #F56040, #FCAF45)`;
    return "#dbdbdb"; // Instagram gray for viewed stories
  }};
  z-index: 2;

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
  }

  @media (max-width: 480px) {
    width: 54px;
    height: 54px;
    margin-bottom: 4px;
  }

  &.image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;

    &:before {
      background-color: #fafafa; // Instagram background color
      content: "\\f03e";
      font-family: "Font Awesome 5 Free";
      font-weight: 900;
      font-size: 1.2rem;
      color: #8e8e8e; // Instagram gray
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

const StoryAvatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: #fafafa; // Instagram background
  border: 2px solid white; // Instagram-style white border
`;

const StoryUsername = styled.span`
  font-size: 12px; // Instagram font size
  color: #262626; // Instagram text color
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 400; // Instagram font weight
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif; // Instagram font stack

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

// Your Story / Create Story item
const CreateStoryItem = styled(StoryItem)`
  // Same styles as StoryItem
`;

const CreateStoryAvatarWrapper = styled.div`
  width: 62px;
  height: 62px;
  border-radius: 50%;
  margin-bottom: 6px;
  position: relative;
  background: #fafafa; // Instagram background
  border: 1px dashed #dbdbdb; // Instagram-like dashed border
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
  }

  @media (max-width: 480px) {
    width: 54px;
    height: 54px;
    margin-bottom: 4px;
  }
`;

const CreateStoryButton = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #0095f6; // Instagram blue
  color: white;
  font-size: 14px;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 480px) {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
`;

const CreateStoryLabel = styled.span`
  font-size: 12px;
  color: #262626; // Instagram text color
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

// Loading skeleton
const StoryItemSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 66px;

  &:before {
    content: "";
    width: 62px;
    height: 62px;
    border-radius: 50%;
    margin-bottom: 6px;
    background: linear-gradient(90deg, #efefef 8%, #fbfbfb 18%, #efefef 33%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  &:after {
    content: "";
    width: 40px;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(90deg, #efefef 8%, #fbfbfb 18%, #efefef 33%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  @media (max-width: 768px) {
    width: 64px;

    &:before {
      width: 56px;
      height: 56px;
    }
  }

  @media (max-width: 480px) {
    width: 62px;

    &:before {
      width: 54px;
      height: 54px;
      margin-bottom: 4px;
    }

    &:after {
      height: 8px;
    }
  }
`;

const NoStoriesMessage = styled.div`
  display: none; // Hide message for cleaner Instagram-like experience
`;

const ErrorMessage = styled.div`
  color: #ed4956; // Instagram error red
  width: 100%;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
`;

// Story Viewer Modal Components
const StoryModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #000000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  touch-action: none;
  width: 100vw;
  height: 100vh;

  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

const ProgressBarContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 12px 8px 8px;
  gap: 4px;
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  /* iOS Safe Area Support */
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(12px + env(safe-area-inset-top, 0));
  }
`;

const ProgressBarBackground = styled.div`
  position: relative;
  flex: 1;
  height: 2px; // Instagram uses thinner bars
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.3); // More transparent background
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => (props.complete ? "100%" : `${props.progress * 100}%`)};
  background: white; // Simple white fill instead of gradient
  transition: width 0.1s linear; // Linear transition like Instagram
  border-radius: 1px;
`;

const StoryHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 5;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;

  /* iOS Safe Area Support */
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(16px + env(safe-area-inset-top, 0));
  }
`;

const StoryHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .story-user {
    font-size: 14px;
    color: white;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
  }
`;

const StoryTimestamp = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: normal;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
`;

const ControlsBar = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 12px;

  /* iOS Safe Area Support */
  @supports (padding-top: env(safe-area-inset-top)) {
    top: calc(16px + env(safe-area-inset-top, 0));
  }
`;

const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const DeleteButton = styled.button`
  background-color: rgba(
    237,
    73,
    86,
    0.8
  ); // Instagram delete color with transparency
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(237, 73, 86, 1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StoryContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000000;
  width: 100vw;
  height: 100vh;
`;

const FullScreenImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100vw;
`;

const StoryVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
  max-width: 100vw;
`;

const StoryNavigation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 4;
`;

const NavArea = styled.div`
  flex: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  user-select: none;

  &:focus {
    outline: none;
  }
`;

export default EnhancedStories;
