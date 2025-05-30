import React, { useState, useEffect, useContext, lazy, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaFolder,
  FaEdit,
  FaArrowLeft,
  FaTrash,
  FaImages,
  FaPlusCircle,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { COLORS, THEME } from "../theme";

// 🎯 KEY CHANGE: Lazy load PostCard instead of direct import
const PostCard = lazy(() => import("../components/posts/PostCard"));

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemovePostModal, setShowRemovePostModal] = useState(false);
  const [postToRemove, setPostToRemove] = useState(null);

  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/collections/${id}`);
        setCollection(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching collection:", err);
        setError(
          "Failed to load collection. It may have been deleted or does not exist."
        );
        toast.error("Failed to load collection");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  const handleDeletePost = async (postId) => {
    setPostToRemove(postId);
    setShowRemovePostModal(true);
  };

  const confirmRemovePost = async () => {
    try {
      await axios.delete(`/api/collections/${id}/posts/${postToRemove}`);

      // Update state to remove the post
      setCollection({
        ...collection,
        posts: collection.posts.filter((post) => post._id !== postToRemove),
      });

      toast.success("Post removed from collection");
      setShowRemovePostModal(false);
      setPostToRemove(null);
    } catch (err) {
      console.error("Error removing post from collection:", err);
      toast.error("Failed to remove post from collection");
      setShowRemovePostModal(false);
      setPostToRemove(null);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await axios.delete(`/api/collections/${id}`);
      toast.success("Collection deleted successfully");
      navigate("/collections");
    } catch (err) {
      console.error("Error deleting collection:", err);
      toast.error("Failed to delete collection");
    }
  };

  if (loading) {
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
            <ErrorMessage>{error || "Collection not found"}</ErrorMessage>
            <BackButton to="/collections">
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
        <BackButton to="/collections">
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
                Add posts to this collection
              </EmptyActionLink>
            )}
          </EmptyState>
        ) : (
          <PostsGrid>
            {collection.posts.map((post) => (
              <PostCardWrapper key={post._id}>
                {/* 🎯 KEY CHANGE: Wrap PostCard in Suspense for lazy loading */}
                <Suspense
                  fallback={
                    <PostCardSkeleton>
                      <div>Loading post...</div>
                    </PostCardSkeleton>
                  }
                >
                  <PostCard post={post} onDelete={handleDeletePost} />
                </Suspense>
              </PostCardWrapper>
            ))}
          </PostsGrid>
        )}

        {/* Collection Delete Confirmation Modal */}
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
                <ConfirmDeleteButton onClick={handleDeleteCollection}>
                  Delete Collection
                </ConfirmDeleteButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowDeleteModal(false)} />
          </DeleteModal>
        )}

        {/* Post Removal Confirmation Modal */}
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
                <ConfirmDeleteButton onClick={confirmRemovePost}>
                  Remove Post
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

// Styled Components (keeping your existing styles)
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
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: ${COLORS.textPrimary};
`;

const CollectionDescription = styled.p`
  color: ${COLORS.textTertiary};
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
`;

const CollectionMeta = styled.div`
  display: flex;
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
`;

const PostCount = styled.span`
  display: inline-flex;
  align-items: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    width: 100%;
  }
`;

const EditButton = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${COLORS.primaryBlue};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1565c0;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 640px) {
    justify-content: center;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: ${COLORS.error};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 640px) {
    justify-content: center;
    width: 100%;
  }
`;

const AddPostButton = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${COLORS.primaryGreen};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2e7d32;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 640px) {
    justify-content: center;
  }
`;

// 🎯 NEW: Added PostCard wrapper and skeleton for lazy loading
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

const PostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
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
  display: inline-block;
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

  @media (max-width: 480px) {
    order: 2;
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

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
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
