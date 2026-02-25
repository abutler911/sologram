import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteModal } from '../../context/DeleteModalContext';
import { COLORS } from '../../theme';
import { useStories, useDeleteStory } from '../../hooks/queries/useStories';

const EnhancedStories = ({ isPWA = false }) => {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: stories = [], isLoading: loading, error } = useStories();
  const { mutate: deleteStory } = useDeleteStory();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [localIsPWA, setLocalIsPWA] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );

  const storiesRef = useRef(null);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();
  const isAdmin = isAuthenticated && user && user.role === 'admin';
  const navigate = useNavigate();

  // ── PWA detection ─────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (e) => setLocalIsPWA(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // ── Story progression (RAF-based) ─────────────────────────────────────────
  const nextStoryItem = useCallback(() => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((p) => p + 1);
      setTimeLeft(10);
    } else {
      setActiveStory(null);
      setActiveStoryIndex(0);
    }
  }, [activeStory, activeStoryIndex]);

  useEffect(() => {
    let rafId;
    if (activeStory) {
      if (!activeStory.media || activeStoryIndex >= activeStory.media.length) {
        closeStory();
        return;
      }
      const isVideo =
        activeStory.media[activeStoryIndex]?.mediaType === 'video';
      if (!isVideo) {
        const start = Date.now();
        const duration = 10_000;
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          setTimeLeft(10 - progress * 10);
          if (progress < 1) rafId = requestAnimationFrame(tick);
          else nextStoryItem();
        };
        rafId = requestAnimationFrame(tick);
      }
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeStory, activeStoryIndex, nextStoryItem]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeStory) {
      document.body.style.overflow = 'hidden';
      if (localIsPWA || isPWA)
        document.body.style.paddingTop = 'env(safe-area-inset-top, 0)';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingTop = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingTop = '';
    };
  }, [activeStory, localIsPWA, isPWA]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sortStoriesByPriority = (data) => {
    if (!user) return data;
    return [...data].sort((a, b) => {
      if (a.userId === user._id) return -1;
      if (b.userId === user._id) return 1;
      const aNew = !a.viewers?.includes(user._id);
      const bNew = !b.viewers?.includes(user._id);
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const openStory = (story) => {
    setActiveStory(story);
    setActiveStoryIndex(0);
    setTimeLeft(10);
  };
  const closeStory = () => {
    setActiveStory(null);
    setActiveStoryIndex(0);
  };

  const handleNext = () => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((p) => p + 1);
      setTimeLeft(10);
    } else {
      closeStory();
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((p) => p - 1);
      setTimeLeft(10);
    }
  };

  const handleDeleteStory = () => {
    if (!activeStory || !isAdmin) return;
    showDeleteModal({
      title: 'Delete Story',
      message:
        'This action cannot be undone and the story will be permanently removed.',
      confirmText: 'Delete Story',
      cancelText: 'Keep Story',
      itemName: activeStory.title || 'this story',
      onConfirm: () => deleteStory(activeStory._id, { onSuccess: closeStory }),
      destructive: true,
    });
  };

  const getExpirationTime = (story) => {
    if (!story?.expiresAt) return '';
    const diffMs = new Date(story.expiresAt) - new Date();
    if (diffMs <= 0) return 'Expiring…';
    const h = Math.floor(diffMs / 3_600_000);
    const m = Math.floor((diffMs % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getThumbnailUrl = (media) => {
    if (!media) return '/placeholder-image.jpg';
    if (media.mediaType === 'image') return media.mediaUrl;
    if (media.mediaType === 'video') {
      const url = media.mediaUrl || '';
      if (url.includes('cloudinary.com')) {
        const parts = url.split('/');
        const idx = parts.findIndex((p) => p === 'upload');
        if (idx !== -1) {
          parts.splice(idx + 1, 0, 'w_400,h_600,c_fill,g_auto,so_1');
          const file = parts[parts.length - 1];
          const ext = file.split('.').pop().toLowerCase();
          if (['mp4', 'mov', 'avi', 'webm'].includes(ext))
            parts[parts.length - 1] = file.replace(`.${ext}`, '.jpg');
          return parts.join('/');
        }
      }
      return '/video-thumbnail-placeholder.jpg';
    }
    return media.mediaUrl;
  };

  const activeStories = sortStoriesByPriority(
    stories.filter((s) => new Date(s.expiresAt) > new Date())
  );

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StoriesContainer>
        <StoriesWrapper>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
        </StoriesWrapper>
      </StoriesContainer>
    );
  }

  if (error) {
    return (
      <StoriesContainer>
        <ErrorMessage>Unable to load stories.</ErrorMessage>
      </StoriesContainer>
    );
  }

  if (activeStories.length === 0 && !isAuthenticated) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <StoriesContainer>
        <StoriesWrapper ref={storiesRef}>
          {/* ── Create Story card ─────────────────────────────────────── */}
          {isAuthenticated && (
            <CreateCard onClick={() => navigate('/create-story')}>
              <CreateThumb>
                <CreatePlus>
                  <FaPlus />
                </CreatePlus>
              </CreateThumb>
              <CardLabel>New Story</CardLabel>
            </CreateCard>
          )}

          {/* ── Story cards ───────────────────────────────────────────── */}
          {activeStories.map((story) => {
            const firstMedia = story.media?.[0];
            const thumbUrl = firstMedia
              ? getThumbnailUrl(firstMedia)
              : '/placeholder-image.jpg';
            const isViewed = user && story.viewers?.includes(user._id);
            const isOwn = user && story.userId === user._id;
            const expiry = getExpirationTime(story);

            return (
              <StoryCard key={story._id} onClick={() => openStory(story)}>
                <StoryThumb $viewed={isViewed} $isOwn={isOwn}>
                  <StoryThumbImg
                    src={thumbUrl}
                    alt={story.title || 'Story'}
                    loading='lazy'
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                  <ThumbScrim />
                  <ThumbMeta>
                    {story.title && <ThumbTitle>{story.title}</ThumbTitle>}
                    {expiry && <ThumbExpiry>{expiry}</ThumbExpiry>}
                  </ThumbMeta>
                  {!isViewed && <UnviewedDot />}
                </StoryThumb>
                <CardLabel>{story.username || 'Andrew'}</CardLabel>
              </StoryCard>
            );
          })}
        </StoriesWrapper>
      </StoriesContainer>

      {/* ── STORY VIEWER ────────────────────────────────────────────────── */}
      {activeStory && (
        <StoryModal>
          {/* Progress pills */}
          <ProgressTrack>
            {activeStory.media.map((_, i) => {
              const progress =
                i < activeStoryIndex
                  ? 1
                  : i === activeStoryIndex &&
                    activeStory.media[i].mediaType !== 'video'
                  ? (10 - timeLeft) / 10
                  : 0;
              return (
                <PillTrack key={i}>
                  <PillFill $progress={progress} $complete={progress >= 1} />
                </PillTrack>
              );
            })}
          </ProgressTrack>

          {/* Top controls */}
          <ViewerControls>
            <ControlBtn onClick={closeStory} aria-label='Close story'>
              <FaTimes />
            </ControlBtn>
            {isAdmin && (
              <ControlBtn
                $danger
                onClick={handleDeleteStory}
                aria-label='Delete story'
              >
                <FaTrash />
              </ControlBtn>
            )}
          </ViewerControls>

          {/* Media */}
          <StoryContent>
            {activeStory.media[activeStoryIndex].mediaType === 'video' ? (
              <StoryVideo
                src={activeStory.media[activeStoryIndex].mediaUrl}
                controls
                autoPlay
                onEnded={handleNext}
                playsInline
              />
            ) : (
              <StoryImage
                src={activeStory.media[activeStoryIndex].mediaUrl}
                alt={activeStory.title}
              />
            )}
          </StoryContent>

          {/* Bottom info bar */}
          <ViewerInfoBar>
            <ViewerTitle>{activeStory.title || 'Story'}</ViewerTitle>
            <ViewerExpiry>{getExpirationTime(activeStory)}</ViewerExpiry>
          </ViewerInfoBar>

          {/* Tap zones */}
          <TapZones>
            <TapZone onClick={handlePrev} />
            <TapZone onClick={handleNext} />
          </TapZones>
        </StoryModal>
      )}
    </>
  );
};

