import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useDeleteModal } from '../context/DeleteModalContext';
import { FaTrash } from 'react-icons/fa';

// ─── NOIR tokens — matches PostCard / ThoughtCard ─────────────────────────────
const NOIR = {
  ink: '#0a0a0b',
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  border: 'rgba(10,10,11,0.08)',
  salmon: '#e87c5a',
  sage: '#7aab8c',
  error: '#c0392b',
};

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const DeleteConfirmationModal = () => {
  const { isOpen, deleteConfig, handleConfirm, handleCancel } =
    useDeleteModal();

  if (!isOpen) return null;

  const {
    title = 'Delete Item',
    message = 'Are you sure? This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    itemName = null,
    destructive = true,
  } = deleteConfig;

  return (
    <Overlay onClick={handleCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        {/* Salmon accent line at top — matches PostCard */}
        <AccentLine />

        <ModalHeader>
          <IconWrap $destructive={destructive}>
            <FaTrash />
          </IconWrap>
          <Title>{title}</Title>
        </ModalHeader>

        <ModalBody>
          <Message>{message}</Message>

          {itemName && <ItemName>&ldquo;{itemName}&rdquo;</ItemName>}
        </ModalBody>

        <ModalFooter>
          <CancelBtn onClick={handleCancel}>{cancelText}</CancelBtn>
          <ConfirmBtn onClick={handleConfirm} $destructive={destructive}>
            {confirmText}
          </ConfirmBtn>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

export default DeleteConfirmationModal;

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 11, 0.62);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: ${fadeIn} 0.15s ease;
`;

const Modal = styled.div`
  position: relative;
  background: ${NOIR.warmWhite};
  border: 1px solid ${NOIR.dust};
  border-radius: 0;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 2px 0 0 ${NOIR.salmon}, 0 24px 60px rgba(10, 10, 11, 0.28);
  overflow: hidden;
  animation: ${slideUp} 0.2s cubic-bezier(0.22, 1, 0.36, 1);
`;

const AccentLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, ${NOIR.salmon} 0%, ${NOIR.sage} 100%);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid ${NOIR.border};
`;

const IconWrap = styled.div`
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: ${(p) => (p.$destructive ? NOIR.error : NOIR.salmon)};
  font-size: 0.9rem;
  opacity: 0.8;

  /* Subtle left bar like ThoughtCard mood bar */
  border-left: 2px solid ${(p) => (p.$destructive ? NOIR.error : NOIR.salmon)};
  padding-left: 10px;
`;

const Title = styled.h3`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-weight: 600;
  font-size: 1.35rem;
  font-style: italic;
  letter-spacing: -0.02em;
  color: ${NOIR.ink};
  margin: 0;
  line-height: 1.2;
`;

const ModalBody = styled.div`
  padding: 18px 24px 20px;
`;

const Message = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  line-height: 1.65;
  color: ${NOIR.charcoal};
  margin: 0 0 14px;
  opacity: 0.85;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ItemName = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  color: ${NOIR.ash};
  padding: 8px 12px;
  border-left: 2px solid ${NOIR.dust};
  background: rgba(10, 10, 11, 0.02);
  margin-top: 4px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 10px;
  padding: 14px 24px 22px;
  border-top: 1px solid ${NOIR.border};
  justify-content: flex-end;
`;

const baseBtn = css`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 9px 18px;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
`;

const CancelBtn = styled.button`
  ${baseBtn}
  background: transparent;
  color: ${NOIR.ash};
  border-color: ${NOIR.dust};

  &:hover {
    color: ${NOIR.ink};
    border-color: ${NOIR.ash};
    background: rgba(10, 10, 11, 0.03);
  }
`;

const ConfirmBtn = styled.button`
  ${baseBtn}
  background: ${(p) => (p.$destructive ? NOIR.error : NOIR.salmon)};
  color: #fff;
  border-color: ${(p) => (p.$destructive ? NOIR.error : NOIR.salmon)};

  &:hover {
    background: ${(p) => (p.$destructive ? '#a93226' : '#d4694a')};
    border-color: ${(p) => (p.$destructive ? '#a93226' : '#d4694a')};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
