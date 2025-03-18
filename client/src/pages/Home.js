import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaSearch, FaCamera } from "react-icons/fa";
import Stories from "../components/stories/Stories";

import PostCard from "../components/posts/PostCard";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showAboutBanner, setShowAboutBanner] = useState(true);

  const observer = useRef();

  // Last element callback for infinite scrolling
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Fetch posts
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);

        const response = await axios.get("/api/posts", {
          params: { page, limit: 6 },
        });

        if (isMounted) {
          const { data, currentPage, totalPages } = response.data;

          setPosts((prevPosts) => {
            // If it's the first page, replace posts
            if (currentPage === 1) {
              return data;
            }
            // Otherwise append new posts
            return [...prevPosts, ...data];
          });

          setHasMore(currentPage < totalPages);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching posts:", err);
          setError("Failed to load posts. Please try again.");
          toast.error("Failed to load posts");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [page]);

  // Check local storage for banner visibility
  useEffect(() => {
    const hasBannerBeenClosed = localStorage.getItem("aboutBannerClosed");
    if (hasBannerBeenClosed) {
      setShowAboutBanner(false);
    }
  }, []);

  const closeBanner = () => {
    setShowAboutBanner(false);
    localStorage.setItem("aboutBannerClosed", "true");
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      // Reset to normal post fetch if search query is empty
      setPage(1);
      return;
    }

    try {
      setSearching(true);
      setLoading(true);

      const response = await axios.get("/api/posts/search", {
        params: { query: searchQuery },
      });

      setPosts(response.data.data);
      setHasMore(false); // No infinite scrolling for search results
      setError(null);

      if (response.data.count === 0) {
        toast.info("No posts found matching your search");
      }
    } catch (err) {
      console.error("Error searching posts:", err);
      setError("Failed to search posts. Please try again.");
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearching(false);
    setPage(1);
    setHasMore(true);
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${postId}`);

      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post");
    }
  };

  return (
    <PageWrapper>
      <HomeContainer>
        {showAboutBanner && (
          <AboutBanner>
            <BannerContent>
              <LogoContainer>
                <FaCamera />
              </LogoContainer>
              <BannerTextContainer>
                <BannerTitle>Welcome to Sologram</BannerTitle>
                <BannerDescription>
                  My personal photography journal where I share moments and
                  create collections. Feel free to explore and enjoy the visual
                  storytelling.
                </BannerDescription>
              </BannerTextContainer>
            </BannerContent>
            <CloseButton onClick={closeBanner}>×</CloseButton>
          </AboutBanner>
        )}
        <Stories />
        <SearchContainer>
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchButton type="submit">
              <FaSearch />
            </SearchButton>
          </SearchForm>

          {searching && (
            <ClearSearchButton onClick={clearSearch}>
              Clear Search
            </ClearSearchButton>
          )}
        </SearchContainer>

        {searching && (
          <SearchResults>
            Showing results for "{searchQuery}" ({posts.length}{" "}
            {posts.length === 1 ? "post" : "posts"})
          </SearchResults>
        )}

        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : posts.length > 0 ? (
          <PostGrid>
            {posts.map((post, index) => {
              if (posts.length === index + 1) {
                // Add ref to last element for infinite scrolling
                return (
                  <GridItem ref={lastPostElementRef} key={post._id}>
                    <PostCard post={post} onDelete={handleDeletePost} />
                  </GridItem>
                );
              } else {
                return (
                  <GridItem key={post._id}>
                    <PostCard post={post} onDelete={handleDeletePost} />
                  </GridItem>
                );
              }
            })}
          </PostGrid>
        ) : loading ? (
          <LoadingMessage>Loading posts...</LoadingMessage>
        ) : (
          <NoPostsMessage>
            No posts available. Start creating your own content!
          </NoPostsMessage>
        )}

        {loading && posts.length > 0 && (
          <LoadingMore>Loading more posts...</LoadingMore>
        )}
      </HomeContainer>
    </PageWrapper>
  );
};

// New wrapper for dark background
const PageWrapper = styled.div`
  background-color: #121212; /* Dark background color */
  min-height: 100vh;
  padding: 1rem 0;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

// Styled Components
const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// About Banner Styles
const AboutBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const LogoContainer = styled.div`
  width: 50px;
  height: 50px;
  background-color: #ff7e5f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
  flex-shrink: 0;

  svg {
    font-size: 1.5rem;
    color: white;
  }
`;

const BannerTextContainer = styled.div`
  flex: 1;
`;

const BannerTitle = styled.h2`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem;
`;

const BannerDescription = styled.p`
  font-size: 0.95rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 1rem;

  &:hover {
    color: #555;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  max-width: 600px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #333;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
  background-color: #1e1e1e;
  color: #fff;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const SearchButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }
`;

const ClearSearchButton = styled.button`
  background-color: #2a2a2a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #333;
  }
`;

const SearchResults = styled.div`
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #ddd;
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const GridItem = styled.div`
  display: flex;
  height: 100%;
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.9);
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin: 2rem 0;
  text-align: center;
`;

const LoadingMessage = styled.div`
  text-align: center;
  margin: 4rem 0;
  color: #ddd;
  font-size: 1.125rem;
`;

const NoPostsMessage = styled.div`
  text-align: center;
  margin: 4rem 0;
  color: #ddd;
  font-size: 1.125rem;
`;

const LoadingMore = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: #aaa;
  font-style: italic;
`;

export default Home;
