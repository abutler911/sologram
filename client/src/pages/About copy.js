import React from "react";
import { sanity } from "../lib/sanityClient";
import { PortableText } from "@portabletext/react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCamera } from "react-icons/fa";
import ProfilePhoto from "./overlord.jpg";
import MainLayout from "../components/layout/MainLayout";

const About = () => {
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
              <LogoContainer>
                <FaCamera />
              </LogoContainer>
              <TitleContainer>
                <PageTitle>SoloGram</PageTitle>
                <Tagline>One Voice. Infinite Moments.</Tagline>
              </TitleContainer>
            </PageHeader>

            <Section>
              <SectionTitle>The Administrator - Andrew</SectionTitle>
              <ProfileImage src={ProfilePhoto} alt="Andrew" />
              <Paragraph>
                Hey, I'm Andrew—the SoloGram administrator, CEO, creator,
                curator, sole poster, and<Emphasis>Supreme Overlord</Emphasis>{" "}
                of SoloGram. I built this platform to replace traditional social
                media and create a<Emphasis> personal space </Emphasis> where I
                can document my life, share moments, and tell my story—without
                the distractions of a typical social feed.
              </Paragraph>
              <Paragraph>
                Unlike other platforms,{" "}
                <Emphasis>SoloGram is mine alone</Emphasis>— I'm the{" "}
                <Emphasis>only one who can post.</Emphasis> Everyone else?
                You're invited to follow along, view my content, and subscribe
                for updates. But the timeline? That's
                <Emphasis> all me.</Emphasis>
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>What is SoloGram?</SectionTitle>
              <Paragraph>
                SoloGram is my personal digital journal—a place where I share
                posts and stories <Emphasis> on my own terms.</Emphasis> No ads,
                no clutter, no noise, and <Emphasis>NO INFLUENCERS</Emphasis>
                —just my journey, my experiences, and my perspective.
              </Paragraph>
              <Paragraph>
                Viewers can explore my <Emphasis> collections</Emphasis>, scroll
                through my posts, and subscribe to receive notifications
                whenever I share something new. It's a one-way broadcast:
                <Emphasis> I post, you watch.</Emphasis>
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
                Think of it as{" "}
                <Emphasis> a social feed, but just for me</Emphasis>— a space
                where I control the content and the narrative. If you're here,
                welcome to the journey. 🚀
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>Stay Connected</SectionTitle>
              <Paragraph>
                Want to stay in the loop? Hit <Emphasis> subscribe</Emphasis> to
                get notified whenever I post new content. Have a question or
                just want to say hi? Reach out at
                <EmailLink href="mailto:abutler911@gmail.com">
                  abutler911@gmail.com
                </EmailLink>
              </Paragraph>
            </Section>
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

// 🌙 DARK THEME STYLED COMPONENTS - Optimized for wider display
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
  margin-bottom: 2rem;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
  gap: 1rem;
`;

const LogoContainer = styled.div`
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

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: #ffffff;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Tagline = styled.h2`
  font-size: 0.9rem;
  color: #ff7e5f;
  font-style: italic;
  margin-top: 0.25rem;
  margin-left: 0px;
`;

const Section = styled.section`
  margin-bottom: 2rem;
  position: relative;
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  float: left;
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  border: 3px solid #ff7e5f;
  shape-outside: circle();

  @media (max-width: 480px) {
    width: 120px;
    height: 120px;
    margin-right: 0.75rem;
  }
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
  color: #bbbbbb;
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

const LastUpdated = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: #777;
  margin-top: 2rem;
`;

<LastUpdated>Last updated: March 31, 2025</LastUpdated>;

export default About;
