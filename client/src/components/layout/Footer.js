import React from 'react';
import styled from 'styled-components';
import { FaHeart, FaCamera } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <LogoSection>
          <FaCamera />
          <span>SoloGram</span>
        </LogoSection>
        
        <Copyright>
          &copy; {currentYear} SoloGram. All rights reserved.
        </Copyright>
        
        <CreatedWithLove>
          Created with <HeartIcon /> by Mr. Gray Enterprises, Inc.
        </CreatedWithLove>
      </FooterContent>
    </FooterContainer>
  );
};

// Styled Components
const FooterContainer = styled.footer`
  background-color: #ffffff;
  border-top: 1px solid #e6e6e6;
  padding: 2rem 0;
  margin-top: 2rem;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff7e5f;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  
  span {
    margin-left: 0.5rem;
  }
`;

const Copyright = styled.p`
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const CreatedWithLove = styled.p`
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeartIcon = styled(FaHeart)`
  color: #ff7e5f;
  margin: 0 0.25rem;
`;

export default Footer;