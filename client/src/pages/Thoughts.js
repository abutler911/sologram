import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { keyframes } from "styled-components";
import { FaSearch, FaTimes, FaPlusCircle } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { format } from "date-fns";

// Import ThoughtCard component
import ThoughtCard from "../components/ThoughtCard";

// Import theme constants
import { moodColors, moodEmojis } from "../utils/themeConstants";

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

// Styled components for the page layout
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 0 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.3rem;
  color: #ff7e5f;
  margin: 0;
  font-family: "Autography", cursive;
  transform: rotate(-2deg);
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(255, 126, 95, 0.3);
`;

const MoodFilter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  max-width: 100%;
`;

const MoodButton = styled.button`
  background-color: ${(props) =>
    props.active
      ? props.mood
        ? props.mood === "all"
          ? "#ff7e5f"
          : moodColors[props.mood].primary
        : "#ff7e5f"
      : "#333333"};
  color: ${(props) => (props.active ? "#121212" : "#dddddd")};
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: ${(props) =>
    props.active ? "0 3px 8px rgba(0, 0, 0, 0.3)" : "none"};

  &:hover {
    background-color: ${(props) =>
      props.mood && props.mood !== "all"
        ? moodColors[props.mood].primary
        : "#ff7e5f"};
    color: #121212;
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  }
  transition: all 0.2s ease-in-out;
`;

const CreateButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 3px 8px rgba(255, 126, 95, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 126, 95, 0.4);
  }

  svg {
    font-size: 1rem;
  }
`;

const SearchContainer = styled.div`
  ${(props) =>
    props.expanded &&
    `
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 0.5rem;
    z-index: 100;
    
    @media (min-width: 769px) {
      position: relative;
      left: auto;
      right: auto;
      top: auto;
      width: 300px;
    }
  `}
`;

const SearchToggle = styled.button`
  background: none;
  border: none;
  color: #dddddd;
  font-size: 1.125rem;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    color: #ff7e5f;
    transform: scale(1.1);
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: #1e1e1e;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid #333333;
  transition: all 0.3s;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);

  &:focus-within {
    border-color: #ff7e5f;
    box-shadow: 0 3px 15px rgba(255, 126, 95, 0.15);
  }
`;

const SearchInput = styled.input`
  font-family: "Space Grotesk", sans-serif;
  flex: 1;
  background-color: transparent;
  border: none;
  color: #ffffff;
  padding: 0.6rem 1.2rem;
  font-size: 0.875rem;
  outline: none;

  &::placeholder {
    color: #888888;
  }
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: #888888;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    color: #ff7e5f;
    transform: scale(1.1);
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #888888;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    color: #ff7e5f;
    transform: scale(1.1);
  }
`;

const CloseSearchButton = styled.button`
  background: none;
  border: none;
  color: #888888;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  @media (min-width: 769px) {
    display: none;
  }

  &:hover {
    color: #ff7e5f;
    transform: scale(1.1);
  }
`;

const ThoughtsContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  padding: 1.25rem;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 107, 107, 0.3);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.1);
  animation: ${fadeIn} 0.4s ease-out;
`;

const LoadingMessage = styled.div`
  color: #aaaaaa;
  text-align: center;
  padding: 2rem 0;
  font-style: italic;
  animation: ${fadeIn} 0.4s ease-out;
`;

const EmptyMessage = styled.div`
  color: #aaaaaa;
  text-align: center;
  padding: 2rem 0;
  font-style: italic;
  animation: ${fadeIn} 0.4s ease-out;
`;

const LoadingMore = styled.div`
  color: #aaaaaa;
  text-align: center;
  padding: 1.5rem 0;
  font-style: italic;
  font-size: 0.875rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const FloatingButton = styled(Link)`
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: #fff;
  padding: 1rem;
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  font-size: 1.5rem;
  z-index: 999;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(255, 126, 95, 0.5);
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

// Modal components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const DeleteModal = styled.div`
  background-color: #1e1e1e;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  z-index: 1001;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: ${fadeIn} 0.4s ease-out;
