import React, { useState, useEffect, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaCamera,
  FaUpload,
  FaPencilAlt,
  FaSave,
  FaSparkles,
  FaHeart,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { COLORS, THEME } from "../theme";

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
      });
      if (user.profileImage) {
        setImagePreview(user.profileImage);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    onDropRejected: () => toast.error("Image is too large. Max size is 5MB."),
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("firstName", formData.firstName);
    data.append("lastName", formData.lastName);
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("bio", formData.bio);
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    try {
      toast.loading("Updating your amazing profile...", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.textPrimary,
          border: `2px solid ${COLORS.primarySalmon}`,
        },
      });

      const success = await updateProfile(data);
      if (success) {
        toast.success("Profile updated successfully! Looking fantastic! ✨", {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.success,
            border: `2px solid ${COLORS.success}`,
          },
          icon: "🎉",
          duration: 5000,
        });
        navigate("/");
      } else {
        toast.error("Profile update failed. Let's try again!", {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.error,
            border: `2px solid ${COLORS.error}`,
          },
          icon: "💔",
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Tech happens!", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.error,
          border: `2px solid ${COLORS.error}`,
        },
        icon: "🤯",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Animated background elements */}
      <BackgroundPattern />
      <FloatingElement
        top="5%"
        left="8%"
        size="120px"
        delay="0s"
        color={COLORS.primarySalmon}
        opacity="0.15"
      />
      <FloatingElement
        top="75%"
        left="85%"
        size="90px"
        delay="2s"
        color={COLORS.primaryMint}
        opacity="0.12"
      />
      <FloatingElement
        top="35%"
        left="92%"
        size="150px"
        delay="1s"
        color={COLORS.primaryKhaki}
        opacity="0.1"
      />
      <FloatingElement
        top="85%"
        left="15%"
        size="100px"
        delay="3s"
        color={COLORS.primaryBlueGray}
        opacity="0.08"
      />

      <Container>
        <ContentCard>
          <ProfileHeader>
            <HeaderBackground />
            <HeaderContent>
              <SparkleIcon>
                <FaSparkles />
              </SparkleIcon>
              <HeaderTitle>Create Your Perfect Profile</HeaderTitle>
              <HeaderSubtitle>Show the world who you are ✨</HeaderSubtitle>
            </HeaderContent>
          </ProfileHeader>

          <ProfileBody>
            <ImageUploadSection>
              {imagePreview ? (
                <ImageContainer>
                  <ProfileAvatar src={imagePreview} alt="Profile Preview" />
                  <ImageBorder />
                  <ImageOverlay>
                    <ChangeButton
                      type="button"
                      onClick={() => {
                        setProfileImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <FaPencilAlt />
                      <span>Change Photo</span>
                    </ChangeButton>
                  </ImageOverlay>
                </ImageContainer>
              ) : (
                <UploadDropzone {...getRootProps()}>
                  <input {...getInputProps()} />
                  <UploadIcon>
                    <FaCamera />
                  </UploadIcon>
                  <UploadText>Add Your Photo</UploadText>
                  <UploadHint>Click or drag to upload</UploadHint>
                </UploadDropzone>
              )}
            </ImageUploadSection>

            <ProfileForm onSubmit={handleSubmit}>
              <FormGrid>
                <InputGroup
                  className={activeField === "firstName" ? "focused" : ""}
                >
                  <InputLabel>First Name</InputLabel>
                  <InputContainer>
                    <InputIcon>
                      <FaUser />
                    </InputIcon>
                    <StyledInput
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onFocus={() => setActiveField("firstName")}
                      onBlur={() => setActiveField("")}
                      placeholder="Enter your first name"
                      required
                    />
                  </InputContainer>
                </InputGroup>

                <InputGroup
                  className={activeField === "lastName" ? "focused" : ""}
                >
                  <InputLabel>Last Name</InputLabel>
                  <InputContainer>
                    <InputIcon>
                      <FaUser />
                    </InputIcon>
                    <StyledInput
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onFocus={() => setActiveField("lastName")}
                      onBlur={() => setActiveField("")}
                      placeholder="Enter your last name"
                    />
                  </InputContainer>
                </InputGroup>
              </FormGrid>

              <InputGroup
                className={activeField === "username" ? "focused" : ""}
              >
                <InputLabel>Username</InputLabel>
                <InputContainer>
                  <InputIcon>
                    <FaUser />
                  </InputIcon>
                  <StyledInput
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setActiveField("username")}
                    onBlur={() => setActiveField("")}
                    placeholder="Choose a unique username"
                    required
                  />
                </InputContainer>
              </InputGroup>

              <InputGroup className={activeField === "email" ? "focused" : ""}>
                <InputLabel>Email Address</InputLabel>
                <InputContainer>
                  <InputIcon>
                    <FaEnvelope />
                  </InputIcon>
                  <StyledInput
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setActiveField("email")}
                    onBlur={() => setActiveField("")}
                    placeholder="your@email.com"
                    required
                  />
                </InputContainer>
              </InputGroup>

              <InputGroup className={activeField === "bio" ? "focused" : ""}>
                <InputLabel>About You</InputLabel>
                <StyledTextarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  onFocus={() => setActiveField("bio")}
                  onBlur={() => setActiveField("")}
                  placeholder="Tell everyone about yourself... What makes you unique? ✨"
                  rows={4}
                />
              </InputGroup>

              <SaveButton type="submit" disabled={loading}>
                {loading ? (
                  <ButtonContent>
                    <LoadingSpinner />
                    <span>Saving Your Profile...</span>
                  </ButtonContent>
                ) : (
                  <ButtonContent>
                    <FaSave />
                    <span>Save Profile</span>
                    <HeartIcon>
                      <FaHeart />
                    </HeartIcon>
                  </ButtonContent>
                )}
              </SaveButton>
            </ProfileForm>
          </ProfileBody>
        </ContentCard>
      </Container>
    </PageWrapper>
  );
};

