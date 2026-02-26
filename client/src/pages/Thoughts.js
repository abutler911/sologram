// pages/Thoughts.js
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
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

const MOODS = Object.keys(moodEmojis);
const defaultUser = { username: 'Andrew', handle: 'andrew', avatar: null };

// ─── Design tokens — mirrors PostCard's NOIR palette ─────────────────────────
const NOIR = {
  ink: '#0a0a0b',
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  border: 'rgba(10,10,11,0.08)',
  salmon: '#e87c5a',
  sage: '#7aab8c',
};

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const revealIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ─── Component ────────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <FeedWrapper>
      {/* ══ Sticky feed header ══════════════════════════════════════════════ */}
      <FeedHeader>
        <FeedHeaderTop>
          <FeedTitle>
            <TitleItalic>Solo</TitleItalic>Thoughts
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

        {/* Mood tabs */}
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
        <LoadingBox>
          <LoadingSpinner text='Loading thoughts' height='300px' />
        </LoadingBox>
      ) : visible.length === 0 ? (
        <StatusBox>
          <EmptyGlyph>—</EmptyGlyph>
          <EmptyTitle>
            {activeSearch
              ? `No results for "${activeSearch}"`
              : selectedMood !== 'all'
              ? `No ${selectedMood} thoughts yet`
              : 'No thoughts yet'}
          </EmptyTitle>
          {canCreate && (
            <RetryBtn as={Link} to='/thoughts/create'>
              Write your first thought
            </RetryBtn>
          )}
        </StatusBox>
      ) : (
        <>
          <CardFeed>
            {visible.map((thought, i) => (
              <ThoughtCardWrap
                key={thought._id}
                style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
              >
                <ThoughtCard
                  thought={thought}
                  defaultUser={defaultUser}
                  formatDate={formatDate}
                  handleLike={handleLike}
                  handleRetweet={() => {}}
                  handlePin={handlePin}
                  canCreateThought={canCreate}
                  onDelete={handleDeleteThought}
                />
              </ThoughtCardWrap>
            ))}
          </CardFeed>

          {loadingMore && (
            <LoadingMore>
              <LoadingSpinner size='28px' height='60px' />
            </LoadingMore>
          )}

          {!hasMore && visible.length > 0 && (
            <EndOfFeed>
              <EndRule />
              <EndText>you're all caught up</EndText>
              <EndRule />
            </EndOfFeed>
          )}
        </>
      )}
    </FeedWrapper>
  );
};

export default Thoughts;

// ─── Styled Components ────────────────────────────────────────────────────────

const FeedWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${COLORS.background};
  animation: ${fadeUp} 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;

  /* Push content right to clear the fixed sidebar — mirrors sidebar widths
     in AppNav: 72px at 960-1199px, 240px at 1200px+ */
  @media (min-width: 960px) {
    margin-left: 72px;
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
  }
`;

// ── Sticky header ─────────────────────────────────────────────────────────────

const FeedHeader = styled.div`
  position: sticky;
  top: 52px;
  z-index: 100;
  background: ${COLORS.background}f0;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  /* Gradient accent line — matches PostCard signature */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, ${NOIR.salmon} 0%, ${NOIR.sage} 100%);
  }

  @media (min-width: 960px) {
    top: 0;
  }
`;

const FeedHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 12px;
  gap: 12px;
`;

const FeedTitle = styled.h1`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.7rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: ${NOIR.warmWhite};
  margin: 0;
  flex-shrink: 0;
  line-height: 1;
`;

/* The italic "Solo" prefix — mirrors the PostCard author-name style */
const TitleItalic = styled.span`
  font-style: italic;
  font-weight: 300;
  color: ${NOIR.salmon};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
`;

const HeaderIconBtn = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  background: none;
  color: ${NOIR.ash};
  border-radius: 0;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.15s;
  flex-shrink: 0;
  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const SearchForm = styled.form`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0;
  padding: 7px 12px;
  min-width: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: ${NOIR.warmWhite};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  min-width: 0;
  &::placeholder {
    color: ${NOIR.ash};
  }
`;

