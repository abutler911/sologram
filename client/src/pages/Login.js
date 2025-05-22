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
      <BackgroundPattern />
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
                  hasValue={email.length > 0}
                />
                <FloatingLabel hasValue={email.length > 0}>Email</FloatingLabel>
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
                  hasValue={password.length > 0}
                />
                <FloatingLabel hasValue={password.length > 0}>
                  Password
                </FloatingLabel>
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
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
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

          <AccountLink>
            Don't have an account? <Link to="/register">Sign up</Link>
          </AccountLink>

          <SocialLoginSection>
            <SocialButton type="button">
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
              Continue with Google
            </SocialButton>
          </SocialLoginSection>
        </AuthForm>
      </PageContainer>
    </MainLayout>
  );
};

// Animations
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const BackgroundPattern = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
`;

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: linear-gradient(
    135deg,
    ${COLORS.background} 0%,
    rgba(134, 227, 206, 0.05) 100%
  );
`;

const AuthForm = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.5s ease-out;

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
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  z-index: 10;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${COLORS.primarySalmon};
  border-top-color: transparent;
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
  filter: drop-shadow(0 4px 6px rgba(242, 120, 92, 0.25));
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const LogoText = styled.h1`
  font-family: "Mystery Quest", cursive;
  font-size: 40px;
  font-weight: 500;
  color: ${COLORS.textPrimary};
  margin: 8px 0 4px;
`;

const Tagline = styled.p`
  color: ${COLORS.primaryMint};
  font-size: 14px;
  margin: 4px 0 0;
  text-align: center;
  letter-spacing: 0.5px;
`;

const FormTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 24px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: ${COLORS.error || "#ff3b30"};
  font-size: 14px;
  animation: ${shake} 0.5s ease-in-out;
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
  background-color: ${COLORS.inputBackground || "#f8f9fa"};
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 16px;
  color: ${COLORS.textPrimary};
  transition: all 0.2s ease;

  &::placeholder {
    color: transparent;
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 4px rgba(134, 227, 206, 0.15);
    transform: translateY(-1px);
    background-color: white;
  }

  &:focus
    + ${FloatingLabel},
    ${(props) => props.hasValue && `+ ${FloatingLabel}`} {
    top: 8px;
    font-size: 12px;
    color: ${COLORS.primaryMint};
  }

  &:focus ~ ${IconContainer} {
    color: ${COLORS.primaryMint};
  }
`;

const FloatingLabel = styled.label`
  position: absolute;
  left: 48px;
  top: ${(props) => (props.hasValue ? "8px" : "50%")};
  transform: translateY(${(props) => (props.hasValue ? "0" : "-50%")});
  font-size: ${(props) => (props.hasValue ? "12px" : "16px")};
  color: ${(props) =>
    props.hasValue ? COLORS.primaryMint : COLORS.textTertiary};
  transition: all 0.2s ease;
  pointer-events: none;
  background-color: transparent;
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
  padding: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: ${COLORS.textSecondary};
  }

  &:focus {
    outline: none;
  }
`;

const RememberForgotRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: ${COLORS.textSecondary};

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: ${COLORS.primarySalmon};
    cursor: pointer;
  }

  label {
    cursor: pointer;
    user-select: none;
  }
`;

const ForgotPassword = styled.div`
  a {
    color: ${COLORS.textSecondary};
    font-size: 14px;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.primarySalmon};
      text-decoration: underline;
    }
  }
`;

const SubmitButton = styled.button`
  position: relative;
  width: 100%;
  height: 56px;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(242, 120, 92, 0.3);

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(242, 120, 92, 0.4);

    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(242, 120, 92, 0.3);
  }

  &:disabled {
    opacity: 0.7;
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
  margin: 28px 0 20px;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    ${COLORS.divider},
    transparent
  );
`;

const DividerText = styled.span`
  padding: 0 16px;
  color: ${COLORS.textTertiary};
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AccountLink = styled.p`
  font-size: 15px;
  color: ${COLORS.textSecondary};
  margin: 0 0 24px 0;
  text-align: center;

  a {
    color: ${COLORS.primarySalmon};
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    margin-left: 4px;

    &:hover {
      color: ${COLORS.accentSalmon};
      text-decoration: underline;
    }
  }
`;

const SocialLoginSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SocialButton = styled.button`
  width: 100%;
  height: 48px;
  background: white;
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
    background: ${COLORS.buttonHover || "#f8f9fa"};
    border-color: ${COLORS.textSecondary};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

export default Login;
