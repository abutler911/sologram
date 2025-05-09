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
      // Add a fun toast notification style for pending
      toast.loading("Updating your awesome profile...", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.textPrimary,
          border: `2px solid ${COLORS.primaryPurple}`,
        },
      });

      const success = await updateProfile(data);
      if (success) {
        toast.success("Profile updated successfully! Looking good! 🔥", {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.primaryGreen,
            border: `2px solid ${COLORS.primaryGreen}`,
          },
          icon: "🚀",
          duration: 5000,
        });
        navigate("/");
      } else {
        toast.error("Profile update failed. Let's try again!", {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.danger,
            border: `2px solid ${COLORS.danger}`,
          },
          icon: "💔",
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Tech happens!", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.danger,
          border: `2px solid ${COLORS.danger}`,
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
      <BackgroundGradient />
      <FloatingCircle
        top="10%"
        left="10%"
        size="100px"
        delay="0s"
        color={COLORS.primaryPurple}
        opacity="0.1"
      />
      <FloatingCircle
        top="70%"
        left="80%"
        size="150px"
        delay="2s"
        color={COLORS.primaryBlue}
        opacity="0.15"
      />
      <FloatingCircle
        top="40%"
        left="90%"
        size="80px"
        delay="1s"
        color={COLORS.primaryGreen}
        opacity="0.1"
      />
      <FloatingCircle
        top="90%"
        left="30%"
        size="120px"
        delay="3s"
        color={COLORS.primaryPurple}
        opacity="0.08"
      />

      <Container>
        <ContentWrapper>
          <GlassHeader>
            <HeaderContent>
              <Title>Customize Your Profile</Title>
              <SubTitle>Make it uniquely yours</SubTitle>
            </HeaderContent>
          </GlassHeader>

          <CardBody>
            <ProfileImageSection>
              {imagePreview ? (
                <ProfileImageContainer>
                  <ProfileImage src={imagePreview} alt="Preview" />
                  <ImageOverlay>
                    <OverlayButton
                      type="button"
                      onClick={() => {
                        setProfileImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <FaPencilAlt /> Change
                    </OverlayButton>
                  </ImageOverlay>
                </ProfileImageContainer>
              ) : (
                <DropAreaContainer {...getRootProps()} tabIndex={0}>
                  <input {...getInputProps()} />
                  <DropIcon>
                    <FaCamera />
                  </DropIcon>
                  <DropText>Upload Profile Picture</DropText>
                </DropAreaContainer>
              )}
            </ProfileImageSection>

            <Form onSubmit={handleSubmit}>
              <FormRow>
                <FormGroup
                  className={activeField === "firstName" ? "active" : ""}
                >
                  <Label htmlFor="firstName">First Name</Label>
                  <InputWrapper>
                    <Icon>
                      <FaUser />
                    </Icon>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onFocus={() => setActiveField("firstName")}
                      onBlur={() => setActiveField("")}
                      required
                    />
                  </InputWrapper>
                </FormGroup>

                <FormGroup
                  className={activeField === "lastName" ? "active" : ""}
                >
                  <Label htmlFor="lastName">Last Name</Label>
                  <InputWrapper>
                    <Icon>
                      <FaUser />
                    </Icon>
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onFocus={() => setActiveField("lastName")}
                      onBlur={() => setActiveField("")}
                    />
                  </InputWrapper>
                </FormGroup>
              </FormRow>

              <FormGroup className={activeField === "username" ? "active" : ""}>
                <Label htmlFor="username">Username</Label>
                <InputWrapper>
                  <Icon>
                    <FaUser />
                  </Icon>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setActiveField("username")}
                    onBlur={() => setActiveField("")}
                    required
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup className={activeField === "email" ? "active" : ""}>
                <Label htmlFor="email">Email</Label>
                <InputWrapper>
                  <Icon>
                    <FaEnvelope />
                  </Icon>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setActiveField("email")}
                    onBlur={() => setActiveField("")}
                    required
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup className={activeField === "bio" ? "active" : ""}>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell the world about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                  onFocus={() => setActiveField("bio")}
                  onBlur={() => setActiveField("")}
                  rows={4}
                />
              </FormGroup>

              <SubmitButton disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Spinner />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>Save Changes</span>
                  </>
                )}
              </SubmitButton>
            </Form>
          </CardBody>
        </ContentWrapper>
      </Container>
    </PageWrapper>
  );
};

export default ProfilePage;

