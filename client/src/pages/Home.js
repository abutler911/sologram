// client/src/pages/Home.js
import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  forwardRef,
  useImperativeHandle,
  memo,
} from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { FaCamera } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';

import { COLORS } from '../theme';
import { LikesContext } from '../context/LikesContext';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  useInfinitePosts,
  useSearchPosts,
  patchInfinitePost,
  postKeys,
} from '../hooks/queries/usePosts';

const PostCard = lazy(() => import('../components/posts/PostCard'));
const EnhancedStories = lazy(() =>
  import('../components/stories/EnhancedStories')
);

// ── Sub-components (memoized to prevent unnecessary re-renders) ───────────────

const AboutBanner = memo(({ onClose }) => (
  <AboutBannerWrapper>
    <BannerContent>
      <LogoContainer>
        <FaCamera />
      </LogoContainer>
      <BannerTextContainer>
        <BannerTitle>Welcome to Sologram</BannerTitle>
        <BannerTagline>One Voice. Infinite Moments.</BannerTagline>
      </BannerTextContainer>
    </BannerContent>
    <CloseButton onClick={onClose}>×</CloseButton>
  </AboutBannerWrapper>
));

const SearchResultsIndicator = memo(
  ({ searchQuery, postsCount, onClearSearch }) => (
    <SearchResultsWrapper>
      <SearchResultsText>
        Showing results for &ldquo;{searchQuery}&rdquo; ({postsCount}{' '}
        {postsCount === 1 ? 'post' : 'posts'})
      </SearchResultsText>
      <ClearSearchButton onClick={onClearSearch}>
        Clear Search
      </ClearSearchButton>
    </SearchResultsWrapper>
  )
);

const LoadingIndicator = memo(({ type = 'main' }) =>
  type === 'main' ? (
    <LoadingContainer>
      <LoadingSpinner size='large' color={COLORS.primarySalmon} />
      <LoadingText>Loading posts...</LoadingText>
    </LoadingContainer>
  ) : (
    <LoadingMoreContainer>
      <LoadingSpinner size='small' color={COLORS.primarySalmon} />
      <LoadingMoreText>Loading more posts...</LoadingMoreText>
    </LoadingMoreContainer>
  )
);

// Grid renders the post list and attaches the sentinel ref on the last item
const PostsGrid = memo(
  forwardRef(({ posts, onPostDelete, onPostLike, isPWA }, sentinelRef) => (
    <PostGrid isPWA={isPWA}>
      <Suspense
        fallback={
          <LoadingContainer>
            <LoadingSpinner
              size='medium'
              color={COLORS.primarySalmon}
              noMinHeight
            />
          </LoadingContainer>
        }
      >
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <GridItem key={post._id} ref={isLast ? sentinelRef : null}>
              <PostCard
                post={post}
                index={index}
                onDelete={onPostDelete}
                onLike={onPostLike}
              />
            </GridItem>
          );
        })}
      </Suspense>
    </PostGrid>
  ))
);

// ── Main Component ────────────────────────────────────────────────────────────

