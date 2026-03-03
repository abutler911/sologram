// navigation/SearchOverlay.js
import React from 'react';
import styled from 'styled-components';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { COLORS } from '../../theme';
import { fadeIn, popIn } from './nav.styles';

const SearchOverlay = ({
  searchQuery,
  setSearchQuery,
  searchInputRef,
  onSubmit,
  onClear,
  onClose,
}) => (
  <Overlay>
    <Card>
      <Row>
        <Box>
          <FaSearch />
          <form onSubmit={onSubmit} style={{ flex: 1, display: 'flex' }}>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search posts and thoughts...'
              autoComplete='off'
            />
          </form>
          {searchQuery && (
            <ClearBtn type='button' onClick={onClear}>
              <FaTimes />
            </ClearBtn>
          )}
        </Box>
        <CancelBtn
          onClick={() => {
            onClose();
            onClear();
          }}
        >
          Cancel
        </CancelBtn>
      </Row>
      <Body>
        {searchQuery ? (
          <ActiveHint>
            Press <kbd>Enter</kbd> to search for &ldquo;{searchQuery}&rdquo;
          </ActiveHint>
        ) : (
          <EmptyState>
            <FaSearch />
            <p>Search posts, thoughts, and more</p>
            <Tip>Cmd+K opens command palette</Tip>
          </EmptyState>
        )}
      </Body>
    </Card>
  </Overlay>
);

export default SearchOverlay;

// ── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  background: ${COLORS.background};
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.12s ease;
  @media (min-width: 960px) {
    background: rgba(0, 0, 0, 0.52);
    backdrop-filter: blur(5px);
    align-items: center;
    justify-content: flex-start;
    padding-top: 10vh;
  }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  @media (min-width: 960px) {
    height: auto;
    max-width: 580px;
    background: ${COLORS.cardBackground};
    border: 1px solid ${COLORS.border};
    border-radius: 18px;
    overflow: hidden;
    animation: ${popIn} 0.16s ease;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.background};
  @media (min-width: 960px) {
    background: transparent;
  }
`;

const Box = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 9px 12px;
  svg {
    color: ${COLORS.textTertiary};
    flex-shrink: 0;
  }
  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: ${COLORS.textPrimary};
    font-size: 0.97rem;
    width: 100%;
    &::placeholder {
      color: ${COLORS.textTertiary};
    }
  }
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 0.82rem;
  padding: 2px;
  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

const CancelBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primarySalmon};
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  padding: 4px 0;
  &:hover {
    opacity: 0.78;
  }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${COLORS.textTertiary};
  svg {
    font-size: 2.2rem;
    opacity: 0.22;
    display: block;
    margin: 0 auto 14px;
  }
  p {
    margin: 0 0 6px;
    font-size: 0.95rem;
    color: ${COLORS.textSecondary};
  }
`;

const Tip = styled.div`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
`;

const ActiveHint = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  text-align: center;
  kbd {
    background: ${COLORS.elevatedBackground};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.8rem;
    margin-right: 4px;
  }
`;
