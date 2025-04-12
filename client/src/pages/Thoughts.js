// Here's the updated version with your requested changes

import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { keyframes } from "styled-components";
import {
  FaHeart,
  FaTrash,
  FaEdit,
  FaSearch,
  FaTimes,
  FaClock,
  FaPlusCircle,
  FaCamera,
  FaComment,
  FaRetweet,
  FaShare,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { format } from "date-fns";

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

// Define mood colors
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

// Styled components (in correct order to avoid reference errors)
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

// Define UserInfo and related components
const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 2px ${(props) => moodColors[props.mood] || "#ff7e5f"};
  position: relative;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    box-shadow: 0 0 10px 1px ${(props) => moodColors[props.mood] || "#ff7e5f"};
    opacity: 0.3;
    transition: opacity 0.3s;
  }

  &:hover:after {
    opacity: 0.6;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => {
    const color = moodColors[props.mood] || "#ff7e5f";
    return `linear-gradient(135deg, ${color}33, ${color}66)`;
  }};
  color: ${(props) => moodColors[props.mood] || "#ff7e5f"};
  font-size: 1.5rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  position: relative;

  &:after {
    content: "";
    width: 75%;
    height: 2px;
    background: linear-gradient(
      to right,
      #ff7e5f,
      ${(props) => moodColors[props.mood] || "#ffcb66"},
      #ff7e5f
    );
    margin-top: 0.25rem;
    border-radius: 1px;
  }
`;

const Username = styled.div`
  font-family: "Autography", cursive;
  font-weight: normal;
  font-size: 1.8rem;
  color: #ffcb66;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;

  &:hover {
    text-decoration: none;
    transform: scale(1.03);
    transition: transform 0.2s ease;
  }
`;

const UserHandle = styled.div`
  font-family: "Space Grotesk", sans-serif;
  background-color: rgba(255, 126, 95, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  color: #ff7e5f;
  font-size: 0.75rem;
  display: inline-block;
`;

// Define action components in the correct order to avoid circular references
const ActionIcon = styled.div`
  color: ${(props) => (props.liked ? "#e0245e" : "#8899a6")};
  transition: color 0.2s;
  font-size: 1.125rem;

  ${(props) =>
    props.liked &&
    `
    animation: ${pulse} 0.3s ease;
  `}
`;

const ActionCount = styled.span`
  color: #8899a6;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  transition: background-color 0.2s;

  &:nth-child(1):hover {
    background-color: rgba(224, 36, 94, 0.1);

    ${ActionIcon} {
      color: #e0245e;
    }

    ${ActionCount} {
      color: #e0245e;
    }
  }

  &:nth-child(2):hover {
    background-color: rgba(29, 161, 242, 0.1);

    ${ActionIcon} {
      color: #1da1f2;
    }

    ${ActionCount} {
      color: #1da1f2;
    }
  }

  &:nth-child(3):hover {
    background-color: rgba(23, 191, 99, 0.1);

    ${ActionIcon} {
      color: #17bf63;
    }

    ${ActionCount} {
      color: #17bf63;
    }
  }

  &:nth-child(4):hover {
    background-color: rgba(29, 161, 242, 0.1);

    ${ActionIcon} {
      color: #1da1f2;
    }
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid #2a2a2a;
`;

// Continue with other styled components
const ThoughtHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ThoughtMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  margin-bottom: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #333333;
`;

const ThoughtMood = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${(props) => moodColors[props.mood] || "#ff7e5f"};
  font-size: 0.875rem;
  text-transform: capitalize;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: ${(props) => `${moodColors[props.mood] || "#ff7e5f"}15`};
  box-shadow: 0 0 8px ${(props) => moodColors[props.mood] || "#ff7e5f"};
`;

const ThoughtTime = styled.div`
  font-family: "Space Grotesk", sans-serif;
  color: #aaaaaa;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 0.5rem;
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
  font-family: "Lora", serif;
  color: #f0f0f0;
  font-size: 1.125rem;
  line-height: 1.75;
  background: rgba(255, 255, 255, 0.02);
  padding: 1.25rem;
  border-left: 3px solid #ff7e5f;
  border-radius: 8px;
  font-style: italic;
  white-space: pre-wrap;
  letter-spacing: 0.3px;
`;

const ThoughtMedia = styled.div`
  margin: 0.75rem -1.25rem;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  img {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    transition: transform 0.4s ease, filter 0.4s ease;
  }

  &:hover img {
    transform: scale(1.02);
    filter: brightness(1.1);
  }

  @media (min-width: 768px) {
    margin: 0.75rem 0;
    border-radius: 16px;
  }
`;

const ThoughtTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ThoughtTag = styled.span`
  font-family: "Space Grotesk", sans-serif;
  background-color: ${(props) => `${moodColors[props.mood] || "#ff7e5f"}20`};
  color: ${(props) => moodColors[props.mood] || "#ff7e5f"};
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => `${moodColors[props.mood] || "#ff7e5f"}30`};
    transform: scale(1.05);
  }
