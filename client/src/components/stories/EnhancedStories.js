import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import styled, { keyframes, css } from "styled-components";
import {
  FaTimes,
  FaVideo,
  FaTrash,
  FaExclamationTriangle,
  FaArchive,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaCameraRetro,
  FaStar,
  FaHourglassHalf,
  FaFire,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { COLORS, THEME } from "../../theme";

const EnhancedStories = ({ isPWA = false }) => {
  // State from both components
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [localIsPWA, setLocalIsPWA] = useState(
    window.matchMedia("(display-mode: standalone)").matches
  );
  const [headerAnimated, setHeaderAnimated] = useState(false);
  // Add this with your other state declarations at the top of the component
  const [progress, setProgress] = useState(0.33);
  // References and hooks
  const storiesRef = useRef(null);
  const { user, isAuthenticated } = useContext(AuthContext);
  const isAdmin = isAuthenticated && user && user.role === "admin";
  const navigate = useNavigate();

  // Calculate visible items based on container width
  const [visibleItems, setVisibleItems] = useState(5);

  // PWA detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setLocalIsPWA(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    setHeaderAnimated(true);
  }, []);

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

  // Update visible items count based on container width
  useEffect(() => {
    const updateVisibleItems = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setVisibleItems(4);
      } else if (width < 768) {
        setVisibleItems(5);
      } else {
        setVisibleItems(7);
      }
    };

    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, []);

  // Check if scroll buttons should be visible
  useEffect(() => {
    if (!storiesRef.current) return;

    const checkScrollButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const storiesContainer = storiesRef.current;
    storiesContainer.addEventListener("scroll", checkScrollButtons);
    checkScrollButtons();

    return () => {
      if (storiesContainer) {
        storiesContainer.removeEventListener("scroll", checkScrollButtons);
      }
    };
  }, [stories]);

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

  const scrollLeft = () => {
    if (!storiesRef.current) return;
    storiesRef.current.scrollBy({
      left: -200,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    if (!storiesRef.current) return;
    storiesRef.current.scrollBy({
      left: 200,
      behavior: "smooth",
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
        <StoriesHeaderContainer>
          <HeaderContentWrapper>
            <TitleGroup>
              <IconWrapper>
                <FaStar className="icon-spark" />
                <FaCameraRetro className="icon-main" />
              </IconWrapper>
              <TitleWrapper>
                <h3>Moment Capsules</h3>
                <Subtitle animate={headerAnimated}>
                  Capture today's magic
                </Subtitle>
              </TitleWrapper>
            </TitleGroup>

            <HeaderButtons>
              {isAdmin && (
                <StoryArchiveLink
                  to="/story-archive"
                  title="View archived stories"
                >
                  <FaArchive />
                  <span>Archive</span>
                </StoryArchiveLink>
              )}
              {isAuthenticated && (
                <ButtonGroup>
                  <ActiveStoriesIndicator>
                    <FaFire />
                    <span className="count">{stories.length}</span>
                    <span className="text">Active</span>
                  </ActiveStoriesIndicator>

                  <CreateStoryButton onClick={handleCreateStory}>
                    <ButtonContent>
                      <FaPlus className="icon" />
                      <span>New Story</span>
                    </ButtonContent>
                    <ButtonGlow />
                  </CreateStoryButton>
                </ButtonGroup>
              )}
            </HeaderButtons>
          </HeaderContentWrapper>

          <ProgressIndicator>
            <Timeframe>
              <FaHourglassHalf />
              <span>Stories refresh in 24h</span>
            </Timeframe>
            <ProgressBarBackground complete={progress >= 1}>
              <ProgressFill progress={progress} complete={progress >= 1} />
              {progress > 0 && progress < 1 && (
                <ProgressParticle progress={progress} />
              )}
            </ProgressBarBackground>
          </ProgressIndicator>
        </StoriesHeaderContainer>
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
  if (stories.length === 0) {
    return (
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <StoriesHeaderContainer>
          <HeaderContentWrapper>
            <TitleGroup>
              <IconWrapper>
                <FaStar className="icon-spark" />
                <FaCameraRetro className="icon-main" />
              </IconWrapper>
              <TitleWrapper>
                <h3>Moment Capsules</h3>
                <Subtitle animate={headerAnimated}>
                  Capture today&apos;s magic
                </Subtitle>
              </TitleWrapper>
            </TitleGroup>

            <HeaderButtons>
              {isAdmin && (
                <StoryArchiveLink
                  to="/story-archive"
                  title="View archived stories"
                >
                  <FaArchive />
                  <span>Archive</span>
                </StoryArchiveLink>
              )}
              {isAuthenticated && (
                <ButtonGroup>
                  <ActiveStoriesIndicator>
                    <FaFire />
                    <span className="count">{stories.length}</span>
                    <span className="text">Active</span>
                  </ActiveStoriesIndicator>

                  <CreateStoryButton onClick={handleCreateStory}>
                    <ButtonContent>
                      <FaPlus className="icon" />
                      <span>New Story</span>
                    </ButtonContent>
                    <ButtonGlow />
                  </CreateStoryButton>
                </ButtonGroup>
              )}
            </HeaderButtons>
          </HeaderContentWrapper>
        </StoriesHeaderContainer>

        <NoStoriesMessage>
          No stories available. Create your first story!
        </NoStoriesMessage>
      </StoriesContainer>
    );
  }

  return (
    <>
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <StoriesHeaderContainer>
          <HeaderContentWrapper>
            <TitleGroup>
              <IconWrapper>
                <FaStar className="icon-spark" />
                <FaCameraRetro className="icon-main" />
              </IconWrapper>
              <TitleWrapper>
                <h3>Moment Capsules</h3>
                <Subtitle animate={headerAnimated}>
                  Capture today&apos;s magic
                </Subtitle>
              </TitleWrapper>
            </TitleGroup>

            <HeaderButtons>
              {isAdmin && (
                <StoryArchiveLink
                  to="/story-archive"
                  title="View archived stories"
                >
                  <FaArchive />
                  <span>Archive</span>
                </StoryArchiveLink>
              )}
              {isAuthenticated && (
                <ButtonGroup>
                  <ActiveStoriesIndicator>
                    <FaFire />
                    <span className="count">{stories.length}</span>
                    <span className="text">Active</span>
                  </ActiveStoriesIndicator>

                  <CreateStoryButton onClick={handleCreateStory}>
                    <ButtonContent>
                      <FaPlus className="icon" />
                      <span>New Story</span>
                    </ButtonContent>
                    <ButtonGlow />
                  </CreateStoryButton>
                </ButtonGroup>
              )}
            </HeaderButtons>
          </HeaderContentWrapper>
        </StoriesHeaderContainer>

        <ScrollableContainer>
          {canScrollLeft && (
            <ScrollButton direction="left" onClick={scrollLeft}>
              <FaChevronLeft />
            </ScrollButton>
          )}

          <StoriesWrapper ref={storiesRef}>
            {stories.map((story, index) => {
              const firstMedia = story.media && story.media[0];
              const isVideo = firstMedia && firstMedia.mediaType === "video";
              const thumbnailUrl = firstMedia
                ? getThumbnailUrl(firstMedia)
                : "/placeholder-image.jpg";

              return (
                <StoryItem
                  key={story._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openStory(story)}
                  active={index === activeIndex}
                  viewed={user && story.viewers?.includes(user._id)}
                  isOwn={user && story.userId === user._id}
                >
                  <StoryAvatarWrapper
                    viewed={user && story.viewers?.includes(user._id)}
                    isOwn={user && story.userId === user._id}
                  >
                    <StoryAvatar
                      src={thumbnailUrl}
                      alt={story.title || "Story"}
                      loading="lazy"
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
                  </StoryAvatarWrapper>
                </StoryItem>
              );
            })}
          </StoriesWrapper>

          {canScrollRight && (
            <ScrollButton direction="right" onClick={scrollRight}>
              <FaChevronRight />
            </ScrollButton>
          )}
        </ScrollableContainer>
      </StoriesContainer>

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
                  {progress > 0 && progress < 1 && (
                    <ProgressParticle progress={progress} />
                  )}
                </ProgressBarBackground>
              );
            })}
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

// Animations
const pulse = keyframes`
  0% { box-shadow: 0 0 5px ${COLORS.primarySalmon}; }
  50% { box-shadow: 0 0 15px ${COLORS.primaryMint}; }
  100% { box-shadow: 0 0 5px ${COLORS.primarySalmon}; }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const glowPulse = keyframes`
  0% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.5;
    transform: scale(0.95);
  }
`;

// Enhanced Styled Components
const StoriesContainer = styled.section`
  background-color: ${COLORS.cardBackground};
  border-radius: ${(props) => (props.isPWA ? "0" : "12px")};
  padding: 1rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px ${COLORS.shadow};
  animation: ${fadeIn} 0.3s ease;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    border-radius: ${(props) => (props.isPWA ? "0" : "8px")};
  }
