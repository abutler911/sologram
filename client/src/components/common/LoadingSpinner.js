// components/common/LoadingSpinner.js
import React from "react";
import styled, { keyframes } from "styled-components";
import { COLORS } from "../../theme";

// Clean rotation animation
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Smooth fade animation for text
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Gentle pulse for the inner dot
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: ${(props) => (props.fullHeight ? "100vh" : "auto")};
  min-height: ${(props) =>
    props.noMinHeight ? "auto" : props.height || "200px"};
  padding: ${(props) => (props.noMinHeight ? "0" : "2rem")};
  background-color: ${(props) =>
    props.overlay ? "rgba(248, 245, 240, 0.9)" : "transparent"};
  backdrop-filter: ${(props) => (props.overlay ? "blur(8px)" : "none")};
  position: ${(props) => (props.overlay ? "fixed" : "relative")};
  top: ${(props) => (props.overlay ? "0" : "auto")};
  left: ${(props) => (props.overlay ? "0" : "auto")};
  right: ${(props) => (props.overlay ? "0" : "auto")};
  bottom: ${(props) => (props.overlay ? "0" : "auto")};
  z-index: ${(props) => (props.overlay ? "1000" : "1")};
`;

const SpinnerContainer = styled.div`
  position: relative;
  width: ${(props) => props.size || "50px"};
  height: ${(props) => props.size || "50px"};
`;

// Outer ring with your theme colors
const SpinnerRing = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid ${COLORS.elevatedBackground};
  border-top: 3px solid ${COLORS.primarySalmon};
  border-right: 3px solid ${COLORS.primaryMint};
  border-bottom: 3px solid ${COLORS.primaryBlueGray};
  animation: ${rotate} ${(props) => props.speed || "1.2s"} linear infinite;
  position: relative;
`;

// Inner dot that pulses
const SpinnerDot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: ${(props) => props.color || COLORS.primarySalmon};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ${pulse} 1.5s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(233, 137, 115, 0.3);
`;

// Clean, minimal text
const SpinnerText = styled.div`
  margin-top: 16px;
  color: ${COLORS.textSecondary};
  font-size: ${(props) => props.textSize || "0.875rem"};
  font-weight: 500;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
`;

// Optional dots that appear after the text for a modern loading effect
const LoadingDots = styled.div`
  display: inline-block;
  margin-left: 4px;

  &::after {
    content: "";
    animation: ${keyframes`
      0%, 20% { content: ''; }
      25%, 40% { content: '.'; }
      45%, 60% { content: '..'; }
      65%, 80% { content: '...'; }
      85%, 100% { content: ''; }
    `} 1.5s infinite;
  }
`;

const LoadingSpinner = ({
  size = "50px",
  speed = "1.2s",
  text = "Loading",
  overlay = false,
  fullHeight = false,
  height = "200px",
  textSize = "0.875rem",
  noMinHeight = false,
  color,
  showDots = true,
}) => {
  return (
    <SpinnerWrapper
      overlay={overlay}
      fullHeight={fullHeight}
      height={height}
      noMinHeight={noMinHeight}
    >
      <SpinnerContainer size={size}>
        <SpinnerRing size={size} speed={speed} />
        <SpinnerDot color={color} />
      </SpinnerContainer>
      {text && (
        <SpinnerText textSize={textSize}>
          {text}
          {showDots && <LoadingDots />}
        </SpinnerText>
      )}
    </SpinnerWrapper>
  );
};

export default LoadingSpinner;
