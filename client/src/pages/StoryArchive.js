import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaTrash, FaArrowLeft } from "react-icons/fa";

const StoryArchive = () => {
  const [archivedStories, setArchivedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch archived stories
  useEffect(() => {
    const fetchArchivedStories = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/stories/archived");
        setArchivedStories(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching archived stories:", err);
        setError("Failed to load archived stories");
        toast.error("Failed to load archived stories");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedStories();
  }, []);

  // Handle story deletion
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this archived story?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/stories/archived/${id}`);
      setArchivedStories((prevStories) =>
        prevStories.filter((story) => story._id !== id)
      );
      toast.success("Story deleted permanently");
    } catch (err) {
      console.error("Error deleting story:", err);
      toast.error("Failed to delete story");
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading archived stories...</LoadingMessage>
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
          <PageTitle>Story Archive</PageTitle>
        </Header>

        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : archivedStories.length > 0 ? (
          <ArchiveGrid>
            {archivedStories.map((story) => (
              <StoryCard key={story._id}>
                <StoryImage src={story.media[0].mediaUrl} alt={story.title} />
                <StoryContent>
                  <StoryTitle>{story.title}</StoryTitle>
                  <StoryDate>
                    {new Date(story.createdAt).toLocaleDateString()}
                  </StoryDate>
                  <StoryMeta>
                    {story.media.length}{" "}
                    {story.media.length === 1 ? "image" : "images"}
                  </StoryMeta>
                  <ActionButtons>
                    <ViewButton to={`/story-archive/${story._id}`}>
                      View
                    </ViewButton>
                    <DeleteButton onClick={() => handleDelete(story._id)}>
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
      </Container>
    </PageWrapper>
  );
};

// Styled components (similar to your dark theme styling)
const PageWrapper = styled.div`
  background-color: #121212;
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
  color: #ddd;
  text-decoration: none;
  margin-right: 2rem;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 640px) {
    margin-bottom: 1rem;
  }
`;

const PageTitle = styled.h1`
  color: #fff;
  font-size: 1.75rem;
  margin: 0;
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

const EmptyMessage = styled.div`
  text-align: center;
  color: #ddd;
  font-size: 1.125rem;
  padding: 3rem 0;
`;

const ArchiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const StoryCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const StoryImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const StoryContent = styled.div`
  padding: 1.5rem;
`;

const StoryTitle = styled.h2`
  color: #fff;
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
`;

const StoryDate = styled.div`
  color: #aaa;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const StoryMeta = styled.div`
  color: #888;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ViewButton = styled(Link)`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  text-decoration: none;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: #e74c3c;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #c0392b;
  }
`;

export default StoryArchive;
