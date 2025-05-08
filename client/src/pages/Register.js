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
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
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
    <PageWrapper>
      <RegisterContainer>
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
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {passwordError && <ErrorText>{passwordError}</ErrorText>}
              </FormGroup>

              <NextButton type="button" onClick={nextStep}>
                Next <FaChevronRight />
              </NextButton>
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
                <SubmitButton type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Sign Up"}
                </SubmitButton>
              </ButtonGroup>
            </>
          )}
        </Form>

        <Divider>
          <Line />
          <Or>OR</Or>
          <Line />
        </Divider>

        <LoginLink>
          Have an account? <Link to="/login">Log In</Link>
        </LoginLink>
      </RegisterContainer>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.background};
  padding: 2rem 1rem;
`;

const RegisterContainer = styled.div`
  width: 100%;
  max-width: 400px;
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
  margin-bottom: 2rem;
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

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const StepDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.border};
  transition: background-color 0.3s ease;
`;

const FormTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 0.75rem;
  width: 100%;
`;

const FormRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
  }
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background-color: ${COLORS.inputBackground || COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  resize: vertical;
  min-height: 80px;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
  }
`;

const ProfileSection = styled.div`
  width: 100%;
  margin: 1rem 0 1.5rem;
`;

const ProfileLabel = styled.p`
  font-size: 0.9rem;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.75rem;
`;

const UploadBox = styled.div`
  border: 1px dashed ${COLORS.border};
  border-radius: 4px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${COLORS.inputBackground || COLORS.elevatedBackground};

  svg {
    font-size: 2rem;
    color: ${COLORS.textTertiary};
    margin-bottom: 0.5rem;
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
`;

const ProfilePreviewContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${COLORS.primarySalmon};
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${COLORS.error || COLORS.primarySalmon};
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.errorDark || COLORS.accentSalmon};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;
`;

const BaseButton = styled.button`
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
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

const SubmitButton = styled(BaseButton)`
  flex: 1;
  background-color: ${COLORS.primarySalmon};
  color: white;

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
  }
`;

const NextButton = styled(BaseButton)`
  width: 100%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  margin-top: 0.5rem;

  svg {
    margin-left: 0.5rem;
  }

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
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
  }
`;

const ErrorText = styled.p`
  color: ${COLORS.error || "#ff3b30"};
  font-size: 0.8rem;
  margin: 0.25rem 0 0;
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

const LoginLink = styled.p`
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

export default Register;
