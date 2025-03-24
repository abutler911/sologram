// components/common/LoadingSpinner.js
import React from "react";
import styled from "styled-components";

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 126, 95, 0.2);
  border-radius: 50%;
  border-top-color: #ff7e5f;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingSpinner = () => <Spinner />;

export default LoadingSpinner;
