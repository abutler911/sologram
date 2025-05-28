import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FaCamera,
  FaLock,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS } from "../theme";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

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
    setError("");

    const success = await login(email, password);

    if (success) {
      navigate("/");
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <MainLayout noNav noFooter>
      <PageContainer>
        <AuthForm>
          {loading && (
            <LoadingOverlay>
              <Spinner />
            </LoadingOverlay>
          )}

          <LogoContainer>
            <LogoIcon>
              <FaCamera />
            </LogoIcon>
            <LogoText>SoloGram</LogoText>
            <Tagline>One Voice. Infinite Moments.</Tagline>
          </LogoContainer>

          <FormTitle>Welcome back</FormTitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Form onSubmit={handleSubmit}>
            <FormField>
              <InputWrap>
                <IconContainer>
                  <FaEnvelope />
                </IconContainer>
                <StyledInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputWrap>
            </FormField>

            <FormField>
              <InputWrap>
                <IconContainer>
                  <FaLock />
                </IconContainer>
                <StyledInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </TogglePasswordButton>
              </InputWrap>
            </FormField>

            <RememberForgotRow>
              <RememberMeContainer>
                <CustomCheckbox>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <CheckboxMark />
                </CustomCheckbox>
                <label htmlFor="rememberMe">Remember me</label>
              </RememberMeContainer>
              <ForgotPassword>
                <Link to="/forgot-password">Forgot password?</Link>
              </ForgotPassword>
            </RememberForgotRow>

            <SubmitButton type="submit" disabled={loading}>
              <ButtonContent>
                {loading ? "Logging in..." : "Log In"}
              </ButtonContent>
            </SubmitButton>
          </Form>

          <Divider>
            <DividerLine />
            <DividerText>OR</DividerText>
            <DividerLine />
          </Divider>

          <SocialLoginSection>
            <SocialButton type="button">
              <GoogleIcon>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M19.99 10.187c0-.82-.069-1.417-.216-2.037H10.2v3.698h5.62c-.113.92-.725 2.303-2.084 3.233l-.02.124 3.028 2.292.21.02c1.926-1.738 3.037-4.296 3.037-7.33z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.2 19.93c2.753 0 5.064-.886 6.753-2.414l-3.218-2.436c-.862.587-2.017.997-3.536.997a6.126 6.126 0 0 1-5.801-4.141l-.12.01-3.148 2.38-.041.112c1.677 3.256 5.122 5.492 9.11 5.492z"
                    fill="#34A853"
                  />
                  <path
                    d="M4.398 11.936a6.008 6.008 0 0 1-.34-1.971c0-.687.125-1.351.329-1.971l-.006-.132-3.188-2.42-.104.05A9.79 9.79 0 0 0 .001 9.965a9.79 9.79 0 0 0 1.088 4.473l3.309-2.502z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.2 3.853c1.914 0 3.206.809 3.943 1.484l2.878-2.746C15.253.985 12.953 0 10.199 0 6.211 0 2.766 2.237 1.09 5.492l3.297 2.503A6.152 6.152 0 0 1 10.2 3.853z"
                    fill="#EA4335"
                  />
                </svg>
              </GoogleIcon>
              Continue with Google
            </SocialButton>
          </SocialLoginSection>

          <AccountLink>
            Don't have an account? <Link to="/register">Sign up</Link>
          </AccountLink>
        </AuthForm>
      </PageContainer>
    </MainLayout>
  );
};

// Animations
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: ${COLORS.background};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at 20% 20%,
        rgba(233, 137, 115, 0.05) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 80%,
        rgba(136, 178, 204, 0.05) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
`;

const AuthForm = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 40px;
  box-shadow: ${COLORS.shadow};
  animation: ${fadeIn} 0.6s ease-out;
  z-index: 1;

  @media (max-width: 600px) {
    margin: 0;
    max-width: 100%;
    min-height: 100vh;
    border-radius: 0;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  z-index: 10;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${COLORS.border};
  border-top-color: ${COLORS.primaryBlueGray};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`;

