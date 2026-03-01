// components/easter/EasterEggModal.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  FaTimes,
  FaLock,
  FaUnlock,
  FaChartBar,
  FaTerminal,
  FaFileAlt,
} from 'react-icons/fa';

const SECRET_CODE = '7700';

const EasterEggModal = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('code'); // 'code' | 'unlocked'
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (input === SECRET_CODE) {
      setUnlocking(true);
      setTimeout(() => setPhase('unlocked'), 900);
    } else {
      setShaking(true);
      setError('ACCESS DENIED');
      setInput('');
      setTimeout(() => {
        setShaking(false);
        setError('');
      }, 600);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <CloseBtn onClick={onClose}>
          <FaTimes />
        </CloseBtn>

        {phase === 'code' && (
          <>
            <PanelTop>
              <LockIcon $unlocking={unlocking}>
                {unlocking ? <FaUnlock /> : <FaLock />}
              </LockIcon>
              <PanelTitle>RESTRICTED ACCESS</PanelTitle>
              <PanelSub>Enter authorisation code to proceed</PanelSub>
            </PanelTop>

            <CodeForm onSubmit={handleSubmit} $shaking={shaking}>
              <CodeInput
                ref={inputRef}
                value={input}
                onChange={(e) =>
                  setInput(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder='_ _ _ _'
                maxLength={4}
                autoComplete='off'
                spellCheck={false}
                $hasError={!!error}
              />
              {error && <ErrorLine>{error}</ErrorLine>}
              <SubmitBtn type='submit' disabled={input.length < 4}>
                UNLOCK
              </SubmitBtn>
            </CodeForm>

            <ScanLine />
          </>
        )}

        {phase === 'unlocked' && (
          <UnlockedView>
            <UnlockBadge>⬡ ACCESS GRANTED</UnlockBadge>
            <UnlockTitle>Where do you want to go?</UnlockTitle>
            <DestGrid>
              <DestCard onClick={() => go('/vault/wrapped')} $color='#e87c5a'>
                <DestIcon $color='#e87c5a'>
                  <FaChartBar />
                </DestIcon>
                <DestName>SoloGram Wrapped</DestName>
                <DestDesc>Your story, by the numbers</DestDesc>
                <DestArrow $color='#e87c5a'>→</DestArrow>
              </DestCard>
              <DestCard onClick={() => go('/vault/terminal')} $color='#00ff41'>
                <DestIcon $color='#00ff41'>
                  <FaTerminal />
                </DestIcon>
                <DestName>Root Access</DestName>
                <DestDesc>You really shouldn't be here</DestDesc>
                <DestArrow $color='#00ff41'>→</DestArrow>
              </DestCard>
              <DestCard onClick={() => go('/vault/docs')} $color='#c9a84c' $span>
                <DestIcon $color='#c9a84c'>
                  <FaFileAlt />
                </DestIcon>
                <DestName>Dead Drop</DestName>
                <DestDesc>The document repository</DestDesc>
                <DestArrow $color='#c9a84c'>→</DestArrow>
              </DestCard>
            </DestGrid>
          </UnlockedView>
        )}
      </Panel>
    </Backdrop>
  );
};

export default EasterEggModal;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const popUp = keyframes`
  from { opacity: 0; transform: scale(0.94) translateY(10px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-5px); }
  80%       { transform: translateX(5px); }
`;

const scanAnim = keyframes`
  0%   { top: 0%; }
  100% { top: 100%; }
`;

const unlockSpin = keyframes`
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(20deg) scale(1.2); }
  100% { transform: rotate(0deg) scale(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,65,0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(0,255,65,0); }
`;

// ─── Backdrop ─────────────────────────────────────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.15s ease;
`;

// ─── Panel ────────────────────────────────────────────────────────────────────

const Panel = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  background: #0a0a0b;
  border: 1px solid rgba(0, 255, 65, 0.25);
  box-shadow: 0 0 0 1px rgba(0, 255, 65, 0.08), 0 0 60px rgba(0, 255, 65, 0.08),
    0 32px 80px rgba(0, 0, 0, 0.6);
  padding: 36px 32px 32px;
  animation: ${popUp} 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;

  /* Corner brackets */
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-color: rgba(0, 255, 65, 0.4);
    border-style: solid;
  }
  &::before {
    top: 8px;
    left: 8px;
    border-width: 1px 0 0 1px;
  }
  &::after {
    bottom: 8px;
    right: 8px;
    border-width: 0 1px 1px 0;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
  z-index: 2;
  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

// ─── Code phase ───────────────────────────────────────────────────────────────

const PanelTop = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const LockIcon = styled.div`
  font-size: 1.6rem;
  color: rgba(0, 255, 65, 0.7);
  margin-bottom: 14px;
  display: inline-block;
  ${(p) =>
    p.$unlocking &&
    css`
      animation: ${unlockSpin} 0.6s ease forwards;
      color: #00ff41;
    `}
`;

const PanelTitle = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  color: rgba(0, 255, 65, 0.9);
  margin-bottom: 8px;
`;

const PanelSub = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.25);
`;

const CodeForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  ${(p) =>
    p.$shaking &&
    css`
      animation: ${shake} 0.5s ease;
    `}
`;

const CodeInput = styled.input`
  width: 160px;
  text-align: center;
  background: rgba(0, 255, 65, 0.04);
  border: 1px solid ${(p) => (p.$hasError ? '#ff4444' : 'rgba(0,255,65,0.3)')};
  color: #00ff41;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 1.8rem;
  letter-spacing: 0.3em;
  padding: 12px 16px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  caret-color: #00ff41;

  &::placeholder {
    color: rgba(0, 255, 65, 0.15);
    letter-spacing: 0.4em;
  }
  &:focus {
    border-color: ${(p) => (p.$hasError ? '#ff4444' : 'rgba(0,255,65,0.7)')};
    box-shadow: 0 0 12px rgba(0, 255, 65, 0.1);
  }
`;

const ErrorLine = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.15em;
  color: #ff4444;
`;

const SubmitBtn = styled.button`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  color: #0a0a0b;
  background: #00ff41;
  border: none;
  padding: 10px 28px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  &:hover:not(:disabled) {
    opacity: 0.85;
  }
  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background: rgba(0, 255, 65, 0.4);
  }
`;

/* Animated scan line overlay */
const ScanLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 65, 0.15),
    transparent
  );
  animation: ${scanAnim} 3s linear infinite;
  pointer-events: none;
`;

// ─── Unlocked phase ───────────────────────────────────────────────────────────

const UnlockedView = styled.div`
  text-align: center;
  animation: ${slideUp} 0.35s cubic-bezier(0.22, 1, 0.36, 1);
`;

const UnlockBadge = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.2em;
  color: #00ff41;
  margin-bottom: 16px;
  animation: ${pulse} 2s ease infinite;
  display: inline-block;
`;

const UnlockTitle = styled.div`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.4rem;
  font-weight: 400;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  letter-spacing: -0.01em;
`;

const DestGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const DestCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 18px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  ${(p) => p.$span && 'grid-column: 1 / -1;'}

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: ${(p) => `${p.$color}44`};
  }
`;

const DestIcon = styled.div`
  font-size: 1.1rem;
  color: ${(p) => p.$color};
`;

const DestName = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.85);
`;

const DestDesc = styled.div`
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.3);
`;

const DestArrow = styled.div`
  font-size: 0.8rem;
  color: ${(p) => p.$color};
  margin-top: auto;
  align-self: flex-end;
`;