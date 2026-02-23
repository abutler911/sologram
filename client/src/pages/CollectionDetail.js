// client/src/pages/CollectionDetail.js
import React, { useState, useContext, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaFolder,
  FaEdit,
  FaArrowLeft,
  FaTrash,
  FaImages,
  FaPlusCircle,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme';
import {
  useCollection,
  useDeleteCollection,
  useRemovePostFromCollection,
} from '../hooks/queries/useCollections';

const PostCard = lazy(() => import('../components/posts/PostCard'));

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemovePostModal, setShowRemovePostModal] = useState(false);
  const [postToRemove, setPostToRemove] = useState(null);

  const { data: collection, isLoading, error } = useCollection(id);
  const deleteCollection = useDeleteCollection();
  const removePost = useRemovePostFromCollection();

  const handleDeletePost = (postId) => {
    setPostToRemove(postId);
    setShowRemovePostModal(true);
  };

  const confirmRemovePost = async () => {
    try {
      await removePost.mutateAsync({ collectionId: id, postId: postToRemove });
      setShowRemovePostModal(false);
      setPostToRemove(null);
    } catch {
      setShowRemovePostModal(false);
      setPostToRemove(null);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await deleteCollection.mutateAsync(id);
      navigate('/collections');
    } catch {
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading collection...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !collection) {
    return (
      <PageWrapper>
        <Container>
          <ErrorContainer>
            <ErrorMessage>
              {error?.message || 'Collection not found'}
            </ErrorMessage>
            <BackButton to='/collections'>
              <FaArrowLeft />
              <span>Back to Collections</span>
            </BackButton>
          </ErrorContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <BackButton to='/collections'>
          <FaArrowLeft />
          <span>Back to Collections</span>
        </BackButton>

        <CollectionHeader>
          <CollectionIcon>
            <FaFolder />
          </CollectionIcon>

          <CollectionInfo>
            <CollectionTitle>{collection.name}</CollectionTitle>
            {collection.description && (
              <CollectionDescription>
                {collection.description}
              </CollectionDescription>
            )}
            <CollectionMeta>
              <PostCount>{collection.posts.length} posts</PostCount>
            </CollectionMeta>
          </CollectionInfo>

          {isAuthenticated && (
            <ActionButtons>
              <EditButton to={`/collections/${id}/edit`}>
                <FaEdit />
                <span>Edit</span>
              </EditButton>
              <DeleteButton onClick={() => setShowDeleteModal(true)}>
                <FaTrash />
                <span>Delete</span>
              </DeleteButton>
              <AddPostButton to={`/collections/${id}/add-posts`}>
                <FaPlusCircle />
                <span>Add Posts</span>
              </AddPostButton>
            </ActionButtons>
          )}
        </CollectionHeader>

        {collection.posts.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FaImages />
            </EmptyIcon>
            <EmptyText>No posts in this collection yet</EmptyText>
            {isAuthenticated && (
              <EmptyActionLink to={`/collections/${id}/add-posts`}>
                <FaPlusCircle />
                <span>Add Posts</span>
              </EmptyActionLink>
            )}
          </EmptyState>
        ) : (
          <PostsGrid>
            {collection.posts.map((post) => (
              <PostCardWrapper key={post._id}>
                <Suspense
                  fallback={
                    <PostCardSkeleton>Loading post...</PostCardSkeleton>
                  }
                >
                  <PostCard
                    post={post}
                    onDelete={
                      isAuthenticated
                        ? () => handleDeletePost(post._id)
                        : undefined
                    }
                  />
                </Suspense>
              </PostCardWrapper>
            ))}
          </PostsGrid>
        )}

        {/* Delete Collection Modal */}
        {showDeleteModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Delete Collection</h3>
              <p>
                Are you sure you want to delete this collection? This action
                cannot be undone.
              </p>
              <DeleteModalButtons>
                <CancelModalButton onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </CancelModalButton>
                <ConfirmDeleteButton
                  onClick={handleDeleteCollection}
                  disabled={deleteCollection.isPending}
                >
                  {deleteCollection.isPending
                    ? 'Deleting...'
                    : 'Delete Collection'}
                </ConfirmDeleteButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowDeleteModal(false)} />
          </DeleteModal>
        )}

        {/* Remove Post Modal */}
        {showRemovePostModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Remove Post</h3>
              <p>
                Are you sure you want to remove this post from the collection?
              </p>
              <DeleteModalButtons>
                <CancelModalButton
                  onClick={() => setShowRemovePostModal(false)}
                >
                  Cancel
                </CancelModalButton>
                <ConfirmDeleteButton
                  onClick={confirmRemovePost}
                  disabled={removePost.isPending}
                >
                  {removePost.isPending ? 'Removing...' : 'Remove Post'}
                </ConfirmDeleteButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowRemovePostModal(false)} />
          </DeleteModal>
        )}
      </Container>
    </PageWrapper>
  );
};

// ── Styled Components (unchanged) ─────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;
  &:hover {
    color: ${COLORS.accentPurple};
  }
  svg {
    margin-right: 0.5rem;
  }
`;

const CollectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
  background-color: ${COLORS.cardBackground};
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const CollectionIcon = styled.div`
  font-size: 2.5rem;
  color: ${COLORS.primaryPurple};
  margin-right: 1.5rem;
  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const CollectionInfo = styled.div`
  flex: 1;
`;

const CollectionTitle = styled.h1`
  font-size: 1.75rem;
  color: ${COLORS.textPrimary};
  margin: 0 0 0.5rem;
`;

const CollectionDescription = styled.p`
  color: ${COLORS.textSecondary};
  margin: 0 0 0.5rem;
`;

const CollectionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PostCount = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  @media (max-width: 640px) {
    width: 100%;
  }
`;

const EditButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primaryBlue};
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.accentBlue};
  }
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.error};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #c0392b;
  }
`;

const AddPostButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2e7d32;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 0.3s;
  &:hover {
    background-color: #1b5e20;
  }
`;

const PostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PostCardWrapper = styled.div`
  width: 100%;
`;

const PostCardSkeleton = styled.div`
  width: 100%;
  height: 400px;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textSecondary};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: ${COLORS.textTertiary};
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 0;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 2px 8px ${COLORS.shadow};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: ${COLORS.divider};
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.5rem;
  color: ${COLORS.textTertiary};
  margin-bottom: 1rem;
`;

const EmptyActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primaryPurple};
  color: ${COLORS.textPrimary};
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  &:hover {
    background-color: #4527a0;
  }
`;

const DeleteModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DeleteModalContent = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  h3 {
    color: ${COLORS.textPrimary};
    margin-top: 0;
    margin-bottom: 1rem;
  }
  p {
    color: ${COLORS.textSecondary};
    margin-bottom: 1.5rem;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CancelModalButton = styled.button`
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: ${COLORS.error};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #c0392b;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
`;

export default CollectionDetail;
