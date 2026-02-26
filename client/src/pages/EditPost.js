// client/src/pages/EditPost.js
import React, { lazy, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEdit } from 'react-icons/fa';
import { COLORS } from '../theme';
import { usePost, postKeys } from '../hooks/queries/usePosts';
import { useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PostCreator = lazy(() => import('../components/posts/PostCreator'));

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: postResponse, isLoading, error } = usePost(id);

  // usePost / react-query returns the raw API response shape:
  //   { success: true, data: { _id, title, media, ... } }
  // Unwrap .data if present, otherwise fall back to the response itself
  // so this works regardless of how the hook is configured.
  const post = postResponse?.data ?? postResponse;
  const queryClient = useQueryClient();

  // Called by PostCreator after a successful update — invalidates both the
  // single-post cache and the infinite feed so everything reflects the changes
  // immediately without a manual reload.
  const handleSuccess = useCallback(
    async (postId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
        queryClient.invalidateQueries({ queryKey: postKeys.infiniteFeed() }),
      ]);
    },
    [queryClient]
  );

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner text='Loading post' size='50px' />
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <PageWrapper>
        <Container>
          <ErrorContainer>
            <ErrorMessage>
              {error?.message ||
                'Failed to load post. It may have been deleted or does not exist.'}
            </ErrorMessage>
            <BackButton onClick={() => navigate(-1)}>Go Back</BackButton>
          </ErrorContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <PageHeader>
          <HeaderIcon>
            <FaEdit />
          </HeaderIcon>
          <HeaderTitle>Edit Post</HeaderTitle>
          <HeaderSubtitle>Update and refine your content</HeaderSubtitle>
        </PageHeader>
        <Suspense
          fallback={
            <LoadingContainer>
              <LoadingSpinner text='Loading editor' size='40px' />
            </LoadingContainer>
          }
        >
          <PostCreator
            initialData={post}
            isEditing={true}
            onSuccess={handleSuccess}
          />
        </Suspense>
      </Container>
    </PageWrapper>
  );
};

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 2rem 0;
  @media (max-width: 768px) {
    padding: 0;
    background-color: ${COLORS.background};
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const HeaderIcon = styled.div`
  font-size: 2.5rem;
  color: ${COLORS.primaryBlue};
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 0.5rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${COLORS.textTertiary};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
  padding: 1rem 2rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const BackButton = styled.button`
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

export default EditPost;
