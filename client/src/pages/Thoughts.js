// client/src/pages/Thoughts.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaHeart,
  FaTrash,
  FaEdit,
  FaSearch,
  FaTimes,
  FaClock,
  FaPlusCircle,
  FaCamera,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { format } from "date-fns";

const Thoughts = () => {
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = isAuthenticated && user?.role === "admin";
  const [selectedMood, setSelectedMood] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [thoughtToDelete, setThoughtToDelete] = useState(null);

  const moodEmojis = {
    inspired: "✨",
    reflective: "🌙",
    excited: "🔥",
    creative: "🎨",
    calm: "🌊",
    curious: "🔍",
    nostalgic: "📷",
    amused: "😄",
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
        const newThoughts = response.data.data;

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

  const handleLike = async (id) => {
    try {
      const response = await axios.put(`/api/thoughts/${id}/like`);
      setThoughts((prevThoughts) =>
        prevThoughts.map((thought) =>
          thought._id === id ? response.data.data : thought
        )
      );
    } catch (err) {
      console.error("Error liking thought:", err);
      toast.error("Failed to like thought");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this thought?")) {
      return;
    }

    try {
      await axios.delete(`/api/thoughts/${id}`);
      setThoughts((prevThoughts) =>
        prevThoughts.filter((thought) => thought._id !== id)
      );
      toast.success("Thought deleted successfully");
    } catch (err) {
      console.error("Error deleting thought:", err);
      toast.error("Failed to delete thought");
    }
  };

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

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop ===
        document.documentElement.offsetHeight &&
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
            {isAdmin && (
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
            filteredThoughts.map((thought, index) => (
              <ThoughtCard
                key={thought._id}
                pinned={thought.pinned}
                mood={thought.mood}
              >
                {thought.pinned && <PinnedBadge>Pinned</PinnedBadge>}

                <ThoughtHeader>
                  <ThoughtMeta>
                    <ThoughtMood mood={thought.mood}>
                      {moodEmojis[thought.mood]} {thought.mood}
                    </ThoughtMood>
                    <ThoughtTime>
                      <FaClock />
                      <span>{formatDate(thought.createdAt)}</span>
                    </ThoughtTime>
                  </ThoughtMeta>

                  {isAdmin && (
                    <ThoughtActions>
                      <ActionButton
                        onClick={() => handlePin(thought._id)}
                        title={thought.pinned ? "Unpin" : "Pin"}
                        className={thought.pinned ? "pinned" : ""}
                      >
                        📌
                      </ActionButton>
                      <ActionButton
                        as={Link}
                        to={`/thoughts/edit/${thought._id}`}
                        title="Edit"
                      >
                        <FaEdit />
                      </ActionButton>
                      <ActionButton
                        onClick={() => {
                          setThoughtToDelete(thought._id);
                          setShowDeleteModal(true);
                        }}
                        title="Delete"
                        className="delete"
                      >
                        <FaTrash />
                      </ActionButton>
                    </ThoughtActions>
                  )}
                </ThoughtHeader>

                <ThoughtContent>{thought.content}</ThoughtContent>

                {thought.media?.mediaUrl && (
                  <ThoughtMedia>
                    <img src={thought.media.mediaUrl} alt="Thought media" />
                  </ThoughtMedia>
                )}

                {thought.tags && thought.tags.length > 0 && (
                  <ThoughtTags>
                    {thought.tags.map((tag, tagIndex) => (
                      <ThoughtTag key={tagIndex} mood={thought.mood}>
                        #{tag}
                      </ThoughtTag>
                    ))}
                  </ThoughtTags>
                )}

                <ThoughtFooter>
                  <LikeButton onClick={() => handleLike(thought._id)}>
                    <FaHeart />
                    <span>{thought.likes} likes</span>
                  </LikeButton>
                </ThoughtFooter>
              </ThoughtCard>
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

      {isAdmin && (
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
              {/* Optional: click outside to close */}
              <Backdrop onClick={cancelDelete} />
            </ModalOverlay>
          )}

          <FloatingButton to="/thoughts/create">
            <FaPlusCircle />
          </FloatingButton>
        </>
      )}
    </MainLayout>
  );
};

const moodColors = {
  inspired: "#ffcb66",
  reflective: "#7891c9",
  excited: "#ff7e5f",
  creative: "#7be0ad",
  calm: "#00b2ff",
  curious: "#a06eff",
  nostalgic: "#ff61a6",
  amused: "#fcbe32",
};

// Styled components
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
          : moodColors[props.mood]
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

  &:hover {
    background-color: ${(props) =>
      props.mood && props.mood !== "all" ? moodColors[props.mood] : "#ff7e5f"};
    color: #121212;
    transform: scale(1.1);
  }
  transition: all 0.2s ease-in-out;
`;

const CreateButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #ff7e5f;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 500;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
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
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
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
`;

const SearchInput = styled.input`
  font-family: "Courier New", monospace;
  flex: 1;
  background-color: #121212;
  border: none;
  color: #ffffff;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-bottom: 2px solid #ff7e5f;
  transition: border-color 0.3s ease;

  &::placeholder {
    color: #888888;
  }

  &:focus {
    border-color: #ff6347;
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

  &:hover {
    color: #ff7e5f;
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

  &:hover {
    color: #ff7e5f;
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

  @media (min-width: 769px) {
    display: none;
  }

  &:hover {
    color: #ff7e5f;
  }
`;

const ThoughtsContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const ThoughtCard = styled.div`
  position: relative;
  background-color: #1e1e1e;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-left: 6px solid ${(props) => moodColors[props.mood] || "#ff7e5f"};
  background-image: ${(props) =>
    `linear-gradient(#1e1e1e, #1e1e1e), linear-gradient(to right, ${
      moodColors[props.mood] || "#ff7e5f"
    }, #1e1e1e)`};
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 0 12px rgba(255, 126, 95, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 16px rgba(255, 126, 95, 0.3);
  }
`;

const PinnedBadge = styled.div`
  position: absolute;
  top: -10px;
  right: 1rem;
  background-color: #ff7e5f;
  color: #121212;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
`;

const ThoughtHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ThoughtMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ThoughtMood = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${(props) => moodColors[props.mood] || "#ff7e5f"};
  font-size: 0.875rem;
  text-transform: capitalize;
`;

const ThoughtTime = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #aaaaaa;
  font-size: 0.75rem;

  svg {
    font-size: 0.75rem;
  }
`;

const ThoughtActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #aaaaaa;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #333333;
    color: #ffffff;
  }

  &.delete:hover {
    color: #ff6b6b;
  }

  &.pinned {
    color: #ffbb00;
  }
`;

const ThoughtContent = styled.p`
  color: #ffffff;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  white-space: pre-wrap;
`;

const ThoughtMedia = styled.div`
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    max-height: 400px;
    object-fit: contain;
    background-color: #121212;
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.02);
  }
`;

const ThoughtTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ThoughtTag = styled.span`
  background-color: ${(props) => {
    const hexColor = moodColors[props.mood] || "#ff7e5f";
    // Convert hex to RGB with opacity
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  }};
  color: ${(props) => moodColors[props.mood] || "#ff7e5f"};
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
`;

const ThoughtFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #aaaaaa;
  cursor: pointer;
  transition: color 0.3s;
  padding: 0.5rem;

  &:hover {
    color: #ff6b6b;
  }

  svg {
    font-size: 0.875rem;
  }

  span {
    font-size: 0.875rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const LoadingMessage = styled.div`
  color: #aaaaaa;
  text-align: center;
  padding: 2rem 0;
`;

const EmptyMessage = styled.div`
  color: #aaaaaa;
  text-align: center;
  padding: 2rem 0;
`;

const LoadingMore = styled.div`
  color: #aaaaaa;
  text-align: center;
  padding: 1rem 0;
  font-style: italic;
  font-size: 0.875rem;
`;

const FloatingButton = styled(Link)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: #ff7e5f;
  color: #fff;
  padding: 1rem;
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  font-size: 1.5rem;
  z-index: 999;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

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
  z-index: 2000;
  padding: 1rem;
`;

const DeleteModal = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  z-index: 1001;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
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

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
`;

export default Thoughts;
