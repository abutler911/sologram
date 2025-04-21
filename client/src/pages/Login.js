import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaCamera, FaLock, FaEnvelope } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS, THEME } from "../theme"; // Import your theme

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
              <FaCamera />
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
              </FormGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
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

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1.5rem;
`;

const FormContainer = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 4px 20px ${COLORS.shadow};
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;

  @media (max-width: 500px) {
    padding: 2rem 1.5rem;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: ${COLORS.primaryPurple};

  svg {
    font-size: 2.5rem;
    margin-right: 0.75rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const Tagline = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-bottom: 2rem;
`;

const FormTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.textTertiary};
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 2.75rem;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  font-size: 1rem;
  color: ${COLORS.textPrimary};
  transition: border-color 0.3s, box-shadow 0.3s;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 2px ${COLORS.primaryPurple}20;
  }

  @media (max-width: 500px) {
    padding: 1.1rem 1rem 1.1rem 2.75rem;
    font-size: 1.05rem;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: ${COLORS.primaryPurple};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #4527a0; /* Darker purple on hover */
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${COLORS.divider};
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 500px) {
    padding: 1.1rem;
    font-size: 1.05rem;
  }
`;

const AdminNoteText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${COLORS.textTertiary};
  font-style: italic;
`;

export default Login;
