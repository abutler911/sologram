import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
} from "react-icons/fa";
import { useSwipeable } from "react-swipeable";

const ArchivedStoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`/api/archived-stories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to load story");
        }

        const fetchedStory = response.data.data;

        if (!fetchedStory) {
          throw new Error("Story data is missing");
        }

        if (!fetchedStory.media || fetchedStory.media.length === 0) {
          throw new Error("No media found in this archived story");
        }

        setStory(fetchedStory);
        setError(null);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load story";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const nextMedia = () => {
    if (story && activeMediaIndex < story.media.length - 1) {
      setActiveMediaIndex((prev) => prev + 1);
    }
  };

  const prevMedia = () => {
    if (story && activeMediaIndex > 0) {
      setActiveMediaIndex((prev) => prev - 1);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextMedia,
    onSwipedRight: prevMedia,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const handleDelete = async () => {
    if (
      !window.confirm("Are you sure you want to permanently delete this story?")
    ) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.delete(`/api/archived-stories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Story deleted successfully");
        navigate("/story-archive");
      } else {
        throw new Error(response.data.message || "Failed to delete story");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to delete story";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading story...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !story) {
    return (
      <PageWrapper>
        <Container>
          <ErrorMessage>{error || "Story not found"}</ErrorMessage>
          <BackLink to="/story-archive">Back to Archive</BackLink>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackLink to="/story-archive">
            <FaArrowLeft />
            <span>Back to Archive</span>
          </BackLink>
          <DeleteButton onClick={handleDelete}>
            <FaTrash />
            <span>Delete</span>
          </DeleteButton>
        </Header>

        <StoryTitle>{story.title}</StoryTitle>
        <StoryDate>
          Created: {new Date(story.createdAt).toLocaleDateString()}
          {story.archivedAt && (
            <span>
              {" "}
              • Archived: {new Date(story.archivedAt).toLocaleDateString()}
            </span>
          )}
        </StoryDate>

        <MediaContainer {...swipeHandlers}>
          <MediaTrack
            style={{ transform: `translateX(-${activeMediaIndex * 100}%)` }}
          >
            {story.media.map((media, index) => (
              <MediaItem key={index}>
                {media.mediaType === "image" ? (
                  <MediaImage
                    src={media.mediaUrl}
                    alt={`${story.title} - Image ${index + 1}`}
                  />
                ) : (
                  <MediaVideo src={media.mediaUrl} controls />
                )}
              </MediaItem>
            ))}
          </MediaTrack>

          {story.media.length > 1 && (
            <>
              <NavButton
                className="prev"
                onClick={prevMedia}
                disabled={activeMediaIndex === 0}
              >
                <FaChevronLeft />
              </NavButton>
              <NavButton
                className="next"
                onClick={nextMedia}
                disabled={activeMediaIndex === story.media.length - 1}
              >
                <FaChevronRight />
              </NavButton>

              <MediaCounter>
                {activeMediaIndex + 1} / {story.media.length}
              </MediaCounter>

              <DotIndicators>
                {story.media.map((_, index) => (
                  <Dot
                    key={index}
                    active={index === activeMediaIndex}
                    onClick={() => setActiveMediaIndex(index)}
                  />
                ))}
              </DotIndicators>
            </>
          )}
        </MediaContainer>
      </Container>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  color: #ddd;
  text-decoration: none;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const StoryTitle = styled.h1`
  color: #fff;
  font-size: 1.75rem;
  margin: 0 0 0.5rem;
`;

const StoryDate = styled.div`
  color: #aaa;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #ddd;
  font-size: 1.125rem;
  padding: 3rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.9);
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const MediaContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  background-color: #000;
  aspect-ratio: 16 / 9;

  @media (max-width: 768px) {
    aspect-ratio: 1 / 1;
  }
`;

const MediaTrack = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease-out;
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const MediaVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }

  &.prev {
    left: 1rem;
  }

  &.next {
    right: 1rem;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const MediaCounter = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const DotIndicators = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const Dot = styled.button`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? "#ff7e5f" : "rgba(255, 255, 255, 0.5)"};
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) =>
      props.active ? "#ff7e5f" : "rgba(255, 255, 255, 0.8)"};
  }
`;

export default ArchivedStoryView;
