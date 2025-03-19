import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import CollectionForm from "../components/collections/CollectionForm";

const EditCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/collections/${id}`);
        setCollection(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching collection:", err);
        setError(
          "Failed to load collection. It may have been deleted or does not exist."
        );
        toast.error("Failed to load collection");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  const handleDeleteCollection = async () => {
    try {
      await axios.delete(`/api/collections/${id}`);
      toast.success("Collection deleted successfully");
      navigate("/collections");
    } catch (err) {
      console.error("Error deleting collection:", err);
      toast.error("Failed to delete collection");
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading collection...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !collection) {
    return (
      <PageWrapper>
        <Container>
          <ErrorContainer>
            <ErrorMessage>{error || "Collection not found"}</ErrorMessage>
            <BackLink to="/collections">
              <FaArrowLeft />
              <span>Back to Collections</span>
            </BackLink>
          </ErrorContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackLink to={`/collections/${id}`}>
            <FaArrowLeft />
            <span>Back to Collection</span>
          </BackLink>

          <DeleteButton onClick={() => setShowDeleteModal(true)}>
            <FaTrash />
            <span>Delete Collection</span>
          </DeleteButton>
        </Header>

        <CollectionForm initialData={collection} isEditing={true} />

        {showDeleteModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Delete Collection</h3>
              <p>
                Are you sure you want to delete this collection? This action
                cannot be undone.
              </p>
              <DeleteModalButtons>
                <CancelButton onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </CancelButton>
                <ConfirmDeleteButton onClick={handleDeleteCollection}>
                  Delete Collection
                </ConfirmDeleteButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={() => setShowDeleteModal(false)} />
          </DeleteModal>
        )}
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #dddddd;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #aaaaaa;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.2);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const DeleteModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DeleteModalContent = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h3 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  p {
    color: #dddddd;
    margin-bottom: 1.5rem;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444444;
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
`;

export default EditCollection;
