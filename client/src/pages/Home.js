import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaCamera,
  FaFolder,
  FaImages,
  FaBookOpen,
} from "react-icons/fa";
import { Link } from "react-router-dom";
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

  // New state for top collections
  const [topCollections, setTopCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  const observer = useRef();

  // Check localStorage for banner visibility on mount
  useEffect(() => {
    const bannerClosed = localStorage.getItem("aboutBannerClosed");
    if (bannerClosed === "true") {
      setShowAboutBanner(false);
    }
  }, []);

  // Fetch top collections for the homepage
  useEffect(() => {
    const fetchTopCollections = async () => {
      try {
        setCollectionsLoading(true);
        const response = await axios.get("/api/collections", {
          params: { limit: 3 }, // Just get 3 most recent collections
        });
        setTopCollections(response.data.data);
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setCollectionsLoading(false);
      }
    };

    fetchTopCollections();
  }, []);

  // Setup lazy loading for videos when posts change
  useEffect(() => {
    // Only run if there are posts with video media
    if (!posts.length) return;

    // Find all videos that should be lazy loaded
    const lazyVideos = document.querySelectorAll("video[data-src]");
    if (!lazyVideos.length) return;

    // Create an intersection observer to load videos when they come into view
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target;

            // If the video has a data-src but no src, load it
            if (video.dataset.src && !video.src) {
              console.log("Lazy loading video:", video.dataset.src);
              video.src = video.dataset.src;

              // Also update any source elements
              const sources = video.querySelectorAll("source[data-src]");
              sources.forEach((source) => {
                source.src = source.dataset.src;
              });

              // Reload the video to apply the new source
              video.load();
            }

            // Stop observing once loaded
            videoObserver.unobserve(video);
          }
        });
      },
      {
        rootMargin: "100px", // Start loading when video is 100px away
        threshold: 0.1, // Trigger when at least 10% of the element is visible
      }
    );

    // Start observing all lazy videos
    lazyVideos.forEach((video) => videoObserver.observe(video));

    // Clean up observer on component unmount or when posts change
    return () => {
      videoObserver.disconnect();
    };
  }, [posts]);

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

        {/* Stories Section with Header */}
        <ContentSection>
          <CompactSectionHeader>
            <SectionTitle>
              <FaBookOpen />
              <span>Recent Stories</span>
            </SectionTitle>
          </CompactSectionHeader>
          <Stories />
        </ContentSection>

        {/* Collections Section - Updated to horizontal scroll */}
        <ContentSection className="collections-section">
          <CompactSectionHeader>
            <SectionTitle>
              <FaFolder />
              <span>Featured Collections</span>
            </SectionTitle>
            <ViewAllLink to="/collections">View All</ViewAllLink>
          </CompactSectionHeader>

          {collectionsLoading ? (
            <LoadingIndicator>Loading collections...</LoadingIndicator>
          ) : topCollections.length > 0 ? (
            <CollectionsRow>
              {topCollections.map((collection) => (
                <CollectionCard key={collection._id}>
                  <CollectionLink to={`/collections/${collection._id}`}>
                    {collection.coverImage ? (
                      <CollectionCover
                        src={collection.coverImage}
                        alt={collection.name}
                      />
                    ) : (
                      <CollectionCoverPlaceholder>
                        <FaImages />
                      </CollectionCoverPlaceholder>
                    )}
                    <CollectionName>{collection.name}</CollectionName>
                  </CollectionLink>
                </CollectionCard>
              ))}
            </CollectionsRow>
          ) : (
            <EmptyMessage>No collections yet</EmptyMessage>
          )}
        </ContentSection>

        {/* Posts Section */}
        <ContentSection>
          <SectionHeaderWithSearch>
            <SectionTitleWrapper>
              <SectionTitle>
                <FaCamera />
                <span>Posts</span>
              </SectionTitle>
            </SectionTitleWrapper>
            <SearchWrapper>
              <SearchContainer searching={searching}>
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
            </SearchWrapper>
          </SectionHeaderWithSearch>

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
        </ContentSection>
      </HomeContainer>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 0.5rem 0 1rem; /* Reduced top padding */

  /* Fix for iOS to better handle full height */
  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 2rem; /* Reduced top/bottom padding */

  @media (max-width: 768px) {
    padding: 0.5rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
  }

  /* Specific adjustments for PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 1rem;
  }

  /* Visual separation between sections */
  & > section {
    margin-top: 1rem; /* Add spacing between content sections */
  }
