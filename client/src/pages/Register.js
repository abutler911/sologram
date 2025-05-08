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
  const [formStep, setFormStep] = useState(1); // Track form steps

  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear password error when either password field changes
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  // Handle profile image upload
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setProfileImage(file);

    // Create image preview
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
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  // Move to next form step
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

  // Move to previous form step
  const prevStep = () => {
    setFormStep(1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create form data for submission
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
                    placeholder="Bio"
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
    props.active ? COLORS.primarySalmon : COLORS.border};
  transition: background-color 0.3s ease, transform 0.2s ease;
  transform: ${(props) => (props.active ? "scale(1.2)" : "scale(1)")};
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
  padding: ${(props) =>
    props.type === "password"
      ? "0 16px 0 48px"
      : props.name === "firstName" || props.name === "lastName"
      ? "0 16px"
      : "0 16px 0 48px"};
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

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  background-color: ${COLORS.inputBackground || "#f8f9fa"};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 16px;
  color: ${COLORS.textPrimary};
  resize: vertical;
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

const FieldRow = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 16px;
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
  background-color: ${COLORS.inputBackground || "#f8f9fa"};

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background-color: ${COLORS.buttonHover};
  }
`;

const UploadIcon = styled.div`
  font-size: 40px;
  color: ${COLORS.textTertiary};
  margin-bottom: 12px;
  transition: color 0.2s ease;

  ${DropZone}:hover & {
    color: ${COLORS.primarySalmon};
  }
`;

const UploadText = styled.p`
  font-size: 16px;
  color: ${COLORS.textSecondary};
  margin: 0;
  transition: color 0.2s ease;
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
  border: 3px solid ${COLORS.primarySalmon};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${COLORS.error || COLORS.primarySalmon};
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
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

  &:hover {
    background-color: ${COLORS.errorDark || "#e63a2d"};
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
  border-radius: 8px;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const NextButton = styled(BaseButton)`
  width: 100%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  box-shadow: 0 4px 10px rgba(242, 120, 92, 0.25);
  margin-top: 8px;

  svg {
    margin-left: 8px;
    font-size: 16px;
  }

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(242, 120, 92, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(242, 120, 92, 0.2);
  }
`;

const SubmitButton = styled(BaseButton)`
  flex: 1;
  background-color: ${COLORS.primarySalmon};
  color: white;
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
`;

const BackButton = styled(BaseButton)`
  flex: 0.8;
  background-color: transparent;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};

  svg {
    margin-right: 8px;
    font-size: 14px;
  }

  &:hover {
    background-color: ${COLORS.buttonHover || "#f1f3f5"};
    border-color: ${COLORS.textSecondary};
  }
`;

const ErrorText = styled.p`
  color: ${COLORS.error || "#ff3b30"};
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

export default Register;
