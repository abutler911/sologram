// client/src/pages/Thoughts.js
import React, {
  useState,
  useContext,
  useRef,
  useCallback,
  Suspense,
} from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import {
  FaSearch,
  FaTimes,
  FaRetweet,
  FaPen,
  FaLightbulb,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import { COLORS } from '../theme';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ThoughtCard from '../components/posts/ThoughtCard';
import {
  useInfiniteThoughts,
  useDeleteThought,
  useLikeThought,
  usePinThought,
} from '../hooks/queries/useThoughts';

// ── Constants ─────────────────────────────────────────────────────────────────

const moodEmojis = {
  inspired: '✨',
  reflective: '🌙',
  excited: '🔥',
  creative: '🎨',
  calm: '🌊',
  curious: '🔍',
  nostalgic: '📷',
  amused: '😄',
};

const defaultUser = {
  username: 'Andrew',
  handle: 'andrew',
  avatar: null,
};

// ── Component ─────────────────────────────────────────────────────────────────

const Thoughts = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const canCreateThought =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'creator');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); // submitted search
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState('all');
  const [showRetweetModal, setShowRetweetModal] = useState(false);

  // React Query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteThoughts(activeSearch);

  const deleteThought = useDeleteThought();
  const likeThought = useLikeThought();
  const pinThought = usePinThought();

  // Flatten pages into single array
  const allThoughts =
    data?.pages.flatMap((page) =>
      page.data.map((thought) => ({
        ...thought,
        user: defaultUser,
        userHasLiked: false,
        comments: thought.comments || [],
        shares: Math.floor(Math.random() * 10),
      }))
    ) ?? [];

  // IntersectionObserver sentinel — replaces scroll event listener
  const observer = useRef();
  const sentinelRef = useCallback(
    (node) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    if (window.innerWidth <= 768) setSearchExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const handleLike = (id) => likeThought.mutate(id);

  const handleRetweet = () => setShowRetweetModal(true);

  const handlePin = (id) => pinThought.mutate(id);

  const handleDeleteThought = (thoughtId) => {
    const thought = allThoughts.find((t) => t._id === thoughtId);
    const thoughtPreview =
      thought?.content?.length > 50
        ? thought.content.substring(0, 50) + '...'
        : thought?.content || 'this thought';

    showDeleteModal({
      title: 'Delete Thought',
      message: thought?.pinned
        ? 'This is a pinned thought. Deleting it will remove it from your pinned collection. This action cannot be undone.'
        : 'Are you sure you want to delete this thought? This action cannot be undone and all interactions will be lost.',
      confirmText: 'Delete Thought',
      cancelText: 'Keep Thought',
      itemName: thoughtPreview,
      onConfirm: () => deleteThought.mutate(thoughtId),
      onCancel: () => {},
      destructive: true,
    });
  };

  const formatDate = (dateString) =>
    format(new Date(dateString), 'MMM d, yyyy • h:mm a');

  // Client-side mood filter
  const filteredThoughts =
    selectedMood === 'all'
      ? allThoughts
      : allThoughts.filter((t) => t.mood === selectedMood);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <PageWrapper>
        <Header>
          <HeaderLeft>
            <PageTitle>SoloThoughts</PageTitle>
            <MoodFilter>
              <MoodButton
                active={selectedMood === 'all'}
                onClick={() => setSelectedMood('all')}
                mood='all'
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
                <SearchIconButton onClick={() => setSearchExpanded(true)}>
                  <FaSearch />
                </SearchIconButton>
              ) : (
                <SearchForm onSubmit={handleSearchSubmit}>
                  <SearchInput
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search thoughts...'
                  />
                  {searchQuery && (
                    <ClearButton type='button' onClick={clearSearch}>
                      <FaTimes />
                    </ClearButton>
                  )}
                  <SearchButton type='submit'>
                    <FaSearch />
                  </SearchButton>
                  <SearchButton
                    type='button'
                    onClick={() => {
                      setSearchExpanded(false);
                      clearSearch();
                    }}
                  >
                    <FaTimes />
                  </SearchButton>
                </SearchForm>
              )}
            </SearchContainer>

            {canCreateThought && (
              <CreateButton to='/thoughts/create'>
                <FaPen />
                <span>New Thought</span>
              </CreateButton>
            )}
          </HeaderRight>
        </Header>

        {activeSearch && (
          <SearchResultsBanner>
            Showing results for &ldquo;{activeSearch}&rdquo;
            <ClearSearchLink onClick={clearSearch}>Clear</ClearSearchLink>
          </SearchResultsBanner>
        )}

        <ThoughtsContainer>
          {error ? (
            <ErrorMessage>
              Failed to load thoughts. Please try again.
            </ErrorMessage>
          ) : isLoading ? (
            <LoadingSpinner text='Loading thoughts' />
          ) : filteredThoughts.length > 0 ? (
            <>
              {filteredThoughts.map((thought, index) => {
                const isLast = index === filteredThoughts.length - 1;
                return (
                  <Suspense
                    key={thought._id}
                    fallback={
                      <div
                        style={{
                          height: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                        }}
                      >
                        Loading thought...
                      </div>
                    }
                  >
                    <div ref={isLast ? sentinelRef : null}>
                      <ThoughtCard
                        thought={thought}
                        defaultUser={defaultUser}
                        formatDate={formatDate}
                        handleLike={handleLike}
                        handleRetweet={handleRetweet}
                        handlePin={handlePin}
                        canCreateThought={canCreateThought}
                        onDelete={handleDeleteThought}
                      />
                    </div>
                  </Suspense>
                );
              })}

              {isFetchingNextPage && (
                <LoadingMore>
                  <LoadingSpinner
                    size='30px'
                    text='Loading more'
                    textSize='0.875rem'
                    height='80px'
                  />
                </LoadingMore>
              )}
            </>
          ) : (
            <EmptyState>
              <FaLightbulb />
              <p>
                No thoughts found
                {activeSearch && ` matching "${activeSearch}"`}
                {selectedMood !== 'all' && ` with mood "${selectedMood}"`}.
              </p>
            </EmptyState>
          )}
        </ThoughtsContainer>
      </PageWrapper>

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

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const MoodFilter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const MoodButton = styled.button`
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.elevatedBackground};
  color: ${(props) => (props.active ? 'white' : COLORS.textSecondary)};
  border: 1px solid
    ${(props) => (props.active ? COLORS.primarySalmon : COLORS.border)};
  border-radius: 20px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.primarySalmon};
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  width: ${(props) => (props.expanded ? '250px' : 'auto')};
`;

const SearchIconButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1rem;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 20px;
  padding: 0.25rem 0.5rem;
  width: 100%;
  gap: 0.25rem;
`;

const SearchInput = styled.input`
  background: none;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;
  flex: 1;
  outline: none;
  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.875rem;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.75rem;
`;

const CreateButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(233, 137, 115, 0.3);
  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(233, 137, 115, 0.4);
  }
`;

const SearchResultsBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
`;

const ClearSearchLink = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primarySalmon};
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

const ThoughtsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${COLORS.error};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 0;
  color: ${COLORS.textTertiary};
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.4;
  }
  p {
    font-size: 1rem;
  }
`;

const LoadingMore = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const RetweetModal = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
`;

const ModalIcon = styled.div`
  font-size: 3rem;
  color: ${COLORS.primarySalmon};
  margin-bottom: 1rem;
`;

const RetweetModalContent = styled.div`
  h3 {
    color: ${COLORS.textPrimary};
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
  }
  p {
    color: ${COLORS.textSecondary};
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
  }
`;

const RetweetCloseButton = styled.button`
  margin-top: 1.5rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

export default Thoughts;
