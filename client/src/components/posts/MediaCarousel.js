// components/posts/MediaCarousel.js
import React, { useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { getTransformedImageUrl } from '../../utils/cloudinary';
import authorImg from '../../assets/andy.jpg';

const AUTHOR_IMAGE = authorImg;
const AUTHOR_NAME = 'Andrew Butler';
const SALMON = '#e87c5a';

const MediaCarousel = ({
  media = [],
  formattedDate,
  postTitle,
  onDoubleTapLike,
  isAuthenticated,
}) => {
  const [currentIndex, setIndex] = useState(0);
  const [isDoubleTapLiking, setDTLike] = useState(false);
  const mediaCount = media.length;

  const handleDoubleTap = useCallback(() => {
    if (!isAuthenticated) return;
    onDoubleTapLike?.();
    setDTLike(true);
    setTimeout(() => setDTLike(false), 900);
  }, [isAuthenticated, onDoubleTapLike]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setIndex((c) => Math.min(c + 1, mediaCount - 1)),
    onSwipedRight: () => setIndex((c) => Math.max(c - 1, 0)),
    trackMouse: true,
  });

  return (
    <Frame onDoubleClick={handleDoubleTap} {...swipeHandlers}>
      <Track style={{ transform: 'translateX(-' + currentIndex * 100 + '%)' }}>
        {media.map((m, i) => (
          <Slide key={m._id || i}>
            {m.mediaType === 'video' ? (
              <Vid src={m.mediaUrl} controls preload='metadata' />
            ) : (
              <Img
                src={getTransformedImageUrl(m.mediaUrl, {
                  width: 1080,
                  height: 1350,
                  crop: 'fill',
                  quality: 'auto',
                  format: 'auto',
                })}
                loading={i === 0 ? 'eager' : 'lazy'}
                alt={postTitle || 'Sologram post'}
              />
            )}
          </Slide>
        ))}
      </Track>

      <GrainOverlay />
      <BottomScrim />

      {mediaCount > 1 && (
        <Dots>
          {media.map((_, i) => (
            <Dot key={i} $active={i === currentIndex} />
          ))}
        </Dots>
      )}

      {mediaCount > 1 && (
        <MediaIndex>
          {String(currentIndex + 1).padStart(2, '0')} /{' '}
          {String(mediaCount).padStart(2, '0')}
        </MediaIndex>
      )}

      <AuthorOverlay>
        <AvatarWrap>
          <Avatar src={AUTHOR_IMAGE} alt={AUTHOR_NAME} />
        </AvatarWrap>
        <AuthorMeta>
          <AuthorSig>{AUTHOR_NAME}</AuthorSig>
          <AuthorDate>{formattedDate}</AuthorDate>
        </AuthorMeta>
      </AuthorOverlay>

      {mediaCount > 1 && (
        <>
          {currentIndex > 0 && (
            <NavBtn
              $side='left'
              onClick={() => setIndex((c) => c - 1)}
              aria-label='Previous'
            >
              <FaChevronLeft />
            </NavBtn>
          )}
          {currentIndex < mediaCount - 1 && (
            <NavBtn
              $side='right'
              onClick={() => setIndex((c) => c + 1)}
              aria-label='Next'
            >
              <FaChevronRight />
            </NavBtn>
          )}
        </>
      )}

      {isDoubleTapLiking && (
        <>
          <Ripple />
          <BigHeart>
            <FaHeart />
          </BigHeart>
        </>
      )}
    </Frame>
  );
};

export default MediaCarousel;

// Animations

const scaleIn = keyframes`
  0%        { transform: scale(0);    opacity: 0; }
  15%       { transform: scale(1.3);  opacity: 1; }
  30%       { transform: scale(0.95);             }
  45%, 80%  { transform: scale(1);    opacity: 1; }
  100%      { transform: scale(0);    opacity: 0; }
`;

const rippleOut = keyframes`
  from { transform: translate(-50%,-50%) scale(0.4); opacity: 0.9; }
  to   { transform: translate(-50%,-50%) scale(3.2); opacity: 0;   }
`;

// Styled Components

const Frame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #000;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
`;

const Track = styled.div`
  display: flex;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
`;

const Slide = styled.div`
  flex: 0 0 100%;
  height: 100%;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(0.88) contrast(1.04);
  transition: filter 0.4s ease;
`;

const Vid = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const GrainOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
  mix-blend-mode: overlay;
`;

const BottomScrim = styled.div`
  position: absolute;
  inset: auto 0 0 0;
  height: 52%;
  background: linear-gradient(
    to top,
    rgba(10, 10, 11, 0.76) 0%,
    rgba(10, 10, 11, 0.32) 48%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 3;
`;

const Dots = styled.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  z-index: 5;
`;

const Dot = styled.div`
  height: 3px;
  border-radius: 2px;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.35)')};
  width: ${(p) => (p.$active ? '22px' : '3px')};
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease;
`;

const MediaIndex = styled.span`
  position: absolute;
  top: 15px;
  right: 16px;
  z-index: 5;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
`;

const AuthorOverlay = styled.div`
  position: absolute;
  bottom: 20px;
  left: 18px;
  right: 56px;
  display: flex;
  align-items: flex-end;
  gap: 11px;
  z-index: 5;
`;

const AvatarWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  filter: none !important;
`;

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const AuthorSig = styled.span`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 300;
  font-size: 1.55rem;
  color: #fff;
  line-height: 1;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AuthorDate = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.52);
  text-transform: uppercase;
`;

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(10, 10, 11, 0.44);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 4;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: rgba(10, 10, 11, 0.7);
    transform: translateY(-50%) scale(1.08);
  }
`;

const Ripple = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border: 2px solid ${SALMON};
  border-radius: 50%;
  pointer-events: none;
  z-index: 6;
  animation: ${rippleOut} 0.75s ease-out forwards;
`;

const BigHeart = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${SALMON};
  font-size: 88px;
  filter: drop-shadow(0 0 24px ${SALMON}99);
  pointer-events: none;
  z-index: 6;
  animation: ${scaleIn} 0.8s ease forwards;
`;
