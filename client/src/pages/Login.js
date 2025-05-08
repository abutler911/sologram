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
      <PageWrapper>
        <AuthContainer>
          <LogoContainer>
            <LogoIcon>
              <FaCamera />
            </LogoIcon>
            <LogoText>SoloGram</LogoText>
            <Tagline>One Voice. Infinite Moments.</Tagline>
          </LogoContainer>

          <FormTitle>Welcome back</FormTitle>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <InputWrapper>
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
              </InputWrapper>
            </FormGroup>

            <FormGroup>
              <InputWrapper>
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
              </InputWrapper>
            </FormGroup>

            <ForgotPassword>
              <Link to="/forgot-password">Forgot password?</Link>
            </ForgotPassword>

            <ActionButton type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </ActionButton>
          </Form>

          <Divider>
            <Line />
            <Or>OR</Or>
            <Line />
          </Divider>

          <ToggleLink>
            Don't have an account? <Link to="/register">Sign up</Link>
          </ToggleLink>
        </AuthContainer>
      </PageWrapper>
    </MainLayout>
  );
};

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.background};
  padding: 2rem 0.5rem;

  @media (max-width: 480px) {
    padding: 1rem 0.25rem;
  }
`;

const AuthContainer = styled.div`
  width: 100%;
  max-width: 450px;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
    max-width: 100%;
    border-radius: 4px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2.5rem;
`;

const LogoIcon = styled.div`
  color: ${COLORS.primarySalmon};
  font-size: 3rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 4px 6px rgba(242, 120, 92, 0.25));
`;

const LogoText = styled.h1`
  font-family: "Mystery Quest", cursive;
  font-size: 2.5rem;
  font-weight: 500;
  color: ${COLORS.textPrimary};
  margin: 0.5rem 0 0.25rem;
`;

const Tagline = styled.p`
  color: ${COLORS.primaryMint};
  font-size: 0.9rem;
  margin-top: 0.25rem;
  text-align: center;
  letter-spacing: 0.5px;
`;

const FormTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 1.75rem;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  width: 100%;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  color: ${COLORS.textTertiary};
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  background-color: ${COLORS.inputBackground || COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 2px rgba(134, 227, 206, 0.2);
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0.85rem 0.75rem 0.85rem 2.5rem;
  }
`;

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: 1.25rem;

  a {
    color: ${COLORS.textSecondary};
    font-size: 0.85rem;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.primarySalmon};
      text-decoration: underline;
    }
  }
`;

const ActionButton = styled.button`
  width: 100%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
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
  margin: 2rem 0;
`;

const Line = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${COLORS.divider};
`;

const Or = styled.span`
  padding: 0 1rem;
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const ToggleLink = styled.p`
  font-size: 0.95rem;
  color: ${COLORS.textSecondary};
  margin: 0;

  a {
    color: ${COLORS.primarySalmon};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
    margin-left: 0.25rem;

    &:hover {
      color: ${COLORS.accentSalmon};
      text-decoration: underline;
    }
  }
`;

export default Login;
