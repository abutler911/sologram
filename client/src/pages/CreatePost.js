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
    localStorage.setItem("postDraftActive", "true");
    return () => {
      localStorage.removeItem("postDraftActive");
    };
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <Skeleton height="300px" width="100%" />
          <Skeleton height="50px" width="60%" style={{ margin: "20px auto" }} />
        </Container>
      </PageWrapper>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "creator")) {
    toast.error("You do not have permission to create posts.");
    navigate(-1);
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

        <Suspense
          fallback={<CenteredMessage>Loading Editor...</CenteredMessage>}
        >
          <PostCreator />
        </Suspense>
      </Container>
    </PageWrapper>
  );
};

// Styled Components — themed with SoloGram colors!
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 2rem 0;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.5rem;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const HeaderIcon = styled.div`
  font-size: 2.5rem;
  color: ${THEME.header.icon}; /* White on header normally */
  background-color: ${THEME.header.background}; /* Blue Gray */
  padding: 1rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  color: ${COLORS.textPrimary}; /* Near-black */
  margin-top: 1rem;
  margin-bottom: 0.5rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${COLORS.textSecondary}; /* Dark gray text */
`;

const CenteredMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${COLORS.textTertiary}; /* lighter gray */
  font-size: 1.125rem;
`;

export default CreatePost;
