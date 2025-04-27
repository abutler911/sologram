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
  FaChevronLeft,
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
        <LogoHeader>
          <LogoContainer>
            <FaCamera />
            <LogoText>SoloGram</LogoText>
          </LogoContainer>
        </LogoHeader>

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
                    <FaChevronLeft /> Back
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
  padding: 2rem 1rem;
`;

const RegisterContainer = styled.div`
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px ${COLORS.shadow};
  background-color: ${COLORS.cardBackground};
`;

const LogoHeader = styled.div`
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryBlueGray}
  );
  padding: 1.5rem;
  text-align: center;
  color: white;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    font-size: 2rem;
    margin-right: 0.75rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const FormContainer = styled.div`
  padding: 2rem;
  background-color: ${COLORS.cardBackground};
`;

const FormTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 1.5rem;
  margin-bottom: 2rem;
  font-weight: 600;
  text-align: center;
`;

const Form = styled.form`
  margin-bottom: 1.5rem;
`;

const FormProgressBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

const ProgressStep = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.elevatedBackground};
  color: ${(props) =>
    props.active ? COLORS.cardBackground : COLORS.textTertiary};
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
    props.active ? COLORS.primarySalmon : COLORS.elevatedBackground};
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
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 2px ${COLORS.primaryMint}30;
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
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 2px ${COLORS.primaryMint}30;
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
  border: 2px dashed ${COLORS.primaryKhaki};
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: ${COLORS.elevatedBackground};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${COLORS.primarySalmon};
  }

  svg {
    color: ${COLORS.primaryBlueGray};
    font-size: 2rem;
    margin-bottom: 0.75rem;
    transition: color 0.3s;
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
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
  border: 3px solid ${COLORS.primarySalmon};
  box-shadow: 0 0 20px ${COLORS.shadow};

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
  color: ${COLORS.cardBackground};
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.primarySalmon};
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
  background-color: ${COLORS.primarySalmon};
  color: white;
  flex: 1;

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const NextButton = styled(BaseButton)`
  background-color: ${COLORS.primarySalmon};
  color: white;
  width: 100%;

  svg {
    margin-left: 0.5rem;
  }

  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active {
    transform: translateY(0);
  }
`;

const BackButton = styled(BaseButton)`
  background-color: ${COLORS.primaryMint};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.border};

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    background-color: ${COLORS.accentMint};
  }
`;

const LoginLink = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
  margin-top: 1rem;
  margin-bottom: 0;

  a {
    color: ${COLORS.primaryBlueGray};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.primarySalmon};
      text-decoration: underline;
    }
  }
`;

export default Register;
