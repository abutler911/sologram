// client/src/pages/CollectionsList.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaFolder, FaImages } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { COLORS } from '../theme';
import { useCollections } from '../hooks/queries/useCollections';

const CollectionsList = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const canCreateCollection =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'creator');

  const { data: collections = [], isLoading, error } = useCollections();

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading collections...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <ErrorMessage>
            Failed to load collections. Please try again.
          </ErrorMessage>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <MainLayout>
      <PageWrapper>
        <Container>
          <PageHeader>
            <PageTitle>
              <FaFolder />
              <span>Collections</span>
            </PageTitle>
            {canCreateCollection && (
              <CreateButton to='/collections/create'>
                <FaPlus />
                <span>Create Collection</span>
              </CreateButton>
            )}
          </PageHeader>

          {collections.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <FaImages />
              </EmptyIcon>
              <EmptyText>No collections yet</EmptyText>
              {canCreateCollection && (
                <EmptyActionLink to='/collections/create'>
                  Create your first collection
                </EmptyActionLink>
              )}
            </EmptyState>
          ) : (
            <CollectionsGrid>
              {collections.map((collection) => (
                <CollectionCard key={collection._id}>
                  <CollectionLink to={`/collections/${collection._id}`}>
                    {collection.coverImage ? (
                      <CollectionCover
                        src={collection.coverImage}
                        alt={collection.name}
                      />
                    ) : (
                      <CollectionCoverPlaceholder>
                        <FaImages />
                      </CollectionCoverPlaceholder>
                    )}
                    <CollectionDetails>
                      <CollectionName>{collection.name}</CollectionName>
                      {collection.posts && (
                        <PostCount>{collection.posts.length} posts</PostCount>
                      )}
                      {collection.description && (
                        <CollectionDescription>
                          {collection.description.length > 100
                            ? `${collection.description.substring(0, 100)}...`
                            : collection.description}
                        </CollectionDescription>
                      )}
                    </CollectionDetails>
                  </CollectionLink>
                </CollectionCard>
              ))}
            </CollectionsGrid>
          )}
        </Container>
      </PageWrapper>
    </MainLayout>
  );
};

// ── Styled Components ─────────────────────────────────────────────────────────

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

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  font-size: 2rem;
  color: ${COLORS.textPrimary};
  margin: 0;
  svg {
    margin-right: 0.75rem;
    color: ${COLORS.primarySalmon};
  }
`;

const CreateButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

const CollectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
`;

const CollectionCard = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px ${COLORS.shadow};
    border: 1px solid ${COLORS.primarySalmon}20;
  }
`;

const CollectionLink = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
`;

const CollectionCover = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const CollectionCoverPlaceholder = styled.div`
  width: 100%;
  height: 180px;
  background-color: ${COLORS.elevatedBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    font-size: 3rem;
    color: ${COLORS.divider};
  }
`;

const CollectionDetails = styled.div`
  padding: 1.25rem;
`;

const CollectionName = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
  color: ${COLORS.textPrimary};
`;

const PostCount = styled.div`
  font-size: 0.875rem;
  color: ${COLORS.textTertiary};
  margin-bottom: 0.75rem;
`;

const CollectionDescription = styled.p`
  font-size: 0.875rem;
  color: ${COLORS.textTertiary};
  margin: 0;
  line-height: 1.5;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: ${COLORS.textTertiary};
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 4px;
  margin: 2rem 0;
  text-align: center;
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
  background-color: ${COLORS.primarySalmon};
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

export default CollectionsList;
