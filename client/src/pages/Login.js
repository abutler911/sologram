import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <PageContainer>
      {/* Ambient background glow */}
      <Glow $pos='top-left' $color={COLORS.primarySalmon} />
      <Glow $pos='bottom-right' $color={COLORS.primaryMint} />

      <Card>
        {loading && (
          <LoadingOverlay>
            <Spinner />
          </LoadingOverlay>
        )}

        {/* Logo */}
        <LogoBlock>
          <LogoSig>SoloGram</LogoSig>
          <Tagline>One Voice. Infinite Moments.</Tagline>
        </LogoBlock>

        <FormTitle>Welcome back</FormTitle>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Form onSubmit={handleSubmit}>
          {/* Email */}
          <Field>
            <InputWrap>
              <InputIcon>
                <FaEnvelope />
              </InputIcon>
              <Input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
              />
            </InputWrap>
          </Field>

          {/* Password */}
          <Field>
            <InputWrap>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
              />
              <ToggleBtn
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </ToggleBtn>
            </InputWrap>
          </Field>

          {/* Forgot password */}
          <ForgotRow>
            <ForgotLink to='/forgot-password'>Forgot password?</ForgotLink>
          </ForgotRow>

          <SubmitBtn type='submit' disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </SubmitBtn>
        </Form>

        <FootNote>
          Family member?&nbsp;
          <a href='mailto:andrew@example.com'>Request access</a>
        </FootNote>
      </Card>
    </PageContainer>
  );
};

export default Login;

// ─── Animations ───────────────────────────────────────────────────────────────

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0);  }
  25%       { transform: translateX(-6px); }
  75%       { transform: translateX(6px);  }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1);    }
  50%       { opacity: 0.65; transform: scale(1.1); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: ${COLORS.background};
  position: relative;
  overflow: hidden;
`;

const Glow = styled.div`
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  filter: blur(120px);
  opacity: 0.07;
  animation: ${glow} 6s ease-in-out infinite;
  pointer-events: none;

  ${(p) => p.$pos === 'top-left' && 'top: -160px; left: -160px;'}
  ${(p) =>
    p.$pos === 'bottom-right' &&
    'bottom: -160px; right: -160px; animation-delay: 3s;'}
`;

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 20px;
  padding: 44px 40px 36px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  animation: ${fadeUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  z-index: 1;

  @media (max-width: 520px) {
    max-width: 100%;
    min-height: 100vh;
    border-radius: 0;
    padding: 48px 24px 32px;
    display: flex;
    flex-direction: column;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(18, 18, 18, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  z-index: 20;

  @media (max-width: 520px) {
    border-radius: 0;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${COLORS.border};
  border-top-color: ${COLORS.primarySalmon};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;

// ─── Logo ─────────────────────────────────────────────────────────────────────

const LogoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36px;

  @font-face {
    font-family: 'Autography';
    src: url('/fonts/Autography.woff2') format('woff2');
    font-display: swap;
  }
`;

const LogoSig = styled.h1`
  font-family: 'Autography', cursive;
  font-size: 3.2rem;
  font-weight: 400;
  color: ${COLORS.textPrimary};
  line-height: 1.2;
  margin: 0 0 4px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Tagline = styled.p`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${COLORS.textTertiary};
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin: 0;
`;

// ─── Form ─────────────────────────────────────────────────────────────────────

const FormTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
`;

const ErrorMsg = styled.div`
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.28);
  border-radius: 10px;
  padding: 11px 16px;
  margin-bottom: 20px;
  color: ${COLORS.error};
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: ${shake} 0.4s ease;

  &::before {
    content: '⚠';
    font-size: 0.95rem;
  }
`;

const Form = styled.form`
  width: 100%;
`;

const Field = styled.div`
  margin-bottom: 16px;
`;

const InputWrap = styled.div`
  position: relative;
  width: 100%;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.textTertiary};
  font-size: 0.9rem;
  pointer-events: none;
  z-index: 1;
  transition: color 0.2s;
`;

const Input = styled.input`
  width: 100%;
  height: 52px;
  padding: 0 48px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  font-size: 0.95rem;
  color: ${COLORS.textPrimary};
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}22;
    background: ${COLORS.cardBackground};

    ~ ${InputIcon} {
      color: ${COLORS.primarySalmon};
    }
  }
`;

const ToggleBtn = styled.button`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  &:hover {
    color: ${COLORS.textSecondary};
  }
`;

const ForgotRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
`;

const ForgotLink = styled(Link)`
  font-size: 0.82rem;
  color: ${COLORS.textTertiary};
  text-decoration: none;
  transition: color 0.2s;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  height: 52px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 20px ${COLORS.primarySalmon}44;

  &:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-2px);
    box-shadow: 0 10px 28px ${COLORS.primarySalmon}55;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

// ─── Footer note ──────────────────────────────────────────────────────────────

const FootNote = styled.p`
  font-size: 0.82rem;
  color: ${COLORS.textTertiary};
  text-align: center;
  margin: 24px 0 0;

  a {
    color: ${COLORS.primarySalmon};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
    &:hover {
      color: ${COLORS.accentSalmon};
      text-decoration: underline;
    }
  }

  @media (max-width: 520px) {
    margin-top: auto;
    padding-top: 32px;
  }
`;