`;

const DeleteModalContent = styled.div`
  padding: 1.5rem;
  color: #ddd;
  line-height: 1.6;

  h3 {
    color: #ff7e5f;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
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
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 8px rgba(231, 76, 60, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
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
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
`;

// Retweet modal components
const RetweetModal = styled.div`
  background-color: #1e1e1e;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  z-index: 1001;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  text-align: center;
  animation: ${fadeIn} 0.4s ease-out;
`;

const RetweetModalContent = styled.div`
  color: #ddd;
  line-height: 1.6;

  h3 {
    color: #ff7e5f;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }
`;

const RetweetCloseButton = styled.button`
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
  box-shadow: 0 3px 8px rgba(255, 126, 95, 0.3);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(255, 126, 95, 0.4);
  }
`;

// Main component function
const Thoughts = () => {
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);
  // Updated to check for both admin and creator roles
  const canCreateThought =
    isAuthenticated && (user?.role === "admin" || user?.role === "creator");
  const [selectedMood, setSelectedMood] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [thoughtToDelete, setThoughtToDelete] = useState(null);

  // State for retweet modal
  const [showRetweetModal, setShowRetweetModal] = useState(false);

  // Hardcoded user info
  const defaultUser = {
    username: "Andrew",
    handle: "andrew",
    avatar: null,
  };

  const fetchThoughts = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const currentPage = reset ? 1 : page;
        const url = searchQuery
          ? `/api/thoughts/search?query=${searchQuery}&page=${currentPage}`
          : `/api/thoughts?page=${currentPage}`;

        const response = await axios.get(url);
        const newThoughts = response.data.data.map((thought) => ({
          ...thought,
          user: defaultUser,
          userHasLiked: false,
          comments: thought.comments || [],
          shares: Math.floor(Math.random() * 10),
        }));

        setThoughts((prevThoughts) => {
          if (reset || currentPage === 1) return newThoughts;
          return [...prevThoughts, ...newThoughts];
        });

        setHasMore(currentPage < response.data.totalPages);
        setError(null);
      } catch (err) {
        console.error("Error fetching thoughts:", err);
        setError("Failed to load thoughts. Please try again.");
        toast.error("Failed to load thoughts");
      } finally {
        setLoading(false);
      }
    },
    [page, searchQuery]
  );

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchThoughts(true);
    if (window.innerWidth <= 768) setSearchExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
    fetchThoughts(true);
  };

  // Handle like function
  const handleLike = async (id) => {
    try {
      const response = await axios.put(`/api/thoughts/${id}/like`);

      // Update thoughts with the liked status
      setThoughts((prevThoughts) =>
        prevThoughts.map((thought) => {
          if (thought._id === id) {
            return {
              ...response.data.data,
              user: defaultUser,
              userHasLiked: !thought.userHasLiked,
              comments: thought.comments,
              shares: thought.shares,
            };
          }
          return thought;
        })
      );
    } catch (err) {
      console.error("Error liking thought:", err);
      toast.error("Failed to like thought");
    }
  };

  // Handle retweet function
  const handleRetweet = () => {
    setShowRetweetModal(true);
  };

  // Handle pin function
  const handlePin = async (id) => {
    try {
      const response = await axios.put(`/api/thoughts/${id}/pin`);
      // Refresh thoughts to get updated pinned status
      fetchThoughts(true);
      toast.success(
        `Thought ${
          response.data.data.pinned ? "pinned" : "unpinned"
        } successfully`
      );
    } catch (err) {
      console.error("Error pinning thought:", err);
      toast.error("Failed to update pin status");
    }
  };

  // Delete modal functions
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setThoughtToDelete(null);
  };

  const confirmDelete = async () => {
    if (!thoughtToDelete) return;
    try {
      await axios.delete(`/api/thoughts/${thoughtToDelete}`);
      setThoughts((prev) =>
        prev.filter((thought) => thought._id !== thoughtToDelete)
      );
      toast.success("Thought deleted");
    } catch (err) {
      console.error("Error deleting thought:", err);
      toast.error("Failed to delete thought");
    } finally {
      setShowDeleteModal(false);
      setThoughtToDelete(null);
    }
  };

  // Infinite scroll functionality
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200 &&
      !loading &&
      hasMore
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy • h:mm a");
  };

  const filteredThoughts = thoughts.filter((thought) => {
    if (selectedMood === "all") return true;
    return thought.mood === selectedMood;
  });

  return (
    <MainLayout>
      <PageWrapper>
        <Header>
          <HeaderLeft>
            <PageTitle>SoloThoughts</PageTitle>
            <MoodFilter>
              <MoodButton
                active={selectedMood === "all"}
                onClick={() => setSelectedMood("all")}
              >
                All
              </MoodButton>
              {Object.keys(moodEmojis).map((mood) => (
                <MoodButton
                  key={mood}
                  active={selectedMood === mood}
                  mood={mood}
                  onClick={() => setSelectedMood(mood)}
                >
                  {moodEmojis[mood]}
                </MoodButton>
              ))}
            </MoodFilter>
          </HeaderLeft>

          <HeaderRight>
            {/* Only show create button if user has admin or creator role */}
            {canCreateThought && (
              <CreateButton to="/thoughts/create">
                <FaPlusCircle />
                <span>New Thought</span>
              </CreateButton>
            )}

            <SearchContainer expanded={searchExpanded}>
              {!searchExpanded ? (
                <SearchToggle onClick={() => setSearchExpanded(true)}>
                  <FaSearch />
                </SearchToggle>
              ) : (
                <SearchForm onSubmit={handleSearchSubmit}>
                  <SearchInput
                    type="text"
                    placeholder="Search thoughts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <ClearButton
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      <FaTimes />
                    </ClearButton>
                  )}
                  <SearchButton type="submit">
                    <FaSearch />
                  </SearchButton>
                  <CloseSearchButton
                    type="button"
                    onClick={() => setSearchExpanded(false)}
                  >
                    <FaTimes />
                  </CloseSearchButton>
                </SearchForm>
              )}
            </SearchContainer>
          </HeaderRight>
        </Header>

        <ThoughtsContainer>
          {error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : filteredThoughts.length > 0 ? (
            filteredThoughts.map((thought) => (
              <ThoughtCard
                key={thought._id}
                thought={thought}
                defaultUser={defaultUser}
                formatDate={formatDate}
                handleLike={handleLike}
                handleRetweet={handleRetweet}
                handlePin={handlePin}
                canCreateThought={canCreateThought}
                onDelete={(id) => {
                  setThoughtToDelete(id);
                  setShowDeleteModal(true);
                }}
              />
            ))
          ) : loading ? (
            <LoadingMessage>Loading thoughts...</LoadingMessage>
          ) : (
            <EmptyMessage>
              No thoughts found
              {searchQuery && " matching your search"}
              {selectedMood !== "all" && ` with mood "${selectedMood}"`}.
            </EmptyMessage>
          )}

          {loading && thoughts.length > 0 && (
            <LoadingMore>Loading more thoughts...</LoadingMore>
          )}
        </ThoughtsContainer>
      </PageWrapper>

      {/* Only show modals and floating button if user has admin or creator role */}
      {canCreateThought && (
        <>
          {showDeleteModal && (
            <ModalOverlay>
              <DeleteModal>
                <DeleteModalContent>
                  <h3>Delete Thought</h3>
                  <p>This cannot be undone. Are you sure?</p>
                  <DeleteModalButtons>
                    <CancelButton onClick={cancelDelete}>Cancel</CancelButton>
                    <ConfirmDeleteButton onClick={confirmDelete}>
                      Delete
                    </ConfirmDeleteButton>
                  </DeleteModalButtons>
                </DeleteModalContent>
              </DeleteModal>
              <Backdrop onClick={cancelDelete} />
            </ModalOverlay>
          )}

          <FloatingButton to="/thoughts/create">
            <FaPlusCircle />
          </FloatingButton>
        </>
      )}

      {/* Retweet Modal - shown to all users */}
      {showRetweetModal && (
        <ModalOverlay>
          <RetweetModal>
            <RetweetModalContent>
              <h3>Thought Re-Thought!</h3>
              <p>Your thought has been re-thought into the netherworld!</p>
              <p>The cosmic thought-sphere acknowledges your contribution.</p>
              <RetweetCloseButton onClick={() => setShowRetweetModal(false)}>
                Cool!
              </RetweetCloseButton>
            </RetweetModalContent>
          </RetweetModal>
          <Backdrop onClick={() => setShowRetweetModal(false)} />
        </ModalOverlay>
      )}
    </MainLayout>
  );
};

export default Thoughts;
