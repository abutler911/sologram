import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCamera, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <NotFoundContainer>
      <LogoIcon>
        <FaCamera />
      </LogoIcon>
      
      <NotFoundCode>404</NotFoundCode>
      
      <NotFoundTitle>Page Not Found</NotFoundTitle>
      
      <NotFoundMessage>
        Oops! The page you're looking for doesn't exist or has been moved.
      </NotFoundMessage>
      
      <BackToHomeLink to="/">
        <FaHome />
        <span>Back to Home</span>
      </BackToHomeLink>
    </NotFoundContainer>
  );
};

// Styled Components
const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: calc(100vh - 300px);
`;

const LogoIcon = styled.div`
  color: #ff7e5f;
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const NotFoundCode = styled.h1`
  font-size: 6rem;
  font-weight: 700;
  color: #ff7e5f;
  margin: 0 0 1rem;
  line-height: 1;
`;

const NotFoundTitle = styled.h2`
  font-size: 2rem;
  color: #333333;
  margin-bottom: 1.5rem;
`;

const NotFoundMessage = styled.p`
  font-size: 1.125rem;
  color: #666666;
  max-width: 500px;
  margin-bottom: 2rem;
`;

const BackToHomeLink = styled(Link)`
  display: flex;
  align-items: center;
  background-color: #ff7e5f;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #ff6347;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

export default NotFound;