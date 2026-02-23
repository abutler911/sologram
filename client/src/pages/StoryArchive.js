// client/src/pages/StoryArchive.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaTrash,
  FaArrowLeft,
  FaArchive,
  FaExclamationTriangle,
  FaRedoAlt,
  FaPlay,
} from 'react-icons/fa';
import { COLORS } from '../theme';
import { useDeleteModal } from '../context/DeleteModalContext';
import {
  useArchivedStories,
  useDeleteArchivedStory,
} from '../hooks/queries/useStories';
import LoadingSpinner from '../components/common/LoadingSpinner';

const getThumbnailUrl = (media) => {
  if (media.mediaType === 'image') return media.mediaUrl;
  return media.mediaUrl
    .replace('/video/upload/', '/video/upload/so_1,f_jpg/')
    .replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
};

const StoryArchive = () => {
  const { showDeleteModal } = useDeleteModal();
  const {
    data: archivedStories = [],
    isLoading,
    error,
    refetch,
  } = useArchivedStories();
  const deleteArchivedStory = useDeleteArchivedStory();

  const handleDeleteStory = (storyId) => {
    const story = archivedStories.find((s) => s._id === storyId);
    const storyTitle = story?.title || 'this archived story';

    showDeleteModal({
      title: 'Delete Archived Story',
      message:
        'Are you sure you want to permanently delete this archived story? This action cannot be undone and the story will be lost forever.',
      confirmText: 'Delete Permanently',
      cancelText: 'Keep Story',
      itemName: storyTitle,
      onConfirm: () => deleteArchivedStory.mutate(storyId),
      onCancel: () => {},
      destructive: true,
    });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner text='Loading archived stories' />
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackButton to='/'>
            <FaArrowLeft />
            <span>Back to Home</span>
          </BackButton>
          <PageTitle>
            <FaArchive />
            <span>Story Archive</span>
          </PageTitle>
        </Header>

        {error ? (
          <ErrorContainer>
            <ErrorIcon>
              <FaExclamationTriangle />
            </ErrorIcon>
            <ErrorMessage>
              {error.message || 'Failed to load archived stories.'}
            </ErrorMessage>
            <RetryButton onClick={() => refetch()}>
              <FaRedoAlt />
              <span>Retry</span>
            </RetryButton>
          </ErrorContainer>
        ) : archivedStories.length > 0 ? (
          <ArchiveGrid>
            {archivedStories.map((story) => (
              <StoryCard key={story._id}>
                <StoryThumbnail>
                  {story.media && story.media.length > 0 ? (
                    <>
                      <StoryImage
                        src={getThumbnailUrl(story.media[0])}
                        alt={story.title}
                        loading='lazy'
                      />
                      {story.media[0].mediaType === 'video' && (
                        <VideoBadge>
                          <FaPlay />
                        </VideoBadge>
                      )}
                    </>
                  ) : (
                    <NoImagePlaceholder>
                      <FaArchive />
                    </NoImagePlaceholder>
                  )}
                  <MediaCount>
                    {story.media ? story.media.length : 0}{' '}
                    {story.media?.length === 1 ? 'item' : 'items'}
                  </MediaCount>
                </StoryThumbnail>
                <StoryContent>
                  <StoryTitle>{story.title}</StoryTitle>
                  <StoryDate>
                    Created: {new Date(story.createdAt).toLocaleDateString()}
                  </StoryDate>
                  {story.archivedAt && (
                    <ArchivedDate>
                      Archived:{' '}
                      {new Date(story.archivedAt).toLocaleDateString()}
                    </ArchivedDate>
                  )}
                  <ActionButtons>
                    <ViewButton
                      to={`/story-archive/${story._id}`}
                      onClick={() =>
                        localStorage.setItem(
                          'currentArchivedStoryId',
                          story._id
                        )
                      }
                    >
                      View
                    </ViewButton>
                    <DeleteButton onClick={() => handleDeleteStory(story._id)}>
                      <FaTrash />
                    </DeleteButton>
                  </ActionButtons>
                </StoryContent>
              </StoryCard>
            ))}
          </ArchiveGrid>
        ) : (
          <EmptyMessage>
            No archived stories yet. Stories will appear here after they expire.
          </EmptyMessage>
        )}
      </Container>
    </PageWrapper>
  );
};

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 2rem 0;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackButton = styled(Link)`
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

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 0;
  text-align: center;
  gap: 1rem;
`;

const ErrorIcon = styled.div`
  font-size: 2rem;
  color: ${COLORS.error};
`;

const ErrorMessage = styled.p`
  color: ${COLORS.error};
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const ArchiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const StoryCard = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s;
  &:hover {
    transform: translateY(-4px);
  }
`;

const StoryThumbnail = styled.div`
  position: relative;
  height: 180px;
  background-color: ${COLORS.elevatedBackground};
`;

const StoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 2rem;
  color: ${COLORS.textTertiary};
`;

const VideoBadge = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  pointer-events: none;
`;

const MediaCount = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const StoryContent = styled.div`
  padding: 1rem;
`;

const StoryTitle = styled.h3`
  color: ${COLORS.textPrimary};
  margin: 0 0 0.5rem;
  font-size: 1rem;
`;

const StoryDate = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  margin: 0 0 0.25rem;
`;

const ArchivedDate = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  margin: 0 0 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const ViewButton = styled(Link)`
  background-color: ${COLORS.primarySalmon};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

const DeleteButton = styled.button`
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    background-color: rgba(231, 76, 60, 0.2);
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  color: ${COLORS.textTertiary};
  font-size: 1.125rem;
`;

export default StoryArchive;
