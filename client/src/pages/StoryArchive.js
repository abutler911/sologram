import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaTrash,
  FaArrowLeft,
  FaArchive,
  FaExclamationTriangle,
  FaRedoAlt,
} from "react-icons/fa";
import { COLORS, THEME } from "../theme"; // Import the theme

// Import LoadingSpinner component
import LoadingSpinner from "../components/common/LoadingSpinner";
// Import DeleteConfirmationModal component
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";

const StoryArchive = () => {
  const [archivedStories, setArchivedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);

  useEffect(() => {
    const fetchArchivedStories = async () => {
      try {
        setLoading(true);
        console.log("Fetching archived stories");

        // Use the original endpoint that's already implemented on the server
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/archived-stories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Archived stories response:", response.data);

        if (response.data.success) {
          setArchivedStories(response.data.data || []);
          setError(null);
        } else {
          throw new Error(
            response.data.message || "Failed to load archived stories"
          );
        }
      } catch (err) {
        console.error("Error fetching archived stories:", err);
        setError("Failed to load archived stories. Please try again.");
        toast.error("Failed to load archived stories");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedStories();
  }, [retryCount]);

  const openDeleteModal = (id) => {
    setStoryToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;

    try {
      const token = localStorage.getItem("token");
      // Use the original endpoint that's already implemented on the server
      const response = await axios.delete(
        `/api/archived-stories/${storyToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setArchivedStories((prevStories) =>
          prevStories.filter((story) => story._id !== storyToDelete)
        );
        toast.success("Story deleted permanently");
      } else {
        throw new Error(response.data.message || "Failed to delete story");
      }
    } catch (err) {
      console.error("Error deleting story:", err);
      toast.error("Failed to delete story");
    } finally {
      setShowDeleteModal(false);
      setStoryToDelete(null);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner text="Loading archived stories" />
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackButton to="/">
            <FaArrowLeft />
            <span>Back to Home</span>
          </BackButton>
          <PageTitle>
            <FaArchive />
            <span>Story Archive</span>
          </PageTitle>
        </Header>

        {error ? (
          <ErrorContainer>
            <ErrorIcon>
              <FaExclamationTriangle />
            </ErrorIcon>
            <ErrorMessage>{error}</ErrorMessage>
            <RetryButton onClick={handleRetry}>
              <FaRedoAlt />
              <span>Retry</span>
            </RetryButton>
          </ErrorContainer>
        ) : archivedStories.length > 0 ? (
          <ArchiveGrid>
            {archivedStories.map((story) => (
              <StoryCard key={story._id}>
                <StoryThumbnail>
                  {story.media && story.media.length > 0 ? (
                    <StoryImage
                      src={story.media[0].mediaUrl}
                      alt={story.title}
                    />
                  ) : (
                    <NoImagePlaceholder>
                      <FaArchive />
                    </NoImagePlaceholder>
                  )}
                  <MediaCount>
                    {story.media ? story.media.length : 0}{" "}
                    {story.media?.length === 1 ? "item" : "items"}
                  </MediaCount>
                </StoryThumbnail>
                <StoryContent>
                  <StoryTitle>{story.title}</StoryTitle>
                  <StoryDate>
                    Created: {new Date(story.createdAt).toLocaleDateString()}
                  </StoryDate>
                  {story.archivedAt && (
                    <ArchivedDate>
                      Archived:{" "}
                      {new Date(story.archivedAt).toLocaleDateString()}
                    </ArchivedDate>
                  )}
                  <ActionButtons>
                    <ViewButton
                      to={`/story-archive/${story._id}`}
                      onClick={() => {
                        localStorage.setItem(
                          "currentArchivedStoryId",
                          story._id
                        );
                      }}
                    >
                      View
                    </ViewButton>
                    <DeleteButton onClick={() => openDeleteModal(story._id)}>
                      <FaTrash />
                    </DeleteButton>
                  </ActionButtons>
                </StoryContent>
              </StoryCard>
            ))}
          </ArchiveGrid>
        ) : (
          <EmptyMessage>
            No archived stories yet. Stories will appear here after they expire.
          </EmptyMessage>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Delete Archived Story"
            message="Are you sure you want to permanently delete this archived story? This action cannot be undone."
            confirmButtonText="Delete Permanently"
          />
        )}
      </Container>
    </PageWrapper>
  );
};

// Styled components updated with Modern Twilight theme
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  margin-right: 2rem;
  transition: all 0.3s ease;

  &:hover {
    color: ${COLORS.primaryBlue};
    transform: translateX(-3px);
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 640px) {
    margin-bottom: 1rem;
  }
`;

const PageTitle = styled.h1`
  color: ${COLORS.textPrimary};
  font-size: 1.75rem;
  margin: 0;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
    color: ${COLORS.primaryPurple};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 0;
  gap: 1.5rem;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  color: #e74c3c;
`;

const ErrorMessage = styled.div`
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  max-width: 600px;
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  background-color: ${COLORS.primaryBlue};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.accentBlue};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${COLORS.textSecondary};
  font-size: 1.125rem;
  padding: 3rem 0;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  border: 1px dashed ${COLORS.border};
  margin-top: 2rem;
`;

const ArchiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const StoryCard = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 2px 8px ${COLORS.shadow};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px ${COLORS.shadow};
    border-color: ${COLORS.primaryPurple}50;
  }
`;

const StoryThumbnail = styled.div`
  height: 200px;
  position: relative;
  overflow: hidden;
`;

const StoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${StoryCard}:hover & {
    transform: scale(1.05);
  }
`;

const NoImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textTertiary};
  font-size: 3rem;
  transition: color 0.3s ease;

  ${StoryCard}:hover & {
    color: ${COLORS.primaryPurple};
  }
`;

const MediaCount = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: ${COLORS.textPrimary};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  backdrop-filter: blur(4px);
  border: 1px solid ${COLORS.border};
`;

const StoryContent = styled.div`
  padding: 1.5rem;
`;

const StoryTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
`;

const StoryDate = styled.div`
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const ArchivedDate = styled.div`
  color: ${COLORS.primaryBlue};
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const ViewButton = styled(Link)`
  background-color: ${COLORS.primaryGreen};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background-color: ${COLORS.accentGreen};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: #e74c3c;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 50%;

  &:hover {
    color: #c0392b;
    background-color: rgba(231, 76, 60, 0.1);
    transform: scale(1.1);
  }
`;

export default StoryArchive;
