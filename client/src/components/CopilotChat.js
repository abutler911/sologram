// components/CopilotChat.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { COLORS } from '../theme';
import axios from 'axios';

const COPILOT_NAME = 'Co-Pilot'; // ← Change this when you pick a name

const CopilotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey! I'm Andrew's ${COPILOT_NAME}. Ask me anything about his photography, aviation journey, thoughts, or what he's been up to on SoloGram.`,
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
      // Send conversation history (skip the welcome message)
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
          ? "I've hit my message limit — try again in a few minutes!"
          : "Sorry, I'm having trouble right now. Try again in a moment.";
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
      {/* Floating trigger button */}
      {!isOpen && (
        <FloatingButton onClick={() => setIsOpen(true)} aria-label='Open chat'>
          <ButtonIcon>✈</ButtonIcon>
        </FloatingButton>
      )}

      {/* Chat panel */}
      {isOpen && (
        <ChatPanel>
          <ChatHeader>
            <HeaderInfo>
              <HeaderIcon>✈</HeaderIcon>
              <div>
                <HeaderTitle>{COPILOT_NAME}</HeaderTitle>
                <HeaderSubtitle>Ask me about Andrew</HeaderSubtitle>
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
              placeholder='Ask about Andrew...'
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

// ── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

// ── Floating Button ─────────────────────────────────────────────────────────

const FloatingButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}
  );
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: ${float} 3s ease-in-out infinite;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.5);
    animation: none;
  }

  @media (max-width: 480px) {
    bottom: 72px;
    right: 16px;
    width: 50px;
    height: 50px;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.5rem;
  line-height: 1;
`;

// ── Chat Panel ──────────────────────────────────────────────────────────────

const ChatPanel = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 380px;
  max-height: 520px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.25s ease-out;

  @media (max-width: 480px) {
    bottom: 0;
    right: 0;
    width: 100%;
    max-height: 100vh;
    border-radius: 16px 16px 0 0;
  }
`;

// ── Header ──────────────────────────────────────────────────────────────────

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}22
  );
  border-bottom: 1px solid ${COLORS.border};
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderIcon = styled.span`
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${COLORS.primaryBlueGray};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const HeaderSubtitle = styled.div`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
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
  font-size: 1rem;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${COLORS.textPrimary};
    background: ${COLORS.elevatedBackground};
  }
`;

// ── Messages ────────────────────────────────────────────────────────────────

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: ${COLORS.border} transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border};
    border-radius: 2px;
  }
`;

const MessageBubble = styled.div`
  max-width: 82%;
  padding: 10px 14px;
  border-radius: ${(p) =>
    p.$isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
  background: ${(p) =>
    p.$isUser ? COLORS.primaryBlueGray : COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  font-size: 0.88rem;
  line-height: 1.45;
  align-self: ${(p) => (p.$isUser ? 'flex-end' : 'flex-start')};
  word-wrap: break-word;
  animation: ${fadeIn} 0.2s ease-out;
`;

// ── Typing Dots ─────────────────────────────────────────────────────────────

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  padding: 2px 0;
`;

const Dot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${COLORS.textTertiary};
  animation: ${pulse} 1.2s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay};
`;

// ── Input Area ──────────────────────────────────────────────────────────────

const InputArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid ${COLORS.border};
  background: ${COLORS.cardBackground};
`;

const ChatInput = styled.input`
  flex: 1;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 20px;
  padding: 10px 16px;
  color: ${COLORS.textPrimary};
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    border-color: ${COLORS.primaryBlueGray};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const SendButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: ${COLORS.primaryBlueGray};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: background 0.15s, transform 0.15s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: ${COLORS.primaryMint};
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
