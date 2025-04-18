import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import { FaUser, FaEnvelope, FaCamera, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

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
      const success = await updateProfile(data);
      if (success) {
        navigate("/");
      } else {
        toast.error("Profile update failed.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Container>
        <Title>Edit Profile</Title>
        <Form onSubmit={handleSubmit}>
          <Label htmlFor="firstName">First Name</Label>
          <Field>
            <Icon>
              <FaUser />
            </Icon>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </Field>

          <Label htmlFor="lastName">Last Name</Label>
          <Field>
            <Icon>
              <FaUser />
            </Icon>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </Field>

          <Label htmlFor="username">Username</Label>
          <Field>
            <Icon>
              <FaUser />
            </Icon>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Field>

          <Label htmlFor="email">Email</Label>
          <Field>
            <Icon>
              <FaEnvelope />
            </Icon>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Field>

          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={handleChange}
            rows={4}
          />

          <Label>Profile Image</Label>
          {imagePreview ? (
            <Preview>
              <img src={imagePreview} alt="Preview" />
              <Remove
                type="button"
                onClick={() => {
                  setProfileImage(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Remove>
            </Preview>
          ) : (
            <DropArea {...getRootProps()} tabIndex={0}>
              <input {...getInputProps()} />
              <FaUpload />
              <p>Click or drag to upload</p>
            </DropArea>
          )}

          <Submit disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Submit>
        </Form>
      </Container>
    </Wrapper>
  );
};

export default ProfilePage;

// Styled Components
const Wrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  background-color: #1e1e1e;
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Label = styled.label`
  color: #aaa;
  margin-bottom: 0.25rem;
`;

const Field = styled.div`
  position: relative;
`;

const Icon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #aaa;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: #333;
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: #333;
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
  resize: vertical;
`;

const DropArea = styled.div`
  border: 2px dashed #444;
  padding: 2rem;
  text-align: center;
  background: #2a2a2a;
  cursor: pointer;
  color: #aaa;

  svg {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

const Preview = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  margin-bottom: 1rem;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const Remove = styled.button`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 100%;
  padding: 0.5rem;
  border: none;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const Submit = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: #ff7e5f;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 4px;

  &:hover {
    background: #ff6347;
  }

  &:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
`;
