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

// ─── NOIR tokens ──────────────────────────────────────────────────────────────
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

const EnhancedStories = ({ isPWA = false }) => {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: stories = [], isLoading: loading, error } = useStories();
  const { mutate: deleteStory } = useDeleteStory();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0–1, drives pill fill
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

  const [captionExpanded, setCaptionExpanded] = useState(false);
  // ── Story progression (RAF-based) ─────────────────────────────────────────
  // NOTE: progress is 0→1 driven by RAF. PillFill has NO css transition —
  // that was causing the timer to look frozen (transition fought RAF updates).
  const nextStoryItem = useCallback(() => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((p) => p + 1);
      setProgress(0);
    } else {
      setActiveStory(null);
      setActiveStoryIndex(0);
      setProgress(0);
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
          const p = Math.min(elapsed / duration, 1);
          setProgress(p);
          if (p < 1) rafId = requestAnimationFrame(tick);
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
    setProgress(0);
    setCaptionExpanded(false);
  };

  const closeStory = () => {
    setActiveStory(null);
    setActiveStoryIndex(0);
    setProgress(0);
  };

  const handleNext = () => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((p) => p + 1);
      setProgress(0);
    } else {
      closeStory();
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((p) => p - 1);
      setProgress(0);
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
    if (diffMs <= 0) return 'Expiring...';
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

  const currentMedia = activeStory?.media?.[activeStoryIndex];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <StoriesContainer>
        <StoriesWrapper ref={storiesRef}>
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

      {/* ── STORY VIEWER ──────────────────────────────────────────────────── */}
      {activeStory && (
        <StoryModal>
          {/* ── Media — full bleed background ─────────────────────────── */}
          <StoryContent>
            {currentMedia?.mediaType === 'video' ? (
              <StoryVideo
                src={currentMedia.mediaUrl}
                autoPlay
                playsInline
                onEnded={handleNext}
              />
            ) : (
              <StoryImage
                src={currentMedia?.mediaUrl}
                alt={activeStory.title || 'Story'}
              />
            )}
          </StoryContent>

          {/* ── Grain overlay — matches PostCard ──────────────────────── */}
          <GrainOverlay />

          {/* ── Top scrim ─────────────────────────────────────────────── */}
          <TopScrim />

          {/* ── Bottom scrim ──────────────────────────────────────────── */}
          <BottomScrim />

          {/* ── Progress pills ────────────────────────────────────────── */}
          {/* PillFill has NO css transition — RAF handles smoothness      */}
          <ProgressTrack>
            {activeStory.media.map((m, i) => {
              const pillProgress =
                i < activeStoryIndex
                  ? 1
                  : i === activeStoryIndex && m.mediaType !== 'video'
                  ? progress
                  : 0;
              return (
                <PillTrack key={i}>
                  <PillFill style={{ width: `${pillProgress * 100}%` }} />
                </PillTrack>
              );
            })}
          </ProgressTrack>

          {/* ── Top controls: close + delete ──────────────────────────── */}
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

          {/* ── Bottom info: author · title · caption · expiry ────────── */}
          <ViewerInfoBar>
            <AuthorRow>
              <AuthorName>Andrew Butler</AuthorName>
              <ExpiryBadge>{getExpirationTime(activeStory)}</ExpiryBadge>
            </AuthorRow>

            {activeStory.title && (
              <ViewerTitle>{activeStory.title}</ViewerTitle>
            )}

            {activeStory.caption && (
              <ViewerCaption
                $expanded={captionExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  setCaptionExpanded((prev) => !prev);
                }}
              >
                {activeStory.caption}
              </ViewerCaption>
            )}

            {/* Slide counter if multi-media */}
            {activeStory.media.length > 1 && (
              <SlideCounter>
                {String(activeStoryIndex + 1).padStart(2, '0')} /{' '}
                {String(activeStory.media.length).padStart(2, '0')}
              </SlideCounter>
            )}
          </ViewerInfoBar>

          {/* ── Tap zones (left = prev, right = next) ─────────────────── */}
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

const slideUpViewer = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
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
  padding: 2px;
  background: ${(p) =>
    p.$isOwn || !p.$viewed
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

// ─────────────────────────────────────────────────────────────────────────────
// STORY VIEWER — Editorial Noir
// ─────────────────────────────────────────────────────────────────────────────

const StoryModal = styled.div`
  position: fixed;
  inset: 0;
  background: ${NOIR.ink};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  touch-action: none;
  animation: ${fadeIn} 0.18s ease;

  @supports (padding: env(safe-area-inset-top)) {
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

// ── Full-bleed media ──────────────────────────────────────────────────────────

const StoryContent = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${NOIR.ink};
`;

const StoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Match PostCard's editorial desaturation */
  filter: saturate(0.88) contrast(1.04);
`;

const StoryVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: none;
`;

// ── Overlays ──────────────────────────────────────────────────────────────────

const GrainOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
  mix-blend-mode: overlay;
`;

const TopScrim = styled.div`
  position: absolute;
  inset: 0 0 auto 0;
  height: 22%;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 11, 0.72) 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 3;
`;

const BottomScrim = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 48%;
  background: linear-gradient(
    to top,
    rgba(10, 10, 11, 0.88) 0%,
    rgba(10, 10, 11, 0.32) 55%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 3;
`;

// ── Progress pills ─────────────────────────────────────────────────────────────
// Width is driven by inline style from RAF — NO css transition here.
// A transition would introduce lag that makes the bar look broken.

const ProgressTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 14px 14px 0;
  z-index: 10;
  pointer-events: none;

  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(14px + env(safe-area-inset-top, 0));
  }
`;

const PillTrack = styled.div`
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
`;

// No styled-component for PillFill — width is set via inline style from RAF
// Wrapping in styled would re-create the component on every progress tick
const PillFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${NOIR.salmon}, ${NOIR.sage});
  /* NO transition — RAF handles smoothness at 60fps */
  will-change: width;
`;

// ── Top controls ──────────────────────────────────────────────────────────────

const ViewerControls = styled.div`
  position: absolute;
  top: 18px;
  right: 14px;
  z-index: 11;
  display: flex;
  gap: 8px;

  @supports (padding-top: env(safe-area-inset-top)) {
    top: calc(18px + env(safe-area-inset-top, 0));
  }
`;

const ControlBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 0;
  border: 1px solid
    ${(p) => (p.$danger ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.15)')};
  background: ${(p) =>
    p.$danger ? 'rgba(192,57,43,0.35)' : 'rgba(10,10,11,0.45)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: ${(p) =>
      p.$danger ? 'rgba(192,57,43,0.7)' : 'rgba(10,10,11,0.75)'};
    transform: scale(1.05);
  }
`;

// ── Bottom info bar ───────────────────────────────────────────────────────────

const ViewerInfoBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
  will-change: contents;

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0));
  }
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
`;

const AuthorName = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
`;

const ExpiryBadge = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.sage};
  opacity: 0.85;
`;

const ViewerTitle = styled.h2`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-weight: 600;
  font-style: italic;
  font-size: 1.35rem;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin: 0;
  text-shadow: 0 2px 12px rgba(10, 10, 11, 0.5);

  @media (max-width: 480px) {
    font-size: 1.15rem;
  }
`;

const ViewerCaption = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 400;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 8px rgba(10, 10, 11, 0.6);
  cursor: pointer;
  pointer-events: auto;
  overflow: hidden;
  max-height: ${(p) => (p.$expanded ? '200px' : '2.5em')};
  transition: max-height 0.25s ease;
`;

const SlideCounter = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
`;

// ── Tap zones ─────────────────────────────────────────────────────────────────

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
