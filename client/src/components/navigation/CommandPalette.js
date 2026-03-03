// navigation/CommandPalette.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { FaMagic, FaChevronRight } from 'react-icons/fa';
import { COLORS } from '../../theme';
import { fadeIn, dropDown } from './nav.styles';

const CommandPalette = ({ items, onClose, navigate }) => {
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((i) => i.label.toLowerCase().includes(s)) : items;
  }, [q, items]);

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <InputRow>
          <FaMagic />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Type a page or command...'
          />
          <Kbd>Esc</Kbd>
        </InputRow>
        <Results>
          {filtered.map((item, i) => (
            <Row
              key={i}
              onClick={() => {
                navigate(item.to);
                onClose();
              }}
            >
              <RowIcon>{item.icon}</RowIcon>
              <span>{item.label}</span>
              <Chevron>
                <FaChevronRight />
              </Chevron>
            </Row>
          ))}
          {!filtered.length && <Empty>No matching commands</Empty>}
        </Results>
      </Panel>
    </Backdrop>
  );
};

export default CommandPalette;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 16px 0;
  animation: ${fadeIn} 0.1s ease;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 580px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
  animation: ${dropDown} 0.15s ease;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid ${COLORS.border};
  svg {
    color: ${COLORS.primarySalmon};
    flex-shrink: 0;
  }
  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: ${COLORS.textPrimary};
    font-size: 1rem;
    &::placeholder {
      color: ${COLORS.textTertiary};
    }
  }
`;

const Kbd = styled.kbd`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 5px;
  padding: 2px 7px;
`;

const Results = styled.div`
  max-height: 380px;
  overflow-y: auto;
  padding: 6px;
`;

const Row = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: none;
  background: none;
  color: ${COLORS.textPrimary};
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  transition: background 0.1s;
  &:hover {
    background: ${COLORS.elevatedBackground};
  }
`;

const RowIcon = styled.span`
  width: 20px;
  display: grid;
  place-items: center;
  color: ${COLORS.textSecondary};
  font-size: 0.95rem;
  flex-shrink: 0;
  ${Row}:hover & {
    color: ${COLORS.primarySalmon};
  }
`;

const Chevron = styled.span`
  margin-left: auto;
  color: ${COLORS.textTertiary};
  font-size: 0.65rem;
  opacity: 0;
  transition: opacity 0.1s;
  ${Row}:hover & {
    opacity: 1;
  }
`;

const Empty = styled.div`
  padding: 24px;
  text-align: center;
  color: ${COLORS.textTertiary};
  font-size: 0.88rem;
`;
