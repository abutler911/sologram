// components/common/DeleteConfirmationModal.js
import React from "react";
import styled, { keyframes } from "styled-components";
import { FaTrash, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { COLORS } from "../../theme";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const slideInBottom = keyframes`
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
`;

const DeleteModalContent = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  animation: ${fadeIn} 0.3s ease-out;
`;

const DeleteModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${COLORS.border};
  background-color: ${COLORS.elevatedBackground};
`;

const DeleteModalTitle = styled.h3`
  margin: 0;
  color: ${COLORS.error};
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    font-size: 1.1rem;
    color: ${COLORS.error};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
    transform: rotate(90deg);
  }
`;

const DeleteModalBody = styled.div`
  padding: 1.75rem 1.5rem;
  animation: ${slideInBottom} 0.3s ease-out;
`;

const DeleteMessage = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: ${COLORS.textPrimary};
`;

const DeleteHighlight = styled.span`
  font-weight: 600;
  color: ${COLORS.error};
`;

const DeleteWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: ${COLORS.error}15;
  border-left: 4px solid ${COLORS.error};
  border-radius: 6px;
  color: ${COLORS.textSecondary};
  font-size: 0.95rem;
  line-height: 1.5;
  margin-top: 1rem;

  svg {
    color: ${COLORS.error};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
`;

const DeleteModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid ${COLORS.border};
  background-color: ${COLORS.elevatedBackground};
`;

const CancelButton = styled.button`
  background: none;
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textSecondary};
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
    border-color: ${COLORS.textTertiary};
  }
`;

const DeleteButton = styled.button`
  background-color: ${COLORS.error};
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover {
    background-color: #c62828;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    &:before {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const DeleteConfirmationModal = ({
  show,
  onCancel,
  onConfirm,
  assetName,
  isBulk,
  count,
}) => {
  if (!show) return null;

  return (
    <ModalOverlay>
      <DeleteModalContent onClick={(e) => e.stopPropagation()}>
        <DeleteModalHeader>
          <DeleteModalTitle>
            <FaTrash /> Confirm Deletion
          </DeleteModalTitle>
          <CloseButton onClick={onCancel}>
            <FaTimes />
          </CloseButton>
        </DeleteModalHeader>

        <DeleteModalBody>
          {isBulk ? (
            <DeleteMessage>
              Are you sure you want to delete{" "}
              <DeleteHighlight>{count}</DeleteHighlight> selected
              {count === 1 ? " asset" : " assets"}? This action cannot be
              undone.
            </DeleteMessage>
          ) : (
            <DeleteMessage>
              Are you sure you want to delete{" "}
              <DeleteHighlight>"{assetName}"</DeleteHighlight>? This action
              cannot be undone.
            </DeleteMessage>
          )}

          <DeleteWarning>
            <FaExclamationTriangle />
            <span>
              Once deleted, the asset will be permanently removed from
              Cloudinary and cannot be recovered. Any content using this media
              will be affected.
            </span>
          </DeleteWarning>
        </DeleteModalBody>

        <DeleteModalFooter>
          <CancelButton onClick={onCancel}>Cancel</CancelButton>
          <DeleteButton onClick={onConfirm}>
            {isBulk ? `Delete ${count} Assets` : "Delete Asset"}
          </DeleteButton>
        </DeleteModalFooter>
      </DeleteModalContent>
    </ModalOverlay>
  );
};

export default DeleteConfirmationModal;