const LogoIcon = styled.div`
  color: ${COLORS.primarySalmon};
  font-size: 48px;
  filter: drop-shadow(0 4px 6px rgba(233, 137, 115, 0.3));
  margin-bottom: 8px;
  animation: ${pulse} 3s ease-in-out infinite;
`;

const LogoText = styled.h1`
  font-family: "Mystery Quest", cursive;
  font-size: 40px;
  font-weight: 500;
  color: ${COLORS.textPrimary};
  margin: 0 0 4px;
`;

const Tagline = styled.p`
  color: ${COLORS.primaryMint};
  font-size: 14px;
  margin: 0;
  text-align: center;
  letter-spacing: 0.5px;
`;

const FormTitle = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 24px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: ${COLORS.error};
  font-size: 14px;
  animation: ${shake} 0.5s ease-in-out;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "⚠";
    font-size: 16px;
  }
`;

const Form = styled.form`
  width: 100%;
`;

const FormField = styled.div`
  margin-bottom: 20px;
  width: 100%;
`;

const InputWrap = styled.div`
  position: relative;
  width: 100%;
`;

const IconContainer = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.textTertiary};
  font-size: 16px;
  z-index: 2;
  pointer-events: none;
  transition: color 0.2s ease;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 56px;
  padding: 0 48px 0 48px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  font-size: 16px;
  color: ${COLORS.textPrimary};
  transition: all 0.2s ease;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 3px rgba(136, 178, 204, 0.15);
    background: ${COLORS.cardBackground};
    transform: translateY(-1px);

    & + ${IconContainer} {
      color: ${COLORS.primaryMint};
    }
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.textSecondary};
    background: ${COLORS.elevatedBackground};
  }

  &:focus {
    outline: none;
    color: ${COLORS.primaryMint};
  }
`;

const RememberForgotRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: ${COLORS.textSecondary};

  label {
    cursor: pointer;
    user-select: none;
  }
`;

const CustomCheckbox = styled.div`
  position: relative;
  width: 18px;
  height: 18px;

  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
    margin: 0;
  }
`;

const CheckboxMark = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  transition: all 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    display: none;
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
    border: solid ${COLORS.textPrimary};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  ${CustomCheckbox} input:checked ~ & {
    background: ${COLORS.primaryBlueGray};
    border-color: ${COLORS.primaryBlueGray};
  }

  ${CustomCheckbox} input:checked ~ &::after {
    display: block;
  }

  ${CustomCheckbox}:hover & {
    border-color: ${COLORS.primaryMint};
  }
`;

const ForgotPassword = styled.div`
  a {
    color: ${COLORS.textSecondary};
    font-size: 14px;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.primaryMint};
      text-decoration: underline;
    }
  }
`;

const SubmitButton = styled.button`
  position: relative;
  width: 100%;
  height: 56px;
  background: ${COLORS.primaryBlueGray};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover:not(:disabled) {
    background: ${COLORS.accentBlueGray};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(101, 142, 169, 0.3);

    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(101, 142, 169, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonContent = styled.span`
  position: relative;
  z-index: 1;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 32px 0 24px;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${COLORS.divider};
`;

const DividerText = styled.span`
  padding: 0 16px;
  color: ${COLORS.textTertiary};
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SocialLoginSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const SocialButton = styled.button`
  width: 100%;
  height: 48px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: ${COLORS.textPrimary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS.cardBackground};
    border-color: ${COLORS.primaryMint};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const GoogleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AccountLink = styled.p`
  font-size: 15px;
  color: ${COLORS.textSecondary};
  margin: 0;
  text-align: center;

  a {
    color: ${COLORS.primaryMint};
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    margin-left: 4px;

    &:hover {
      color: ${COLORS.accentMint};
      text-decoration: underline;
    }
  }

  @media (max-width: 600px) {
    margin-top: auto;
    padding-top: 32px;
  }
`;

export default Login;
