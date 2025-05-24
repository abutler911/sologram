import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Link } from "react-router-dom";
import { FaArrowLeft, FaGavel } from "react-icons/fa";
import MainLayout from "../components/layout/MainLayout";
import { sanity } from "../lib/sanityClient";
import PortableTextComponent from "../components/PortableTextComponent";
import { COLORS } from "../theme";

const Terms = () => {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    sanity.fetch(`*[_type == "termsPage"][0]`).then((data) => {
      setPolicy(data);
    });
  }, []);

  if (!policy)
    return (
      <MainLayout>
        <LoadingContainer>Loading...</LoadingContainer>
      </MainLayout>
    );

  const formattedDate = new Date(policy._updatedAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <MainLayout>
      <PageWrapper>
        <Container>
          <BackLink to="/">
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
                {section.heading && (
                  <SectionTitle>{section.heading}</SectionTitle>
                )}
                {section.content?.map((block, i) => {
                  if (block._type === "block") {
                    return (
                      <div key={i}>
                        <PortableTextComponent value={[block]} />
                      </div>
                    );
                  }
                  if (block._type === "list") {
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
      </PageWrapper>
    </MainLayout>
  );
};

// Full-width page wrapper that fills the viewport
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
`;

// Loading container with themed colors
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: ${COLORS.textPrimary};
  font-size: 1.2rem;
`;

// Themed styled components
const Container = styled.div`
  width: 100%;
  max-width: 1000px; /* Increased from 800px for wider content */
  padding: 2rem;
  color: ${COLORS.textPrimary};
  box-sizing: border-box;

  @media (max-width: 1024px) {
    max-width: 100%;
    padding: 1.5rem;
  }

  /* Specific adjustments for smaller screens */
  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
  }

  /* Specific adjustments for PWA mode */
  @media screen and (display-mode: standalone) {
    max-width: 100%;
    padding: 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: ${COLORS.primarySalmon};
    transform: translateX(-3px);
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const ContentCard = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px ${COLORS.shadow};
  border: 1px solid ${COLORS.border};

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 6px;
  }

  /* Ensure proper rendering in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    box-sizing: border-box;
    padding: 1.5rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${COLORS.divider};
  padding-bottom: 1rem;
`;

const LogoIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryBlueGray}
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
  box-shadow: 0 3px 6px ${COLORS.shadow};

  @media (max-width: 480px) {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: ${COLORS.textPrimary};
  margin: 0;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const LastUpdated = styled.p`
  color: ${COLORS.textTertiary};
  font-style: italic;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${COLORS.divider};
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  color: ${COLORS.primarySalmon};
  margin: 0 0 1rem 0;
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

export default Terms;
