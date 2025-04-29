// pages/EditPost.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaEdit } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import PostCreator from "../components/posts/PostCreator";
import { COLORS, THEME } from "../theme";

// Import LoadingSpinner component
import LoadingSpinner from "../components/common/LoadingSpinner";

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
            <LoadingSpinner text="Loading post" size="50px" />
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

        <PostCreator initialData={post} isEditing={true} />
      </Container>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 2rem 0;

  @media (max-width: 768px) {
    padding: 0;
    background-color: ${COLORS.background};
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
  color: ${COLORS.primaryBlue};
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 0.5rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${COLORS.textTertiary};
`;

// Loading styles
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
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
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
  padding: 1rem 2rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const BackButton = styled.button`
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

export default EditPost;
