import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { keyframes } from "styled-components";
import { FaSearch, FaTimes, FaRetweet } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { useDeleteModal } from "../context/DeleteModalContext";
import MainLayout from "../components/layout/MainLayout";
import { format } from "date-fns";

// Import ThoughtCard component
import ThoughtCard from "../components/posts/ThoughtCard";

// Import LoadingSpinner component
import LoadingSpinner from "../components/common/LoadingSpinner";

// Import theme constants
import { COLORS } from "../theme";
import { moodColors, moodEmojis } from "../utils/themeConstants";

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shine = keyframes`
  0% {
    background-position: -100px;
  }
  40%, 100% {
    background-position: 200px;
  }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 15px rgba(233, 137, 115, 0.4); }
  50% { box-shadow: 0 0 25px rgba(233, 137, 115, 0.7); }
  100% { box-shadow: 0 0 15px rgba(233, 137, 115, 0.4); }
`;

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0.5rem 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 0 0.5rem;
    margin-bottom: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
    padding: 0 0.5rem;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
    padding: 0 0.5rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.3rem;
  color: ${COLORS.primarySalmon};
  margin: 0;
  font-family: "Autography", cursive;
  transform: rotate(-2deg);
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 2px rgba(233, 137, 115, 0.3);
  white-space: nowrap;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 1.8rem;
    margin-left: 0;
    transform: rotate(-7deg);
    white-space: normal;
  }

  @media (max-width: 480px) {
    font-size: 3rem;
  }
`;

const MoodFilter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 0 0.5rem 0.5rem 0.5rem;
    gap: 0.4rem;
  }
`;

const MoodButton = styled.button`
  background-color: ${(props) =>
    props.active
      ? props.mood
        ? props.mood === "all"
          ? COLORS.primarySalmon
          : moodColors[props.mood].primary
        : COLORS.primarySalmon
      : COLORS.elevatedBackground};
  color: ${(props) =>
    props.active ? COLORS.textPrimary : COLORS.textSecondary};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0; /* Prevent buttons from shrinking */
  box-shadow: ${(props) =>
    props.active ? "0 3px 8px rgba(0, 0, 0, 0.3)" : "none"};

  &:hover {
    background-color: ${(props) =>
      props.mood && props.mood !== "all"
        ? moodColors[props.mood].primary
        : COLORS.accentSalmon};
    color: ${COLORS.textPrimary};
    transform: scale(1.05);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const SearchContainer = styled.div`
  ${(props) =>
    props.expanded &&
    `
    position: fixed;
    left: 0.5rem;
    right: 0.5rem;
    top: 0.5rem;
    z-index: 100;
    
    @media (min-width: 769px) {
      position: relative;
      left: auto;
      right: auto;
      top: auto;
      width: 300px;
      max-width: 300px;
    }
  `}

  @media (max-width: 768px) {
    ${(props) =>
      !props.expanded &&
      `
      margin-right: 0;
    `}
  }
`;

const SearchToggle = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 1.125rem;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    color: ${COLORS.primaryBlueGray};
    transform: scale(1.1);
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${COLORS.border};
  transition: all 0.3s;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 100%;

  &:focus-within {
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 3px 15px rgba(233, 137, 115, 0.15);
  }
`;

const SearchInput = styled.input`
  font-family: "Space Grotesk", sans-serif;
  flex: 1;
  background-color: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  padding: 0.6rem 1.2rem;
  font-size: 0.875rem;
  outline: none;
  min-width: 0; /* Allow input to shrink */

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  @media (max-width: 768px) {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

const CloseSearchButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
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
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

const ThoughtsContainer = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    padding: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.25rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(233, 137, 115, 0.2);
  color: ${COLORS.error};
  padding: 1.25rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(233, 137, 115, 0.3);
  box-shadow: 0 5px 15px rgba(233, 137, 115, 0.1);
  animation: ${fadeIn} 0.4s ease-out;
`;

const EmptyMessage = styled.div`
  color: ${COLORS.textTertiary};
  text-align: center;
  padding: 2rem 0;
  font-style: italic;
  animation: ${fadeIn} 0.4s ease-out;
`;

const LoadingMore = styled.div`
  padding: 1.5rem 0;
  display: flex;
  justify-content: center;
  animation: ${fadeIn} 0.4s ease-out;
`;

const RetweetModal = styled.div`
  position: relative;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  max-width: 380px;
  width: calc(100% - 2rem); /* Ensure margins on small screens */
  max-width: calc(100vw - 2rem); /* Prevent viewport overflow */
  z-index: 1001;
  padding: 2.5rem 2rem;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
  animation: ${fadeIn} 0.4s ease-out;
  border: 1px solid ${COLORS.border};
  overflow: hidden;
  box-sizing: border-box;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100px;
    width: 100px;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: ${shine} 3s infinite;
    z-index: 10;
  }

  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
    width: calc(100% - 1rem);
    max-width: calc(100vw - 1rem);
  }
`;

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
  overflow-y: auto; /* Allow vertical scrolling if content is too tall */

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const ModalIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: ${COLORS.primarySalmon};
  position: relative;
  display: inline-block;
  animation: ${pulseGlow} 2s infinite ease-in-out;
