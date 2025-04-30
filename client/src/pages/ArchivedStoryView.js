import React, { useState, useEffect, useContext } from "react";
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
import { AuthContext } from "../context/AuthContext";
import { COLORS } from "../theme"; // Import the theme
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const ArchivedStoryView = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  const [story, setStory] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const isAdmin = user?.role === "admin";
  const isCreator = story && user?._id === story.createdBy;
  const canDelete = isAuthenticated && (isAdmin || isCreator);

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
        <Header />
        <Container>
          <LoadingMessage>Loading story...</LoadingMessage>
        </Container>
        <Footer />
      </PageWrapper>
    );
  }

  if (error || !story) {
    return (
      <PageWrapper>
        <Header />
        <Container>
          <ErrorMessage>{error || "Story not found"}</ErrorMessage>
          <BackLink to="/story-archive">Back to Archive</BackLink>
        </Container>
        <Footer />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header />
      <Container>
        <PageHeader>
          <BackLink to="/story-archive">
            <FaArrowLeft />
            <span>Back to Archive</span>
          </BackLink>
          {canDelete && (
            <DeleteButton onClick={handleDelete}>
              <FaTrash />
              <span>Delete</span>
            </DeleteButton>
          )}
        </PageHeader>

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
      <Footer />
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  flex: 1;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: ${COLORS.primarySalmon};
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: ${COLORS.error};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b; /* Darker red on hover */
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const StoryTitle = styled.h1`
  color: ${COLORS.textPrimary};
  font-size: 1.75rem;
  margin: 0 0 0.5rem;
`;

const StoryDate = styled.div`
  color: ${COLORS.textTertiary};
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${COLORS.textSecondary};
  font-size: 1.125rem;
  padding: 3rem 0;
`;

const ErrorMessage = styled.div`
  background-color: ${COLORS.primarySalmon}15;
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  border: 1px solid ${COLORS.primarySalmon}30;
`;

const MediaContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  background-color: ${COLORS.elevatedBackground};
  aspect-ratio: 16 / 9;
  box-shadow: 0 4px 10px ${COLORS.shadow};

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
  background-color: rgba(
    101,
    142,
    169,
    0.4
  ); /* Using primaryBlueGray with opacity */
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
    background-color: rgba(101, 142, 169, 0.7); /* Darker on hover */
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
  background-color: rgba(136, 178, 204, 0.7); /* primaryMint with opacity */
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
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
    props.active ? COLORS.primarySalmon : "rgba(255, 255, 255, 0.5)"};
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.active ? COLORS.primarySalmon : COLORS.primaryKhaki};
    transform: scale(1.1);
  }
`;

export default ArchivedStoryView;