const SearchClear = styled.button`
  background: none;
  border: none;
  color: ${NOIR.ash};
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  padding: 0;
  flex-shrink: 0;
  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const CancelBtn = styled.button`
  background: none;
  border: none;
  color: ${NOIR.salmon};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 400;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  &:hover {
    opacity: 0.7;
  }
`;

// ── Mood tabs ─────────────────────────────────────────────────────────────────

const MoodTabs = styled.div`
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0 4px;
`;

const MoodTab = styled.button`
  flex-shrink: 0;
  padding: 10px 14px;
  background: none;
  border: none;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => (p.$active ? NOIR.warmWhite : NOIR.ash)};
  cursor: pointer;
  position: relative;
  transition: color 0.15s;
  white-space: nowrap;

  /* Active underline — salmon, matches PostCard accent */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 14px;
    right: 14px;
    height: 1.5px;
    background: ${NOIR.salmon};
    opacity: ${(p) => (p.$active ? 1 : 0)};
    transition: opacity 0.15s;
  }

  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

// ── Compose row ───────────────────────────────────────────────────────────────

const ComposeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  /* Left accent border — thinner, editorial */
  border-left: 2px solid ${NOIR.salmon}66;
  cursor: pointer;
  transition: background 0.15s, border-left-color 0.15s;

  &:hover {
    background: rgba(250, 249, 247, 0.03);
    border-left-color: ${NOIR.salmon};
  }
`;

const ComposePlaceholder = styled.span`
  flex: 1;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.95rem;
  color: ${NOIR.ash};
  min-width: 0;
`;

const ComposeBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: none;
  border: 1px solid ${NOIR.salmon}88;
  color: ${NOIR.salmon};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  svg {
    width: 10px;
    height: 10px;
  }

  &:hover {
    background: ${NOIR.salmon}14;
    border-color: ${NOIR.salmon};
    color: ${NOIR.warmWhite};
  }
`;

// ── Card feed ─────────────────────────────────────────────────────────────────

const CardFeed = styled.div`
  display: flex;
  flex-direction: column;

  /* Mobile: no gap — 2px background bleed separates cards */
  @media (max-width: 639px) {
    gap: 2px;
  }

  /* Tablet + desktop: cards centred with breathing room */
  @media (min-width: 640px) {
    gap: 0;
    max-width: 680px;
    margin: 0 auto;
    padding: 24px 0 0;
  }
`;

/* Each ThoughtCard gets a staggered fade-up — same as PostCard reveal */
const ThoughtCardWrap = styled.div`
  opacity: 0;
  animation: ${revealIn} 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  position: relative;

  /* The 2px salmon→sage gradient top line — PostCard's signature */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, ${NOIR.salmon} 0%, ${NOIR.sage} 100%);
    z-index: 2;
  }
`;

// ── Loading / status states ───────────────────────────────────────────────────

const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`;

const LoadingMore = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
`;

const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 80px 24px;
  text-align: center;
`;

const EmptyGlyph = styled.div`
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 300;
  color: ${NOIR.ash};
  line-height: 1;
  opacity: 0.4;
`;

const EmptyTitle = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  color: ${NOIR.ash};
  letter-spacing: 0.01em;
  margin: 0;
`;

const RetryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  background: none;
  border: 1px solid ${NOIR.salmon}66;
  color: ${NOIR.salmon};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: ${NOIR.salmon}14;
    border-color: ${NOIR.salmon};
  }
`;

// ── End of feed ───────────────────────────────────────────────────────────────

const EndOfFeed = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 40px 24px 80px;
  max-width: 680px;
  margin: 0 auto;
`;

const EndRule = styled.div`
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
`;

const EndText = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  white-space: nowrap;
  opacity: 0.6;
`;
