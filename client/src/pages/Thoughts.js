// pages/Thoughts.js
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaSearch, FaTimes, FaPen } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import ThoughtCard from '../components/posts/ThoughtCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { COLORS } from '../theme';
import { moodEmojis } from '../utils/themeConstants';
import { format } from 'date-fns';

/**
 * Thoughts — Twitter/Threads-style feed
 *
 * Structure
 *   ┌─ Sticky feed header ─────────────────────┐
 *   │  SoloThoughts            🔍              │
 *   │  [All] [✨] [🌙] [🔥] … (scrollable)    │
 *   └──────────────────────────────────────────┘
 *   ┌─ Compose row (admin/creator) ────────────┐
 *   │  [A]  What are you thinking?   [Post]    │
 *   └──────────────────────────────────────────┘
 *     divider
 *   ┌─ ThoughtCard (feed row) ─────────────────┐
 *   │  …repeating…                             │
 *   └──────────────────────────────────────────┘
 */

const MOODS = Object.keys(moodEmojis);

const defaultUser = { username: 'Andrew', handle: 'andrew', avatar: null };

const Thoughts = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();
  const navigate = useNavigate();

  const canCreate =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'creator');

  // ── Data state ─────────────────────────────────────────────────────────────
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ── Filter / search state ──────────────────────────────────────────────────
  const [selectedMood, setSelectedMood] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const searchRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchThoughts = useCallback(
    async (reset = false) => {
      try {
        reset ? setLoading(true) : setLoadingMore(true);

        const currentPage = reset ? 1 : page;
        const url = activeSearch
          ? `/api/thoughts/search?query=${activeSearch}&page=${currentPage}`
          : `/api/thoughts?page=${currentPage}`;

        const { data } = await axios.get(url);

        const incoming = data.data.map((t) => ({
          ...t,
          userHasLiked: false,
          comments: t.comments || [],
          shares: t.shares ?? 0,
        }));

        setThoughts((prev) =>
          reset || currentPage === 1 ? incoming : [...prev, ...incoming]
        );
        setHasMore(currentPage < data.totalPages);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load thoughts. Please try again.');
        toast.error('Failed to load thoughts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, activeSearch]
  );

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300;
      if (nearBottom && !loading && !loadingMore && hasMore) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, loadingMore, hasMore]);

  // ── Search focus ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchOpen) requestAnimationFrame(() => searchRef.current?.focus());
  }, [searchOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const submitSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    setActiveSearch(q);
    setPage(1);
    setThoughts([]);
    fetchThoughts(true);
    if (window.innerWidth <= 768) setSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
    setThoughts([]);
    fetchThoughts(true);
  };

  const handleLike = async (id) => {
    try {
      const { data } = await axios.put(`/api/thoughts/${id}/like`);
      setThoughts((prev) =>
        prev.map((t) =>
          t._id === id
            ? {
                ...data.data,
                userHasLiked: !t.userHasLiked,
                comments: t.comments,
                shares: t.shares,
              }
            : t
        )
      );
    } catch {
      toast.error('Failed to like thought');
    }
  };

  const handlePin = async (id) => {
    try {
      const { data } = await axios.put(`/api/thoughts/${id}/pin`);
      fetchThoughts(true);
      toast.success(`Thought ${data.data.pinned ? 'pinned' : 'unpinned'}`);
    } catch {
      toast.error('Failed to update pin');
    }
  };

  const handleDeleteThought = (id) => {
    const thought = thoughts.find((t) => t._id === id);
    const preview =
      thought?.content?.slice(0, 50) +
      (thought?.content?.length > 50 ? '…' : '');

    showDeleteModal({
      title: 'Delete Thought',
      message: thought?.pinned
        ? 'This is a pinned thought. Deleting it will remove it from your pinned collection. This action cannot be undone.'
        : 'Are you sure you want to delete this thought? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      itemName: preview,
      destructive: true,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/thoughts/${id}`);
          setThoughts((prev) => prev.filter((t) => t._id !== id));
          toast.success('Thought deleted');
        } catch {
          toast.error('Failed to delete thought');
        }
      },
    });
  };

  const formatDate = (dateString) =>
    format(new Date(dateString), 'MMM d, yyyy · h:mm a');

  // ── Filtered thoughts ──────────────────────────────────────────────────────
  const visible = thoughts.filter(
    (t) => selectedMood === 'all' || t.mood === selectedMood
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <FeedWrapper>
      {/* ══ Sticky feed header ══════════════════════════════════════════════ */}
      <FeedHeader>
        <FeedHeaderTop>
          <FeedTitle>
            <TitleAccent>Solo</TitleAccent>Thoughts
          </FeedTitle>
          <HeaderActions>
            {searchOpen ? (
              <SearchForm onSubmit={submitSearch}>
                <SearchInput
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search thoughts…'
                />
                {searchQuery && (
                  <SearchClear type='button' onClick={clearSearch}>
                    <FaTimes />
                  </SearchClear>
                )}
              </SearchForm>
            ) : (
              <HeaderIconBtn
                onClick={() => setSearchOpen(true)}
                aria-label='Search'
              >
                <FaSearch />
              </HeaderIconBtn>
            )}
            {searchOpen && (
              <CancelBtn
                type='button'
                onClick={() => {
                  setSearchOpen(false);
                  clearSearch();
                }}
              >
                Cancel
              </CancelBtn>
            )}
          </HeaderActions>
        </FeedHeaderTop>

        {/* Mood tabs — scrollable, flush to bottom of header */}
        <MoodTabs>
          <MoodTab
            $active={selectedMood === 'all'}
            onClick={() => setSelectedMood('all')}
          >
            All
          </MoodTab>
          {MOODS.map((mood) => (
            <MoodTab
              key={mood}
              $active={selectedMood === mood}
              onClick={() => setSelectedMood(mood)}
            >
              {moodEmojis[mood]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </MoodTab>
          ))}
        </MoodTabs>
      </FeedHeader>

      {/* ══ Compose row ═════════════════════════════════════════════════════ */}
      {canCreate && (
        <ComposeRow onClick={() => navigate('/thoughts/create')}>
          <ComposePlaceholder>What are you thinking?</ComposePlaceholder>
          <ComposeBtn type='button'>
            <FaPen />
            <span>Thought</span>
          </ComposeBtn>
        </ComposeRow>
      )}

      {/* ══ Feed ════════════════════════════════════════════════════════════ */}
      {error ? (
        <StatusBox>
          <p>{error}</p>
          <RetryBtn onClick={() => fetchThoughts(true)}>Try again</RetryBtn>
        </StatusBox>
      ) : loading ? (
        <LoadingSpinner text='Loading thoughts' height='300px' />
      ) : visible.length === 0 ? (
        <StatusBox>
          <EmptyIcon>💭</EmptyIcon>
          <p>
            {activeSearch
              ? `No thoughts matching "${activeSearch}"`
              : selectedMood !== 'all'
              ? `No ${selectedMood} thoughts yet`
              : 'No thoughts yet'}
          </p>
          {canCreate && (
            <RetryBtn as={Link} to='/thoughts/create'>
              Write your first thought
            </RetryBtn>
          )}
        </StatusBox>
      ) : (
        <>
          <CardFeed>
            {visible.map((thought) => (
              <ThoughtCard
                key={thought._id}
                thought={thought}
                defaultUser={defaultUser}
                formatDate={formatDate}
                handleLike={handleLike}
                handleRetweet={() => {}} // future: real repost
                handlePin={handlePin}
                canCreateThought={canCreate}
                onDelete={handleDeleteThought}
              />
            ))}
          </CardFeed>
          {loadingMore && (
            <LoadingSpinner
              size='32px'
              text='Loading more'
              textSize='0.8rem'
              height='80px'
            />
          )}

          {!hasMore && visible.length > 0 && (
            <EndOfFeed>You've caught up ✦</EndOfFeed>
          )}
        </>
      )}
    </FeedWrapper>
  );
};

export default Thoughts;

// ─────────────────────────────────────────────────────────────────────────────
// Keyframes
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const FeedWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${COLORS.background};
  animation: ${fadeUp} 0.2s ease both;
`;

/* Cards sit in a flex column — the gap lets the dark page background
   bleed through as a natural gutter, making each mood-washed card
   read as a distinct surface */
const CardFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 0;

  @media (min-width: 600px) {
    gap: 8px;
    padding: 10px 10px 0;
  }
`;

/* ── Sticky feed header ── */
const FeedHeader = styled.div`
  position: sticky;
  top: 52px; /* clears the mobile top bar (54px) */
  z-index: 100;
  background: ${COLORS.background}ee;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid ${COLORS.border};

  @media (min-width: 960px) {
    top: 0; /* no mobile top bar on desktop */
  }
`;

const FeedHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  gap: 10px;
`;

const FeedTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  margin: 0;
  letter-spacing: -0.3px;
  flex-shrink: 0;

  /* AppNav TopBar already identifies the app on mobile —
     hide the redundant page title so two sticky bars don't stack */
  @media (max-width: 959px) {
    display: none;
  }
`;

const TitleAccent = styled.span`
  color: ${COLORS.primarySalmon};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
`;

const HeaderIconBtn = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  background: none;
  color: ${COLORS.textSecondary};
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
  &:hover {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.primarySalmon};
  }
`;

const SearchForm = styled.form`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 7px 12px;
  min-width: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: ${COLORS.textPrimary};
  font-size: 0.93rem;
  min-width: 0;
  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const SearchClear = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  padding: 0;
  flex-shrink: 0;
  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

const CancelBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primarySalmon};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  &:hover {
    opacity: 0.75;
  }
`;

/* Mood tabs */
const MoodTabs = styled.div`
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  border-top: 1px solid ${COLORS.border};
`;

const MoodTab = styled.button`
  flex-shrink: 0;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 0.85rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  color: ${(p) => (p.$active ? COLORS.textPrimary : COLORS.textTertiary)};
  cursor: pointer;
  position: relative;
  transition: color 0.12s;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: ${COLORS.primarySalmon};
    opacity: ${(p) => (p.$active ? 1 : 0)};
    transition: opacity 0.12s;
  }

  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

/* ── Compose row ── */
const ComposeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px 13px 20px;
  border-bottom: 1px solid ${COLORS.border};
  border-left: 3px solid ${COLORS.primarySalmon}55;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: ${COLORS.cardBackground}70;
    border-left-color: ${COLORS.primarySalmon};
  }
`;

const ComposePlaceholder = styled.span`
  flex: 1;
  font-size: 1rem;
  color: ${COLORS.textTertiary};
  min-width: 0;
`;

const ComposeBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: ${COLORS.primarySalmon};
  color: #fff;
  border: none;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, transform 0.1s;

  &:hover {
    background: ${COLORS.accentSalmon};
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.97);
  }
`;

/* ── Status states ── */
const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
  color: ${COLORS.textSecondary};
  font-size: 0.95rem;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  opacity: 0.5;
`;

const RetryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  background: ${COLORS.primarySalmon};
  color: #fff;
  border: none;
  border-radius: 99px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s;
  &:hover {
    background: ${COLORS.accentSalmon};
  }
`;

const EndOfFeed = styled.div`
  text-align: center;
  padding: 32px 16px 64px;
  color: ${COLORS.textTertiary};
  font-size: 0.82rem;
  letter-spacing: 0.5px;
`;
