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
        <LoginContainer>
          <LogoContainer>
            <LogoIcon>
              <FaCamera />
            </LogoIcon>
            <LogoText>SoloGram</LogoText>
            <Tagline>One Voice. Infinite Moments.</Tagline>
          </LogoContainer>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </SubmitButton>
          </Form>

          <Divider>
            <Line />
            <Or>OR</Or>
            <Line />
          </Divider>

          <RegisterLink>
            Don't have an account? <Link to="/register">Sign up</Link>
          </RegisterLink>
        </LoginContainer>
      </PageWrapper>
    </MainLayout>
  );
};

// Styled Components
const PageWrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.background};
  padding: 1rem;
`;

const LoginContainer = styled.div`
  width: 100%;
  max-width: 350px;
  background-color: ${COLORS.cardBackground};
  border-radius: 1px;
  padding: 2rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
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
`;

const Form = styled.form`
  width: 100%;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 0.75rem;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background-color: ${COLORS.inputBackground || COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
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
  margin: 1.5rem 0;
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
`;

const RegisterLink = styled.p`
  font-size: 0.9rem;
  color: ${COLORS.textSecondary};

  a {
    color: ${COLORS.primarySalmon};
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default Login;