export default ProfilePage;

// Stunning animations and styled components
const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg) }
  25% { transform: translateY(-10px) rotate(1deg) }
  50% { transform: translateY(-20px) rotate(0deg) }
  75% { transform: translateY(-10px) rotate(-1deg) }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0 }
  100% { background-position: 200% 0 }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1) }
  50% { transform: scale(1.05) }
`;

const heartBeat = keyframes`
  0%, 100% { transform: scale(1) }
  25% { transform: scale(1.1) }
  50% { transform: scale(1) }
  75% { transform: scale(1.05) }
`;

const spin = keyframes`
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg) }
  50% { opacity: 0.7; transform: scale(1.2) rotate(180deg) }
`;

const FloatingElement = styled.div`
  position: absolute;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  top: ${(props) => props.top};
  left: ${(props) => props.left};
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${(props) => props.color}40 0%,
    ${(props) => props.color}20 100%
  );
  opacity: ${(props) => props.opacity};
  filter: blur(15px);
  animation: ${gentleFloat} 8s ease-in-out infinite;
  animation-delay: ${(props) => props.delay};
  pointer-events: none;
  z-index: 1;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    ${COLORS.background} 0%,
    ${COLORS.primaryKhaki}30 25%,
    ${COLORS.accentMint}20 50%,
    ${COLORS.background} 75%,
    ${COLORS.primarySalmon}15 100%
  );
  background-size: 400% 400%;
  animation: ${gradientFlow} 20s ease infinite;
  z-index: 0;
`;

const PageWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const Container = styled.div`
  max-width: 800px;
  width: 100%;
  position: relative;
  z-index: 2;
`;

const ContentCard = styled.div`
  border-radius: 24px;
  overflow: hidden;
  background: ${COLORS.cardBackground};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid ${COLORS.border};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15), 0 10px 35px rgba(0, 0, 0, 0.1);
  }
`;

const ProfileHeader = styled.div`
  position: relative;
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryBlueGray} 0%,
    ${COLORS.primaryMint} 50%,
    ${COLORS.accentSalmon} 100%
  );
  background-size: 300% 300%;
  animation: ${gradientFlow} 15s ease infinite;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    background-size: 200% 200%;
    animation: ${shimmer} 8s ease-in-out infinite;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
`;

const SparkleIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.9);
  animation: ${sparkle} 3s ease-in-out infinite;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
  letter-spacing: -1px;
`;

const HeaderSubtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 500;
`;

const ProfileBody = styled.div`
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
`;

const ImageUploadSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ProfileAvatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${ImageContainer}:hover & {
    transform: scale(1.1);
  }
`;

const ImageBorder = styled.div`
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: linear-gradient(
    45deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint},
    ${COLORS.primaryBlueGray},
    ${COLORS.accentSalmon}
  );
  background-size: 300% 300%;
  animation: ${gradientFlow} 8s ease infinite;
  z-index: -1;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    transparent 100%
  );
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${ImageContainer}:hover & {
    opacity: 1;
  }
`;

const ChangeButton = styled.button`
  background: rgba(255, 255, 255, 0.95);
  color: ${COLORS.textPrimary};
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }
`;

const UploadDropzone = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.elevatedBackground} 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px dashed ${COLORS.primaryMint};
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: ${COLORS.primarySalmon};
    transform: scale(1.05);
    background: linear-gradient(
      135deg,
      ${COLORS.accentMint}30 0%,
      rgba(255, 255, 255, 0.9) 100%
    );
  }

  &::before {
    content: "";
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 50%;
    background: linear-gradient(
      45deg,
      ${COLORS.primarySalmon}30,
      ${COLORS.primaryMint}30,
      ${COLORS.primaryBlueGray}30
    );
    background-size: 200% 200%;
    animation: ${gradientFlow} 10s ease infinite;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: ${COLORS.primaryBlueGray};
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;

  ${UploadDropzone}:hover & {
    color: ${COLORS.primarySalmon};
    animation: ${pulse} 2s infinite;
  }
`;

const UploadText = styled.p`
  color: ${COLORS.textPrimary};
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
`;

const UploadHint = styled.p`
  color: ${COLORS.textSecondary};
  margin: 0;
  font-size: 0.75rem;
`;

const ProfileForm = styled.form`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &.focused {
    transform: translateY(-2px);

    label {
      color: ${COLORS.primarySalmon};
      font-weight: 600;
    }
  }
`;

const InputLabel = styled.label`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
`;

const InputContainer = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: ${COLORS.textTertiary};
  transition: color 0.3s ease;
  z-index: 1;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: 2px solid ${COLORS.border};
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${COLORS.primarySalmon};
    background: rgba(255, 255, 255, 0.9);
    outline: none;
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;

    & + ${InputIcon} {
      color: ${COLORS.primarySalmon};
    }
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: 2px solid ${COLORS.border};
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${COLORS.primarySalmon};
    background: rgba(255, 255, 255, 0.9);
    outline: none;
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon} 0%,
    ${COLORS.accentSalmon} 100%
  );
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  box-shadow: 0 6px 20px ${COLORS.primarySalmon}40;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px ${COLORS.primarySalmon}50;
    background: linear-gradient(
      135deg,
      ${COLORS.accentSalmon} 0%,
      ${COLORS.primarySalmon} 100%
    );

    &:before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${COLORS.textTertiary};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${spin} 1s linear infinite;
`;

const HeartIcon = styled.div`
  color: ${COLORS.heartRed};
  animation: ${heartBeat} 2s ease-in-out infinite;
  font-size: 0.9rem;
`;
