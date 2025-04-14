import React, { useContext } from "react";
import styled from "styled-components";
import { FaCamera } from "react-icons/fa";
import CreatePostWorkflow from "../components/posts/CreatePostWorkflow";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const CreatePost = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Wait for auth to load
  if (loading) {
    return <CenteredMessage>Loading...</CenteredMessage>;
  }

  // If not allowed, redirect or show a friendly message
  if (!user || (user.role !== "admin" && user.role !== "creator")) {
    toast.error("You do not have permission to create posts.");
    navigate(-1); // Go back to previous page
    return null;
  }

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

const CenteredMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #aaa;
  font-size: 1.125rem;
`;

export default CreatePost;
