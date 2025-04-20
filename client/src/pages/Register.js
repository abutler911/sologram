import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaCamera, FaUser, FaLock, FaEnvelope, FaUpload } from "react-icons/fa";
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
        <FormContainer>
          <LogoContainer>
            <FaCamera />
            <LogoText>SoloGram</LogoText>
          </LogoContainer>
          <Tagline>One Voice. Infinite Moments.</Tagline>
          <FormTitle>Create an account</FormTitle>

          <Form onSubmit={handleSubmit}>
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

            <FormGroup>
              <Textarea
                name="bio"
                placeholder="Bio (optional)"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <Label>Profile Image (optional)</Label>
              {imagePreview ? (
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
              ) : (
                <DropzoneContainer {...getRootProps()}>
                  <input {...getInputProps()} />
                  <FaUpload />
                  <p>Click or drag to upload profile image</p>
                </DropzoneContainer>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </SubmitButton>
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
const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 2rem;

  @media (max-width: 480px) {
    padding: 2rem 0.5rem;
  }
`;

const FormContainer = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 4px 20px ${COLORS.shadow};
  border: 1px solid ${COLORS.border};
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;

  @media (max-width: 480px) {
    padding: 2rem 1rem;
    border-radius: 0;
    box-shadow: none;
    max-width: none;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  color: ${COLORS.primaryPurple};

  svg {
    font-size: 2.5rem;
    margin-right: 0.75rem;
  }
`;

const FormTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const Form = styled.form`
  margin-bottom: 1.5rem;
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

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 2px ${COLORS.primaryPurple}30;
  }

  @media (max-width: 480px) {
    padding: 1.2rem 1rem 1.2rem 2.75rem;
    font-size: 1.1rem;
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

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 2px ${COLORS.primaryPurple}30;
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
  transition: border-color 0.3s;

  &:hover {
    border-color: ${COLORS.primaryBlue};
  }

  svg {
    color: ${COLORS.textTertiary};
    font-size: 2rem;
    margin-bottom: 0.75rem;
    transition: color 0.3s;
  }

  &:hover svg {
    color: ${COLORS.primaryBlue};
  }

  p {
    color: ${COLORS.textSecondary};
    margin: 0;
  }
`;

const ProfileImagePreview = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid ${COLORS.primaryPurple};
  box-shadow: 0 0 10px ${COLORS.shadow};

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
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
    color: ${COLORS.accentPurple};
  }
`;

const ErrorText = styled.p`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: ${COLORS.primaryGreen};
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.accentGreen};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${COLORS.textTertiary};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoginLink = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};

  a {
    color: ${COLORS.primaryBlue};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${COLORS.accentBlue};
      text-decoration: underline;
    }
  }
`;

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Tagline = styled.p`
  color: ${COLORS.primaryBlue};
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeIn 0.6s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default Register;
