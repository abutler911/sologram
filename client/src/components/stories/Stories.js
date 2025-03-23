// components/stories/Stories.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import styled from "styled-components";
import { FaTimes, FaVideo, FaTrash, FaExclamationTriangle, FaClock, FaArchive } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from 'axios'; // Use direct axios instead of storiesApi for now
import { AuthContext } from "../../context/AuthContext";

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
  
  // Get authentication context to check if user is admin
  const { user, isAuthenticated } = useContext(AuthContext);
  const isAdmin = isAuthenticated && user && user.role === 'admin';

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
          setStories(response.data.data);
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
    
    // Set up a refresh interval to check for expired stories every minute
    const refreshInterval = setInterval(fetchStories, 60000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(refreshInterval);
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
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/stories/${storyToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Update the UI by removing the deleted story
        setStories(prevStories => 
          prevStories.filter(story => story._id !== storyToDelete._id)
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
      
      if (url && url.includes('cloudinary.com')) {
        // Extract relevant parts of the URL
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        
        if (uploadIndex !== -1) {
          // Insert thumbnail transformation after 'upload'
          urlParts.splice(uploadIndex + 1, 0, 'w_400,h_400,c_fill,g_auto,so_1');
          
          // Get file extension
          const filename = urlParts[urlParts.length - 1];
          const extension = filename.split('.').pop();
          
          // Replace extension if it's a video format
          const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
          if (videoExtensions.includes(extension.toLowerCase())) {
            urlParts[urlParts.length - 1] = filename.replace(`.${extension}`, '.jpg');
          }
          
          return urlParts.join('/');
        }
      }
      
      // Return a default video thumbnail if we couldn't transform the URL
      return '/video-thumbnail-placeholder.jpg';
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
          const thumbnailUrl = firstMedia ? getThumbnailUrl(firstMedia) : "/placeholder-image.jpg";
          const expirationTime = getExpirationTime(story);
          
          return (
            <StoryCircle key={story._id} onClick={() => openStory(story)}>
              <StoryImageWrapper>
                <ThumbnailImage 
                  src={thumbnailUrl} 
                  alt={story.title} 
                  onError={(e) => {
                    // Fallback to a styled container if image fails to load
                    e.target.style.display = 'none';
                    e.target.parentNode.classList.add('image-fallback');
                  }}
                />
                {isVideo && <VideoIndicator><FaVideo /></VideoIndicator>}
                
              </StoryImageWrapper>
              <StoryTitle>{story.title}</StoryTitle>
            </StoryCircle>
          );
        })}
      </StoriesContainer>

      {activeStory && (
        <StoryModal>
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

          <ProgressContainer>
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
          </ProgressContainer>

          <StoryContent>
            {activeStory.media[activeStoryIndex].mediaType === "video" ? (
              <StoryVideo 
                src={activeStory.media[activeStoryIndex].mediaUrl} 
                controls 
                autoPlay 
                onEnded={handleNext}
              />
            ) : (
              <FullScreenImage
                src={activeStory.media[activeStoryIndex].mediaUrl}
                alt={activeStory.title}
              />
            )}

            <StoryNavigation>
              <NavArea onClick={handlePrev} side="left" />
              <NavArea onClick={handleNext} side="right" />
            </StoryNavigation>
          </StoryContent>
          
          <StoryInfo>
            <StoryInfoTitle>{activeStory.title}</StoryInfoTitle>
            <StoryInfoExpires>
              Expires in: {getExpirationTime(activeStory)}
            </StoryInfoExpires>
          </StoryInfo>
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
              Are you sure you want to delete the story "{storyToDelete?.title}"?
              <br />
              This action cannot be undone.
            </DeleteModalContent>
            
            <DeleteModalButtons>
              <CancelButton onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </CancelButton>
              <ConfirmDeleteButton onClick={handleDeleteStory} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Story"}
              </ConfirmDeleteButton>
            </DeleteModalButtons>
          </DeleteModal>
        </ModalOverlay>
      )}
    </>
  );
};

// Styled Components
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
  color: #aaa;
  transition: color 0.3s;
  
  &:hover {
    color: #ff7e5f;
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
  color: #888;
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

const EmptyMessage = styled.p`
  color: #888;
  width: 100%;
  text-align: center;
  padding: 1rem 0;
`;

const StoryCircle = styled.div`
  flex: 0 0 auto;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

const StoryImageWrapper = styled.div`
  position: relative;
  width: 65px;
  height: 65px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ff7e5f;
  padding: 3px;
  background-color: #333;
  
  &.image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #444;
    
    &:before {
      content: '\\f03e'; /* Image icon in Font Awesome */
      font-family: 'Font Awesome 5 Free';
      font-weight: 900;
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
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
  color: white;
  font-size: 0.8rem;
`;



const StoryTitle = styled.span`
   font-size: 0.65rem;
  color: #ddd;
  margin: 0.5rem 0 0;
  text-align: center;
  max-width: 80px;
  white-space: normal; 
  overflow: visible; 
  word-wrap: break-word; 
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical;
`;

const StoryModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const ControlsBar = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1001;
  display: flex;
  gap: 1rem;
`;

const CloseButton = styled.button`
  background: none;
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
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const DeleteButton = styled.button`
  background-color: rgba(231, 76, 60, 0.7);
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
    background-color: rgba(231, 76, 60, 0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 1rem;
  gap: 4px;
`;

const ProgressBar = styled.div`
  height: 3px;
  flex: 1;
  background-color: rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;

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
    background-color: white;
    transition: width 1s linear;
  }
`;

const StoryContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const FullScreenImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
`;

const StoryVideo = styled.video`
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
`;

const StoryNavigation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
`;

const NavArea = styled.div`
  flex: 1;
  cursor: pointer;
`;

const StoryInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1.5rem;
  color: white;
`;

const StoryInfoTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
`;

const StoryInfoExpires = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #eee;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Custom delete confirmation modal
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
  z-index: 2000; // Higher than the story modal
  padding: 1rem;
`;

const DeleteModal = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const DeleteModalHeader = styled.div`
  background-color: #e74c3c;
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
  color: #ddd;
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
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #c0392b;
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
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #333;
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