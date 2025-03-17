import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaFolder, 
  FaEdit, 
  FaArrowLeft, 
  FaTrash, 
  FaImages,
  FaPlusCircle
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/posts/PostCard';

const CollectionDetail = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`/api/collections/${id}`);
        setCollection(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection. It may have been deleted or does not exist.');
        toast.error('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [id]);
  
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to remove this post from the collection?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/collections/${id}/posts/${postId}`);
      
      // Update state to remove the post
      setCollection({
        ...collection,
        posts: collection.posts.filter(post => post._id !== postId)
      });
      
      toast.success('Post removed from collection');
    } catch (err) {
      console.error('Error removing post from collection:', err);
      toast.error('Failed to remove post from collection');
    }
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading collection...</LoadingMessage>
      </Container>
    );
  }
  
  if (error || !collection) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorMessage>{error || 'Collection not found'}</ErrorMessage>
          <BackButton to="/collections">
            <FaArrowLeft />
            <span>Back to Collections</span>
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }
  
  return (
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
            <CollectionDescription>{collection.description}</CollectionDescription>
          )}
          <CollectionMeta>
            <PostCount>{collection.posts.length} posts</PostCount>
          </CollectionMeta>
        </CollectionInfo>
        
        {isAuthenticated && (
          <ActionButtons>
            <EditButton to={`/collections/${id}/edit`}>
              <FaEdit />
              <span>Edit Collection</span>
            </EditButton>
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
          {collection.posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              onDelete={handleDeletePost} 
            />
          ))}
        </PostsGrid>
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

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #666666;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;
  
  &:hover {
    color: #ff7e5f;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const CollectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const CollectionIcon = styled.div`
  font-size: 2.5rem;
  color: #ff7e5f;
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
  color: #333333;
`;

const CollectionDescription = styled.p`
  color: #666666;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
`;

const CollectionMeta = styled.div`
  display: flex;
  color: #999999;
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
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #3a70b2;
  }
  
  svg {
    margin-right: 0.5rem;
  }
  
  @media (max-width: 640px) {
    justify-content: center;
  }
`;

const AddPostButton = styled(Link)`
  display: flex;
  align-items: center;
  background-color: #50c878;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #3cb371;
  }
  
  svg {
    margin-right: 0.5rem;
  }
  
  @media (max-width: 640px) {
    justify-content: center;
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #666666;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 0;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

export default CollectionDetail;