import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FaFolder,
  FaEdit,
  FaArrowLeft,
  FaTrash,
  FaImages,
  FaPlusCircle,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import { COLORS } from '../theme';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PostCard = lazy(() => import('../components/posts/PostCard'));

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/collections/${id}`);
        setCollection(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError(
          'Failed to load collection. It may have been deleted or does not exist.'
        );
        toast.error('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [id]);

  // Remove a post from this collection — optimistic UI update
  const handleDeletePost = (postId) => {
    const postPreview = collection.posts.find((p) => p._id === postId);
    showDeleteModal({
      title: 'Remove Post',
      message:
        "Remove this post from the collection? The post itself won't be deleted.",
      confirmText: 'Remove',
      cancelText: 'Keep',
      itemName: postPreview?.title || postPreview?.caption || 'this post',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/collections/${id}/posts/${postId}`);
          setCollection((prev) => ({
            ...prev,
            posts: prev.posts.filter((p) => p._id !== postId),
          }));
          toast.success('Post removed from collection');
        } catch (err) {
          console.error('Error removing post:', err);
          toast.error('Failed to remove post');
        }
      },
      destructive: true,
    });
  };

  const handleDeleteCollection = () => {
    showDeleteModal({
      title: 'Delete Collection',
      message:
        'Are you sure you want to delete this collection? This cannot be undone.',
      confirmText: 'Delete Collection',
      cancelText: 'Keep',
      itemName: collection?.name,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/collections/${id}`);
          toast.success('Collection deleted');
          navigate('/collections');
        } catch (err) {
          console.error('Error deleting collection:', err);
          toast.error('Failed to delete collection');
        }
      },
      destructive: true,
    });
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingSpinner />
        </Container>
      </PageWrapper>
    );
  }

  if (error || !collection) {
    return (
      <PageWrapper>
        <Container>
          <ErrorBox>{error || 'Collection not found'}</ErrorBox>
          <BackButton to='/collections'>
            <FaArrowLeft />
            <span>Back to Collections</span>
          </BackButton>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        {/* ── Back nav ── */}
        <BackButton to='/collections'>
          <FaArrowLeft />
          <span>Collections</span>
        </BackButton>

        {/* ── Collection header card ── */}
        <CollectionHeader>
          <CollectionIconWrap>
            <FaFolder />
          </CollectionIconWrap>

          <CollectionInfo>
            <CollectionTitle>{collection.name}</CollectionTitle>
            {collection.description && (
              <CollectionDescription>
                {collection.description}
              </CollectionDescription>
            )}
            <PostCountBadge>
              {collection.posts.length}{' '}
              {collection.posts.length === 1 ? 'post' : 'posts'}
            </PostCountBadge>
          </CollectionInfo>

          {isAuthenticated && (
            <ActionButtons>
              <ActionBtn
                as={Link}
                to={`/collections/${id}/edit`}
                $variant='neutral'
              >
                <FaEdit />
                <span>Edit</span>
              </ActionBtn>
              <ActionBtn
                as={Link}
                to={`/collections/${id}/add-posts`}
                $variant='primary'
              >
                <FaPlusCircle />
                <span>Add Posts</span>
              </ActionBtn>
              <ActionBtn onClick={handleDeleteCollection} $variant='danger'>
                <FaTrash />
                <span>Delete</span>
              </ActionBtn>
            </ActionButtons>
          )}
        </CollectionHeader>

        {/* ── Posts ── */}
        {collection.posts.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FaImages />
            </EmptyIcon>
            <EmptyText>No posts in this collection yet</EmptyText>
            {isAuthenticated && (
              <EmptyActionLink to={`/collections/${id}/add-posts`}>
                <FaPlusCircle />
                <span>Add posts</span>
              </EmptyActionLink>
            )}
          </EmptyState>
        ) : (
          <PostsGrid>
            {collection.posts.map((post) => (
              <Suspense key={post._id} fallback={<PostCardSkeleton />}>
                <PostCard post={post} onDelete={handleDeletePost} />
              </Suspense>
            ))}
          </PostsGrid>
        )}
      </Container>
    </PageWrapper>
  );
};

export default CollectionDetail;

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Layout ────────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  background: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: ${COLORS.textTertiary};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  transition: color 0.15s;

  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

// ── Collection header card ────────────────────────────────────────────────────
const CollectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  animation: ${fadeUp} 0.2s ease both;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CollectionIconWrap = styled.div`
  font-size: 2rem;
  color: ${COLORS.primarySalmon};
  flex-shrink: 0;
  margin-top: 2px;
`;

const CollectionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CollectionTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  margin: 0 0 4px;
  line-height: 1.2;
`;

const CollectionDescription = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  margin: 0 0 8px;
  line-height: 1.5;
`;

const PostCountBadge = styled.div`
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  background: ${COLORS.primarySalmon}18;
  padding: 3px 10px;
  border-radius: 999px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`;

const ActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  border: none;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s, transform 0.1s;

  background: ${(p) =>
    p.$variant === 'danger'
      ? `${COLORS.error}18`
      : p.$variant === 'primary'
      ? `${COLORS.primarySalmon}18`
      : COLORS.elevatedBackground};

  color: ${(p) =>
    p.$variant === 'danger'
      ? COLORS.error
      : p.$variant === 'primary'
      ? COLORS.primarySalmon
      : COLORS.textSecondary};

  &:hover {
    background: ${(p) =>
      p.$variant === 'danger'
        ? `${COLORS.error}30`
        : p.$variant === 'primary'
        ? `${COLORS.primarySalmon}30`
        : COLORS.buttonHover};
    transform: translateY(-1px);
  }
`;

// ── Posts grid ────────────────────────────────────────────────────────────────
const PostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PostCardSkeleton = styled.div`
  height: 380px;
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

// ── Empty / Error states ──────────────────────────────────────────────────────
const EmptyState = styled.div`
  text-align: center;
  padding: 5rem 1rem;
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: ${COLORS.textTertiary};
  opacity: 0.35;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.25rem;
  color: ${COLORS.textSecondary};
  font-weight: 600;
  margin: 0 0 1.25rem;
`;

const EmptyActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: ${COLORS.primarySalmon};
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  padding: 0.65rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: background 0.15s;

  &:hover {
    background: ${COLORS.accentSalmon};
  }
`;

const ErrorBox = styled.div`
  background: ${COLORS.error}18;
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid ${COLORS.error}30;
  margin-bottom: 1rem;
  text-align: center;
`;
