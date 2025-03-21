import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaGavel } from "react-icons/fa";

const Terms = () => {
  const lastUpdated = "March 18, 2025";

  return (
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
            <PageTitle>Terms of Service</PageTitle>
          </PageHeader>

          <LastUpdated>Last Updated: {lastUpdated}</LastUpdated>

          <Section>
            <Paragraph>
              Welcome to SoloGram. These terms and conditions outline the rules
              and regulations for the use of this website.
            </Paragraph>
            <Paragraph>
              By accessing this website, I assume you accept these terms and
              conditions in full. If you disagree with these terms and conditions,
              you must not use this website.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Intellectual Property Rights</SectionTitle>
            <Paragraph>
              Unless otherwise stated, I own the intellectual property rights for
              all material on SoloGram. All intellectual property rights are
              reserved.
            </Paragraph>
            <Paragraph>
              You may view and/or print pages from the website for your own
              personal use subject to restrictions set in these terms and
              conditions.
            </Paragraph>
            <Paragraph>You must not:</Paragraph>
            <List>
              <ListItem>
                Republish material from this website (including republication on
                another website)
              </ListItem>
              <ListItem>
                Sell, rent, or sub-license material from the website
              </ListItem>
              <ListItem>
                Reproduce, duplicate, or copy material from the website
              </ListItem>
              <ListItem>
                Redistribute content from SoloGram (unless content is specifically
                made for redistribution)
              </ListItem>
            </List>
          </Section>

          <Section>
            <SectionTitle>User Content</SectionTitle>
            <Paragraph>
              SoloGram does not allow users to post content. This is a personal
              photography portfolio where I am the sole content creator.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Notification Service</SectionTitle>
            <Paragraph>
              If you choose to subscribe to notifications from SoloGram:
            </Paragraph>
            <List>
              <ListItem>
                You agree to receive SMS notifications about new content
              </ListItem>
              <ListItem>Standard message and data rates may apply</ListItem>
              <ListItem>You may unsubscribe at any time</ListItem>
              <ListItem>
                I will not use your phone number for any purpose other than
                sending notifications about SoloGram content
              </ListItem>
            </List>
          </Section>

          <Section>
            <SectionTitle>Limitation of Liability</SectionTitle>
            <Paragraph>
              In no event shall I be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the
              materials on SoloGram, even if I or an authorized representative has
              been notified orally or in writing of the possibility of such
              damage.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Accuracy of Materials</SectionTitle>
            <Paragraph>
              The materials appearing on SoloGram could include technical,
              typographical, or photographic errors. I do not warrant that any of
              the materials on the website are accurate, complete, or current.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Links</SectionTitle>
            <Paragraph>
              SoloGram may contain links to external websites that are not
              provided or maintained by me. I do not guarantee the accuracy,
              relevance, timeliness, or completeness of any information on these
              external websites.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Modifications</SectionTitle>
            <Paragraph>
              I may revise these terms of service at any time without notice. By
              using this website, you are agreeing to be bound by the current
              version of these terms of service.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Governing Law</SectionTitle>
            <Paragraph>
              These terms and conditions are governed by and construed in
              accordance with the laws of the United States and the State of Utah
              and you irrevocably submit to the exclusive jurisdiction of the
              courts in that location.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Contact</SectionTitle>
            <Paragraph>
              If you have any questions about these Terms of Service, please
              contact me at{" "}
              <EmailLink href="mailto:abutler911@gmail.com">
                abutler911@gmail.com
              </EmailLink>
            </Paragraph>
          </Section>
        </ContentCard>
      </Container>
    </PageWrapper>
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

export default Terms;