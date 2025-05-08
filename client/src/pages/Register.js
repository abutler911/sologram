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
      <PageWrapper>
        <AuthContainer>
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
                <FormGroup>
                  <InputWrapper>
                    <InputIcon>
                      <FaUser />
                    </InputIcon>
                    <Input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </InputWrapper>
                </FormGroup>

                <FormGroup>
                  <InputWrapper>
                    <InputIcon>
                      <FaEnvelope />
                    </InputIcon>
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
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
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </InputWrapper>
                  {passwordError && <ErrorText>{passwordError}</ErrorText>}
                </FormGroup>

                <ActionButton type="button" onClick={nextStep}>
                  Next <FaChevronRight />
                </ActionButton>
              </>
            ) : (
              <>
                <FormRow>
                  <FormGroup>
                    <Input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <TextArea
                    name="bio"
                    placeholder="Bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                  />
                </FormGroup>

                <ProfileSection>
                  <ProfileLabel>Profile Picture</ProfileLabel>

                  {imagePreview ? (
                    <ProfilePreviewContainer>
                      <ProfileImage src={imagePreview} alt="Profile preview" />
                      <RemoveImageButton
                        type="button"
                        onClick={() => {
                          setProfileImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <FaTimes />
                      </RemoveImageButton>
                    </ProfilePreviewContainer>
                  ) : (
                    <UploadBox {...getRootProps()}>
                      <input {...getInputProps()} />
                      <FaImage />
                      <UploadText>Upload Image</UploadText>
                    </UploadBox>
                  )}
                </ProfileSection>

                <ButtonGroup>
                  <BackButton type="button" onClick={prevStep}>
                    <FaChevronLeft /> Back
                  </BackButton>
                  <ActionButton type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Sign Up"}
                  </ActionButton>
                </ButtonGroup>
              </>
            )}
          </Form>

          <Divider>
            <Line />
            <Or>OR</Or>
            <Line />
          </Divider>

          <ToggleLink>
            Have an account? <Link to="/login">Log In</Link>
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

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 1.75rem;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
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
  padding: ${(props) =>
    props.hasIcon ? "0.75rem 0.75rem 0.75rem 2.5rem" : "0.75rem"};
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
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background-color: ${COLORS.inputBackground || COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  resize: vertical;
  min-height: 90px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 2px rgba(134, 227, 206, 0.2);
  }
`;

const ProfileSection = styled.div`
  width: 100%;
  margin: 1.5rem 0 2rem;
`;

const ProfileLabel = styled.p`
  font-size: 0.9rem;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.75rem;
  font-weight: 500;
`;

const UploadBox = styled.div`
  border: 2px dashed ${COLORS.border};
  border-radius: 8px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${COLORS.inputBackground || COLORS.elevatedBackground};

  svg {
    font-size: 2.5rem;
    color: ${COLORS.textTertiary};
    margin-bottom: 0.75rem;
    transition: color 0.2s ease;
  }

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background-color: ${COLORS.buttonHover};

    svg {
      color: ${COLORS.primarySalmon};
    }
  }
`;

const UploadText = styled.p`
  font-size: 0.9rem;
  color: ${COLORS.textSecondary};
  margin: 0;
  transition: color 0.2s ease;
`;

const ProfilePreviewContainer = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto;
`;

const ProfileImage = styled.img`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${COLORS.primarySalmon};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${COLORS.error || COLORS.primarySalmon};
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

  &:hover {
    background-color: ${COLORS.errorDark || COLORS.accentSalmon};
    transform: scale(1.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const BaseButton = styled.button`
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ActionButton = styled(BaseButton)`
  flex: 1;
  background-color: ${COLORS.primarySalmon};
  color: white;
  box-shadow: 0 4px 10px rgba(242, 120, 92, 0.25);
  width: 100%;

  svg {
    margin-left: 0.5rem;
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

const BackButton = styled(BaseButton)`
  background-color: transparent;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    background-color: ${COLORS.buttonHover};
    border-color: ${COLORS.textSecondary};
  }
`;

const ErrorText = styled.p`
  color: ${COLORS.error || "#ff3b30"};
  font-size: 0.8rem;
  margin: 0.25rem 0 0 0.25rem;
  font-weight: 500;
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

export default Register;
