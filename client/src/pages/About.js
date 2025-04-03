import React, { useEffect, useState } from "react";
import { sanity } from "../lib/sanityClient";
import PortableTextComponent from "../components/PortableTextComponent";
import styled from "styled-components";
import MainLayout from "../components/layout/MainLayout";

const query = `*[_type == "about"][0]{
  title,
  content,
  _updatedAt,
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
    return <p>Loading...</p>;
  }

  return (
    <MainLayout>
      <Container>
        <Title>{aboutData.title}</Title>

        {aboutData.profileImageUrl && (
          <ProfileImage src={aboutData.profileImageUrl} alt="Andrew" />
        )}

        <PortableTextComponent value={aboutData.content} />

        <LastUpdated>
          Last updated: {new Date(aboutData._updatedAt).toLocaleDateString()}
        </LastUpdated>
      </Container>
    </MainLayout>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #fff;
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  margin: 1rem 0;
  border: 3px solid #ff7e5f;
`;

const LastUpdated = styled.p`
  color: #888;
  font-size: 0.875rem;
  margin-top: 2rem;
`;

export default About;
