import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FaCamera, FaLock, FaEnvelope, FaChevronRight } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS } from "../theme";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <MainLayout noNav noFooter>
      <PageWrapper>
        <LoginContainer>
          <FormContainer>
            <LogoContainer>
              <LogoIconWrapper>
                <FaCamera />
              </LogoIconWrapper>
              <LogoText>SoloGram</LogoText>
            </LogoContainer>

            <Tagline>One Voice. Infinite Moments.</Tagline>

            <FormTitle>Login to your account</FormTitle>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <InputIcon>
                  <FaEnvelope />
                </InputIcon>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <InputHighlight />
              </FormGroup>

              <FormGroup>
                <InputIcon>
                  <FaLock />
                </InputIcon>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <InputHighlight />
              </FormGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? (
                  "Logging in..."
                ) : (
                  <>
                    Login
                    <ButtonIcon>
                      <FaChevronRight />
                    </ButtonIcon>
                  </>
                )}
                <ButtonGlow />
              </SubmitButton>
            </Form>
          </FormContainer>
        </LoginContainer>
      </PageWrapper>
    </MainLayout>
  );
};

// Animations
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

// Styled Components
const PageWrapper = styled.div`
  position: relative;
  background: linear-gradient(
    135deg,
    ${COLORS.background},
    ${COLORS.cardBackground} 60%
  );
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  &:before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at top right,
        ${COLORS.primaryMint}30,
        transparent 60%
      ),
      radial-gradient(
        circle at bottom left,
        ${COLORS.primaryBlue}20,
        transparent 60%
      );
    pointer-events: none;
  }
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1.5rem;
`;

const FormContainer = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 10px 20px ${COLORS.shadow}, 0 0 0 1px ${COLORS.border};
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 6px;
    width: 100%;
    background: ${COLORS.primaryMint};
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const LogoIconWrapper = styled.div`
  width: 50px;
  height: 50px;
  background: ${COLORS.primaryMint};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  box-shadow: 0 5px 15px ${COLORS.primaryMint}50;
  animation: ${pulse} 3s infinite ease-in-out;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 12px;
    background: ${COLORS.primaryMint};
    opacity: 0.5;
    filter: blur(5px);
    z-index: -1;
  }

  svg {
    font-size: 1.8rem;
    color: white;
  }
`;

const LogoText = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  color: ${COLORS.accentMint};
  text-shadow: 0 2px 8px ${COLORS.primaryMint}40;
`;

const Tagline = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 1.1rem;
  font-style: italic;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 25%;
    right: 25%;
    height: 2px;
    background: ${COLORS.divider};
  }
`;

const FormTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 600;
`;

const Form = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  position: relative;
  margin-bottom: 1.8rem;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.accentMint};
  z-index: 1;
`;

const InputHighlight = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: ${COLORS.primaryMint};
  transition: width 0.3s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 1.1rem 1rem 1.1rem 2.75rem;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  font-size: 1rem;
  color: ${COLORS.textPrimary};
  transition: all 0.3s;

  &::placeholder {
    color: ${COLORS.textTertiary};
    transition: all 0.3s;
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.accentMint};
    box-shadow: 0 0 0 3px ${COLORS.primaryMint}30;

    & + ${InputHighlight} {
      width: 100%;
    }

    &::placeholder {
      transform: translateY(-10px);
      opacity: 0.7;
    }
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background: ${COLORS.primaryMint};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 1.1rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-3px);
    background: ${COLORS.accentMint};
    box-shadow: 0 7px 14px ${COLORS.primaryMint}50;
  }

  &:disabled {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.textTertiary};
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ButtonIcon = styled.span`
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  transition: transform 0.3s ease;
`;

const ButtonGlow = styled.div`
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(
    circle at center,
    ${COLORS.primaryMint}30,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
  animation: ${glow} 2s infinite ease-in-out;
  pointer-events: none;
`;

export default Login;
