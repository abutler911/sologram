import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";

const Privacy = () => {
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
              <FaShieldAlt />
            </LogoIcon>
            <PageTitle>Privacy Policy</PageTitle>
          </PageHeader>

          <LastUpdated>Last Updated: {lastUpdated}</LastUpdated>

          <Section>
            <Paragraph>
              Welcome to SoloGram. I respect your privacy and am committed to
              protecting your personal data. This privacy policy will inform you
              about how I look after your personal data when you visit my website
              and tell you about your privacy rights and how the law protects you.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Information I Collect</SectionTitle>
            <Paragraph>
              <strong>Basic Browsing:</strong> When you visit SoloGram, my servers
              automatically collect standard browsing information, including your
              IP address, browser type, device information, and the pages you
              view.
            </Paragraph>
            <Paragraph>
              <strong>Notification Subscription:</strong> If you opt-in to receive
              SMS notifications, I collect your phone number and name. This
              information is only used to send you updates about new content on
              SoloGram.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>How I Use Your Information</SectionTitle>
            <Paragraph>I use the information I collect to:</Paragraph>
            <List>
              <ListItem>Provide, maintain, and improve SoloGram</ListItem>
              <ListItem>
                Send notifications about new content (only if you've opted in)
              </ListItem>
              <ListItem>Understand how visitors use my site</ListItem>
              <ListItem>Detect and prevent technical issues</ListItem>
            </List>
          </Section>

          <Section>
            <SectionTitle>Data Retention</SectionTitle>
            <Paragraph>
              I retain your personal information only for as long as necessary to
              fulfill the purposes for which I collected it. If you subscribe to
              notifications, your information will be retained until you
              unsubscribe.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Your Rights</SectionTitle>
            <Paragraph>
              Depending on your location, you may have certain rights regarding
              your personal data, including:
            </Paragraph>
            <List>
              <ListItem>The right to access your data</ListItem>
              <ListItem>The right to correct inaccurate data</ListItem>
              <ListItem>The right to request deletion of your data</ListItem>
              <ListItem>The right to unsubscribe from notifications</ListItem>
            </List>
            <Paragraph>
              To exercise any of these rights, please contact me at{" "}
              <EmailLink href="mailto:abutler911@gmail.com">
                abutler911@gmail.com
              </EmailLink>
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Third-Party Services</SectionTitle>
            <Paragraph>I use the following third-party services:</Paragraph>
            <List>
              <ListItem>
                <strong>Cloudinary:</strong> For image and video storage
              </ListItem>
              <ListItem>
                <strong>MongoDB:</strong> For database services
              </ListItem>
              <ListItem>
                <strong>Twilio:</strong> For SMS notification delivery
              </ListItem>
            </List>
            <Paragraph>
              Each of these services has their own privacy policies which govern
              how they handle your data.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Changes to This Policy</SectionTitle>
            <Paragraph>
              I may update this privacy policy from time to time. The updated
              version will be indicated by an updated "Last Updated" date and the
              updated version will be effective as soon as it is accessible.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Contact</SectionTitle>
            <Paragraph>
              If you have any questions about this privacy policy, please contact
              me at{" "}
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

export default Privacy;