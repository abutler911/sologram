// components/stories/Stories.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

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
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        // Move to next story item
        if (activeStoryIndex < activeStory.media.length - 1) {
          setActiveStoryIndex((prev) => prev + 1);
          setTimeLeft(10);
        } else {
          // End of story items, close the story
          setActiveStory(null);
          setActiveStoryIndex(0);
        }
      }
    }

    return () => clearTimeout(timer);
  }, [activeStory, activeStoryIndex, timeLeft]);

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

  if (loading) {
    return (
      <StoriesContainer>
        <p>Loading stories...</p>
      </StoriesContainer>
    );
  }

  return (
    <>
      <StoriesContainer>
        {stories.map((story) => (
          <StoryCircle key={story._id} onClick={() => openStory(story)}>
            <StoryImage src={story.media[0].mediaUrl} alt={story.title} />
            <StoryTitle>{story.title}</StoryTitle>
          </StoryCircle>
        ))}
      </StoriesContainer>

      {activeStory && (
        <StoryModal>
          <CloseButton onClick={closeStory}>
            <FaTimes />
          </CloseButton>

          <ProgressContainer>
            {activeStory.media.map((_, index) => (
              <ProgressBar
                key={index}
                active={index === activeStoryIndex}
                complete={index < activeStoryIndex}
                progress={index === activeStoryIndex ? (10 - timeLeft) / 10 : 0}
              />
            ))}
          </ProgressContainer>

          <StoryContent>
            <StoryImage
              src={activeStory.media[activeStoryIndex].mediaUrl}
              alt={activeStory.title}
            />

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

const StoryCircle = styled.div`
  flex: 0 0 auto;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

const StoryImage = styled.img`
  width: 65px;
  height: 65px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff7e5f;
  padding: 3px;
  background-color: #fff;
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

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1001;
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

  img {
    max-width: 100%;
    max-height: 90vh;
    width: auto;
    height: auto;
    border: none;
    border-radius: 0;
    padding: 0;
  }
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
