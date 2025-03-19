import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaArrowLeft } from "react-icons/fa";
import CollectionForm from "../components/collections/CollectionForm";

const CreateCollection = () => {
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

export default CreateCollection;
