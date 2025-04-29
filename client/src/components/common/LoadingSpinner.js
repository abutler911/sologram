// components/common/LoadingSpinner.js
import React from "react";
import styled, { keyframes } from "styled-components";
import { COLORS } from "../../theme";

// Keyframes for the spin animation
const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

// Keyframes for the pulse animation
const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
`;

// Keyframes for the wave animation for the text
const wave = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
`;

const SpinnerCircle = styled.div`
  width: ${(props) => props.size || "50px"};
  height: ${(props) => props.size || "50px"};
  border-radius: 50%;
  position: relative;
  animation: ${spin} ${(props) => props.speed || "1.2s"} linear infinite;
  &:before,
  &:after {
    content: "";
    position: absolute;
    border-radius: 50%;
  }
  &:before {
    width: 100%;
    height: 100%;
    background: ${(props) =>
      props.color
        ? `conic-gradient(${props.color}, ${COLORS.primaryMint}, ${COLORS.primaryBlueGray}, ${COLORS.primaryKhaki}, ${props.color})`
        : `conic-gradient(${COLORS.primarySalmon}, ${COLORS.primaryMint}, ${COLORS.primaryBlueGray}, ${COLORS.primaryKhaki}, ${COLORS.primarySalmon})`};
    opacity: 0.8;
  }
  &:after {
    top: 15%;
    left: 15%;
    right: 15%;
    bottom: 15%;
    background-color: ${COLORS.cardBackground};
    box-shadow: 0 0 10px ${COLORS.cardBackground};
  }
`;

const InnerCircle = styled.div`
  position: absolute;
  top: 35%;
  left: 35%;
  right: 35%;
  bottom: 35%;
  background: ${(props) => props.color || COLORS.primarySalmon};
  border-radius: 50%;
  z-index: 2;
  animation: ${pulse} 1.5s ease-in-out infinite;
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
    props.overlay ? "rgba(248, 248, 248, 0.7)" : "transparent"};
  backdrop-filter: ${(props) => (props.overlay ? "blur(3px)" : "none")};
  position: ${(props) => (props.overlay ? "fixed" : "relative")};
  top: ${(props) => (props.overlay ? "0" : "auto")};
  left: ${(props) => (props.overlay ? "0" : "auto")};
  right: ${(props) => (props.overlay ? "0" : "auto")};
  bottom: ${(props) => (props.overlay ? "0" : "auto")};
  z-index: ${(props) => (props.overlay ? "1000" : "1")};
`;

// Text that appears below the spinner
const SpinnerText = styled.div`
  margin-top: 20px;
  color: ${COLORS.textSecondary};
  font-size: ${(props) => props.textSize || "1rem"};
  font-weight: 500;
  letter-spacing: 0.5px;
`;

// Individual characters for the wave effect
const AnimatedCharacter = styled.span`
  display: inline-block;
  animation: ${wave} 1.5s ease-in-out infinite;
  animation-delay: ${(props) => props.delay * 0.1}s;
`;

const LoadingSpinner = ({
  size = "50px",
  speed = "1.2s",
  text = "Loading",
  overlay = false,
  fullHeight = false,
  height = "200px",
  textSize = "1rem",
  noMinHeight = false,
  color,
}) => {
  // Only create animated text if text is provided
  const animatedText = text
    ? text.split("").map((char, index) => (
        <AnimatedCharacter key={index} delay={index}>
          {char}
        </AnimatedCharacter>
      ))
    : null;

  return (
    <SpinnerWrapper
      overlay={overlay}
      fullHeight={fullHeight}
      height={height}
      noMinHeight={noMinHeight}
    >
      <SpinnerCircle size={size} speed={speed} color={color}>
        <InnerCircle color={color} />
      </SpinnerCircle>
      {text && <SpinnerText textSize={textSize}>{animatedText}</SpinnerText>}
    </SpinnerWrapper>
  );
};
export default LoadingSpinner;
