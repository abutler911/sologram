// components/stories/Stories.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import styled from "styled-components";
import {
  FaTimes,
  FaVideo,
  FaTrash,
  FaExclamationTriangle,
  FaArchive,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { COLORS, THEME } from "../../theme";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [isPWA, setIsPWA] = useState(
    window.matchMedia("(display-mode: standalone)").matches
  );

  // Get authentication context to check if user is admin
  const { user, isAuthenticated } = useContext(AuthContext);
  const isAdmin = isAuthenticated && user && user.role === "admin";

  // Define nextStoryItem as useCallback
  const nextStoryItem = useCallback(() => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setTimeLeft(10);
    } else {
      // End of story items, close the story
      setActiveStory(null);
      setActiveStoryIndex(0);
    }
  }, [activeStory, activeStoryIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setIsPWA(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
          setStories(activeStories);
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

    if (activeStory) {
      if (!activeStory.media || activeStoryIndex >= activeStory.media.length) {
        // Safety check - close the story viewer if there's no media
        closeStory();
        return;
      }

      const currentMedia = activeStory.media[activeStoryIndex];
      // Set longer duration for videos (don't auto-progress)
      const isVideo = currentMedia && currentMedia.mediaType === "video";

      if (!isVideo && timeLeft > 0) {
        timer = setTimeout(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else if (!isVideo && timeLeft <= 0) {
        // Only auto-progress for images
        nextStoryItem();
      }
    }

    return () => clearTimeout(timer);
  }, [activeStory, activeStoryIndex, timeLeft, nextStoryItem]);

  // Handle body scroll lock when story is open
  useEffect(() => {
    if (activeStory) {
      // Prevent body scrolling when story is open
      document.body.style.overflow = "hidden";

      // Add extra padding for iOS notch
      if (isPWA) {
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
  }, [activeStory, isPWA]);

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

  // Handle opening the delete confirmation modal
  const openDeleteModal = () => {
    if (!activeStory || !isAdmin) return;
    setStoryToDelete(activeStory);
    setShowDeleteModal(true);
  };

  // Handle closing the delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setStoryToDelete(null);
  };

  // Handle story deletion
  const handleDeleteStory = async () => {
    if (!storyToDelete || !isAdmin) return;

    setDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`/api/stories/${storyToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Update the UI by removing the deleted story
        setStories((prevStories) =>
          prevStories.filter((story) => story._id !== storyToDelete._id)
        );

        // Close the story view and delete modal
        closeStory();
        closeDeleteModal();

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
  };

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

  if (loading) {
    return (
      <StoriesContainer>
        <LoadingMessage>Loading stories...</LoadingMessage>
      </StoriesContainer>
    );
  }

  if (error) {
    return (
      <StoriesContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </StoriesContainer>
    );
  }

  if (stories.length === 0) {
    return (
      <StoriesContainer>
        <EmptyMessage>No stories available</EmptyMessage>
      </StoriesContainer>
    );
  }

  return (
    <>
      <StoriesContainer>
        {isAdmin && (
          <StoryArchiveLink to="/story-archive" title="View archived stories">
            <FaArchive />
            <span>Archive</span>
          </StoryArchiveLink>
        )}
        {stories.map((story) => {
          const firstMedia = story.media && story.media[0];
          const isVideo = firstMedia && firstMedia.mediaType === "video";
          const thumbnailUrl = firstMedia
            ? getThumbnailUrl(firstMedia)
            : "/placeholder-image.jpg";

          return (
            <StoryCircle key={story._id} onClick={() => openStory(story)}>
              <StoryImageWrapper>
                <ThumbnailImage
                  src={thumbnailUrl}
                  alt={story.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.classList.add("image-fallback");
                  }}
                />
                {isVideo && (
                  <VideoIndicator>
                    <FaVideo />
                  </VideoIndicator>
                )}
              </StoryImageWrapper>
            </StoryCircle>
          );
        })}
      </StoriesContainer>

      {activeStory && (
        <StoryModal>
          <ProgressBarContainer>
            {activeStory.media.map((_, index) => (
              <ProgressBar
                key={index}
                active={index === activeStoryIndex}
                complete={index < activeStoryIndex}
                progress={
                  index === activeStoryIndex &&
                  activeStory.media[index].mediaType !== "video"
                    ? (10 - timeLeft) / 10
                    : 0
                }
              />
            ))}
          </ProgressBarContainer>

          <StoryHeader>
            <StoryHeaderContent>
              <StoryHeaderTitle>{activeStory.title}</StoryHeaderTitle>
              <StoryTimestamp>{getExpirationTime(activeStory)}</StoryTimestamp>
            </StoryHeaderContent>
          </StoryHeader>

          <ControlsBar>
            <CloseButton onClick={closeStory}>
              <FaTimes />
            </CloseButton>

            {/* Admin Delete Button */}
            {isAdmin && (
              <DeleteButton
                onClick={openDeleteModal}
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

          {/* Navigation overlay for left/right swipe */}
          <StoryNavigation>
            <NavArea onClick={handlePrev} side="left" />
            <NavArea onClick={handleNext} side="right" />
          </StoryNavigation>
        </StoryModal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalOverlay>
          <DeleteModal>
            <DeleteModalHeader>
              <FaExclamationTriangle />
              <DeleteModalTitle>Delete Story?</DeleteModalTitle>
            </DeleteModalHeader>

            <DeleteModalContent>
              Are you sure you want to delete the story "{storyToDelete?.title}
              "?
              <br />
              This action cannot be undone.
            </DeleteModalContent>

            <DeleteModalButtons>
              <CancelButton onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </CancelButton>
              <ConfirmDeleteButton
                onClick={handleDeleteStory}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Story"}
              </ConfirmDeleteButton>
            </DeleteModalButtons>
          </DeleteModal>
        </ModalOverlay>
      )}
    </>
  );
};

// Styled Components with SoloGram Theme
const StoriesContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 1rem 0;
  gap: 1rem;
  position: relative;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const StoryArchiveLink = styled(Link)`
  flex: 0 0 auto;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: ${COLORS.textTertiary};
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primaryBlueGray};
  }

  svg {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  span {
    font-size: 0.75rem;
  }
`;

const LoadingMessage = styled.p`
  color: ${COLORS.textTertiary};
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

const ErrorMessage = styled.p`
  color: ${COLORS.error};
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

const EmptyMessage = styled.p`
  color: ${COLORS.textTertiary};
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

const StoryCircle = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 0 4px;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
`;

const VideoIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textPrimary};
  font-size: 0.8rem;
  z-index: 2; /* Ensure this appears above the thumbnail */
`;

const StoryImageWrapper = styled.div`
  position: relative;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  overflow: hidden;

  /* Gradient border approach */
  padding: 3px;
  background: ${THEME.story.border
    .active}; /* Uses the theme's blue-gray color */

  /* For the inner content (the actual image container) */
  &::before {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    right: 3px;
    bottom: 3px;
    border-radius: 50%;
    background: ${COLORS.cardBackground};
    z-index: 0;
  }

  transition: transform 0.3s ease;

  @media (hover: hover) {
    &:hover {
      transform: scale(1.05);
    }
  }

  &.image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;

    &:before {
      background-color: ${COLORS.elevatedBackground};
      content: "\\f03e";
      font-family: "Font Awesome 5 Free";
      font-weight: 900;
      font-size: 1.5rem;
      color: ${COLORS.textTertiary};
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

const StoryModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${COLORS.background};
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

// Progress bar moved to top
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

// FIXED: Progress bar transition to make it animate smoother
const ProgressBar = styled.div`
  height: 2px;
  flex: 1;
  background-color: rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  border-radius: 1px;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${(props) =>
      props.complete
        ? "100%"
        : props.active
        ? `${props.progress * 100}%`
        : "0"};
    background-color: ${COLORS.primarySalmon}; /* Updated to salmon color */
    transition: width 0.1s linear; /* Changed from 1s to 0.1s for smoother updates */
  }
`;

// FIXED: Header gradient to improve text visibility on dark backgrounds
const StoryHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 48px 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 5;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.8) 0%,
    /* Darker background from 0.7 to 0.8 */ rgba(0, 0, 0, 0.5) 50%,
    /* Added middle point for smoother gradient */ rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;

  /* iOS Safe Area Support */
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(48px + env(safe-area-inset-top, 0));
  }
`;

// New container for header content to control width
const StoryHeaderContent = styled.div`
  max-width: 80%;
  padding-right: 40px;
  padding-left: 16px;
`;

// FIXED: Improved text shadow for better visibility
const StoryHeaderTitle = styled.h3`
  font-size: 1rem;
  color: white; /* Always white for better contrast */
  margin: 0 0 4px 0;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8); /* Stronger text shadow */
  white-space: normal;
  line-height: 1.3;
`;

// FIXED: Improved text shadow for better visibility
const StoryTimestamp = styled.span`
  color: rgba(255, 255, 255, 0.9); /* Slightly transparent white */
  font-size: 0.875rem;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8); /* Stronger text shadow */
`;

// Adjusted position of controls to be higher and more prominent
const ControlsBar = styled.div`
  position: absolute;
  top: 16px; /* Moved up */
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 1rem;

  /* iOS Safe Area Support */
  @supports (padding-top: env(safe-area-inset-top)) {
    top: calc(16px + env(safe-area-inset-top, 0));
  }
`;

const CloseButton = styled.button`
  background: ${COLORS.primaryBlueGray}; /* Updated to theme color */
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.accentBlueGray}; /* Updated to theme color */
  }
`;

const DeleteButton = styled.button`
  background-color: ${COLORS.primarySalmon}; /* Updated to theme color */
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.accentSalmon}; /* Updated to theme color */
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Content area now fills viewport completely
const StoryContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${COLORS.background};
  width: 100vw;
  height: 100vh;
`;

// Image now fills the screen with object-fit: contain
const FullScreenImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100vw;
`;

// Video now fills the screen with object-fit: contain
const StoryVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
  max-width: 100vw;
`;

// Navigation overlay now covers the entire screen
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

// Modal styling updated with theme colors
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
`;

const DeleteModal = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 4px 20px ${COLORS.shadow};
`;

const DeleteModalHeader = styled.div`
  background-color: ${COLORS.primarySalmon}; /* Updated to theme color */
  color: white;
  padding: 1.25rem;
  display: flex;
  align-items: center;

  svg {
    font-size: 1.5rem;
    margin-right: 0.75rem;
  }
`;

const DeleteModalTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const DeleteModalContent = styled.div`
  padding: 1.5rem;
  color: ${COLORS.textSecondary};
  line-height: 1.5;
`;

const DeleteModalButtons = styled.div`
  display: flex;
  padding: 1rem 1.5rem;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: ${COLORS.primarySalmon}; /* Updated to theme color */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.accentSalmon}; /* Updated to theme color */
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    order: 1;
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.buttonHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

export default Stories;