`;

const StoriesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 5; // Higher z-index to stay on top

  h3 {
    font-size: 1.3rem;
    font-family: "Mystery Quest", sans-serif;
    color: ${COLORS.primaryBlueGray};
    margin: 0;
  }

  @media (max-width: 480px) {
    margin-bottom: 0.75rem;

    h3 {
      font-size: 1.1rem;
    }
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 480px) {
    gap: 0.5rem;
    width: 100%;
    justify-content: flex-end;
  }
`;

const StoryArchiveLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-decoration: none;
  color: ${COLORS.textSecondary};
  font-size: 0.8125rem;
  transition: color 0.2s;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.05);

  svg {
    font-size: 0.875rem;
  }

  &:hover {
    color: ${COLORS.primaryBlueGray};
    background: rgba(255, 255, 255, 0.12);
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.4rem 0.5rem;

    svg {
      font-size: 0.8125rem;
    }

    span {
      display: none;
    }
  }
`;

const CreateStoryButton = styled.button`
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0.6rem 1.25rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 12px ${COLORS.primarySalmon}40;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${COLORS.primarySalmon}60;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
  }
`;

const ScrollableContainer = styled.div`
  position: relative;
  margin-top: 8px; // Add margin to push the stories down a bit
`;

const StoriesWrapper = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 1rem;
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  @media (max-width: 768px) {
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const StoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex: 0 0 auto;
  width: 90px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;

  &:hover {
    transform: translateY(-2px);
  }

  ${(props) =>
    props.active &&
    css`
      transform: scale(1.05);
    `}

  @media (max-width: 768px) {
    width: 80px;
  }

  @media (max-width: 480px) {
    width: 72px;
  }
`;

