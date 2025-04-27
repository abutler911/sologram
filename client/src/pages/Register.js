import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FaCamera,
  FaUser,
  FaLock,
  FaEnvelope,
  FaUpload,
  FaChevronRight,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import { COLORS, THEME } from "../theme"; // Import the theme

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
    setFormStep(2);
  };

  // Move to previous form step
  const prevStep = () => {
    setFormStep(1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

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
        <BrandSidebar>
          <SidebarContent>
            <LogoContainer>
              <FaCamera />
              <LogoText>SoloGram</LogoText>
            </LogoContainer>
            <Tagline>One Voice. Infinite Moments.</Tagline>
            <FeatureList>
              <FeatureItem>
                <FeatureIcon>✓</FeatureIcon>
                <FeatureText>Connect with like-minded individuals</FeatureText>
              </FeatureItem>
              <FeatureItem>
                <FeatureIcon>✓</FeatureIcon>
                <FeatureText>Share your adventures</FeatureText>
              </FeatureItem>
              <FeatureItem>
                <FeatureIcon>✓</FeatureIcon>
                <FeatureText>Build your personal brand</FeatureText>
              </FeatureItem>
            </FeatureList>
          </SidebarContent>
        </BrandSidebar>

        <FormContainer>
          <FormProgressBar>
            <ProgressStep active={formStep >= 1}>1</ProgressStep>
            <ProgressLine active={formStep >= 2} />
            <ProgressStep active={formStep >= 2}>2</ProgressStep>
          </FormProgressBar>

          <FormTitle>
            {formStep === 1 ? "Create your account" : "Complete your profile"}
          </FormTitle>

          <Form onSubmit={handleSubmit}>
            {formStep === 1 ? (
              <>
                <FormGroup>
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
                </FormGroup>

                <FormGroup>
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
                </FormGroup>

                <FormGroup>
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
                </FormGroup>

                <FormGroup>
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
                  {passwordError && <ErrorText>{passwordError}</ErrorText>}
                </FormGroup>

                <NextButton type="button" onClick={nextStep}>
                  Continue <FaChevronRight />
                </NextButton>
              </>
            ) : (
              <>
                <TwoColumnGrid>
                  <FormGroup>
                    <InputIcon>
                      <FaUser />
                    </InputIcon>
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
                    <InputIcon>
                      <FaUser />
                    </InputIcon>
                    <Input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </TwoColumnGrid>

                <FormGroup>
                  <Label>About You</Label>
                  <Textarea
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Profile Image</Label>
                  {imagePreview ? (
                    <ProfileImageContainer>
                      <ProfileImagePreview>
                        <img src={imagePreview} alt="Profile preview" />
                        <RemoveButton
                          type="button"
                          onClick={() => {
                            setProfileImage(null);
                            setImagePreview(null);
                          }}
                        >
                          Remove
                        </RemoveButton>
                      </ProfileImagePreview>
                    </ProfileImageContainer>
                  ) : (
                    <DropzoneContainer {...getRootProps()}>
                      <input {...getInputProps()} />
                      <FaUpload />
                      <p>Click or drag to upload profile image</p>
                    </DropzoneContainer>
                  )}
                </FormGroup>

                <ButtonGroup>
                  <BackButton type="button" onClick={prevStep}>
                    Back
                  </BackButton>
                  <SubmitButton type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Complete Registration"}
                  </SubmitButton>
                </ButtonGroup>
              </>
            )}
          </Form>

          <LoginLink>
            Already have an account? <Link to="/login">Login</Link>
          </LoginLink>
        </FormContainer>
      </RegisterContainer>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RegisterContainer = styled.div`
  display: flex;
  width: 90%;
  max-width: 1000px;
  min-height: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    flex-direction: column;
    width: 95%;
    min-height: auto;
  }
`;

const BrandSidebar = styled.div`
  flex: 0 0 40%;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryTeal},
    ${COLORS.primaryBlue}
  );
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="none" width="100" height="100"/><path d="M0,0L100,100" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><path d="M100,0L0,100" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></svg>');
    background-size: 20px 20px;
    opacity: 0.2;
  }

  @media (max-width: 768px) {
    flex: 0 0 auto;
    padding: 2rem 1.5rem;
  }
`;

const SidebarContent = styled.div`
  padding: 3rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 3rem 0 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
`;

const FeatureIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  margin-right: 1rem;
  color: white;
  font-weight: bold;
`;

const FeatureText = styled.span`
  font-size: 1rem;
`;

const FormContainer = styled.div`
  flex: 1;
  background-color: ${COLORS.cardBackground};
  padding: 3rem;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;

  svg {
    font-size: 2.5rem;
    margin-right: 0.75rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
`;

const Tagline = styled.p`
  font-size: 1.125rem;
  font-style: italic;
  margin-bottom: 2rem;
  opacity: 0.9;
`;

const FormTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 1.75rem;
  margin-bottom: 2rem;
  font-weight: 600;
`;

const Form = styled.form`
  margin-bottom: 1.5rem;
  flex: 1;
`;

const FormProgressBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
`;

const ProgressStep = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primaryTeal : COLORS.elevatedBackground};
  color: ${(props) =>
    props.active ? COLORS.textPrimary : COLORS.textTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s ease;
`;

const ProgressLine = styled.div`
  flex: 1;
  height: 4px;
  background-color: ${(props) =>
    props.active ? COLORS.primaryTeal : COLORS.elevatedBackground};
  margin: 0 10px;
  transition: all 0.3s ease;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 2.75rem;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  font-size: 1rem;
  color: ${COLORS.textPrimary};
  transition: all 0.3s ease;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryTeal};
    box-shadow: 0 0 0 2px ${COLORS.primaryTeal}30;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  font-size: 1rem;
  color: ${COLORS.textPrimary};
  resize: vertical;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryTeal};
    box-shadow: 0 0 0 2px ${COLORS.primaryTeal}30;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.textTertiary};
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${COLORS.textSecondary};
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${COLORS.border};
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: ${COLORS.elevatedBackground};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${COLORS.primaryTeal};
  }

  svg {
    color: ${COLORS.textTertiary};
    font-size: 2rem;
    margin-bottom: 0.75rem;
    transition: color 0.3s;
  }

  &:hover svg {
    color: ${COLORS.primaryTeal};
  }

  p {
    color: ${COLORS.textSecondary};
    margin: 0;
  }
`;

const ProfileImageContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const ProfileImagePreview = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid ${COLORS.primaryTeal};
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: ${COLORS.textPrimary};
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
    color: ${COLORS.accentTeal};
  }
`;

const ErrorText = styled.p`
  color: ${COLORS.error};
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const BaseButton = styled.button`
  border: none;
  border-radius: 4px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(BaseButton)`
  background-color: ${COLORS.primaryTeal};
  color: ${COLORS.textPrimary};
  flex: 1;

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentTeal};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const NextButton = styled(BaseButton)`
  background-color: ${COLORS.primaryTeal};
  color: ${COLORS.textPrimary};
  width: 100%;

  svg {
    margin-left: 0.5rem;
  }

  &:hover {
    background-color: ${COLORS.accentTeal};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active {
    transform: translateY(0);
  }
`;

const BackButton = styled(BaseButton)`
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.border};

  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const LoginLink = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
  margin-top: 1.5rem;

  a {
    color: ${COLORS.accentTeal};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.primaryTeal};
      text-decoration: underline;
    }
  }
`;

export default Register;