const Home = forwardRef((props, ref) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useContext(AuthContext);
  const { batchCheckLikeStatus } = useContext(LikesContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAboutBanner, setShowAboutBanner] = useState(
    () => localStorage.getItem('aboutBannerClosed') !== 'true'
  );
  const [isPWA, setIsPWA] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );

  // ── Data ────────────────────────────────────────────────────────────────────

  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: feedError,
  } = useInfinitePosts();

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useSearchPosts(isSearching ? searchQuery : '');

  // Flatten infinite pages or use flat search results
  const posts = isSearching
    ? searchData?.data ?? []
    : feedData?.pages.flatMap((p) => p.data) ?? [];

  const isLoading = isSearching ? searchLoading : feedLoading;
  const error = isSearching ? searchError : feedError;

  // ── Side effects ────────────────────────────────────────────────────────────

  // Batch-check liked status whenever post list changes
  useEffect(() => {
    if (isAuthenticated && posts.length > 0) {
      batchCheckLikeStatus(posts.map((p) => p._id));
    }
  }, [isAuthenticated, posts, batchCheckLikeStatus]);

  // PWA detection
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (e) => setIsPWA(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Video lazy-loading (plays deferred src once video scrolls into view)
  useEffect(() => {
    if (!posts.length) return;
    const lazyVideos = document.querySelectorAll('video[data-src]');
    if (!lazyVideos.length) return;

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const video = entry.target;
          if (video.dataset.src && !video.src) {
            video.src = video.dataset.src;
            video.querySelectorAll('source[data-src]').forEach((s) => {
              s.src = s.dataset.src;
            });
            video.load();
          }
          videoObserver.unobserve(video);
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    lazyVideos.forEach((v) => videoObserver.observe(v));
    return () => videoObserver.disconnect();
  }, [posts]);

  // ── Imperative handle — AppNav drives search via this ref ────────────────────

  useImperativeHandle(ref, () => ({
    handleHeaderSearch: (query) => {
      if (!query?.trim()) return clearSearch();
      setSearchQuery(query);
      setIsSearching(true);
      if (searchData?.count === 0)
        toast.info('No posts found matching your search');
    },
    clearSearch,
  }));

  // ── Infinite scroll sentinel ─────────────────────────────────────────────────

  const sentinelObserver = useRef();
  const sentinelRef = useCallback(
    (node) => {
      if (isFetchingNextPage) return;
      if (sentinelObserver.current) sentinelObserver.current.disconnect();
      sentinelObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) sentinelObserver.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const closeBanner = () => {
    setShowAboutBanner(false);
    localStorage.setItem('aboutBannerClosed', 'true');
  };

  // Optimistic local updates — write straight into the RQ cache, no refetch needed
  const handlePostDelete = useCallback(
    (deletedId) => {
      queryClient.setQueryData(postKeys.infiniteFeed(), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((p) => p._id !== deletedId),
          })),
        };
      });
      if (isSearching && searchQuery) {
        queryClient.setQueryData(postKeys.search(searchQuery), (old) => {
          if (!old) return old;
          return { ...old, data: old.data.filter((p) => p._id !== deletedId) };
        });
      }
    },
    [queryClient, isSearching, searchQuery]
  );

  const handlePostLike = useCallback(
    (likedPostId) => {
      patchInfinitePost(queryClient, likedPostId, (p) => ({
        ...p,
        likes: (p.likes || 0) + 1,
      }));
    },
    [queryClient]
  );

  const bumpComments = useCallback(
    (postId, delta) => {
      patchInfinitePost(queryClient, postId, (p) => ({
        ...p,
        commentsCount: (p.commentsCount ?? p.commentCount ?? 0) + delta,
        commentCount: (p.commentCount ?? p.commentsCount ?? 0) + delta,
      }));
    },
    [queryClient]
  );

  const handleCommentAdded = useCallback(
    (postId) => bumpComments(postId, +1),
    [bumpComments]
  );
  const handleCommentDeleted = useCallback(
    (postId) => bumpComments(postId, -1),
    [bumpComments]
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <HomeContainer isPWA={isPWA}>
        {showAboutBanner && <AboutBanner onClose={closeBanner} />}

        {isSearching && searchQuery && (
          <SearchResultsIndicator
            searchQuery={searchQuery}
            postsCount={posts.length}
            onClearSearch={clearSearch}
          />
        )}

        <Suspense fallback={<LoadingIndicator />}>
          <EnhancedStories isPWA={isPWA} />
        </Suspense>

        {error ? (
          <ErrorMessage>Failed to load posts. Please try again.</ErrorMessage>
        ) : isLoading ? (
          <LoadingIndicator type='main' />
        ) : posts.length > 0 ? (
          <>
            <PostsGrid
              ref={isSearching ? null : sentinelRef}
              posts={posts}
              onPostDelete={handlePostDelete}
              onPostLike={handlePostLike}
              isPWA={isPWA}
            />
            {isFetchingNextPage && <LoadingIndicator type='more' />}
          </>
        ) : (
          <EmptyMessage>
            {isSearching
              ? `No posts found for "${searchQuery}"`
              : 'No posts yet'}
          </EmptyMessage>
        )}
      </HomeContainer>
    </PageWrapper>
  );
});

Home.displayName = 'Home';

export default Home;

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
`;

const HomeContainer = styled.div`
  max-width: 935px;
  margin: 0 auto;

  /* On mobile, no side padding — cards go full bleed */
  @media (max-width: 639px) {
    padding: ${(p) => (p.isPWA ? '0.5rem 0 0' : '1rem 0 0')};
  }

  /* Tablet and up — restore comfortable side padding */
  @media (min-width: 640px) {
    padding: ${(p) => (p.isPWA ? '0.5rem 1rem' : '1.5rem 1rem')};
  }
`;

const PostGrid = styled.div`
  /* Single-column feed — cards centre themselves via their own max-width */
  display: flex;
  flex-direction: column;

  /* On mobile: no gap, cards are separated by the 2px margin in CardWrapper */
  @media (max-width: 639px) {
    gap: 0;
  }

  /* Tablet and up: breathing room between cards */
  @media (min-width: 640px) {
    gap: 2rem;
  }
`;

const GridItem = styled.div`
  /*
    No border-radius, no overflow:hidden, no box-shadow here —
    PostCard owns all of its own visual treatment.
    This is just a transparent structural wrapper for the sentinel ref.
  */
  width: 100%;
`;

const AboutBannerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon}22,
    ${COLORS.primaryMint}22
  );
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 0 1rem 1.5rem;

  @media (min-width: 640px) {
    margin: 0 0 1.5rem;
  }
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LogoContainer = styled.div`
  font-size: 1.5rem;
  color: ${COLORS.primarySalmon};
`;

const BannerTextContainer = styled.div``;

const BannerTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const BannerTagline = styled.p`
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
  &:hover {
    color: ${COLORS.textSecondary};
  }
`;

const SearchResultsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin: 0 1rem 1rem;

  @media (min-width: 640px) {
    margin: 0 0 1rem;
  }
`;

const SearchResultsText = styled.span`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
`;

const ClearSearchButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primarySalmon};
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1rem;
`;

const LoadingText = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
`;

const LoadingMoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
  gap: 0.75rem;
`;

const LoadingMoreText = styled.span`
  color: ${COLORS.textSecondary};
  font-size: 0.875rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem 0;
  color: ${COLORS.error};
  font-size: 1rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  color: ${COLORS.textTertiary};
  font-size: 1rem;
`;
