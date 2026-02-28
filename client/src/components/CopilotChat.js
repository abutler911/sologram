// components/CopilotChat.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { COLORS } from '../theme';
import axios from 'axios';

const COPILOT_NAME = 'Blackbox';

const CopilotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Welcome to Blackbox — Andrew's flight recorder. Ask me anything about his photography, aviation journey, thoughts, or what he's been posting on SoloGram.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const history = updated
        .slice(1)
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));

      const { data } = await axios.post('/api/copilot/chat', {
        message: text,
        history,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.data.reply },
      ]);
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? 'Message limit reached — try again in a few minutes.'
          : 'Blackbox is temporarily offline. Try again shortly.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <FloatingButton
          onClick={() => setIsOpen(true)}
          aria-label='Open Blackbox'
        >
          <ButtonIcon>
            <RecorderSVG />
          </ButtonIcon>
        </FloatingButton>
      )}

      {isOpen && (
        <ChatPanel>
          <ChatHeader>
            <HeaderInfo>
              <HeaderIconWrap>
                <RecorderSVG small />
              </HeaderIconWrap>
              <div>
                <HeaderTitle>{COPILOT_NAME}</HeaderTitle>
                <HeaderSubtitle>Andrew's flight recorder</HeaderSubtitle>
              </div>
            </HeaderInfo>
            <CloseButton
              onClick={() => setIsOpen(false)}
              aria-label='Close chat'
            >
              <FaTimes />
            </CloseButton>
          </ChatHeader>

          <MessagesContainer>
            {messages.map((msg, i) => (
              <MessageBubble key={i} $isUser={msg.role === 'user'}>
                {msg.content}
              </MessageBubble>
            ))}
            {loading && (
              <MessageBubble $isUser={false}>
                <TypingDots>
                  <Dot $delay='0s' />
                  <Dot $delay='0.15s' />
                  <Dot $delay='0.3s' />
                </TypingDots>
              </MessageBubble>
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          <InputArea>
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask Blackbox...'
              maxLength={500}
              disabled={loading}
            />
            <SendButton
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label='Send message'
            >
              <FaPaperPlane />
            </SendButton>
          </InputArea>
        </ChatPanel>
      )}
    </>
  );
};

export default CopilotChat;

// ── Blackbox icon (mini flight recorder) ────────────────────────────────────

const RecorderSVG = ({ small }) => (
  <svg
    width={small ? 18 : 24}
    height={small ? 18 : 24}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect
      x='3'
      y='5'
      width='18'
      height='14'
      rx='2.5'
      fill={COLORS.primarySalmon}
      opacity='0.85'
    />
    <rect
      x='5'
      y='8'
      width='14'
      height='3'
      rx='1'
      fill='#1a1a1a'
      opacity='0.5'
    />
    <circle cx='12' cy='15.5' r='1.5' fill='#1a1a1a' opacity='0.4' />
    <rect x='9' y='3' width='6' height='2' rx='1' fill={COLORS.textTertiary} />
  </svg>
);

// ── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulse = keyframes`
  0%, 80%, 100% { transform: scale(0.35); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
`;

const subtleGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(233, 137, 115, 0); }
  50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px 2px rgba(233, 137, 115, 0.15); }
`;

// ── Noir glass effect ───────────────────────────────────────────────────────

const noirGlass = css`
  background: rgba(18, 18, 18, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
`;

// ── Floating Button ─────────────────────────────────────────────────────────

const FloatingButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  border: 1px solid ${COLORS.border};
  ${noirGlass}
  color: ${COLORS.primarySalmon};
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, border-color 0.2s;
  animation: ${subtleGlow} 4s ease-in-out infinite;

  &:hover {
    transform: translateY(-2px) scale(1.04);
    border-color: ${COLORS.primarySalmon}88;
    animation: none;
  }

  @media (max-width: 480px) {
    bottom: 72px;
    right: 14px;
    width: 48px;
    height: 48px;
  }
`;

const ButtonIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

// ── Chat Panel ──────────────────────────────────────────────────────────────

const ChatPanel = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 370px;
  max-height: 510px;
  ${noirGlass}
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6),
    0 0 1px rgba(255, 255, 255, 0.05) inset;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.2s ease-out;

  @media (max-width: 480px) {
    bottom: 0;
    right: 0;
    width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }
`;

// ── Header ──────────────────────────────────────────────────────────────────

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid ${COLORS.border};
  background: rgba(30, 30, 30, 0.6);
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderIconWrap = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(233, 137, 115, 0.1);
  border: 1px solid rgba(233, 137, 115, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  letter-spacing: 0.5px;
`;

const HeaderSubtitle = styled.div`
  font-size: 0.68rem;
  color: ${COLORS.textTertiary};
  letter-spacing: 0.3px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${COLORS.primarySalmon};
    background: rgba(255, 255, 255, 0.04);
  }
`;

// ── Messages ────────────────────────────────────────────────────────────────

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: ${COLORS.border} transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border};
    border-radius: 2px;
  }
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 10px 13px;
  border-radius: ${(p) =>
    p.$isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px'};
  background: ${(p) =>
    p.$isUser
      ? `linear-gradient(135deg, ${COLORS.primaryBlueGray}, ${COLORS.primaryBlueGray}dd)`
      : 'rgba(42, 42, 42, 0.8)'};
  ${(p) =>
    !p.$isUser &&
    css`
      border: 1px solid rgba(68, 68, 68, 0.5);
    `}
  color: ${COLORS.textPrimary};
  font-size: 0.85rem;
  line-height: 1.5;
  align-self: ${(p) => (p.$isUser ? 'flex-end' : 'flex-start')};
  word-wrap: break-word;
  animation: ${fadeIn} 0.15s ease-out;
`;

// ── Typing Dots ─────────────────────────────────────────────────────────────

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  padding: 2px 0;
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${COLORS.primarySalmon};
  animation: ${pulse} 1.2s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay};
`;

// ── Input Area ──────────────────────────────────────────────────────────────

const InputArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid ${COLORS.border};
  background: rgba(30, 30, 30, 0.6);
`;

const ChatInput = styled.input`
  flex: 1;
  background: rgba(42, 42, 42, 0.6);
  border: 1px solid ${COLORS.border};
  border-radius: 20px;
  padding: 9px 16px;
  color: ${COLORS.textPrimary};
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    border-color: ${COLORS.primaryBlueGray};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const SendButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${COLORS.primarySalmon};
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: opacity 0.15s, transform 0.15s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    opacity: 0.85;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;
