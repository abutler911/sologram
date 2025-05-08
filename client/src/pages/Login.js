import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaCamera, FaLock, FaEnvelope } from "react-icons/fa";
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
      <PageContainer>
        <AuthForm>
          <LogoContainer>
            <LogoIcon>
              <FaCamera />
            </LogoIcon>
            <LogoText>SoloGram</LogoText>
            <Tagline>One Voice. Infinite Moments.</Tagline>
          </LogoContainer>

          <FormTitle>Welcome back</FormTitle>

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
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </InputWrap>
            </FormField>

            <ForgotPassword>
              <Link to="/forgot-password">Forgot password?</Link>
            </ForgotPassword>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
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
        </AuthForm>
      </PageContainer>
    </MainLayout>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: ${COLORS.background};
`;

const AuthForm = styled.div`
  width: 100%;
  max-width: 480px;
  margin: 0 16px;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

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
  font-size: 20px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 24px;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
`;

const FormField = styled.div`
  margin-bottom: 16px;
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
`;

const StyledInput = styled.input`
  width: 100%;
  height: 56px;
  padding: 0 16px 0 48px;
  background-color: ${COLORS.inputBackground || "#f8f9fa"};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 16px;
  color: ${COLORS.textPrimary};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 2px rgba(134, 227, 206, 0.15);
  }
`;

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: 24px;

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
  width: 100%;
  height: 56px;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(242, 120, 92, 0.25);

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(242, 120, 92, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(242, 120, 92, 0.2);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 32px 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${COLORS.divider};
`;

const DividerText = styled.span`
  padding: 0 16px;
  color: ${COLORS.textTertiary};
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
`;

const AccountLink = styled.p`
  font-size: 16px;
  color: ${COLORS.textSecondary};
  margin: 0;
  text-align: center;

  a {
    color: ${COLORS.primarySalmon};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
    margin-left: 4px;

    &:hover {
      color: ${COLORS.accentSalmon};
      text-decoration: underline;
    }
  }

  @media (max-width: 600px) {
    margin-top: auto;
    padding-top: 32px;
  }
`;

export default Login;
