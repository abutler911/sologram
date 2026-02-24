import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteModal } from '../../context/DeleteModalContext';
import { COLORS, THEME } from '../../theme';
import { useStories, useDeleteStory } from '../../hooks/queries/useStories';

const EnhancedStories = ({ isPWA = false }) => {
  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: stories = [], isLoading: loading, error } = useStories();
  const { mutate: deleteStory } = useDeleteStory();

  // ── UI state ────────────────────────────────────────────────────────────────
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

  // ── PWA detection ────────────────────────────────────────────────────────────
  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setLocalIsPWA(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ── Story progression ────────────────────────────────────────────────────────
  const nextStoryItem = useCallback(() => {
    if (activeStory && activeStoryIndex < activeStory.media.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setTimeLeft(10);
    } else {
      setActiveStory(null);
      setActiveStoryIndex(0);
    }
  }, [activeStory, activeStoryIndex]);

  useEffect(() => {
    let animationFrameId;

    if (activeStory) {
      if (!activeStory.media || activeStoryIndex >= activeStory.media.length) {
        closeStory();
        return;
      }

      const currentMedia = activeStory.media[activeStoryIndex];
      const isVideo = currentMedia && currentMedia.mediaType === 'video';

      if (!isVideo) {
        const startTime = Date.now();
        const duration = 10000;

        const animate = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          setTimeLeft(10 - progress * 10);
          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
          } else {
            nextStoryItem();
          }
        };

        animationFrameId = requestAnimationFrame(animate);
      }
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activeStory, activeStoryIndex, nextStoryItem]);

  // ── Body scroll lock ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeStory) {
      document.body.style.overflow = 'hidden';
      if (localIsPWA || isPWA) {
        document.body.style.paddingTop = 'env(safe-area-inset-top, 0)';
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingTop = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingTop = '';
    };
  }, [activeStory, localIsPWA, isPWA]);

  // ── Utilities ────────────────────────────────────────────────────────────────
  const sortStoriesByPriority = (storiesData) => {
    if (!user) return storiesData;
    return [...storiesData].sort((a, b) => {
      if (a.userId === user._id) return -1;
      if (b.userId === user._id) return 1;
      const aIsUnwatched = !a.viewers?.includes(user._id);
      const bIsUnwatched = !b.viewers?.includes(user._id);
      if (aIsUnwatched && !bIsUnwatched) return -1;
      if (!aIsUnwatched && bIsUnwatched) return 1;
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
      setActiveStoryIndex((prev) => prev + 1);
      setTimeLeft(10);
    } else {
      closeStory();
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setTimeLeft(10);
    }
  };

  const handleDeleteStory = () => {
    if (!activeStory || !isAdmin) return;

    const storyTitle = activeStory.title || 'this story';
    const expirationTime = getExpirationTime(activeStory);

    showDeleteModal({
      title: 'Delete Story',
      message:
        'Are you sure you want to delete this story? This action cannot be undone and the story will be permanently removed from all viewers.',
      confirmText: 'Delete Story',
      cancelText: 'Keep Story',
      itemName: `${storyTitle} (expires in ${expirationTime})`,
      onConfirm: () => {
        deleteStory(activeStory._id, {
          onSuccess: () => closeStory(),
        });
      },
      destructive: true,
    });
  };

  const getExpirationTime = (story) => {
    if (!story?.expiresAt) return 'Unknown';
    const diffMs = new Date(story.expiresAt) - new Date();
    if (diffMs <= 0) return 'Expiring...';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
  };

  const getThumbnailUrl = (media) => {
    if (!media) return '/placeholder-image.jpg';
    if (media.mediaType === 'image') return media.mediaUrl;
    if (media.mediaType === 'video') {
      const url = media.mediaUrl;
      if (url?.includes('cloudinary.com')) {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex((part) => part === 'upload');
        if (uploadIndex !== -1) {
          urlParts.splice(uploadIndex + 1, 0, 'w_400,h_400,c_fill,g_auto,so_1');
          const filename = urlParts[urlParts.length - 1];
          const extension = filename.split('.').pop();
          if (['mp4', 'mov', 'avi', 'webm'].includes(extension.toLowerCase())) {
            urlParts[urlParts.length - 1] = filename.replace(
              `.${extension}`,
              '.jpg'
            );
          }
          return urlParts.join('/');
        }
      }
      return '/video-thumbnail-placeholder.jpg';
    }
    return media.mediaUrl;
  };

  // ── Filter + sort active stories ─────────────────────────────────────────────
  const activeStories = sortStoriesByPriority(
    stories.filter((s) => new Date(s.expiresAt) > new Date())
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <StoriesWrapper>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <StoryItemSkeleton key={i} />
            ))}
        </StoriesWrapper>
      </StoriesContainer>
    );
  }

  if (error) {
    return (
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <ErrorMessage>
          Unable to load stories. Please try again later.
        </ErrorMessage>
      </StoriesContainer>
    );
  }

  if (activeStories.length === 0 && !isAuthenticated) return null;

  return (
    <>
      <StoriesContainer isPWA={localIsPWA || isPWA}>
        <ScrollableContainer>
          <StoriesWrapper ref={storiesRef}>
            {isAuthenticated && (
              <CreateStoryItem onClick={() => navigate('/create-story')}>
                <CreateStoryAvatarWrapper>
                  <CreateStoryButton>
                    <FaPlus />
                  </CreateStoryButton>
                </CreateStoryAvatarWrapper>
                <CreateStoryLabel>Your Story</CreateStoryLabel>
              </CreateStoryItem>
            )}

            {activeStories.map((story) => {
              const firstMedia = story.media?.[0];
              const thumbnailUrl = firstMedia
                ? getThumbnailUrl(firstMedia)
                : '/placeholder-image.jpg';
              const isOwnStory = user && story.userId === user._id;
              const isViewed = user && story.viewers?.includes(user._id);

              return (
                <StoryItem
                  key={story._id}
                  onClick={() => openStory(story)}
                  viewed={isViewed}
                  isOwn={isOwnStory}
                >
                  <StoryAvatarWrapper viewed={isViewed} isOwn={isOwnStory}>
                    <StoryAvatar
                      src={thumbnailUrl}
                      alt={story.title || 'Story'}
                      loading='lazy'
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('image-fallback');
                      }}
                    />
                  </StoryAvatarWrapper>
                  <StoryUsername>{story.username || 'Andrew'}</StoryUsername>
                </StoryItem>
              );
            })}
          </StoriesWrapper>
        </ScrollableContainer>
      </StoriesContainer>

      {activeStory && (
        <StoryModal>
          <ProgressBarContainer>
            {activeStory.media.map((_, index) => {
              const progress =
                index < activeStoryIndex
                  ? 1
                  : index === activeStoryIndex &&
                    activeStory.media[index].mediaType !== 'video'
                  ? (10 - timeLeft) / 10
                  : 0;
              return (
                <ProgressBarBackground key={index} complete={progress >= 1}>
                  <ProgressFill progress={progress} complete={progress >= 1} />
                </ProgressBarBackground>
              );
            })}
          </ProgressBarContainer>

          <StoryHeader>
            <StoryHeaderContent>
              <div className='story-user'>{activeStory.title || 'Story'}</div>
              <StoryTimestamp>{getExpirationTime(activeStory)}</StoryTimestamp>
            </StoryHeaderContent>
          </StoryHeader>

          <ControlsBar>
            <CloseButton onClick={closeStory}>
              <FaTimes />
            </CloseButton>
            {isAdmin && (
              <DeleteButton
                onClick={handleDeleteStory}
                title='Delete this story'
              >
                <FaTrash />
              </DeleteButton>
            )}
          </ControlsBar>

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
              <FullScreenImage
                src={activeStory.media[activeStoryIndex].mediaUrl}
                alt={activeStory.title}
              />
            )}
          </StoryContent>

          <StoryNavigation>
            <NavArea onClick={handlePrev} side='left' />
            <NavArea onClick={handleNext} side='right' />
          </StoryNavigation>
        </StoryModal>
      )}
    </>
  );
};

