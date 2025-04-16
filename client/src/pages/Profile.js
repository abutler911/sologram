import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { AuthContext } from "../context/AuthContext";
import { FaUser, FaEnvelope, FaCamera, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("bio", formData.bio);
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    const success = await updateProfile(data);
    if (success) {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <Wrapper>
      <Container>
        <Title>Edit Profile</Title>
        <Form onSubmit={handleSubmit}>
          <Field>
            <Icon>
              <FaUser />
            </Icon>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Field>
          <Field>
            <Icon>
              <FaEnvelope />
            </Icon>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Field>
          <Textarea
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
          />
          <Label>Profile Image</Label>
          {imagePreview ? (
            <Preview>
              <img src={imagePreview} alt="Preview" />
              <Remove
                onClick={() => {
                  setProfileImage(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Remove>
            </Preview>
          ) : (
            <DropArea {...getRootProps()}>
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

const Form = styled.form``;

const Field = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const Icon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #aaa;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: #333;
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 1.5rem;
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