`;

const ThoughtFooter = styled.div`
  margin-top: 0.5rem;
`;

const ThoughtCard = styled.div`
  position: relative;
  background: rgba(17, 17, 17, 0.75);
  backdrop-filter: blur(6px);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid #333333;
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    background-color: rgba(26, 26, 26, 0.85);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  ${(props) =>
    props.pinned &&
    `
    border-color: ${moodColors[props.mood] || "#ff7e5f"};
  `}
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  animation: ${pulse} 2s infinite ease-in-out;
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
  bottom: 6rem;
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

// New styled components for retweet modal
const RetweetModal = styled.div`
  background-color: #1e1e1e;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  z-index: 1001;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  text-align: center;
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
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;

  &:hover {
    background-color: #ff6347;
    transform: scale(1.05);
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
  const isAdmin = isAuthenticated && user?.role === "admin";
  const [selectedMood, setSelectedMood] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [thoughtToDelete, setThoughtToDelete] = useState(null);

  // New state for retweet modal
  const [showRetweetModal, setShowRetweetModal] = useState(false);

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

  // Hardcoded user info
  const defaultUser = {
    username: "Andrew",
    handle: "andrew",
    avatar: null, // You can replace this with your avatar URL if you have one
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
          user: defaultUser, // Use hardcoded user info for all thoughts
          userHasLiked: false, // This would come from your API in a real app
          comments: thought.comments || [],
          shares: Math.floor(Math.random() * 10), // Just for demo purposes
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

  // Unified handleLike function
  const handleLike = async (id) => {
    try {
      const response = await axios.put(`/api/thoughts/${id}/like`);

      // Update thoughts with the liked status
      setThoughts((prevThoughts) =>
        prevThoughts.map((thought) => {
          if (thought._id === id) {
            return {
              ...response.data.data,
              user: defaultUser, // Keep hardcoded user info
              userHasLiked: !thought.userHasLiked, // Toggle the liked state
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

  // New function to handle retweet
  const handleRetweet = () => {
    setShowRetweetModal(true);
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
                  <UserInfo>
                    <Avatar mood={thought.mood}>
                      {defaultUser.avatar ? (
                        <img src={defaultUser.avatar} alt="User avatar" />
                      ) : (
                        <DefaultAvatar mood={thought.mood}>
                          {moodEmojis[thought.mood]}
                        </DefaultAvatar>
                      )}
                    </Avatar>
                    <UserDetails>
                      <Username>{defaultUser.username}</Username>
                      <UserHandle>@{defaultUser.handle}</UserHandle>
                    </UserDetails>
                  </UserInfo>

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

                <ThoughtMeta>
                  <ThoughtTime>
                    <FaClock />
                    <span>{formatDate(thought.createdAt)}</span>
                  </ThoughtTime>
                  <ThoughtMood mood={thought.mood}>
                    {moodEmojis[thought.mood]} {thought.mood}
                  </ThoughtMood>
                </ThoughtMeta>

                <ThoughtFooter>
                  <ActionBar>
                    <ActionItem onClick={() => handleLike(thought._id)}>
                      <ActionIcon liked={thought.userHasLiked}>
                        <FaHeart />
                      </ActionIcon>
                      <ActionCount>{thought.likes}</ActionCount>
                    </ActionItem>

                    <ActionItem>
                      <ActionIcon>
                        <FaComment />
                      </ActionIcon>
                      <ActionCount>{thought.comments?.length || 0}</ActionCount>
                    </ActionItem>

                    {/* Modified retweet action to show the modal */}
                    <ActionItem onClick={handleRetweet}>
                      <ActionIcon>
                        <FaRetweet />
                      </ActionIcon>
                      <ActionCount>{thought.shares || 0}</ActionCount>
                    </ActionItem>

                    <ActionItem>
                      <ActionIcon>
                        <FaShare />
                      </ActionIcon>
                    </ActionItem>
                  </ActionBar>
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

      {/* New Retweet Modal */}
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