// ── Styled Components ─────────────────────────────────────────────────────────

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const StoriesContainer = styled.section`
  background-color: ${COLORS.background};
  border-radius: 0;
  padding: 8px 0 12px;
  margin: 0;
  box-shadow: none;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid ${COLORS.divider};
  @media (max-width: 768px) {
    padding: 8px 0 10px;
  }
  @media (max-width: 480px) {
    padding: 6px 0 8px;
  }
`;

const ScrollableContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: auto;
`;

const StoriesWrapper = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 16px;
  position: relative;
  z-index: 1;
  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 768px) {
    gap: 10px;
    padding: 4px 12px;
  }
  @media (max-width: 480px) {
    gap: 8px;
    padding: 4px 8px;
  }
`;

const StoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex: 0 0 auto;
  width: 66px;
  transition: transform 0.2s ease, opacity 0.2s ease;
  position: relative;
  z-index: 2;
  &:hover {
    transform: translateY(-2px);
    opacity: 0.9;
  }
  @media (max-width: 768px) {
    width: 64px;
  }
  @media (max-width: 480px) {
    width: 62px;
  }
`;

const StoryAvatarWrapper = styled.div`
  width: 62px;
  height: 62px;
  border-radius: 50%;
  padding: 2px;
  margin-bottom: 6px;
  position: relative;
  background: ${(props) => {
    if (props.isOwn)
      return `linear-gradient(45deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon})`;
    if (!props.viewed)
      return `linear-gradient(45deg, ${COLORS.primaryBlueGray}, ${COLORS.primaryMint}, ${COLORS.accentMint})`;
    return COLORS.border;
  }};
  z-index: 2;
  box-shadow: ${(props) =>
    props.isOwn || !props.viewed
      ? `0 0 0 1px ${COLORS.background}, 0 2px 8px rgba(0,0,0,0.3)`
      : 'none'};
  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
  }
  @media (max-width: 480px) {
    width: 54px;
    height: 54px;
    margin-bottom: 4px;
  }
  &.image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${COLORS.cardBackground};
    &:before {
      content: '\\f03e';
      font-family: 'Font Awesome 5 Free';
      font-weight: 900;
      font-size: 1.2rem;
      color: ${COLORS.textTertiary};
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

const StoryAvatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: ${COLORS.cardBackground};
  border: 2px solid ${COLORS.background};
`;

const StoryUsername = styled.span`
  font-size: 12px;
  color: ${COLORS.textSecondary};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const CreateStoryItem = styled(StoryItem)``;

const CreateStoryAvatarWrapper = styled.div`
  width: 62px;
  height: 62px;
  border-radius: 50%;
  margin-bottom: 6px;
  position: relative;
  background: ${COLORS.cardBackground};
  border: 2px dashed ${COLORS.border};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  &:hover {
    border-color: ${COLORS.primaryBlueGray};
    background: ${COLORS.elevatedBackground};
  }
  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
  }
  @media (max-width: 480px) {
    width: 54px;
    height: 54px;
    margin-bottom: 4px;
  }
`;

const CreateStoryButton = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${COLORS.primaryBlueGray};
  color: ${COLORS.textPrimary};
  font-size: 14px;
  transition: all 0.3s ease;
  &:hover {
    background: ${COLORS.primaryMint};
    transform: scale(1.1);
  }
  @media (max-width: 480px) {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
`;

const CreateStoryLabel = styled.span`
  font-size: 12px;
  color: ${COLORS.textSecondary};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const StoryItemSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 66px;
  &:before {
    content: '';
    width: 62px;
    height: 62px;
    border-radius: 50%;
    margin-bottom: 6px;
    background: linear-gradient(
      90deg,
      ${COLORS.cardBackground} 8%,
      ${COLORS.elevatedBackground} 18%,
      ${COLORS.cardBackground} 33%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }
  &:after {
    content: '';
    width: 40px;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      ${COLORS.cardBackground} 8%,
      ${COLORS.elevatedBackground} 18%,
      ${COLORS.cardBackground} 33%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }
  @media (max-width: 768px) {
    width: 64px;
    &:before {
      width: 56px;
      height: 56px;
    }
  }
  @media (max-width: 480px) {
    width: 62px;
    &:before {
      width: 54px;
      height: 54px;
      margin-bottom: 4px;
    }
    &:after {
      height: 8px;
    }
  }
`;

const ErrorMessage = styled.div`
  color: ${COLORS.error};
  width: 100%;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
`;

const StoryModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${COLORS.background};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  touch-action: none;
  width: 100vw;
  height: 100vh;
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

const ProgressBarContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 12px 8px 8px;
  gap: 4px;
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(12px + env(safe-area-inset-top, 0));
  }
`;

const ProgressBarBackground = styled.div`
  position: relative;
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => (props.complete ? '100%' : `${props.progress * 100}%`)};
  background: linear-gradient(
    45deg,
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}
  );
  transition: width 0.1s linear;
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(136, 178, 204, 0.4);
`;

const StoryHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 5;
  background: linear-gradient(
    to bottom,
    rgba(18, 18, 18, 0.8) 0%,
    rgba(18, 18, 18, 0) 100%
  );
  pointer-events: none;
  @supports (padding-top: env(safe-area-inset-top)) {
    padding-top: calc(16px + env(safe-area-inset-top, 0));
  }
`;

const StoryHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  .story-user {
    font-size: 14px;
    color: ${COLORS.textPrimary};
    font-weight: 600;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Helvetica, Arial, sans-serif;
  }
`;

const StoryTimestamp = styled.span`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: normal;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
`;

const ControlsBar = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 12px;
  @supports (padding-top: env(safe-area-inset-top)) {
    top: calc(16px + env(safe-area-inset-top, 0));
  }
`;

const CloseButton = styled.button`
  background: rgba(18, 18, 18, 0.8);
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textPrimary};
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  &:hover {
    background: rgba(30, 30, 30, 0.9);
    border-color: ${COLORS.primaryBlueGray};
    transform: scale(1.05);
  }
`;

const DeleteButton = styled.button`
  background: rgba(255, 107, 107, 0.9);
  border: 1px solid ${COLORS.error};
  color: ${COLORS.textPrimary};
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  &:hover {
    background: ${COLORS.error};
    transform: scale(1.05);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StoryContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${COLORS.background};
  width: 100vw;
  height: 100vh;
`;

/* FIXED: cover fills the frame — no more black bars on portrait stories */
const FullScreenImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: 100vw;
`;

/* FIXED: cover fills the frame for video too */
const StoryVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: none;
  max-width: 100vw;
`;

const StoryNavigation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 4;
`;

const NavArea = styled.div`
  flex: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  user-select: none;
  &:focus {
    outline: none;
  }
`;

export default EnhancedStories;