// Styled Components with animations and modern design
const float = keyframes`
  0% { transform: translateY(0px) }
  50% { transform: translateY(-15px) }
  100% { transform: translateY(0px) }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.5) }
  50% { box-shadow: 0 0 25px rgba(124, 58, 237, 0.8) }
  100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.5) }
`;

const pulse = keyframes`
  0% { transform: scale(1) }
  50% { transform: scale(1.05) }
  100% { transform: scale(1) }
`;

const spin = keyframes`
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
`;

const gradientMove = keyframes`
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
`;

const FloatingCircle = styled.div`
  position: absolute;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  top: ${(props) => props.top};
  left: ${(props) => props.left};
  border-radius: 50%;
  background-color: ${(props) => props.color};
  opacity: ${(props) => props.opacity};
  filter: blur(20px);
  animation: ${float} 6s ease-in-out infinite;
  animation-delay: ${(props) => props.delay};
  pointer-events: none;
  z-index: 1;
`;

const BackgroundGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    ${COLORS.background} 0%,
    ${COLORS.backgroundDark || "#121212"} 100%
  );
  background-size: 400% 400%;
  animation: ${gradientMove} 15s ease infinite;
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
`;

const Container = styled.div`
  max-width: 900px;
  width: 100%;
  position: relative;
  z-index: 2;
`;

const ContentWrapper = styled.div`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  background: rgba(25, 25, 35, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
`;

const GlassHeader = styled.div`
  background: linear-gradient(
    135deg,
    ${COLORS.primaryPurple}80 0%,
    ${COLORS.primaryBlue}80 100%
  );
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 80%
    );
    pointer-events: none;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const Title = styled.h1`
  color: white;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const SubTitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0 0;
  font-size: 1.1rem;
`;

const CardBody = styled.div`
  padding: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ProfileImageSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ProfileImageContainer = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 4px solid ${COLORS.primaryPurple};
  animation: ${glow} 3s infinite;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${ProfileImageContainer}:hover & {
    transform: scale(1.1);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0) 50%
  );
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${ProfileImageContainer}:hover & {
    opacity: 1;
  }
`;

const OverlayButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  svg {
    font-size: 0.875rem;
  }
`;

const DropAreaContainer = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    ${COLORS.elevatedBackground} 0%,
    ${COLORS.backgroundDark || "#1a1a1a"} 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px dashed ${COLORS.border};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${COLORS.primaryPurple};
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
`;

const DropIcon = styled.div`
  font-size: 2.5rem;
  color: ${COLORS.primaryPurple};
  margin-bottom: 0.75rem;
  transition: transform 0.3s ease;

  ${DropAreaContainer}:hover & {
    transform: scale(1.2);
    animation: ${pulse} 2s infinite;
  }
`;

const DropText = styled.p`
  color: ${COLORS.textSecondary};
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  width: 100%;
  max-width: 100%;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.3s ease;
  width: 100%;

  &.active {
    transform: translateX(5px);

    label {
      color: ${COLORS.primaryPurple};
    }
  }
`;

const Label = styled.label`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 0.5rem;
  transition: color 0.3s ease;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Icon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: ${COLORS.textTertiary};
  transition: color 0.3s ease;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 1.2rem 1.2rem 1.2rem 3.2rem;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 1.15rem;
  font-family: "Segoe UI", Roboto, -apple-system, sans-serif;
  letter-spacing: 0.2px;
  transition: all 0.3s ease;

  &:focus {
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 3px ${COLORS.primaryPurple}30;
    outline: none;
    background: ${COLORS.elevatedBackground}50;

    & + ${Icon} {
      color: ${COLORS.primaryPurple};
    }
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 1.2rem;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 1.15rem;
  font-family: "Segoe UI", Roboto, -apple-system, sans-serif;
  letter-spacing: 0.2px;
  resize: vertical;
  min-height: 140px;
  transition: all 0.3s ease;

  &:focus {
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 3px ${COLORS.primaryPurple}30;
    outline: none;
    background: ${COLORS.elevatedBackground}50;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: ${spin} 1s ease-in-out infinite;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryGreen} 0%,
    ${COLORS.accentGreen || "#0d9488"} 100%
  );
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px ${COLORS.primaryGreen}50;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px ${COLORS.primaryGreen}70;
    background: linear-gradient(
      135deg,
      ${COLORS.accentGreen || "#0d9488"} 0%,
      ${COLORS.primaryGreen} 100%
    );
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

  svg {
    font-size: 1.25rem;
  }
`;
