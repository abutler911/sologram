// client/src/pages/Terms.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled, { keyframes } from 'styled-components';
import { FaArrowLeft, FaGavel } from 'react-icons/fa';
import { sanity } from '../lib/sanityClient';
import { COLORS } from '../theme';
import PortableTextComponent from '../components/PortableTextComponent';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Sanity query ─────────────────────────────────────────────────────────────

const fetchTerms = () => sanity.fetch(`*[_type == "termsPage"][0]`);

// ─── Component ────────────────────────────────────────────────────────────────

const Terms = () => {
  const {
    data: policy,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['termsPage'],
    queryFn: fetchTerms,
    staleTime: 60 * 60 * 1000, // 1 hr — legal docs rarely change
  });

  if (isLoading) {
    return <LoadingSpinner text='Loading' size='52px' height='50vh' />;
  }

  if (error || !policy) {
    return (
      <ErrorState>
        <ErrorText>
          {error?.message || 'Failed to load terms. Please try again.'}
        </ErrorText>
      </ErrorState>
    );
  }

  const formattedDate = new Date(policy._updatedAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <Container>
      <BackLink to='/'>
        <FaArrowLeft />
        <span>Back to Home</span>
      </BackLink>

      <ContentCard>
        <PageHeader>
          <LogoIcon>
            <FaGavel />
          </LogoIcon>
          <PageTitle>{policy.title}</PageTitle>
        </PageHeader>

        <LastUpdated>Last Updated: {formattedDate}</LastUpdated>

        {policy.sections?.map((section, index) => (
          <Section key={index}>
            {section.heading && <SectionTitle>{section.heading}</SectionTitle>}
            {section.content?.map((block, i) => {
              if (block._type === 'block') {
                return (
                  <div key={i}>
                    <PortableTextComponent value={[block]} />
                  </div>
                );
              }
              if (block._type === 'list') {
                return (
                  <List key={i}>
                    {block.items.map((item, j) => (
                      <ListItem key={j}>{item}</ListItem>
                    ))}
                  </List>
                );
              }
              return null;
            })}
          </Section>
        ))}
      </ContentCard>
    </Container>
  );
};

export default Terms;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem;
  color: ${COLORS.textPrimary};
  animation: ${fadeUp} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (max-width: 1024px) {
    padding: 1.5rem;
  }
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
  }

  @media screen and (display-mode: standalone) {
    max-width: 100%;
    padding: 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textTertiary};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  transition: color 0.2s, transform 0.2s;

  &:hover {
    color: ${COLORS.primarySalmon};
    transform: translateX(-3px);
  }
`;

const ContentCard = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 12px;
  }

  @media screen and (display-mode: standalone) {
    width: 100%;
    box-sizing: border-box;
    padding: 1.5rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${COLORS.border};
`;

const LogoIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px ${COLORS.primarySalmon}44;

  @media (max-width: 480px) {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.02em;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 1.35rem;
  }
`;

const LastUpdated = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  font-style: italic;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${COLORS.border};
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  margin: 0 0 0.75rem;
  letter-spacing: -0.01em;
`;

const List = styled.ul`
  margin: 0 0 1rem 1.5rem;
  color: ${COLORS.textSecondary};
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
  line-height: 1.6;

  &::marker {
    color: ${COLORS.primaryMint};
  }
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