`;

// Generic Content Section - With background and padding
const ContentSection = styled.section`
  margin-bottom: 1rem; /* Reduced margin to minimize vertical spacing */
  background-color: rgba(30, 30, 30, 0.7); /* Subtle dark background */
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.03); /* Subtle border */

  /* Special treatment for collections section */
  &.collections-section {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

// Shared Section Header Styling - More compact with subtle divider
const CompactSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem; /* Slightly more margin for separation */
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Subtle separator */

  @media (max-width: 768px) {
    flex-direction: ${(props) => (props.withSearch ? "column" : "row")};
    align-items: ${(props) => (props.withSearch ? "flex-start" : "center")};
    gap: ${(props) => (props.withSearch ? "0.75rem" : "0")};
  }
`;

// Special section header for the posts section with search
const SectionHeaderWithSearch = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Subtle separator */
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SectionTitleWrapper = styled.div`
  flex: 0 0 auto;
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 1.125rem; /* Smaller font size */
  display: flex;
  align-items: center;
  margin: 0;
  font-weight: 500; /* Lighter weight */
  position: relative;
  padding: 0.125rem 0;

  svg {
    color: #ff7e5f;
    margin-right: 0.375rem; /* Smaller spacing */
    font-size: 0.9em; /* Smaller icon */
  }

  /* Subtle accent color highlight behind the icon */
  &::before {
    content: "";
    position: absolute;
    left: -0.375rem;
    top: 0;
    height: 100%;
    width: 0.25rem;
    background-color: rgba(255, 126, 95, 0.5);
    border-radius: 1rem;
  }
`;

const ViewAllLink = styled(Link)`
  color: #ff7e5f;
  font-size: 0.8125rem; /* Smaller font size */
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// Collections Section Components - Horizontal scrollable layout like stories
const CollectionsRow = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 0.5rem 0;
  gap: 1rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Opera */
  }

  /* Add padding to allow focus outline to be visible at the edges */
  &::after {
    content: "";
    padding-right: 0.5rem;
  }

  /* Improve touch scrolling */
  -webkit-overflow-scrolling: touch;
`;

const CollectionCard = styled.div`
  flex: 0 0 auto;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CollectionLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
`;

const CollectionCover = styled.img`
  width: 65px;
  height: 65px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff7e5f;
  padding: 3px;
  background-color: #222;
  transition: border-color 0.2s;

  ${CollectionCard}:hover & {
    border-color: #ff6347;
  }
`;

const CollectionCoverPlaceholder = styled.div`
  width: 65px;
  height: 65px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #222;
  border: 2px solid #ff7e5f;
  padding: 3px;

  svg {
    font-size: 1.25rem;
    color: #555;
  }

  ${CollectionCard}:hover & {
    border-color: #ff6347;
  }
`;

const CollectionName = styled.h3`
  font-size: 0.75rem;
  color: #ddd;
  margin: 0.5rem 0 0;
  text-align: center;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  padding: 0.75rem 0;
  font-size: 0.75rem;
  height: 80px; /* Match the height of collection items */
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  padding: 0.75rem 0;
  font-size: 0.75rem;
  height: 80px; /* Match the height of collection items */
`;

// New wrapper component to center search elements - improved alignment
const SearchWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  flex: 1;
  max-width: 450px;

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
    justify-content: flex-start;
  }

  @media (max-width: 600px) {
    width: 100%;
  }

  /* Ensure proper width in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    box-sizing: border-box;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Reduced gap */
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: ${(props) => (props.searching ? "column" : "row")};
    align-items: ${(props) => (props.searching ? "stretch" : "center")};
    gap: ${(props) => (props.searching ? "0.5rem" : "0.5rem")};
  }

  /* Ensure proper sizing in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    max-width: 100%;
  }
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  width: 100%;

  @media screen and (display-mode: standalone) {
    max-width: 100%;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem; /* Reduced padding */
  border: 1px solid #333;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 0.875rem; /* Smaller font */
  background-color: #1e1e1e;
  color: #fff;
  width: 100%;
  box-sizing: border-box;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  /* Enhance touch target on mobile */
  @media (max-width: 480px) {
    padding: 0.625rem 0.5rem;
    font-size: 16px; /* Prevent iOS zoom */
  }
`;

const SearchButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0 0.75rem; /* Reduced padding */
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 2.5rem; /* Smaller width */
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #ff6347;
  }

  /* Larger touch target on mobile */
  @media (max-width: 480px) {
    min-width: 3rem;
  }
`;

const ClearSearchButton = styled.button`
  background-color: #2a2a2a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.5rem 0.75rem; /* Reduced padding */
  font-size: 0.875rem; /* Smaller font */
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: #333;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    width: 100%;
  }

  @media screen and (display-mode: standalone) {
    padding: 0.5rem;
    width: 100%;
  }
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(260px, 1fr)
  ); /* Slightly narrower cards */
  gap: 1rem; /* Reduced gap */
  justify-content: center;
  padding: 0.25rem 0.125rem; /* Slight padding inside container */
  background-color: rgba(
    20,
    20,
    20,
    0.4
  ); /* Subtle nested background for depth */
  border-radius: 6px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }

  /* Adjust for PWA mode */
  @media screen and (display-mode: standalone) {
    gap: 0.75rem;
  }
`;

const GridItem = styled.div`
  display: flex;
  height: 100%;
  width: 100%;

  /* Ensure proper rendering in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.9);
  color: #721c24;
  padding: 0.75rem; /* Reduced padding */
  border-radius: 4px;
  margin-bottom: 1rem; /* Reduced margin */
  text-align: center;
  font-size: 0.875rem; /* Smaller font */
`;

const LoadingMessage = styled.div`
  text-align: center;
  margin: 2rem 0; /* Reduced margin */
  color: #ddd;
  font-size: 0.9375rem; /* Smaller font */
`;

const NoPostsMessage = styled.div`
  text-align: center;
  margin: 2rem 0; /* Reduced margin */
  color: #ddd;
  font-size: 0.9375rem; /* Smaller font */
`;

const LoadingMore = styled.div`
  text-align: center;
  margin: 1rem 0; /* Reduced margin */
  color: #aaa;
  font-style: italic;
  font-size: 0.875rem; /* Smaller font */
`;

// Styled Components for UI Elements
const AboutBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 1rem; /* Reduced padding */
  margin-bottom: 1rem; /* Reduced margin */
  position: relative;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    padding: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }

  /* Ensure proper rendering in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    margin-bottom: 1rem;
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
  width: 40px; /* Smaller logo */
  height: 40px;
  background-color: #ff7e5f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem; /* Reduced margin */
  flex-shrink: 0;

  svg {
    font-size: 1.125rem; /* Smaller icon */
    color: white;
  }

  @media (max-width: 640px) {
    width: 32px;
    height: 32px;
    margin-right: 0.75rem;

    svg {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    margin-right: 0.625rem;

    svg {
      font-size: 0.875rem;
    }
  }
`;

const BannerTextContainer = styled.div`
  flex: 1;
`;

const BannerTitle = styled.h2`
  font-size: 1.125rem; /* Smaller font */
  color: #333;
  margin: 0 0 0.25rem; /* Reduced margin */

  @media (max-width: 640px) {
    font-size: 1rem;
    margin: 0 0 0.125rem;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    margin: 0 0 0.125rem;
  }
`;

const BannerTagline = styled.p`
  font-size: 0.9375rem; /* Smaller font */
  color: #ff7e5f;
  font-weight: 500;
  font-style: italic;
  margin: 0;

  @media (max-width: 640px) {
    font-size: 0.8125rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 1.25rem; /* Smaller font */
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.75rem; /* Reduced margin */

  &:hover {
    color: #555;
  }

  @media (max-width: 640px) {
    font-size: 1.125rem;
    margin-left: 0.625rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-left: 0.5rem;
  }
`;

export default Home;
