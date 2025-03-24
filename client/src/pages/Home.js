import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaCamera, FaFolder, FaImages, FaBookOpen } from "react-icons/fa";
import { Link } from "react-router-dom";
import Stories from "../components/stories/Stories";
import PostCard from "../components/posts/PostCard";

const Home = forwardRef((props, ref) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showAboutBanner, setShowAboutBanner] = useState(true);

  const [topCollections, setTopCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  const observer = useRef();

  useImperativeHandle(ref, () => ({
    handleHeaderSearch: (query) => handleSearch(query),
    clearSearch: () => clearSearch(),
  }));

  useEffect(() => {
    const bannerClosed = localStorage.getItem("aboutBannerClosed");
    if (bannerClosed === "true") {
      setShowAboutBanner(false);
    }
  }, []);

  useEffect(() => {
    const fetchTopCollections = async () => {
      try {
        setCollectionsLoading(true);
        const response = await axios.get("/api/collections", {
          params: { limit: 3 },
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

  useEffect(() => {
    if (!posts.length) return;

    const lazyVideos = document.querySelectorAll("video[data-src]");
    if (!lazyVideos.length) return;

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target;

            if (video.dataset.src && !video.src) {
              video.src = video.dataset.src;

              const sources = video.querySelectorAll("source[data-src]");
              sources.forEach((source) => {
                source.src = source.dataset.src;
              });

              video.load();
            }

            videoObserver.unobserve(video);
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    lazyVideos.forEach((video) => videoObserver.observe(video));

    return () => {
      videoObserver.disconnect();
    };
  }, [posts]);

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

    if (!searching) {
      fetchPosts();
    }

    return () => {
      isMounted = false;
    };
  }, [page, searching]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      return clearSearch();
    }

    setSearchQuery(query);

    try {
      setSearching(true);
      setLoading(true);

      const response = await axios.get("/api/posts/search", {
        params: { query },
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

  const clearSearch = () => {
    setSearchQuery("");
    setSearching(false);
    setPage(1);
    setHasMore(true);
  };

  const closeBanner = () => {
    setShowAboutBanner(false);
    localStorage.setItem("aboutBannerClosed", "true");
  };

  return (
    <PageWrapper>
      <HomeContainer>
        {showAboutBanner && (
          <AboutBanner>
            <BannerContent>
              <LogoContainer>
                <FaCamera />
                {/* <img src={logoSrc} alt="Sologram Logo" /> */}
              </LogoContainer>
              <BannerTextContainer>
                <BannerTitle>Welcome to Sologram</BannerTitle>
                <BannerTagline>One Voice. Infinite Moments.</BannerTagline>
              </BannerTextContainer>
            </BannerContent>
            <CloseButton onClick={closeBanner}>×</CloseButton>
          </AboutBanner>
        )}

        {searching && searchQuery && (
          <SearchResultsIndicator>
            <SearchResultsText>
              Showing results for "{searchQuery}" ({posts.length}{" "}
              {posts.length === 1 ? "post" : "posts"})
            </SearchResultsText>
            <ClearSearchButton onClick={clearSearch}>
              Clear Search
            </ClearSearchButton>
          </SearchResultsIndicator>
        )}

        {/* Compact Stories Section */}
        <CompactContentSection>
          <CompactSectionHeader>
            <SectionTitle>
              <FaBookOpen />
              <span>Recent Stories</span>
            </SectionTitle>
          </CompactSectionHeader>
          <Stories />
        </CompactContentSection>

        {/* Compact Collections Section */}
        <CompactContentSection className="collections-section">
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
            <CompactCollectionsRow>
              {topCollections.map((collection) => (
                <CompactCollectionCard key={collection._id}>
                  <CollectionLink to={`/collections/${collection._id}`}>
                    {collection.coverImage ? (
                      <CompactCollectionCover
                        src={collection.coverImage}
                        alt={collection.name}
                      />
                    ) : (
                      <CompactCollectionCoverPlaceholder>
                        <FaImages />
                      </CompactCollectionCoverPlaceholder>
                    )}
                    <CompactCollectionName>
                      {collection.name}
                    </CompactCollectionName>
                  </CollectionLink>
                </CompactCollectionCard>
              ))}
            </CompactCollectionsRow>
          ) : (
            <EmptyMessage>No collections yet</EmptyMessage>
          )}
        </CompactContentSection>

        <ContentSection>
          <CompactSectionHeader>
            <SectionTitle>
              <FaCamera />
              <span>Posts</span>
            </SectionTitle>
          </CompactSectionHeader>

          {error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : posts.length > 0 ? (
            <PostGrid>
              {posts.map((post, index) => (
                <GridItem
                  ref={posts.length === index + 1 ? lastPostElementRef : null}
                  key={post._id}
                >
                  <PostCard post={post} />
                </GridItem>
              ))}
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
});

const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 0.5rem 0 1rem;

  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 2rem;

  @media (max-width: 768px) {
    padding: 0.5rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
  }

  @media screen and (display-mode: standalone) {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 1rem;
  }

  & > section {
    margin-top: 1rem;
  }
`;

const SearchResultsIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SearchResultsText = styled.div`
  color: #ddd;
  font-size: 0.9375rem;
`;

const ClearSearchButton = styled.button`
  background-color: #2a2a2a;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: #333;
  }
`;

// COMPACT SECTION STYLES
const CompactContentSection = styled.section`
  margin-bottom: 0.5rem;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.03);

  &.collections-section {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

// ORIGINAL CONTENT SECTION (kept for Posts section)
const ContentSection = styled.section`
  margin-bottom: 1rem;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.03);

  &.collections-section {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

const CompactSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    flex-direction: ${(props) => (props.withSearch ? "column" : "row")};
    align-items: ${(props) => (props.withSearch ? "flex-start" : "center")};
    gap: ${(props) => (props.withSearch ? "0.75rem" : "0")};
  }
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 1rem; /* Reduced font size */
  display: flex;
  align-items: center;
  margin: 0;
  font-weight: 500;
  position: relative;
  padding: 0.125rem 0;

  svg {
    color: #ff7e5f;
    margin-right: 0.375rem;
    font-size: 0.9em;
  }

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
  font-size: 0.75rem; /* Reduced font size */
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// COMPACT COLLECTIONS STYLES
const CompactCollectionsRow = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 0.25rem 0;
  gap: 0.75rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &::after {
    content: "";
    padding-right: 0.5rem;
  }

  -webkit-overflow-scrolling: touch;
`;

const CompactCollectionCard = styled.div`
  flex: 0 0 auto;
  width: 60px; /* Reduced width */
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

const CompactCollectionCover = styled.img`
  width: 50px; /* Reduced size */
  height: 50px; /* Reduced size */
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff7e5f;
  padding: 2px; /* Reduced padding */
  background-color: #222;
  transition: border-color 0.2s;

  ${CompactCollectionCard}:hover & {
    border-color: #ff6347;
  }
`;

const CompactCollectionCoverPlaceholder = styled.div`
  width: 50px; /* Reduced size */
  height: 50px; /* Reduced size */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #222;
  border: 2px solid #ff7e5f;
  padding: 2px; /* Reduced padding */

  svg {
    font-size: 1rem; /* Reduced icon size */
    color: #555;
  }

  ${CompactCollectionCard}:hover & {
    border-color: #ff6347;
  }
`;

const CompactCollectionName = styled.h3`
  font-size: 0.6rem; /* Reduced font size */
  color: #ddd;
  margin: 0.35rem 0 0; /* Reduced margin */
  text-align: center;
  max-width: 60px; /* Match the card width */
  white-space: normal;
  overflow: visible;
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

// Original Collection Styles (kept as reference)
const CollectionsRow = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 0.5rem 0;
  gap: 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &::after {
    content: "";
    padding-right: 0.5rem;
  }

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
  font-size: 0.65rem;
  color: #ddd;
  margin: 0.5rem 0 0;
  text-align: center;
  max-width: 80px;
  white-space: normal;
  overflow: visible;
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  padding: 0.5rem 0; /* Reduced padding */
  font-size: 0.7rem; /* Reduced font size */
  height: 60px; /* Reduced height */
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  padding: 0.5rem 0; /* Reduced padding */
  font-size: 0.7rem; /* Reduced font size */
  height: 60px; /* Reduced height */
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  justify-content: center;
  padding: 0.25rem 0.125rem;
  background-color: rgba(20, 20, 20, 0.4);
  border-radius: 6px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }

  @media screen and (display-mode: standalone) {
    gap: 0.75rem;
  }
`;

const GridItem = styled.div`
  display: flex;
  height: 100%;
  width: 100%;

  @media screen and (display-mode: standalone) {
    width: 100%;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.9);
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: #ddd;
  font-size: 0.9375rem;
`;

const NoPostsMessage = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: #ddd;
  font-size: 0.9375rem;
`;

const LoadingMore = styled.div`
  text-align: center;
  margin: 1rem 0;
  color: #aaa;
  font-style: italic;
  font-size: 0.875rem;
`;

const AboutBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    padding: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }

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
  width: 40px;
  height: 40px;
  background-color: #ff7e5f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;

  svg {
    font-size: 1.125rem;
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
  font-size: 1.125rem;
  color: #333;
  margin: 0 0 0.25rem;

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
  font-size: 0.9375rem;
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
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.75rem;

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
