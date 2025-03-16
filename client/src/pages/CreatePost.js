import React from 'react';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import PostForm from '../components/posts/PostForm';

const CreatePost = () => {
  return (
    <Container>
      <BackLink to="/">
        <FaArrowLeft />
        <span>Back to Home</span>
      </BackLink>
      
      <PageTitle>Create New Post</PageTitle>
      
      <PostForm />
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

export default CreatePost;