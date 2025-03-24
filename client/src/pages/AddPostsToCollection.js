import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaFolder,
  FaSearch,
  FaPlus,
  FaCheck,
  FaPlay,
} from "react-icons/fa";

const AddPostsToCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch collection and posts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get collection details
        const collectionResponse = await axios.get(`/api/collections/${id}`);
        const collectionData = collectionResponse.data.data;
        setCollection(collectionData);

        // Get all posts
        const postsResponse = await axios.get("/api/posts");
        const postsData = postsResponse.data.data;

        // Filter out posts that are already in the collection
        const collectionPostIds = collectionData.posts.map((post) => post._id);
        const availablePosts = postsData.filter(
          (post) => !collectionPostIds.includes(post._id)
        );

        setAllPosts(availablePosts);
        setFilteredPosts(availablePosts);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Filter posts based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPosts(allPosts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allPosts.filter(
        (post) =>
          post.caption.toLowerCase().includes(query) ||
          (post.content && post.content.toLowerCase().includes(query)) ||
          (post.tags &&
            post.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, allPosts]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle post selection
  const togglePostSelection = (postId) => {
    if (selectedPosts.includes(postId)) {
      setSelectedPosts(selectedPosts.filter((id) => id !== postId));
    } else {
      setSelectedPosts([...selectedPosts, postId]);
    }
  };

  // Add selected posts to collection
  const addPostsToCollection = async () => {
    if (selectedPosts.length === 0) {
      toast.error("Please select at least one post");
      return;
    }

    try {
      setSubmitting(true);

      // Add each selected post to the collection
      for (const postId of selectedPosts) {
        await axios.post(`/api/collections/${id}/posts`, { postId });
      }

      toast.success(`Added ${selectedPosts.length} posts to collection`);
      navigate(`/collections/${id}`);
    } catch (err) {
      console.error("Error adding posts to collection:", err);
      toast.error("Failed to add posts to collection");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading...</LoadingMessage>
      </Container>
    );
  }

  if (error || !collection) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorMessage>{error || "Collection not found"}</ErrorMessage>
          <BackButton to="/collections">
            <FaArrowLeft />
            <span>Back to Collections</span>
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton to={`/collections/${id}`}>
        <FaArrowLeft />
        <span>Back to Collection</span>
      </BackButton>

      <PageHeader>
        <PageInfo>
          <PageTitle>
            <FaFolder />
            <span>Add Posts to "{collection.name}"</span>
          </PageTitle>
          <PageDescription>
            Select posts to add to your collection
          </PageDescription>
        </PageInfo>

        <SearchContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </SearchContainer>
      </PageHeader>

      {filteredPosts.length === 0 ? (
        <EmptyState>
          {searchQuery ? (
            <EmptyText>No posts found matching your search</EmptyText>
          ) : (
            <EmptyText>No posts available to add to this collection</EmptyText>
          )}
        </EmptyState>
      ) : (
        <>
          <SelectionSummary>
            <SelectedCount>{selectedPosts.length} posts selected</SelectedCount>

            <ActionButtons>
              {selectedPosts.length > 0 && (
                <ClearSelectionButton onClick={() => setSelectedPosts([])}>
                  Clear Selection
                </ClearSelectionButton>
              )}

              <AddButton
                onClick={addPostsToCollection}
                disabled={selectedPosts.length === 0 || submitting}
              >
                <FaPlus />
                <span>
                  {submitting
                    ? "Adding..."
                    : `Add ${
                        selectedPosts.length > 0 ? selectedPosts.length : ""
                      } Posts`}
                </span>
              </AddButton>
            </ActionButtons>
          </SelectionSummary>

          <PostsGrid>
            {filteredPosts.map((post) => (
              <PostItem
                key={post._id}
                selected={selectedPosts.includes(post._id)}
                onClick={() => togglePostSelection(post._id)}
              >
                <SelectionIndicator selected={selectedPosts.includes(post._id)}>
                  {selectedPosts.includes(post._id) ? <FaCheck /> : <FaPlus />}
                </SelectionIndicator>

                {post.media && post.media.length > 0 && (
                  <PostThumbnail>
                    {post.media[0].mediaType === "image" ? (
                      <ThumbnailImage
                        src={post.media[0].mediaUrl}
                        alt={post.caption}
                      />
                    ) : (
                      <ThumbnailVideo>
                        <VideoIcon />
                        <VideoOverlay />
                      </ThumbnailVideo>
                    )}
                  </PostThumbnail>
                )}

                <PostDetails>
                  <PostTitle>{post.caption}</PostTitle>

                  {post.content && (
                    <PostContent>
                      {post.content.length > 80
                        ? `${post.content.substring(0, 80)}...`
                        : post.content}
                    </PostContent>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <TagsContainer>
                      {post.tags.map((tag, index) => (
                        <Tag key={index}>#{tag}</Tag>
                      ))}
                    </TagsContainer>
                  )}
                </PostDetails>
              </PostItem>
            ))}
          </PostsGrid>
        </>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #666666;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PageInfo = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  font-size: 1.75rem;
  color: #333333;
  margin: 0 0 0.5rem 0;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
  }
`;

const PageDescription = styled.p`
  color: #666666;
  margin: 0;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999999;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const SelectionSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const SelectedCount = styled.div`
  font-weight: 600;
  color: #333333;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ClearSelectionButton = styled.button`
  background-color: transparent;
  color: #666666;
  border: 1px solid #dddddd;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #f2f2f2;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EmptyText = styled.p`
  color: #666666;
  font-size: 1.125rem;
  margin: 0;
`;

const PostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PostItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid ${(props) => (props.selected ? "#ff7e5f" : "transparent")};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const SelectionIndicator = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background-color: ${(props) =>
    props.selected ? "#ff7e5f" : "rgba(255, 255, 255, 0.9)"};
  color: ${(props) => (props.selected ? "white" : "#666666")};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border: 1px solid ${(props) => (props.selected ? "#ff7e5f" : "#dddddd")};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PostThumbnail = styled.div`
  width: 100%;
  height: 180px;
  position: relative;
  background-color: #f3f3f3;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailVideo = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #222222;
`;

const VideoIcon = styled(FaPlay)`
  font-size: 2rem;
  color: white;
  z-index: 1;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6));
`;

const PostDetails = styled.div`
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PostTitle = styled.h2`
  font-size: 1.125rem;
  margin: 0 0 0.75rem 0;
  color: #333333;
`;

const PostContent = styled.p`
  font-size: 0.875rem;
  color: #666666;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  flex: 1;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: auto;
`;

const Tag = styled.span`
  background-color: #f2f2f2;
  color: #666666;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #666666;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

export default AddPostsToCollection;
