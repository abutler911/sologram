// client/src/pages/ArchivedStoryView.js
import React, { useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
} from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme';
import {
  useArchivedStory,
  useDeleteArchivedStory,
} from '../hooks/queries/useStories';

const ArchivedStoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const { data: story, isLoading, error } = useArchivedStory(id);
  const deleteArchivedStory = useDeleteArchivedStory();

  const isAdmin = user?.role === 'admin';
  const isCreator = story && user?._id === story.createdBy;
  const canDelete = isAuthenticated && (isAdmin || isCreator);

  const nextMedia = () => {
    if (story && activeMediaIndex < story.media.length - 1) {
      setActiveMediaIndex((prev) => prev + 1);
    }
  };

  const prevMedia = () => {
    if (activeMediaIndex > 0) {
      setActiveMediaIndex((prev) => prev - 1);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextMedia,
    onSwipedRight: prevMedia,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const handleDelete = async () => {
    if (
      !window.confirm('Are you sure you want to permanently delete this story?')
    )
      return;
    try {
      await deleteArchivedStory.mutateAsync(id);
      navigate('/story-archive');
    } catch {
      // error toast handled in the hook
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading story...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !story) {
    return (
      <PageWrapper>
        <Container>
          <ErrorMessage>{error?.message || 'Story not found'}</ErrorMessage>
          <BackLink to='/story-archive'>Back to Archive</BackLink>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <PageHeader>
          <BackLink to='/story-archive'>
            <FaArrowLeft />
            <span>Back to Archive</span>
          </BackLink>
          {canDelete && (
            <DeleteButton
              onClick={handleDelete}
              disabled={deleteArchivedStory.isPending}
            >
              <FaTrash />
              <span>
                {deleteArchivedStory.isPending ? 'Deleting...' : 'Delete'}
              </span>
            </DeleteButton>
          )}
        </PageHeader>

        <StoryTitle>{story.title}</StoryTitle>
        <StoryDate>
          Created: {new Date(story.createdAt).toLocaleDateString()}
          {story.archivedAt && (
            <span>
              {' '}
              • Archived: {new Date(story.archivedAt).toLocaleDateString()}
            </span>
          )}
        </StoryDate>

        <MediaContainer {...swipeHandlers}>
          <MediaTrack
            style={{ transform: `translateX(-${activeMediaIndex * 100}%)` }}
          >
            {story.media.map((media, index) => (
              <MediaItem key={index}>
                {media.mediaType === 'image' ? (
                  <MediaImage
                    src={media.mediaUrl}
                    alt={`Story media ${index + 1}`}
                  />
                ) : (
                  <MediaVideo controls src={media.mediaUrl} />
                )}
              </MediaItem>
            ))}
          </MediaTrack>

          {story.media.length > 1 && (
            <>
              <NavButton
                direction='prev'
                onClick={prevMedia}
                disabled={activeMediaIndex === 0}
              >
                <FaChevronLeft />
              </NavButton>
              <NavButton
                direction='next'
                onClick={nextMedia}
                disabled={activeMediaIndex === story.media.length - 1}
              >
                <FaChevronRight />
              </NavButton>
              <MediaIndicator>
                {activeMediaIndex + 1} / {story.media.length}
              </MediaIndicator>
            </>
          )}
        </MediaContainer>
      </Container>
    </PageWrapper>
  );
};

// ── Styled Components (unchanged) ─────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 2rem 0;
`;

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${COLORS.textTertiary};
  text-decoration: none;
  transition: color 0.3s;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
  &:hover:not(:disabled) {
    background-color: rgba(231, 76, 60, 0.2);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StoryTitle = styled.h1`
  font-size: 1.75rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 0.5rem;
`;

const StoryDate = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`;

const MediaContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
  background-color: ${COLORS.elevatedBackground};
`;

const MediaTrack = styled.div`
  display: flex;
  transition: transform 0.3s ease;
`;

const MediaItem = styled.div`
  min-width: 100%;
`;

const MediaImage = styled.img`
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
`;

const MediaVideo = styled.video`
  width: 100%;
  max-height: 70vh;
  display: block;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ direction }) => (direction === 'prev' ? 'left: 1rem;' : 'right: 1rem;')}
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.8);
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const MediaIndicator = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  color: ${COLORS.textTertiary};
  font-size: 1.125rem;
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

export default ArchivedStoryView;
