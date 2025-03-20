// components/stories/Stories.js
import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { FaTimes, FaVideo, FaTrash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext"; // Import AuthContext

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [deleting, setDeleting] = useState(false);
  
  // Get authentication context to check if user is admin
  const { user, isAuthenticated } = useContext(AuthContext);
  const isAdmin = isAuthenticated && user && user.role === 'admin';

  // Fetch stories when component mounts
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await axios.get("/api/stories");
        setStories(response.data.data);
      } catch (error) {
        console.error("Error fetching stories:", error);
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
      const currentMedia = activeStory.media[activeStoryIndex];
      // Set longer duration for videos (don't auto-progress)
      const isVideo = currentMedia.mediaType === "video";
      
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
  }, [activeStory, activeStoryIndex, timeLeft]);

  const nextStoryItem = () => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setTimeLeft(10);
    } else {
      // End of story items, close the story
      setActiveStory(null);
      setActiveStoryIndex(0);
    }
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
    if (activeStoryIndex < activeStory.media.length - 1) {
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

  // Handle story deletion
  const handleDeleteStory = async () => {
    if (!activeStory || !isAdmin) return;
    
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete the story "${activeStory.title}"?`)) {
      return;
    }
    
    setDeleting(true);
    
    try {
      await axios.delete(`/api/stories/${activeStory._id}`);
      
      // Update the UI by removing the deleted story
      setStories(prevStories => 
        prevStories.filter(story => story._id !== activeStory._id)
      );
      
      // Close the story view
      closeStory();
      
      toast.success("Story deleted successfully");
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Failed to delete story");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <StoriesContainer>
        <p>Loading stories...</p>
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
        {stories.map((story) => {
          const firstMedia = story.media[0];
          const isVideo = firstMedia.mediaType === "video";
          
          return (
            <StoryCircle key={story._id} onClick={() => openStory(story)}>
              <StoryImageWrapper>
                <ThumbnailImage src={firstMedia.mediaUrl} alt={story.title} />
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
                onClick={handleDeleteStory}
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
        </StoryModal>
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
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
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
`;

// Thumbnail image (circle shape)
const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

// Full-screen image (no border radius)
const FullScreenImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
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
  font-size: 0.75rem;
  color: #ddd;
  margin-top: 0.5rem;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

// Added a controls bar to hold both close and delete buttons
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

// New delete button for admin
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

export default Stories;