export default EnhancedStories;

// ─── Animations ───────────────────────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// ─── Shelf ────────────────────────────────────────────────────────────────────

const StoriesContainer = styled.section`
  background: ${COLORS.background};
  border-bottom: 1px solid ${COLORS.divider};
  padding: 10px 0 14px;
`;

const StoriesWrapper = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 16px;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 480px) {
    gap: 8px;
    padding: 4px 12px;
  }
`;

// ─── Portrait card ────────────────────────────────────────────────────────────

const CARD_W = '82px';
const CARD_H = '116px';

const StoryCard = styled.div`
  flex: 0 0 auto;
  width: ${CARD_W};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  animation: ${slideUp} 0.3s ease both;

  @media (max-width: 480px) {
    width: 74px;
  }
`;

const ringStyle = css`
  /* gradient ring via box-shadow + padding trick */
  padding: 2px;
  background: ${(p) =>
    p.$isOwn
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.primaryMint})`
      : !p.$viewed
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.primaryMint})`
      : COLORS.border};
`;

const StoryThumb = styled.div`
  position: relative;
  width: 100%;
  height: ${CARD_H};
  border-radius: 12px;
  overflow: hidden;
  ${ringStyle}
  transition: transform 0.2s ease;

  ${StoryCard}:hover & {
    transform: scale(1.03);
  }

  @media (max-width: 480px) {
    height: 104px;
    border-radius: 10px;
  }
