import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaFolder, FaImages } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const CollectionsList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useContext(AuthContext);
  
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
      <Container>
        <LoadingMessage>Loading collections...</LoadingMessage>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }
  
  return (
    <Container>
      <PageHeader>
        <PageTitle>
          <FaFolder />
          <span>Collections</span>
        </PageTitle>
        
        {isAuthenticated && (
          <CreateButton to="/collections/create">
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
          {isAuthenticated && (
            <EmptyActionLink to="/collections/create">
              Create your first collection
            </EmptyActionLink>
          )}
        </EmptyState>
      ) : (
        <CollectionsGrid>
          {collections.map(collection => (
            <CollectionCard key={collection._id}>
              <CollectionLink to={`/collections/${collection._id}`}>
                {collection.coverImage ? (
                  <CollectionCover src={collection.coverImage} alt={collection.name} />
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
  );
};

// Styled Components
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
  color: #333333;
  margin: 0;
  
  svg {
    margin-right: 0.75rem;
    color: #ff7e5f;
  }
`;

const CreateButton = styled(Link)`
  display: flex;
  align-items: center;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #ff6347;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const CollectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
`;

const CollectionCard = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background-color: #f3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    font-size: 3rem;
    color: #cccccc;
  }
`;

const CollectionDetails = styled.div`
  padding: 1.25rem;
`;

const CollectionName = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
  color: #333333;
`;

const PostCount = styled.div`
  font-size: 0.875rem;
  color: #666666;
  margin-bottom: 0.75rem;
`;

const CollectionDescription = styled.p`
  font-size: 0.875rem;
  color: #666666;
  margin: 0;
  line-height: 1.5;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #666666;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin: 2rem 0;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: #cccccc;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.5rem;
  color: #666666;
  margin-bottom: 1rem;
`;

const EmptyActionLink = styled(Link)`
  display: inline-block;
  background-color: #ff7e5f;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #ff6347;
  }
`;

export default CollectionsList;