const StoryAvatarWrapper = styled.div`
  width: 78px;
  height: 78px;
  border-radius: 50%;
  padding: 3px;
  margin-bottom: 0.5rem;
  position: relative;
  background: ${(props) => {
    if (props.isOwn)
      return `linear-gradient(45deg, ${COLORS.primarySalmon}, ${COLORS.primaryMint})`;
    if (!props.viewed)
      return `linear-gradient(45deg, ${COLORS.primaryBlueGray}, ${COLORS.primaryMint})`;
    return COLORS.border;
  }};
  z-index: 2; // Ensure higher z-index than non-critical elements

  ${(props) =>
    !props.viewed &&
    !props.isOwn &&
    css`
      animation: ${pulse} 2s infinite;
    `}

  @media (max-width: 768px) {
    width: 68px;
    height: 68px;
  }

  @media (max-width: 480px) {
    width: 58px;
    height: 58px;
    margin-bottom: 0.375rem;
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

const StoryAvatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: ${COLORS.elevatedBackground};
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

  @media (max-width: 480px) {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
`;

const StoryUsername = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.6875rem;
  }
`;

const ScrollButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px ${COLORS.shadow};
  transition: all 0.2s ease;

  ${(props) =>
    props.direction === "left" &&
    css`
      left: -12px;
    `}

  ${(props) =>
    props.direction === "right" &&
    css`
      right: -12px;
    `}
  
  &:hover {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.textPrimary};
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
  }
`;

const StoryItemSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 90px;

  &:before {
    content: "";
    width: 78px;
    height: 78px;
    border-radius: 50%;
    margin-bottom: 0.5rem;
    background: linear-gradient(
      90deg,
      ${COLORS.border} 8%,
      ${COLORS.elevatedBackground} 18%,
      ${COLORS.border} 33%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  &:after {
    content: "";
    width: 60%;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      ${COLORS.border} 8%,
      ${COLORS.elevatedBackground} 18%,
      ${COLORS.border} 33%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  @media (max-width: 768px) {
    width: 80px;

    &:before {
      width: 68px;
      height: 68px;
    }
  }

  @media (max-width: 480px) {
    width: 72px;

    &:before {
      width: 58px;
      height: 58px;
      margin-bottom: 0.375rem;
    }

    &:after {
      height: 8px;
    }
  }
`;

const NoStoriesMessage = styled.div`
  text-align: center;
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
  padding: 1.5rem 1rem;
  width: 100%;
`;

const ErrorMessage = styled.div`
  color: ${COLORS.error};
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

// Story Viewer Modal Components
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

const ProgressBar = styled.div`
  height: 4px;
  flex: 1;
  background-color: rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  border-radius: 2px;

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
    background: linear-gradient(
      270deg,
      ${COLORS.primarySalmon},
      ${COLORS.primaryMint},
      ${COLORS.primarySalmon}
    );
    background-size: 400% 400%;
    animation: gradientFlow 3s ease infinite;
    transition: width 0.4s ease-out;
    border-radius: 2px;
    box-shadow: 0 0 6px ${COLORS.primarySalmon}, 0 0 10px ${COLORS.primaryMint};
  }

  @keyframes gradientFlow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

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
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;

  /* iOS Safe Area Support */
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(48px + env(safe-area-inset-top, 0));
  }
`;

const StoryHeaderContent = styled.div`
  max-width: 80%;
  padding-right: 40px;
  padding-left: 16px;
`;

const StoryHeaderTitle = styled.h3`
  font-size: 1rem;
  color: white;
  margin: 0 0 4px 0;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  white-space: normal;
  line-height: 1.3;
`;

const StoryTimestamp = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
`;

const ControlsBar = styled.div`
  position: absolute;
  top: 16px;
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
  background: ${COLORS.primaryBlueGray};
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
    background-color: ${COLORS.accentBlueGray};
  }
`;

const DeleteButton = styled.button`
  background-color: ${COLORS.primarySalmon};
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
    background-color: ${COLORS.accentSalmon};
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
  background-color: ${COLORS.background};
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
  background-color: ${COLORS.primarySalmon};
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
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.accentSalmon};
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

const StoriesHeaderContainer = styled.div`
  background: linear-gradient(
    135deg,
    ${COLORS.cardBackground} 0%,
    ${COLORS.elevatedBackground} 100%
  );
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out forwards;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      ${COLORS.primarySalmon},
      ${COLORS.primaryMint},
      ${COLORS.primarySalmon}
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite linear;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: ${(props) => (props.isPWA ? "0" : "8px")};
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const HeaderContentWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

const IconWrapper = styled.div`
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon}88,
    ${COLORS.primaryMint}88
  );
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .icon-main {
    font-size: 1.4rem;
    color: white;
    z-index: 2;
  }

  .icon-spark {
    position: absolute;
    top: -4px;
    right: -4px;
    font-size: 0.9rem;
    color: ${COLORS.primarySalmon};
    background: ${COLORS.cardBackground};
    border-radius: 50%;
    padding: 3px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    animation: ${pulse} 2s infinite ease-in-out;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;

    .icon-main {
      font-size: 1.2rem;
    }

    .icon-spark {
      font-size: 0.8rem;
    }
  }
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1.4rem;
    font-weight: 700;
    color: ${COLORS.textPrimary};
    letter-spacing: 0.5px;
    position: relative;
    display: inline-block;
    font-family: "Mystery Quest", sans-serif;
    color: ${COLORS.primaryBlueGray};

    &::after {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 40px;
      height: 2px;
      background: ${COLORS.primarySalmon};
      border-radius: 1px;
    }
  }

  @media (max-width: 768px) {
    h3 {
      font-size: 1.2rem;
    }
  }

  @media (max-width: 480px) {
    h3 {
      font-size: 1.1rem;
    }
  }
