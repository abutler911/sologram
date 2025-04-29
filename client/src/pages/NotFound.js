import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaCamera, FaHome } from "react-icons/fa";
import { COLORS, THEME } from "../theme"; // Import the theme

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
  background-color: ${COLORS.background};
`;

const LogoIcon = styled.div`
  color: ${COLORS.primarySalmon};
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite ease-in-out;
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const NotFoundCode = styled.h1`
  font-size: 6rem;
  font-weight: 700;
  margin: 0 0 1rem;
  line-height: 1;
  background: linear-gradient(
    45deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 5px 15px ${COLORS.shadow};
`;

const NotFoundTitle = styled.h2`
  font-size: 2rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 1.5rem;
`;

const NotFoundMessage = styled.p`
  font-size: 1.125rem;
  color: ${COLORS.textSecondary};
  max-width: 500px;
  margin-bottom: 2rem;
`;

const BackToHomeLink = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.accentBlueGray};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    margin-right: 0.5rem;
  }
`;

export default NotFound;
