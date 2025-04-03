// src/pages/AdminDashboard.js

import React, { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  FaCamera,
  FaEdit,
  FaCheck,
  FaTimes,
  FaBell,
  FaChartBar,
  FaFolder,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
      });
      setImagePreview(user.profileImage || null);
    }
  }, [user]);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setProfileImage(file);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
    });
    setImagePreview(user?.profileImage || null);
    setProfileImage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const profileFormData = new FormData();
    profileFormData.append("username", formData.username);
    profileFormData.append("email", formData.email);

    if (profileImage) {
      profileFormData.append("profileImage", profileImage);
    }

    const success = await updateProfile(profileFormData);

    if (success) {
      setIsEditing(false);
      toast.success("Profile updated successfully");
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <MainLayout>
        <Wrapper>
          <Message>Loading profile...</Message>
        </Wrapper>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Wrapper>
        <Header>
          <ImageContainer>
            {isEditing ? (
              <DropArea {...getRootProps()}>
                <input {...getInputProps()} />
                {imagePreview ? (
                  <Image src={imagePreview} alt={user.username} />
                ) : (
                  <Placeholder>
                    <FaCamera />
                  </Placeholder>
                )}
                <Overlay>
                  <FaCamera />
                  <span>Change Photo</span>
                </Overlay>
              </DropArea>
            ) : imagePreview ? (
              <Image src={imagePreview} alt={user.username} />
            ) : (
              <Placeholder>
                <FaCamera />
              </Placeholder>
            )}
          </ImageContainer>

          <Info>
            <Name>{user.username}</Name>
            <Email>{user.email}</Email>
            {!isEditing && (
              <ActionBtn onClick={() => setIsEditing(true)}>
                <FaEdit /> Edit Profile
              </ActionBtn>
            )}
          </Info>
        </Header>

        {isEditing ? (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormActions>
              <CancelBtn
                type="button"
                onClick={handleCancel}
                disabled={loading}
              >
                <FaTimes /> Cancel
              </CancelBtn>
              <SaveBtn type="submit" disabled={loading}>
                <FaCheck /> {loading ? "Saving..." : "Save Changes"}
              </SaveBtn>
            </FormActions>
          </Form>
        ) : (
          <Dashboard>
            <DashboardTitle>Admin Dashboard</DashboardTitle>
            <DashboardGrid>
              <CardLink to="/subscribers">
                <FaBell />
                <span>Manage Subscribers</span>
              </CardLink>
              <CardLink to="/collections/create">
                <FaFolder />
                <span>Create Collection</span>
              </CardLink>
              <CardLink to="/analytics">
                <FaChartBar />
                <span>View Analytics</span>
              </CardLink>
            </DashboardGrid>
          </Dashboard>
        )}
      </Wrapper>
    </MainLayout>
  );
};

export default Profile;

// Styled Components
const Wrapper = styled.div`
  background: #121212;
  min-height: 100vh;
  padding: 2rem 1rem;
`;

const Message = styled.p`
  text-align: center;
  color: #aaa;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  margin-right: 2rem;

  @media (max-width: 640px) {
    margin-right: 0;
    margin-bottom: 1rem;
  }
`;

const DropArea = styled.div`
  cursor: pointer;
  position: relative;

  &:hover > div {
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;

  svg {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  span {
    font-size: 0.75rem;
  }
`;

const Image = styled.img`
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #333;
`;

const Placeholder = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 2rem;
`;

const Info = styled.div`
  flex: 1;
`;

const Name = styled.h1`
  font-size: 1.75rem;
  color: white;
  margin-bottom: 0.5rem;
`;

const Email = styled.p`
  color: #aaa;
  margin-bottom: 1.5rem;
`;

const ActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  background: #333;
  color: #ddd;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    background: #444;
  }
`;

const Form = styled.form`
  background: #1e1e1e;
  padding: 1.5rem;
  border-radius: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  color: #ddd;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
  border-radius: 4px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const SaveBtn = styled.button`
  background: #ff7e5f;
  color: white;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    background: #ff6347;
  }

  &:disabled {
    background: #666;
  }
`;

const CancelBtn = styled.button`
  background: transparent;
  color: #ddd;
  border: 1px solid #444;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    background: #333;
  }

  &:disabled {
    opacity: 0.7;
  }
`;

const Dashboard = styled.div`
  margin-top: 2rem;
`;

const DashboardTitle = styled.h2`
  color: white;
  margin-bottom: 1.25rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const CardLink = styled(Link)`
  background: #252525;
  border-radius: 4px;
  padding: 1rem;
  color: #ddd;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: 0.3s ease all;

  svg {
    margin-right: 0.75rem;
    color: #ff7e5f;
    font-size: 1.25rem;
  }

  span {
    font-weight: 500;
  }

  &:hover {
    background: #ff7e5f;
    color: white;

    svg {
      color: white;
    }
  }
`;
