// pages/CreatePost.js
import React from "react";
import styled from "styled-components";
import { FaCamera } from "react-icons/fa";
import CreatePostWorkflow from "../components/posts/CreatePostWorkflow";

const CreatePost = () => {
  return (
    <PageWrapper>
      <Container>
        <PageHeader>
          <HeaderIcon>
            <FaCamera />
          </HeaderIcon>
          <HeaderTitle>Create New Post</HeaderTitle>
          <HeaderSubtitle>Share your moments with your audience</HeaderSubtitle>
        </PageHeader>

        <CreatePostWorkflow />
      </Container>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 2rem 0;

  @media (max-width: 768px) {
    padding: 0;
    background-color: #121212;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const HeaderIcon = styled.div`
  font-size: 2.5rem;
  color: #ff7e5f;
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.125rem;
  color: #aaaaaa;
`;

export default CreatePost;
