import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaFolder, FaImages } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CollectionsList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated, user } = useContext(AuthContext);
  const canCreateCollection =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'creator');

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/collections');
        setCollections(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections. Please try again.');
        toast.error('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingSpinner />
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <ErrorMessage>{error}</ErrorMessage>
        </Container>
      </PageWrapper>
    );
  }

  return (
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
              <span>New Collection</span>
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
                      loading='lazy'
                    />
                  ) : (
                    <CollectionCoverPlaceholder>
                      <FaImages />
                    </CollectionCoverPlaceholder>
                  )}
                  <CollectionDetails>
                    <CollectionName>{collection.name}</CollectionName>
                    {collection.posts && (
                      <PostCount>
                        {collection.posts.length}{' '}
                        {collection.posts.length === 1 ? 'post' : 'posts'}
                      </PostCount>
                    )}
                    {collection.description && (
                      <CollectionDescription>
                        {collection.description.length > 100
                          ? `${collection.description.substring(0, 100)}…`
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
  );
};

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

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  margin: 0;

  svg {
    color: ${COLORS.primarySalmon};
    font-size: 1.2rem;
  }
`;

const CreateButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${COLORS.primarySalmon};
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: background 0.15s, transform 0.1s;

  &:hover {
    background: ${COLORS.accentSalmon};
    transform: translateY(-1px);
  }
  svg {
    font-size: 0.8rem;
  }
`;

// ── Grid ──────────────────────────────────────────────────────────────────────
const CollectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
`;

const CollectionCard = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${COLORS.border};
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  animation: ${fadeUp} 0.2s ease both;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border-color: ${COLORS.primarySalmon}40;
  }
`;

const CollectionLink = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
`;

const CollectionCover = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
`;

const CollectionCoverPlaceholder = styled.div`
  width: 100%;
  height: 160px;
  background: linear-gradient(
    135deg,
    ${COLORS.elevatedBackground},
    ${COLORS.cardBackground}
  );
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    font-size: 2.5rem;
    color: ${COLORS.textTertiary};
    opacity: 0.5;
  }
`;

const CollectionDetails = styled.div`
  padding: 1rem;
`;

const CollectionName = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 4px;
`;

const PostCount = styled.div`
  font-size: 0.78rem;
  color: ${COLORS.primarySalmon};
  font-weight: 600;
  margin-bottom: 6px;
`;

const CollectionDescription = styled.p`
  font-size: 0.82rem;
  color: ${COLORS.textTertiary};
  margin: 0;
  line-height: 1.5;
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
  margin: 0 0 1.25rem;
  font-weight: 600;
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

const ErrorMessage = styled.div`
  background: ${COLORS.error}18;
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid ${COLORS.error}30;
  text-align: center;
`;

export default CollectionsList;
