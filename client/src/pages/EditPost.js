// pages/EditPost.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaEdit } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import CreatePostWorkflow from "../components/posts/CreatePostWorkflow";

const EditPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/posts/${id}`);
        setPost(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(
          "Failed to load post. It may have been deleted or does not exist."
        );
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>Loading post...</LoadingText>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <PageWrapper>
        <Container>
          <ErrorContainer>
            <ErrorMessage>{error || "Post not found"}</ErrorMessage>
            <BackButton onClick={() => navigate(-1)}>Go Back</BackButton>
          </ErrorContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <PageHeader>
          <HeaderIcon>
            <FaEdit />
          </HeaderIcon>
          <HeaderTitle>Edit Post</HeaderTitle>
          <HeaderSubtitle>Update and refine your content</HeaderSubtitle>
        </PageHeader>

        <CreatePostWorkflow initialData={post} isEditing={true} />
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
  color: #4a90e2;
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

// Loading styles
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const LoadingSpinner = styled.div`
  border: 4px solid #333333;
  border-top: 4px solid #ff7e5f;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 1.125rem;
  color: #aaaaaa;
`;

// Error styles
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.2);
  color: #ff6b6b;
  padding: 1rem 2rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const BackButton = styled.button`
  background-color: #333333;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444444;
  }
`;

export default EditPost;
