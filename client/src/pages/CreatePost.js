import React, { useContext, useEffect, lazy, Suspense } from "react";
import styled from "styled-components";
import { FaCamera } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { COLORS, THEME } from "../theme";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const PostCreator = lazy(() => import("../components/posts/PostCreator"));

const CreatePost = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Set flag for post draft in localStorage
    localStorage.setItem("postDraftActive", "true");

    // Remove flag when component unmounts
    return () => {
      localStorage.removeItem("postDraftActive");
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingHeader>
            <Skeleton circle={true} height={60} width={60} />
            <Skeleton height={30} width="50%" style={{ marginTop: 15 }} />
          </LoadingHeader>
          <Skeleton height="450px" width="100%" />
        </Container>
      </PageWrapper>
    );
  }

  // Check if user has permission to create posts
  if (!user || (user.role !== "admin" && user.role !== "creator")) {
    toast.error("You do not have permission to create posts.");
    navigate(-1);
    return null;
  }

  return (
    <PageWrapper>
      <Container>
        <Suspense fallback={<LoadingSkeleton />}>
          <PostCreator />
        </Suspense>
      </Container>
    </PageWrapper>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <>
    <LoadingHeader>
      <Skeleton circle={true} height={60} width={60} />
      <Skeleton height={30} width="50%" style={{ marginTop: 15 }} />
    </LoadingHeader>
    <Skeleton height="450px" width="100%" />
  </>
);

// Styled Components with cleaner implementation
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const LoadingHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
`;

export default CreatePost;
