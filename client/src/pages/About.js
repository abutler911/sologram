import React, { useEffect, useState } from "react";
import { sanity } from "../lib/sanityClient";
import PortableTextComponent from "../components/PortableTextComponent";
import styled from "styled-components";
import MainLayout from "../components/layout/MainLayout";
import { COLORS, THEME } from "../theme"; // Import the theme

const query = `*[_type == "aboutPage"][0]{
  title,
  content,
  lastUpdated,
  "profileImageUrl": profileImage.asset->url
}`;

const About = () => {
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    const fetchAbout = async () => {
      const data = await sanity.fetch(query);
      setAboutData(data);
    };
    fetchAbout();
  }, []);

  if (!aboutData) {
    return <LoadingWrapper>Loading...</LoadingWrapper>;
  }

  return (
    <MainLayout>
      <Container>
        <Title>{aboutData.title}</Title>
        {aboutData.profileImageUrl && (
          <ProfileImageContainer>
            <ProfileImage src={aboutData.profileImageUrl} alt="Profile" />
          </ProfileImageContainer>
        )}
        <Content>
          <PortableTextComponent value={aboutData.content} />
        </Content>
        <LastUpdated>
          Last updated: {new Date(aboutData.lastUpdated).toLocaleDateString()}
        </LastUpdated>
      </Container>
    </MainLayout>
  );
};

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: ${COLORS.textPrimary};
  font-size: 1.2rem;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 4px 16px ${COLORS.shadow};
  margin-top: 2rem;
  margin-bottom: 2rem;
  border: 1px solid ${COLORS.border};

  @media (max-width: 850px) {
    border-radius: 0;
    padding: 1.5rem;
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;

  &:after {
    content: "";
    display: block;
    width: 80px;
    height: 3px;
    background: linear-gradient(
      90deg,
      ${COLORS.primarySalmon},
      ${COLORS.primaryBlueGray}
    );
    margin: 0.5rem auto 0;
    border-radius: 3px;
  }
`;

const ProfileImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
`;

const ProfileImage = styled.img`
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid ${COLORS.primarySalmon};
  box-shadow: 0 5px 15px ${COLORS.shadow};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 25px ${COLORS.shadow};
  }
`;

const Content = styled.div`
  color: ${COLORS.textSecondary};
  line-height: 1.7;
  font-size: 1.1rem;

  h2 {
    color: ${COLORS.primaryBlueGray};
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  h3 {
    color: ${COLORS.accentSalmon};
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  a {
    color: ${COLORS.primaryBlueGray};
    text-decoration: none;
    position: relative;

    &:hover {
      color: ${COLORS.accentBlueGray};
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
    padding-left: 1rem;
    margin-left: 0;
    font-style: italic;
    color: ${COLORS.textPrimary};
  }
`;

const LastUpdated = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
  margin-top: 3rem;
  text-align: right;
  font-style: italic;
`;

export default About;
