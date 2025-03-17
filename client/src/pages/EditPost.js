import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import PostForm from '../components/posts/PostForm';

const EditPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // const navigate = useNavigate();
  
  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`/api/posts/${id}`);
        setPost(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. It may have been deleted or does not exist.');
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);
  
  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading post...</LoadingMessage>
      </Container>
    );
  }
  
  if (error || !post) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorMessage>{error || 'Post not found'}</ErrorMessage>
          <BackLink to="/">
            <FaArrowLeft />
            <span>Back to Home</span>
          </BackLink>
        </ErrorContainer>
      </Container>
    );
  }
  
  return (
    <Container>
      <BackLink to={`/post/${id}`}>
        <FaArrowLeft />
        <span>Back to Post</span>
      </BackLink>
      
      <PageTitle>Edit Post</PageTitle>
      
      <PostForm initialData={post} isEditing={true} />
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #666666;
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color 0.3s;
  
  &:hover {
    color: #ff7e5f;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #333333;
  margin-bottom: 2rem;
  text-align: center;
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

export default EditPost;