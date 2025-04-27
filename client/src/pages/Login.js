import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FaCamera, FaLock, FaEnvelope, FaChevronRight } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS, THEME } from "../theme";

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
                {loading ? "Logging in..." : "Login"}
                {!loading && (
                  <ButtonIcon>
                    <FaChevronRight />
                  </ButtonIcon>
                )}
                <ButtonGlow />
              </SubmitButton>
            </Form>

            <AdminNoteText>
              This login is for site administration only
            </AdminNoteText>
          </FormContainer>
        </LoginContainer>
      </PageWrapper>
    </MainLayout>
  );
};

// Animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
`;

// Styled Components
const PageWrapper = styled.div`
  background: linear-gradient(
    135deg,
    ${COLORS.background},
    ${COLORS.cardBackground}
  );
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at top right,
        ${COLORS.primaryTeal}30,
        transparent 70%
      ),
      radial-gradient(
        circle at bottom left,
        ${COLORS.primaryBlue}20,
        transparent 70%
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

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 1rem;
  }
`;

const FormContainer = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 8px;
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
    width: 100%;
    height: 4px;
    background: ${COLORS.primaryTeal};
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 2rem 1.5rem;
    max-width: 95%;
    border-radius: 8px;
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
  background: ${COLORS.primaryTeal};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  box-shadow: 0 5px 15px ${COLORS.primaryTeal}50;
  animation: ${pulse} 3s infinite ease-in-out;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 12px;
    background: ${COLORS.primaryTeal};
    z-index: -1;
    opacity: 0.5;
    filter: blur(5px);
  }

  svg {
    font-size: 1.8rem;
    color: white;
  }
`;

const LogoText = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  color: ${COLORS.accentTeal};
  text-shadow: 0 2px 8px ${COLORS.primaryTeal}40;
`;

const Tagline = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 1.1rem;
  font-style: italic;
  text-align: center;
  margin-bottom: 2.5rem;
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
  color: ${COLORS.accentTeal};
  z-index: 1;
  transition: all 0.3s ease;
`;

const InputHighlight = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: ${COLORS.primaryTeal};
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
    border-color: ${COLORS.accentTeal};
    box-shadow: 0 0 0 3px ${COLORS.primaryTeal}30;

    & + ${InputHighlight} {
      width: 100%;
    }

    &::placeholder {
      transform: translateY(-10px);
      opacity: 0.7;
    }
  }

  &:focus + ${InputHighlight} {
    width: 100%;
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 1.2rem 1rem 1.2rem 2.75rem;
    font-size: 1.05rem;
    border-radius: 6px;
  }
`;

const ButtonGlow = styled.div`
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(
    circle at center,
    ${COLORS.primaryTeal}30,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
  animation: ${glow} 2s infinite ease-in-out;
  pointer-events: none;
`;

const ButtonIcon = styled.span`
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  transition: transform 0.3s ease;
`;

const SubmitButton = styled.button`
  width: 100%;
  background: ${COLORS.primaryTeal};
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

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: all 0.6s;
  }

  &:hover {
    transform: translateY(-3px);
    background: ${COLORS.accentTeal};
    box-shadow: 0 7px 14px ${COLORS.primaryTeal}50;

    &:before {
      left: 100%;
    }

    ${ButtonIcon} {
      transform: translateX(3px);
    }

    ${ButtonGlow} {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 8px ${COLORS.primaryTeal}30;
  }

  &:disabled {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.textTertiary};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;

    &:before {
      display: none;
    }
  }

  @media (max-width: 768px), screen and (display-mode: standalone) {
    padding: 1.2rem;
    font-size: 1.1rem;
    border-radius: 6px;
  }
`;

const AdminNoteText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${COLORS.textTertiary};
  font-style: italic;
  margin-top: 1.5rem;
  position: relative;

  &:before,
  &:after {
    content: "•";
    margin: 0 8px;
    color: ${COLORS.textTertiary}80;
  }
`;

export default Login;
