import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaCamera, FaLock, FaEnvelope } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

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
  );
};

const PageWrapper = styled.div`
  background-color: #121212;
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
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
  color: #ff7e5f;

  svg {
    font-size: 2.5rem;
    margin-right: 0.75rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
`;

const Tagline = styled.p`
  color: #aaa;
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-bottom: 2rem;
`;

const FormTitle = styled.h2`
  color: #fff;
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
  color: #aaa;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 2.75rem;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 1rem;
  color: #fff;
  transition: border-color 0.3s, box-shadow 0.3s;

  &::placeholder {
    color: #888;
  }

  &:focus {
    outline: none;
    border-color: #ff7e5f;
    box-shadow: 0 0 0 2px rgba(255, 126, 95, 0.2);
  }

  @media (max-width: 500px) {
    padding: 1.1rem 1rem 1.1rem 2.75rem;
    font-size: 1.05rem;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #ff6347;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #666;
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
  color: #888;
  font-style: italic;
`;

export default Login;
