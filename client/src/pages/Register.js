import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FaCamera,
  FaUser,
  FaLock,
  FaChevronRight,
  FaChevronLeft,
  FaImage,
  FaTimes,
  FaEnvelope,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS } from "../theme";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [formStep, setFormStep] = useState(1);

  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setProfileImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const nextStep = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setFormStep(2);
  };

  const prevStep = () => {
    setFormStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const registerFormData = new FormData();
    registerFormData.append("firstName", formData.firstName);
    registerFormData.append("lastName", formData.lastName);
    registerFormData.append("username", formData.username);
    registerFormData.append("email", formData.email);
    registerFormData.append("password", formData.password);
    registerFormData.append("bio", formData.bio);

    if (profileImage) {
      registerFormData.append("profileImage", profileImage);
    }

    const success = await register(registerFormData);

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

          <StepIndicator>
            <StepDot active={formStep >= 1} />
            <StepDot active={formStep >= 2} />
          </StepIndicator>

          <FormTitle>
            {formStep === 1 ? "Create your account" : "Complete your profile"}
          </FormTitle>

          <Form onSubmit={handleSubmit}>
            {formStep === 1 ? (
              <>
                <FormField>
                  <InputWrap>
                    <IconContainer>
                      <FaUser />
                    </IconContainer>
                    <StyledInput
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </InputWrap>
                </FormField>

                <FormField>
                  <InputWrap>
                    <IconContainer>
                      <FaEnvelope />
                    </IconContainer>
                    <StyledInput
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
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
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </InputWrap>
                  {passwordError && <ErrorText>{passwordError}</ErrorText>}
                </FormField>

                <NextButton type="button" onClick={nextStep}>
                  Next <FaChevronRight />
                </NextButton>
              </>
            ) : (
              <>
                <FieldRow>
                  <FormField>
                    <StyledInput
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </FormField>

                  <FormField>
                    <StyledInput
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </FormField>
                </FieldRow>

                <FormField>
                  <StyledTextArea
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                  />
                </FormField>

                <ProfileUploadSection>
                  <ProfileLabel>Profile Picture</ProfileLabel>

                  {imagePreview ? (
                    <ProfilePreviewWrapper>
                      <ProfilePreview
                        src={imagePreview}
                        alt="Profile preview"
                      />
                      <RemoveButton
                        type="button"
                        onClick={() => {
                          setProfileImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <FaTimes />
                      </RemoveButton>
                    </ProfilePreviewWrapper>
                  ) : (
                    <DropZone {...getRootProps()}>
                      <input {...getInputProps()} />
                      <UploadIcon>
                        <FaImage />
                      </UploadIcon>
                      <UploadText>Upload Image</UploadText>
                      <UploadSubtext>JPG, PNG up to 5MB</UploadSubtext>
                    </DropZone>
                  )}
                </ProfileUploadSection>

                <ButtonRow>
                  <BackButton type="button" onClick={prevStep}>
                    <FaChevronLeft /> Back
                  </BackButton>
                  <SubmitButton type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Sign Up"}
                  </SubmitButton>
                </ButtonRow>
              </>
            )}
          </Form>

          <Divider>
            <DividerLine />
            <DividerText>OR</DividerText>
            <DividerLine />
          </Divider>

          <AccountLink>
            Have an account? <Link to="/login">Log In</Link>
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
  padding: 20px;
  background: ${COLORS.background};
`;

const AuthForm = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 40px;
  box-shadow: ${COLORS.shadow};

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
  filter: drop-shadow(0 4px 6px rgba(233, 137, 115, 0.3));
  margin-bottom: 8px;
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

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const StepDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primaryBlueGray : COLORS.border};
  transition: background-color 0.3s ease, transform 0.2s ease;
  transform: ${(props) => (props.active ? "scale(1.2)" : "scale(1)")};
`;

const FormTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 32px;
  text-align: center;
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
  padding: ${(props) =>
    props.name === "firstName" || props.name === "lastName"
      ? "0 16px"
      : "0 16px 0 48px"};
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

    & + ${IconContainer} {
      color: ${COLORS.primaryMint};
    }
  }
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  font-size: 16px;
  color: ${COLORS.textPrimary};
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 3px rgba(136, 178, 204, 0.15);
    background: ${COLORS.cardBackground};
  }
`;

const FieldRow = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const ProfileUploadSection = styled.div`
  width: 100%;
  margin: 24px 0 32px;
`;

const ProfileLabel = styled.p`
  font-size: 16px;
  color: ${COLORS.textSecondary};
  margin-bottom: 12px;
  font-weight: 500;
`;

const DropZone = styled.div`
  border: 2px dashed ${COLORS.border};
  border-radius: 12px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${COLORS.elevatedBackground};

  &:hover {
    border-color: ${COLORS.primaryMint};
    background: ${COLORS.cardBackground};
  }
`;

const UploadIcon = styled.div`
  font-size: 40px;
  color: ${COLORS.textTertiary};
  margin-bottom: 12px;
  transition: color 0.2s ease;

  ${DropZone}:hover & {
    color: ${COLORS.primaryMint};
  }
`;

const UploadText = styled.p`
  font-size: 16px;
  color: ${COLORS.textSecondary};
  margin: 0 0 4px 0;
  font-weight: 500;
`;

const UploadSubtext = styled.p`
  font-size: 12px;
  color: ${COLORS.textTertiary};
  margin: 0;
`;

const ProfilePreviewWrapper = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto;
`;

const ProfilePreview = styled.img`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${COLORS.primaryBlueGray};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background: ${COLORS.error};
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

  &:hover {
    background: #ff5555;
    transform: scale(1.1);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: 480px) {
    flex-direction: row;
  }
`;

const BaseButton = styled.button`
  border: none;
  border-radius: 12px;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const NextButton = styled(BaseButton)`
  width: 100%;
  background: ${COLORS.primaryBlueGray};
  color: ${COLORS.textPrimary};
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: ${COLORS.accentBlueGray};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(101, 142, 169, 0.3);
  }
`;

const SubmitButton = styled(BaseButton)`
  flex: 1;
  background: ${COLORS.primarySalmon};
  color: ${COLORS.textPrimary};

  &:hover:not(:disabled) {
    background: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(233, 137, 115, 0.3);
  }
`;

const BackButton = styled(BaseButton)`
  flex: 0.8;
  background: transparent;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};

  &:hover {
    background: ${COLORS.elevatedBackground};
    border-color: ${COLORS.textSecondary};
  }
`;

const ErrorText = styled.p`
  color: ${COLORS.error};
  font-size: 14px;
  margin: 8px 0 0 2px;
  font-weight: 500;
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
  background: ${COLORS.divider};
`;

const DividerText = styled.span`
  padding: 0 16px;
  color: ${COLORS.textTertiary};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AccountLink = styled.p`
  font-size: 16px;
  color: ${COLORS.textSecondary};
  margin: 0;
  text-align: center;

  a {
    color: ${COLORS.primaryMint};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
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

export default Register;
