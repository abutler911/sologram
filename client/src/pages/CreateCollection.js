import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaArrowLeft } from "react-icons/fa";
import CollectionForm from "../components/collections/CollectionForm";
import { AuthContext } from "../context/AuthContext";

const CreateCollection = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!isAuthenticated || !user || !["admin", "creator"].includes(user.role)) {
    return (
      <PageWrapper>
        <Container>
          <BackLink to="/collections">
            <FaArrowLeft />
            <span>Back to Collections</span>
          </BackLink>
          <AccessDenied>
            <h2>Access Denied</h2>
            <p>You don't have permission to create collections.</p>
          </AccessDenied>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <BackLink to="/collections">
          <FaArrowLeft />
          <span>Back to Collections</span>
        </BackLink>

        <CollectionForm />
      </Container>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 2rem 0;

  @media (max-width: 768px) {
    padding: 1rem 0;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #dddddd;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const AccessDenied = styled.div`
  text-align: center;
  color: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  background-color: rgba(255, 0, 0, 0.1);

  h2 {
    margin-bottom: 0.5rem;
  }

  p {
    color: #bbbbbb;
  }
`;

export default CreateCollection;