`;

const RetweetModalContent = styled.div`
  color: ${COLORS.textPrimary};
  line-height: 1.6;

  h3 {
    margin-bottom: 1.2rem;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${COLORS.primarySalmon};
    letter-spacing: 0.5px;
  }

  p {
    margin-bottom: 1.2rem;
    font-size: 1rem;
    color: ${COLORS.textSecondary};
  }

  p:last-of-type {
    font-size: 0.9rem;
    font-style: italic;
    color: ${COLORS.textTertiary};
  }
`;

const RetweetCloseButton = styled.button`
  margin-top: 1.5rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 2rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(233, 137, 115, 0.3);

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.7s;
  }

  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(233, 137, 115, 0.4);

    &:before {
      left: 100%;
    }
  }
`;

// Main component function
const Thoughts = () => {
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal(); // Add this hook
  // Updated to check for both admin and creator roles
  const isAdmin = isAuthenticated && user?.role === "admin";
  const canCreateThought =
    isAuthenticated && (user?.role === "admin" || user?.role === "creator");
  const [selectedMood, setSelectedMood] = useState("all");
  // Remove these state variables - we don't need them anymore
  // const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [thoughtToDelete, setThoughtToDelete] = useState(null);

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
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

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
        setLoadingMore(false);
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

  // Replace the old delete confirmation function with this new handler
  const handleDeleteThought = (thoughtId) => {
    const thought = thoughts.find((t) => t._id === thoughtId);
    const thoughtPreview =
      thought?.content?.length > 50
        ? thought.content.substring(0, 50) + "..."
        : thought?.content || "this thought";

    showDeleteModal({
      title: "Delete Thought",
      message: thought?.pinned
        ? "This is a pinned thought. Deleting it will remove it from your pinned collection. This action cannot be undone."
        : "Are you sure you want to delete this thought? This action cannot be undone and all interactions will be lost.",
      confirmText: "Delete Thought",
      cancelText: "Keep Thought",
      itemName: thoughtPreview,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/thoughts/${thoughtId}`);
          setThoughts((prev) =>
            prev.filter((thought) => thought._id !== thoughtId)
          );
          toast.success("Thought deleted successfully");
        } catch (err) {
          console.error("Error deleting thought:", err);
          toast.error("Failed to delete thought");
        }
      },
      onCancel: () => {
        console.log("Thought deletion cancelled");
      },
      destructive: true,
    });
  };

  // Remove the old handleDeleteConfirm function

  // Infinite scroll functionality
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200 &&
      !loading &&
      !loadingMore &&
      hasMore
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore]);

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
                mood="all"
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

        <ThoughtsContainer isAdmin={isAdmin}>
          {error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : loading ? (
            <LoadingSpinner text="Loading thoughts" />
          ) : filteredThoughts.length > 0 ? (
            <>
              {filteredThoughts.map((thought) => (
                <ThoughtCard
                  key={thought._id}
                  thought={thought}
                  defaultUser={defaultUser}
                  formatDate={formatDate}
                  handleLike={handleLike}
                  handleRetweet={handleRetweet}
                  handlePin={handlePin}
                  canCreateThought={canCreateThought}
                  onDelete={handleDeleteThought} // Use new handler
                />
              ))}

              {loadingMore && hasMore && (
                <LoadingMore>
                  <LoadingSpinner
                    size="30px"
                    text="Loading more"
                    textSize="0.875rem"
                    height="80px"
                  />
                </LoadingMore>
              )}
            </>
          ) : (
            <EmptyMessage>
              No thoughts found
              {searchQuery && " matching your search"}
              {selectedMood !== "all" && ` with mood "${selectedMood}"`}.
            </EmptyMessage>
          )}
        </ThoughtsContainer>
      </PageWrapper>

      {/* Remove the old DeleteConfirmationModal - it's now handled globally */}

      {/* Retweet Modal - shown to all users */}
      {showRetweetModal && (
        <ModalOverlay>
          <RetweetModal>
            <ModalIcon>
              <FaRetweet />
            </ModalIcon>
            <RetweetModalContent>
              <h3>Echoed in the Cosmos!</h3>
              <p>Your thought has been shared with the universe.</p>
              <p>Ripples of your wisdom now travel through digital space.</p>
            </RetweetModalContent>
            <RetweetCloseButton onClick={() => setShowRetweetModal(false)}>
              Amazing
            </RetweetCloseButton>
          </RetweetModal>
        </ModalOverlay>
      )}
    </MainLayout>
  );
};

export default Thoughts;
