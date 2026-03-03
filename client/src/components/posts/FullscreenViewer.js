// components/posts/FullscreenViewer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const FullscreenViewer = ({
  media = [],
  activeIndex = 0,
  onIndexChange,
  onClose,
  title,
}) => {
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef(null);
  const count = media.length;

  const resetTimeout = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShowControls(true);
    timeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetTimeout();
    document.addEventListener('mousemove', resetTimeout);
    document.addEventListener('touchstart', resetTimeout);
    return () => {
      clearTimeout(timeoutRef.current);
      document.removeEventListener('mousemove', resetTimeout);
      document.removeEventListener('touchstart', resetTimeout);
    };
  }, [resetTimeout]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && activeIndex > 0)
        onIndexChange(activeIndex - 1);
      if (e.key === 'ArrowRight' && activeIndex < count - 1)
        onIndexChange(activeIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, count, onClose, onIndexChange]);

  const current = media[activeIndex];
  if (!current) return null;

  return (
    <Overlay onClick={onClose}>
      <Inner onClick={(e) => e.stopPropagation()}>
        {current.mediaType === 'video' ? (
          <Vid src={current.mediaUrl} controls autoPlay />
        ) : (
          <Img src={current.mediaUrl} alt={title || 'Fullscreen'} />
        )}

        <CloseBtn onClick={onClose} $visible={showControls}>
          <FaTimes />
        </CloseBtn>

        {count > 1 && (
          <>
            {activeIndex > 0 && (
              <NavBtn
                $side='left'
                $visible={showControls}
                onClick={() => onIndexChange(activeIndex - 1)}
              >
                <FaChevronLeft />
              </NavBtn>
            )}
            {activeIndex < count - 1 && (
              <NavBtn
                $side='right'
                $visible={showControls}
                onClick={() => onIndexChange(activeIndex + 1)}
              >
                <FaChevronRight />
              </NavBtn>
            )}
          </>
        )}
      </Inner>
    </Overlay>
  );
};

export default FullscreenViewer;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.96);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease;
`;

const Inner = styled.div`
  position: relative;
  width: 96vw;
  height: 96vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Img = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
`;

const Vid = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.3s, background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.3s, background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;