`;

const Subtitle = styled.div`
  font-size: 0.85rem;
  color: ${COLORS.textSecondary};
  opacity: ${(props) => (props.animate ? 1 : 0)};
  transform: translateY(${(props) => (props.animate ? 0 : "10px")});
  transition: all 0.5s ease-out 0.2s;
  font-style: italic;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const ActiveStoriesIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  svg {
    color: ${COLORS.primarySalmon};
    font-size: 0.9rem;
  }

  .count {
    font-weight: 700;
    color: ${COLORS.textPrimary};
  }

  .text {
    color: ${COLORS.textSecondary};
    font-size: 0.85rem;
    margin-left: 0.25rem;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;

    .text {
      display: none;
    }
  }
`;

const ButtonContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .icon {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    .icon {
      font-size: 0.8rem;
    }
  }
`;

const ButtonGlow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.8),
    transparent 70%
  );
  opacity: 0.5;
  z-index: 1;
  animation: ${glowPulse} 2s infinite ease-in-out;
`;

const ProgressIndicator = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Timeframe = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${COLORS.textTertiary};

  svg {
    font-size: 0.75rem;
  }
`;

const Progress = styled.div`
  height: 100%;
  width: ${(props) => props.width || "0%"};
  background: linear-gradient(
    90deg,
    ${COLORS.primaryMint},
    ${COLORS.primarySalmon}
  );
  border-radius: 2px;
`;

export const ProgressBarBackground = styled.div`
  position: relative;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;

  ${(props) =>
    props.complete &&
    css`
      animation: ${pulse} 1.5s infinite;
    `}
`;

export const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => (props.complete ? "100%" : `${props.progress * 100}%`)};
  background: linear-gradient(
    270deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint},
    ${COLORS.primarySalmon}
  );
  background-size: 400% 400%;
  animation: ${gradientFlow} 3s ease infinite;
  transition: width 0.4s ease-out;
  border-radius: 3px;

  /* Optional wave overlay */
  mask-image: repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 1) 0px,
    rgba(0, 0, 0, 1) 4px,
    rgba(0, 0, 0, 0) 4px,
    rgba(0, 0, 0, 0) 8px
  );
  mask-size: 16px 16px;
`;

export const ProgressParticle = styled.div`
  position: absolute;
  top: 50%;
  left: ${(props) => `${props.progress * 100}%`};
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: radial-gradient(
    circle,
    ${COLORS.primaryMint} 0%,
    transparent 70%
  );
  border-radius: 50%;
  box-shadow: 0 0 10px ${COLORS.primaryMint}, 0 0 20px ${COLORS.primaryMint};
  animation: particlePulse 1.2s infinite;

  @keyframes particlePulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.4);
      opacity: 0.7;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
`;

export default EnhancedStories;
