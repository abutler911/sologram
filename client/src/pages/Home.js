import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaCamera } from "react-icons/fa";
import Stories from "../components/stories/Stories";
import PreloadImage from "../components/PreLoadImage";
import { COLORS, THEME } from "../theme";
import { LikesContext } from "../context/LikesContext";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const PostCard = lazy(() => import("../components/posts/PostCard"));

const Home = forwardRef((props, ref) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showAboutBanner, setShowAboutBanner] = useState(true);
  const [isPWA, setIsPWA] = useState(
    window.matchMedia("(display-mode: standalone)").matches
  );

  const { isAuthenticated } = useContext(AuthContext);
  const { batchCheckLikeStatus } = useContext(LikesContext);

  const observer = useRef();

  useEffect(() => {
    if (isAuthenticated && posts.length > 0) {
      const postIds = posts.map((post) => post._id);
      batchCheckLikeStatus(postIds);
    }
  }, [isAuthenticated, posts, batchCheckLikeStatus]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setIsPWA(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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

    return () => videoObserver.disconnect();
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

  const firstPostImage =
    posts.length > 0 &&
    posts[0].media?.length > 0 &&
    posts[0].media[0].mediaType === "image"
      ? posts[0].media[0].mediaUrl.replace(
          "/upload/",
          "/upload/w_614,h_614,f_auto,q_auto/"
        )
      : null;

  return (
    <>
      {firstPostImage && (
        <PreloadImage src={firstPostImage} type="image/webp" />
      )}
      <PageWrapper>
        <HomeContainer isPWA={isPWA}>
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

          <Stories />

          {error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : posts.length > 0 ? (
            <PostGrid isPWA={isPWA}>
              <Suspense
                fallback={
                  <LoadingContainer>
                    <LoadingSpinner
                      size="medium"
                      color={COLORS.primarySalmon}
                    />
                  </LoadingContainer>
                }
              >
                {posts.map((post, index) => (
                  <GridItem
                    ref={posts.length === index + 1 ? lastPostElementRef : null}
                    key={post._id}
                    isPWA={isPWA}
                  >
                    <PostCard
                      post={post}
                      index={index}
                      onDelete={(deletedId) => {
                        setPosts((prevPosts) =>
                          prevPosts.filter((p) => p._id !== deletedId)
                        );
                      }}
                      onLike={(likedPostId) => {
                        setPosts((prevPosts) =>
                          prevPosts.map((p) =>
                            p._id === likedPostId
                              ? { ...p, likes: (p.likes || 0) + 1 }
                              : p
                          )
                        );
                      }}
                    />
                  </GridItem>
                ))}
              </Suspense>
            </PostGrid>
          ) : loading ? (
            <LoadingContainer>
              <LoadingSpinner size="large" color={COLORS.primarySalmon} />
              <LoadingText>Loading posts...</LoadingText>
            </LoadingContainer>
          ) : (
            <NoPostsMessage>
              No posts available. Start creating your own content!
            </NoPostsMessage>
          )}

          {loading && posts.length > 0 && (
            <LoadingMoreContainer>
              <LoadingSpinner size="small" color={COLORS.primarySalmon} />
              <LoadingMoreText>Loading more posts...</LoadingMoreText>
            </LoadingMoreContainer>
          )}
        </HomeContainer>
      </PageWrapper>
    </>
  );
});

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 0.5rem 0 5rem;

  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 2rem;

  @media (max-width: 768px) {
    max-width: 100%;
    padding: ${(props) => (props.isPWA ? "0.5rem 0.25rem" : "0.5rem 0.5rem")};
    box-sizing: border-box;
  }

  @media (max-width: 480px) {
    padding: ${(props) => (props.isPWA ? "0.25rem 0" : "0.5rem 0.25rem")};
  }

  & > section {
    margin-top: 1rem;
  }
`;

const SearchResultsIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${COLORS.cardBackground};
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
  color: ${COLORS.textSecondary};
  font-size: 0.9375rem;
`;

const ClearSearchButton = styled.button`
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: ${THEME.button.secondary.hoverBackground};
    border-color: ${COLORS.primarySalmon};
  }
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 0;
  margin: 0;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Always one column on mobile/PWA */
    gap: ${(props) => (props.isPWA ? "0.5rem" : "0.75rem")};
    padding: ${(props) => (props.isPWA ? "0" : "0 0.25rem")};
    width: 100%;
    border-radius: ${(props) => (props.isPWA ? "0" : "6px")};
  }
`;

const GridItem = styled.div`
  display: flex;
  justify-content: center; /* Center the card */
  height: 100%;
  max-width: 100%;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 3rem 0;
  padding: 2rem;
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  color: ${COLORS.textSecondary};
  font-size: 0.9375rem;
`;

const LoadingMoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const LoadingMoreText = styled.div`
  color: ${COLORS.textSecondary};
  font-style: italic;
  font-size: 0.875rem;
`;

const NoPostsMessage = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: ${COLORS.textSecondary};
  font-size: 0.9375rem;
`;

const AboutBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${COLORS.primarySalmon};

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
  background-color: ${COLORS.primarySalmon};
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
  color: ${COLORS.textPrimary};
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
  color: ${COLORS.primaryMint};
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
  color: ${COLORS.textTertiary};
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.75rem;

  &:hover {
    color: ${COLORS.textSecondary};
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
