// client/src/pages/EditCollection.js
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { COLORS } from '../theme';
import {
  useCollection,
  useDeleteCollection,
} from '../hooks/queries/useCollections';
import CollectionForm from '../components/collections/CollectionForm';

const EditCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: collection, isLoading, error } = useCollection(id);
  const deleteCollection = useDeleteCollection();

  const handleDeleteCollection = async () => {
    try {
      await deleteCollection.mutateAsync(id);
      navigate('/collections');
    } catch {
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
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
            <ErrorMessage>
              {error?.message || 'Collection not found'}
            </ErrorMessage>
            <BackLink to='/collections'>
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
                <ConfirmDeleteButton
                  onClick={handleDeleteCollection}
                  disabled={deleteCollection.isPending}
                >
                  {deleteCollection.isPending
                    ? 'Deleting...'
                    : 'Delete Collection'}
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

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;
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
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  transition: color 0.3s;
  &:hover {
    color: ${COLORS.accentPurple};
  }
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: transparent;
  color: ${COLORS.error};
  border: 1px solid ${COLORS.error};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    background-color: ${COLORS.error};
    color: white;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: ${COLORS.textTertiary};
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(244, 67, 54, 0.1);
  color: ${COLORS.error};
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
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  h3 {
    color: ${COLORS.textPrimary};
    margin-top: 0;
    margin-bottom: 1rem;
  }
  p {
    color: ${COLORS.textSecondary};
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
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: ${COLORS.error};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #c0392b;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
