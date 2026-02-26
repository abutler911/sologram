// pages/vault/HackerTerminal.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// ─── Terminal script — each line typed out one by one ─────────────────────────
const BOOT_SEQUENCE = [
  {
    text: 'SOLOGRAM SECURE SHELL v2.4.1',
    delay: 0,
    color: '#00ff41',
    pause: 300,
  },
  {
    text: 'Copyright (c) 2024 Andrew — All rights reserved',
    delay: 0,
    color: '#00ff41',
    pause: 200,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  {
    text: 'Initialising connection...',
    delay: 18,
    color: '#a09a91',
    pause: 600,
  },
  {
    text: '> Establishing secure tunnel ............... [OK]',
    delay: 14,
    color: '#7aab8c',
    pause: 200,
  },
  {
    text: '> Loading user profile ...................... [OK]',
    delay: 14,
    color: '#7aab8c',
    pause: 200,
  },
  {
    text: '> Mounting media filesystem ................. [OK]',
    delay: 14,
    color: '#7aab8c',
    pause: 200,
  },
  {
    text: '> Decrypting thought archive ................ [OK]',
    delay: 14,
    color: '#7aab8c',
    pause: 400,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  {
    text: 'WARNING: You are accessing a private system.',
    delay: 20,
    color: '#e87c5a',
    pause: 100,
  },
  {
    text: 'All activity is monitored and logged.',
    delay: 20,
    color: '#e87c5a',
    pause: 500,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  { text: '$ whoami', delay: 22, color: '#faf9f7', pause: 400 },
  {
    text: 'andrew@sologram — root access granted',
    delay: 16,
    color: '#00ff41',
    pause: 500,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  { text: '$ ls -la /vault/', delay: 22, color: '#faf9f7', pause: 500 },
  {
    text: 'drwxr-xr-x  posts/           2.4 GB',
    delay: 12,
    color: '#a09a91',
    pause: 80,
  },
  {
    text: 'drwxr-xr-x  thoughts/        148 MB',
    delay: 12,
    color: '#a09a91',
    pause: 80,
  },
  {
    text: 'drwxr-xr-x  stories/         890 MB',
    delay: 12,
    color: '#a09a91',
    pause: 80,
  },
  {
    text: '-rw-------  .secrets          [REDACTED]',
    delay: 12,
    color: '#e87c5a',
    pause: 80,
  },
  {
    text: '-rw-------  feelings.log      [ENCRYPTED]',
    delay: 12,
    color: '#e87c5a',
    pause: 300,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  { text: '$ cat /vault/.secrets', delay: 22, color: '#faf9f7', pause: 600 },
  { text: 'Permission denied.', delay: 20, color: '#ff4444', pause: 200 },
  { text: 'Nice try.', delay: 30, color: '#ff4444', pause: 700 },
  { text: '', delay: 0, color: null, pause: 100 },
  { text: '$ uptime', delay: 22, color: '#faf9f7', pause: 400 },
  {
    text: 'System has been running for: YOUR ENTIRE ADULT LIFE',
    delay: 12,
    color: '#c9a84c',
    pause: 500,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  {
    text: '$ tail -n 3 /vault/feelings.log',
    delay: 22,
    color: '#faf9f7',
    pause: 600,
  },
  { text: '[2024-??-??] grateful.', delay: 18, color: '#7aab8c', pause: 180 },
  {
    text: '[2024-??-??] building something worth keeping.',
    delay: 14,
    color: '#7aab8c',
    pause: 180,
  },
  {
    text: '[2024-??-??] this is mine.',
    delay: 16,
    color: '#7aab8c',
    pause: 800,
  },
  { text: '', delay: 0, color: null, pause: 100 },
  { text: '$ logout', delay: 22, color: '#faf9f7', pause: 400 },
  { text: '', delay: 0, color: null, pause: 100 },
  {
    text: 'Session closed. The door was always open.',
    delay: 16,
    color: '#00ff41',
    pause: 0,
  },
];

const HackerTerminal = () => {
  const [lines, setLines] = useState([]); // fully rendered lines
  const [current, setCurrent] = useState(''); // line currently being typed
  const [lineIdx, setLineIdx] = useState(0); // which script line we're on
  const [charIdx, setCharIdx] = useState(0); // which char in that line
  const [done, setDone] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom as lines appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, current]);

  // Typing engine
  useEffect(() => {
    if (lineIdx >= BOOT_SEQUENCE.length) {
      setDone(true);
      return;
    }

    const line = BOOT_SEQUENCE[lineIdx];

    // Empty line — push immediately then pause
    if (!line.text) {
      const t = setTimeout(() => {
        setLines((l) => [...l, { text: '', color: null }]);
        setLineIdx((i) => i + 1);
        setCharIdx(0);
        setCurrent('');
      }, line.pause);
      return () => clearTimeout(t);
    }

    // Still typing this line
    if (charIdx < line.text.length) {
      const delay = line.delay + Math.random() * 8;
      const t = setTimeout(() => {
        setCurrent((c) => c + line.text[charIdx]);
        setCharIdx((i) => i + 1);
      }, delay);
      return () => clearTimeout(t);
    }

    // Line complete — push to rendered lines, pause, then advance
    const t = setTimeout(() => {
      setLines((l) => [...l, { text: line.text, color: line.color }]);
      setCurrent('');
      setCharIdx(0);
      setLineIdx((i) => i + 1);
    }, line.pause);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx]);

  // Current line color
  const currentColor =
    lineIdx < BOOT_SEQUENCE.length
      ? BOOT_SEQUENCE[lineIdx]?.color || '#faf9f7'
      : '#faf9f7';

  return (
    <Shell>
      <TerminalWrap>
        {/* Window chrome */}
        <TitleBar>
          <TitleDots>
            <Dot $c='#ff5f56' />
            <Dot $c='#ffbd2e' />
            <Dot $c='#27c93f' />
          </TitleDots>
          <TitleText>andrew@sologram: ~/vault</TitleText>
          <ExitBtn onClick={() => navigate('/')}>× exit</ExitBtn>
        </TitleBar>

        {/* Output */}
        <Output>
          {lines.map((line, i) => (
            <Line key={i} $color={line.color || 'rgba(255,255,255,0.15)'}>
              {line.text || '\u00A0'}
            </Line>
          ))}

          {/* Currently typing line */}
          {!done && current && (
            <Line $color={currentColor}>
              {current}
              <Cursor />
            </Line>
          )}

          {/* Idle cursor between lines */}
          {!done && !current && (
            <Line $color='rgba(255,255,255,0.15)'>
              <Cursor />
            </Line>
          )}

          {/* All done */}
          {done && (
            <DoneRow>
              <Prompt>
                andrew@sologram:~$ <Cursor />
              </Prompt>
              <ExitHint onClick={() => navigate('/')}>
                [ press here to close session ]
              </ExitHint>
            </DoneRow>
          )}

          <div ref={bottomRef} />
        </Output>
      </TerminalWrap>
    </Shell>
  );
};

export default HackerTerminal;

// ─── Animations ───────────────────────────────────────────────────────────────

const blinkAnim = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

const scanline = keyframes`
  0%   { transform: translateY(0); }
  100% { transform: translateY(100vh); }
`;

const flicker = keyframes`
  0%,  95%, 100% { opacity: 1; }
  96%            { opacity: 0.85; }
  97%            { opacity: 1; }
  98%            { opacity: 0.92; }
`;

// ─── Shell ────────────────────────────────────────────────────────────────────

const Shell = styled.div`
  min-height: 100vh;
  background: #0a0a0b;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 16px 40px;
  box-sizing: border-box;

  /* CRT scanline overlay */
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.06) 2px,
      rgba(0, 0, 0, 0.06) 4px
    );
    pointer-events: none;
    z-index: 100;
  }

  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
    align-items: center;
    padding-top: 40px;
    box-sizing: border-box;
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const TerminalWrap = styled.div`
  width: 100%;
  max-width: 720px;
  background: #0d1210;
  border: 1px solid rgba(0, 255, 65, 0.15);
  box-shadow: 0 0 0 1px rgba(0, 255, 65, 0.05), 0 0 40px rgba(0, 255, 65, 0.06),
    0 40px 80px rgba(0, 0, 0, 0.6);
  animation: ${flicker} 8s ease infinite;
  overflow: hidden;
`;

// ─── Window chrome ────────────────────────────────────────────────────────────

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(0, 255, 65, 0.08);
`;

const TitleDots = styled.div`
  display: flex;
  gap: 5px;
  flex-shrink: 0;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => p.$c};
  opacity: 0.7;
`;

const TitleText = styled.div`
  flex: 1;
  text-align: center;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.25);
`;

const ExitBtn = styled.button`
  background: none;
  border: none;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  padding: 2px 6px;
  transition: color 0.15s;
  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

// ─── Output ───────────────────────────────────────────────────────────────────

const Output = styled.div`
  padding: 20px 22px 24px;
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 65, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.2);
  }
`;

const Line = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.7;
  letter-spacing: 0.04em;
  color: ${(p) => p.$color || 'rgba(255,255,255,0.5)'};
  white-space: pre-wrap;
  word-break: break-all;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 7px;
  height: 13px;
  background: #00ff41;
  vertical-align: text-bottom;
  animation: ${blinkAnim} 0.8s step-end infinite;
  margin-left: 1px;
`;

const DoneRow = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const Prompt = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #00ff41;
  display: inline-flex;
  align-items: center;
`;

const ExitHint = styled.button`
  background: none;
  border: none;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;
