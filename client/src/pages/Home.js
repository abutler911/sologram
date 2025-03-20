import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaSearch, FaCamera } from "react-icons/fa";
import Stories from "../components/stories/Stories";
import PostCard from "../components/posts/PostCard";
import SubscribeBanner from "../components/notifications/SubscribeBanner";

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

  // Check localStorage for banner visibility on mount
  useEffect(() => {
    const bannerClosed = localStorage.getItem("aboutBannerClosed");
    if (bannerClosed === "true") {
      setShowAboutBanner(false);
    }
  }, []);

  // Lazy Load Videos (Intersection Observer)
  useEffect(() => {
    const lazyVideos = document.querySelectorAll(".lazy-video");
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const source = video.querySelector("source");
          if (source && !source.src) {
            source.src = video.dataset.src;
            video.load(); // Load when visible
          }
          videoObserver.unobserve(video);
        }
      });
    });

    lazyVideos.forEach((video) => videoObserver.observe(video));
  }, [posts]); // Run whenever posts change

  // Infinite Scroll - Loads more posts when last element is visible
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

          setPosts((prevPosts) =>
            currentPage === 1 ? data : [...prevPosts, ...data]
          );
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

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
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
      setHasMore(false);
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

  // Close banner and save state to localStorage
  const closeBanner = () => {
    setShowAboutBanner(false);
    localStorage.setItem("aboutBannerClosed", "true");
  };

  return (
    <PageWrapper>
      <HomeContainer>
        <SubscribeBanner />

        {showAboutBanner && (
          <AboutBanner>
            <BannerContent>
              <LogoContainer>
                <FaCamera />
              </LogoContainer>
              <BannerTextContainer>
                <BannerTitle>Welcome to Sologram</BannerTitle>
                <BannerTagline>One Voice. Infinite Moments.</BannerTagline>
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

        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : posts.length > 0 ? (
          <PostGrid>
            {posts.map((post, index) => {
              return (
                <GridItem
                  ref={posts.length === index + 1 ? lastPostElementRef : null}
                  key={post._id}
                >
                  <PostCard post={post} />
                </GridItem>
              );
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

// Lazy Loading Applied to Videos
const LazyVideo = ({ src }) => (
  <video className="lazy-video" controls data-src={src}>
    <source data-src={src} type="video/mp4" />
  </video>
);

// Styled Components
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 1rem 0;
`;
const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;
const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  justify-content: center;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const GridItem = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;
const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.9);
  color: #721c24;
  padding: 1rem;
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

// Styled Components for UI Elements
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

  @media (max-width: 640px) {
    padding: 1.2rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;

  @media (max-width: 480px) {
    align-items: flex-start;
  }
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

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
    margin-right: 1rem;

    svg {
      font-size: 1.2rem;
    }
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    margin-right: 0.8rem;

    svg {
      font-size: 1rem;
    }
  }
`;

const BannerTextContainer = styled.div`
  flex: 1;
`;

const BannerTitle = styled.h2`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem;

  @media (max-width: 640px) {
    font-size: 1.1rem;
    margin: 0 0 0.3rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    margin: 0 0 0.2rem;
  }
`;

const BannerTagline = styled.p`
  font-size: 1.1rem;
  color: #ff7e5f;
  font-weight: 500;
  font-style: italic;
  margin: 0 0 0.5rem;

  @media (max-width: 640px) {
    font-size: 0.9rem;
    margin: 0;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
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

  @media (max-width: 640px) {
    font-size: 1.3rem;
    margin-left: 0.8rem;
  }

  @media (max-width: 480px) {
    font-size: 1.2rem;
    margin-left: 0.5rem;
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

export default Home;
