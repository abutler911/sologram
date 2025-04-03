import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { PortableText } from "@portabletext/react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import sanityClient from "@/sanityClient";
import MainLayout from "../components/layout/MainLayout";

const Privacy = () => {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    sanityClient
      .fetch(`*[_type == "privacyPolicy"][0]`)
      .then((data) => setPolicy(data));
  }, []);

  if (!policy)
    return (
      <MainLayout>
        <p>Loading...</p>
      </MainLayout>
    );

  const formattedDate = new Date(policy.lastUpdated).toLocaleDateString(
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
                <FaShieldAlt />
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
                      <Paragraph key={i}>
                        <PortableText value={[block]} />
                      </Paragraph>
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
  background-color: #121212;
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
`;

// Dark theme styled components
const Container = styled.div`
  width: 100%;
  max-width: 1000px; /* Increased from 800px for wider content */
  padding: 2rem;
  color: #ffffff;
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
  color: #aaaaaa;
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

const ContentCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(255, 255, 255, 0.1);

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
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
`;

const LogoIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #ff7e5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;

  @media (max-width: 480px) {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: #ffffff;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const LastUpdated = styled.p`
  color: #aaaaaa;
  font-style: italic;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  color: #ff7e5f;
  margin: 0 0 1rem 0;
`;

const Paragraph = styled.p`
  color: #bbbbbb;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const List = styled.ul`
  margin: 0 0 1rem 1.5rem;
  color: #bbbbbb;
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
  line-height: 1.6;
`;

const EmailLink = styled.a`
  color: #ff7e5f;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export default Privacy;
