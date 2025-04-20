// components/common/LoadingSpinner.js
import React from "react";
import styled, { keyframes } from "styled-components";
import { COLORS } from "../../theme";

// Keyframes for rotation
const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

// Keyframes for gradient animation
const gradientSpin = keyframes`
  0% {
    background: conic-gradient(
      ${COLORS.primaryPurple},
      ${COLORS.primaryBlue},
      ${COLORS.primaryGreen},
      ${COLORS.primaryPurple}
    );
  }
  100% {
    background: conic-gradient(
      ${COLORS.primaryBlue},
      ${COLORS.primaryGreen},
      ${COLORS.primaryPurple},
      ${COLORS.primaryBlue}
    );
  }
`;

// Styled Spinner
const Spinner = styled.div`
  width: ${(props) => props.size || "50px"};
  height: ${(props) => props.size || "50px"};
  animation: ${gradientSpin} ${(props) => props.speed || "2s"} linear infinite,
    ${spin} ${(props) => props.speed || "1s"} linear infinite;
  border-radius: 50%;
  background: conic-gradient(
    ${COLORS.primaryPurple},
    ${COLORS.primaryBlue},
    ${COLORS.primaryGreen},
    ${COLORS.primaryPurple}
  );
  box-shadow: 0 0 10px ${COLORS.primaryPurple}, 0 0 20px ${COLORS.primaryBlue};
`;

// Wrapper for centering
const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${COLORS.background};
`;

const SpinnerText = styled.div`
  margin-top: 10px;
  color: ${COLORS.textSecondary};
  font-size: 16px;
  font-weight: bold;
`;

const LoadingSpinner = () => (
  <SpinnerWrapper>
    <Spinner />
    <SpinnerText>Loading...</SpinnerText>
  </SpinnerWrapper>
);

export default LoadingSpinner;