`;

const StoryThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 10px;
  background: ${COLORS.cardBackground};
`;

const ThumbScrim = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 55%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, transparent 100%);
  border-radius: 0 0 10px 10px;
  pointer-events: none;
`;

const ThumbMeta = styled.div`
  position: absolute;
  bottom: 7px;
  left: 6px;
  right: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const ThumbTitle = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
`;

const ThumbExpiry = styled.span`
  font-size: 0.58rem;
  font-weight: 600;
  color: ${COLORS.accentMint};
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
`;

const UnviewedDot = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${COLORS.primarySalmon};
  border: 2px solid ${COLORS.background};
  box-shadow: 0 0 6px ${COLORS.primarySalmon}88;
`;

const CardLabel = styled.span`
  font-size: 0.7rem;
  color: ${COLORS.textSecondary};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 500;
`;

// ─── Create card ──────────────────────────────────────────────────────────────

const CreateCard = styled(StoryCard)``;

const CreateThumb = styled.div`
  position: relative;
  width: 100%;
  height: ${CARD_H};
  border-radius: 12px;
  background: ${COLORS.cardBackground};
  border: 2px dashed ${COLORS.border};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;

  ${CreateCard}:hover & {
    border-color: ${COLORS.primarySalmon};
    background: ${COLORS.elevatedBackground};
    transform: scale(1.03);
  }

  @media (max-width: 480px) {
    height: 104px;
    border-radius: 10px;
  }
`;

const CreatePlus = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px ${COLORS.primarySalmon}55;
  transition: transform 0.2s;

  ${CreateCard}:hover & {
    transform: scale(1.1);
  }
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const skeletonBase = css`
  background: linear-gradient(
    90deg,
    ${COLORS.cardBackground} 25%,
    ${COLORS.elevatedBackground} 50%,
    ${COLORS.cardBackground} 75%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

const StoryCardSkeleton = styled.div`
  flex: 0 0 auto;
  width: ${CARD_W};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 100%;
    height: ${CARD_H};
    border-radius: 12px;
    ${skeletonBase}
  }
  &::after {
    content: '';
    width: 48px;
    height: 9px;
    border-radius: 4px;
    ${skeletonBase}
  }

  @media (max-width: 480px) {
    width: 74px;
    &::before {
      height: 104px;
      border-radius: 10px;
    }
  }
`;

const ErrorMessage = styled.p`
  color: ${COLORS.error};
  text-align: center;
  padding: 12px 0;
  font-size: 0.875rem;
`;

// ─── Story viewer ─────────────────────────────────────────────────────────────

const StoryModal = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  touch-action: none;
  animation: ${fadeIn} 0.2s ease;

  @supports (padding: env(safe-area-inset-top)) {
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

const StoryContent = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
`;

const StoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StoryVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: none;
`;

// ─── Progress pills ───────────────────────────────────────────────────────────

const ProgressTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 12px 12px 8px;
  z-index: 10;
  pointer-events: none;

  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(12px + env(safe-area-inset-top, 0));
  }
`;

const PillTrack = styled.div`
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.28);
  overflow: hidden;
`;

const PillFill = styled.div`
  height: 100%;
  width: ${(p) => (p.$complete ? '100%' : `${(p.$progress || 0) * 100}%`)};
  background: linear-gradient(
    90deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  border-radius: 2px;
  transition: width 0.1s linear;
  box-shadow: 0 0 6px ${COLORS.primarySalmon}66;
`;

// ─── Top controls ─────────────────────────────────────────────────────────────

const ViewerControls = styled.div`
  position: absolute;
  top: 16px;
  right: 14px;
  z-index: 11;
  display: flex;
  gap: 10px;

  @supports (padding-top: env(safe-area-inset-top)) {
    top: calc(16px + env(safe-area-inset-top, 0));
  }
`;

const ControlBtn = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: ${(p) =>
    p.$danger ? `${COLORS.error}cc` : 'rgba(0, 0, 0, 0.5)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: ${(p) => (p.$danger ? COLORS.error : 'rgba(0, 0, 0, 0.75)')};
    transform: scale(1.08);
  }
`;

// ─── Bottom info bar ──────────────────────────────────────────────────────────

const ViewerInfoBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 28px 18px 20px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, transparent 100%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  pointer-events: none;

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0));
  }
`;

const ViewerTitle = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
  letter-spacing: -0.01em;
`;

const ViewerExpiry = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${COLORS.accentMint};
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
  letter-spacing: 0.3px;
`;

// ─── Tap zones ────────────────────────────────────────────────────────────────

const TapZones = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  z-index: 5;
`;

const TapZone = styled.div`
  flex: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
`;
