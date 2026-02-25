// client/src/pages/About.js
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { sanity } from '../lib/sanityClient';
import PortableTextComponent from '../components/PortableTextComponent';
import styled, { keyframes } from 'styled-components';
import { COLORS } from '../theme';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Sanity query ─────────────────────────────────────────────────────────────

const ABOUT_QUERY = `*[_type == "aboutPage"][0]{
  title,
  content,
  lastUpdated,
  "profileImageUrl": profileImage.asset->url
}`;

const fetchAbout = () => sanity.fetch(ABOUT_QUERY);

// ─── Component ────────────────────────────────────────────────────────────────

const About = () => {
  const {
    data: aboutData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['about'],
    queryFn: fetchAbout,
    staleTime: 10 * 60 * 1000, // 10 min — CMS content changes rarely
  });

  if (isLoading) {
    return <LoadingSpinner text='Loading' size='52px' height='50vh' />;
  }

  if (error || !aboutData) {
    return (
      <ErrorState>
        <ErrorText>
          {error?.message || 'Failed to load page. Please try again.'}
        </ErrorText>
      </ErrorState>
    );
  }

  return (
    <Container>
      <Title>{aboutData.title}</Title>

      {aboutData.profileImageUrl && (
        <AvatarWrapper>
          <Avatar src={aboutData.profileImageUrl} alt='Profile' />
        </AvatarWrapper>
      )}

      <Content>
        <PortableTextComponent value={aboutData.content} />
      </Content>

      {aboutData.lastUpdated && (
        <LastUpdated>
          Last updated:{' '}
          {new Date(aboutData.lastUpdated).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </LastUpdated>
      )}
    </Container>
  );
};

export default About;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: ${COLORS.cardBackground};
  border-radius: 16px;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  animation: ${fadeUp} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (max-width: 850px) {
    border-radius: 0;
    padding: 1.5rem;
    margin: 0;
    box-shadow: none;
    border-left: none;
    border-right: none;
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  text-align: center;
  letter-spacing: -0.03em;
  margin: 0 0 1.5rem;

  &::after {
    content: '';
    display: block;
    width: 64px;
    height: 3px;
    background: linear-gradient(
      90deg,
      ${COLORS.primarySalmon},
      ${COLORS.primaryMint}
    );
    margin: 0.6rem auto 0;
    border-radius: 3px;
  }
`;

const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 1.5rem 0 2rem;
`;

const Avatar = styled.img`
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid ${COLORS.primarySalmon};
  box-shadow: 0 6px 20px ${COLORS.primarySalmon}44;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.04);
    box-shadow: 0 10px 28px ${COLORS.primarySalmon}55;
  }
`;

const Content = styled.div`
  color: ${COLORS.textSecondary};
  line-height: 1.75;
  font-size: 1.05rem;

  h2 {
    color: ${COLORS.textPrimary};
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 2rem 0 0.75rem;
  }

  h3 {
    color: ${COLORS.accentSalmon};
    font-size: 1.1rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
  }

  a {
    color: ${COLORS.primaryMint};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.accentMint};
      text-decoration: underline;
    }
  }

  ul,
  ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  blockquote {
    border-left: 3px solid ${COLORS.primaryMint};
    padding: 0.5rem 0 0.5rem 1rem;
    margin-left: 0;
    font-style: italic;
    color: ${COLORS.textPrimary};
    background: ${COLORS.primaryMint}0a;
    border-radius: 0 8px 8px 0;
  }

  strong {
    color: ${COLORS.textPrimary};
    font-weight: 700;
  }

  p {
    margin: 0 0 1rem;
  }
`;

const LastUpdated = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  margin-top: 2.5rem;
  text-align: right;
  font-style: italic;
  letter-spacing: 0.2px;
`;

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 2rem;
`;

const ErrorText = styled.p`
  color: ${COLORS.error};
  background: ${COLORS.error}12;
  border: 1px solid ${COLORS.error}30;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  font-size: 0.9rem;
  max-width: 480px;
  text-align: center;
`;
