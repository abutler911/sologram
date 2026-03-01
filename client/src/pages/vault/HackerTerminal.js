import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// ─── Dynamic Script Generator ───────────────────────────────────────────────

const COLORS = {
  green: '#00ff41',
  dim: '#a09a91',
  ok: '#7aab8c',
  warn: '#e87c5a',
  white: '#faf9f7',
  blue: '#5ab0e8',
  gold: '#c9a84c',
  error: '#ff4444',
};

const getDynamicSequence = () => {
  const now = new Date();
  const year = now.getFullYear();
  const age = year - 1976;

  const header = [
    {
      text: 'SOLOGRAM SECURE SHELL v2.4.1',
      delay: 0,
      color: COLORS.green,
      pause: 300,
    },
    {
      text: `Copyright (c) ${year} Andrew — All rights reserved`,
      delay: 0,
      color: COLORS.green,
      pause: 200,
    },
    { text: '', pause: 100 },
    {
      text: 'Initialising connection...',
      delay: 18,
      color: COLORS.dim,
      pause: 600,
    },
    {
      text: '> Establishing secure tunnel ............... [OK]',
      delay: 14,
      color: COLORS.ok,
      pause: 200,
    },
  ];

  // Randomize 3 system checks
  const systemChecks = [
    `> Verifying A220 systems integrity ......... [OK]`,
    `> Calibrating piano hand-independence ....... [OK]`,
    `> Loading street_photography_v4.dll ......... [OK]`,
    `> Establishing Salt Lake uplink ............. [OK]`,
    `> Syncing Kindle 'Psych Thriller' library ... [OK]`,
    `> Checking ATL training schedule ............ [OK]`,
    `> Mounting /dev/wasatch_mountains ........... [OK]`,
  ]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((text) => ({
      text,
      delay: 12,
      color: COLORS.ok,
      pause: 150,
    }));

  // Pools of "Probes" based on your actual interests
  const probesPool = [
    [
      // Aviation
      { text: '$ fly --status', delay: 22, color: COLORS.white, pause: 400 },
      {
        text: 'Currently: First Officer / Delta Air Lines',
        color: COLORS.green,
        pause: 200,
      },
      {
        text: 'Type Rating: Airbus A220 (In Progress)',
        color: COLORS.dim,
        pause: 300,
      },
    ],
    [
      // Piano
      { text: '$ play --practice', delay: 22, color: COLORS.white, pause: 400 },
      {
        text: 'Active: Czerny - Practical Method',
        color: COLORS.blue,
        pause: 200,
      },
      {
        text: 'Status: Left-hand coordination improving.',
        color: COLORS.dim,
        pause: 300,
      },
    ],
    [
      // Photography
      {
        text: '$ ls /media/canon_r50/dcim',
        delay: 22,
        color: COLORS.white,
        pause: 400,
      },
      {
        text: 'IMG_8821.CR3 (Portrait)     31.2 MB',
        color: COLORS.dim,
        pause: 80,
      },
      {
        text: 'IMG_8822.CR3 (Street)       27.5 MB',
        color: COLORS.dim,
        pause: 80,
      },
    ],
    [
      // Independent Thinking
      {
        text: '$ cat /etc/philosophy',
        delay: 22,
        color: COLORS.white,
        pause: 500,
      },
      {
        text: 'Status: Independent thinking > The Grind.',
        color: COLORS.gold,
        pause: 400,
      },
    ],
  ];

  const selectedProbes = probesPool
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .flat();

  const footer = [
    { text: '', pause: 100 },
    { text: '$ uptime', delay: 22, color: COLORS.white, pause: 400 },
    {
      text: `System Uptime: ${age} years, ${now.getMonth()} months, ${now.getDate()} days`,
      color: COLORS.gold,
      pause: 500,
    },
    { text: '', pause: 100 },
    { text: '$ logout', delay: 22, color: COLORS.white, pause: 600 },
    {
      text: 'Session closed. The door was always open.',
      delay: 16,
      color: COLORS.green,
      pause: 0,
    },
  ];

  return [
    ...header,
    ...systemChecks,
    { text: '', pause: 100 },
    ...selectedProbes,
    ...footer,
  ];
};

// ─── Component ──────────────────────────────────────────────────────────────

const HackerTerminal = () => {
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Generate sequence once on mount
  const sequenceRef = useRef(getDynamicSequence());
  const BOOT_SEQUENCE = sequenceRef.current;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, current]);

  useEffect(() => {
    if (lineIdx >= BOOT_SEQUENCE.length) {
      setDone(true);
      return;
    }

    const line = BOOT_SEQUENCE[lineIdx];

    if (!line.text && line.text !== '') {
      setLineIdx((i) => i + 1);
      return;
    }

    if (line.text === '') {
      const t = setTimeout(() => {
        setLines((l) => [...l, { text: '', color: null }]);
        setLineIdx((i) => i + 1);
        setCharIdx(0);
        setCurrent('');
      }, line.pause);
      return () => clearTimeout(t);
    }

    if (charIdx < line.text.length) {
      const delay = (line.delay || 15) + Math.random() * 8;
      const t = setTimeout(() => {
        setCurrent((c) => c + line.text[charIdx]);
        setCharIdx((i) => i + 1);
      }, delay);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLines((l) => [...l, { text: line.text, color: line.color }]);
      setCurrent('');
      setCharIdx(0);
      setLineIdx((i) => i + 1);
    }, line.pause);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, BOOT_SEQUENCE]);

  const currentColor =
    lineIdx < BOOT_SEQUENCE.length
      ? BOOT_SEQUENCE[lineIdx]?.color || '#faf9f7'
      : '#faf9f7';

  return (
    <Shell>
      <TerminalWrap>
        <TitleBar>
          <TitleDots>
            <Dot $c='#ff5f56' />
            <Dot $c='#ffbd2e' />
            <Dot $c='#27c93f' />
          </TitleDots>
          <TitleText>andrew@sologram: ~/vault</TitleText>
          <ExitBtn onClick={() => navigate('/')}>× exit</ExitBtn>
        </TitleBar>

        <Output>
          {lines.map((line, i) => (
            <Line key={i} $color={line.color || 'rgba(255,255,255,0.15)'}>
              {line.text || '\u00A0'}
            </Line>
          ))}

          {!done && current && (
            <Line $color={currentColor}>
              {current}
              <Cursor />
            </Line>
          )}

          {!done && !current && (
            <Line $color='rgba(255,255,255,0.15)'>
              <Cursor />
            </Line>
          )}

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

// ─── Styled Components (Animations & Shell) ─────────────────────────────────

const blinkAnim = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const flicker = keyframes`
  0%, 95%, 100% { opacity: 1; }
  96% { opacity: 0.85; }
  98% { opacity: 0.92; }
`;

const Shell = styled.div`
  min-height: 100vh;
  background: #0a0a0b;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 16px 40px;
  box-sizing: border-box;

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
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  animation: ${flicker} 8s ease infinite;
  overflow: hidden;
`;

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
  font-family: 'DM Mono', monospace;
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.25);
`;

const ExitBtn = styled.button`
  background: none;
  border: none;
  font-family: 'DM Mono', monospace;
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const Output = styled.div`
  padding: 20px 22px 24px;
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;
`;

const Line = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.7;
  color: ${(p) => p.$color || 'rgba(255,255,255,0.5)'};
  white-space: pre-wrap;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 7px;
  height: 13px;
  background: #00ff41;
  animation: ${blinkAnim} 0.8s step-end infinite;
`;

const DoneRow = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Prompt = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: #00ff41;
`;

const ExitHint = styled.button`
  background: none;
  border: none;
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;
