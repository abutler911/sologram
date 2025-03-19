import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCamera } from "react-icons/fa";

const About = () => {
  return (
    <Container>
      <BackLink to="/">
        <FaArrowLeft />
        <span>Back to Home</span>
      </BackLink>

      <ContentCard>
        <PageHeader>
          <LogoIcon>
            <FaCamera />
          </LogoIcon>
          <PageTitle>About SoloGram</PageTitle>
        </PageHeader>

        <Section>
          <SectionTitle>The Administrator</SectionTitle>
          <Paragraph>
            Hey, I'm Andrew—the creator, curator, and sole poster of SoloGram. I
            built this platform to replace traditional social media and create a
            <Emphasis>personal space</Emphasis> where I can document my life,
            share moments, and tell my story—without the distractions of a
            typical social feed.
          </Paragraph>
          <Paragraph>
            Unlike other platforms, <Emphasis>SoloGram is mine alone</Emphasis>
            —I'm the <Emphasis>only one who can post</Emphasis>. Everyone else?
            You're invited to follow along, view my content, and subscribe for
            updates. But the timeline? That's
            <Emphasis>all me.</Emphasis>
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>What is SoloGram?</SectionTitle>
          <Paragraph>
            SoloGram is my personal digital journal—a place where I share posts
            and stories <Emphasis>on my own terms</Emphasis>. No ads, no
            clutter, no noise—just my journey, my experiences, and my
            perspective.
          </Paragraph>
          <Paragraph>
            Viewers can explore my <Emphasis>collections</Emphasis>, scroll
            through my posts, and subscribe to receive notifications whenever I
            share something new. It's a one-way broadcast:{" "}
            <Emphasis>I post, you watch.</Emphasis>
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>How It Works</SectionTitle>
          <Feature>
            <FeatureIcon>📌</FeatureIcon>
            <FeatureText>
              <Strong>Only I can post</Strong> – Every story, every update,
              every moment is from me.
            </FeatureText>
          </Feature>
          <Feature>
            <FeatureIcon>👀</FeatureIcon>
            <FeatureText>
              <Strong>Everyone can view</Strong> – Scroll, explore, and see
              what's new.
            </FeatureText>
          </Feature>
          <Feature>
            <FeatureIcon>🔔</FeatureIcon>
            <FeatureText>
              <Strong>You can subscribe</Strong> – Get notified when I share
              something new.
            </FeatureText>
          </Feature>
          <Paragraph>
            Think of it as <Emphasis>a social feed, but just for me</Emphasis>—a
            space where I control the content and the narrative. If you're here,
            welcome to the journey. 🚀
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Stay Connected</SectionTitle>
          <Paragraph>
            Want to stay in the loop? Hit <Emphasis>subscribe</Emphasis> to get
            notified whenever I post new content. Have a question or just want
            to say hi? Reach out at
            <EmailLink href="mailto:abutler911@gmail.com">
              abutler911@gmail.com
            </EmailLink>
          </Paragraph>
        </Section>
      </ContentCard>
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

const ContentCard = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eeeeee;
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
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: #333333;
  margin: 0;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  color: #333333;
  margin: 0 0 1rem 0;
`;

const Paragraph = styled.p`
  color: #666666;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

// New styled components for emphasis
const Emphasis = styled.span`
  color: #ff7e5f;
  font-weight: 600;
  margin: 0 0.25rem;
`;

const Strong = styled.span`
  font-weight: 700;
`;

// Feature list styling
const Feature = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const FeatureIcon = styled.span`
  font-size: 1.25rem;
  margin-right: 0.75rem;
  line-height: 1.5;
`;

const FeatureText = styled.span`
  color: #666666;
  line-height: 1.6;
`;

const EmailLink = styled.a`
  color: #ff7e5f;
  text-decoration: none;
  margin-left: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

export default About;
