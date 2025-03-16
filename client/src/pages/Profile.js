import React, { useState, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { FaCamera, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || ''
      });
      setImagePreview(user.profileImage || null);
    }
  }, [user]);
  
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
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Cancel editing
  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || ''
    });
    setImagePreview(user?.profileImage || null);
    setProfileImage(null);
    setIsEditing(false);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Create form data for submission
    const profileFormData = new FormData();
    profileFormData.append('username', formData.username);
    profileFormData.append('email', formData.email);
    profileFormData.append('bio', formData.bio || '');
    
    if (profileImage) {
      profileFormData.append('profileImage', profileImage);
    }
    
    const success = await updateProfile(profileFormData);
    
    if (success) {
      setIsEditing(false);
      toast.success('Profile updated successfully');
    }
    
    setLoading(false);
  };
  
  if (!user) {
    return (
      <Container>
        <LoadingMessage>Loading profile...</LoadingMessage>
      </Container>
    );
  }
  
  return (
    <Container>
      <ProfileHeader>
        <ProfileImageContainer>
          {isEditing ? (
            <DropzoneContainer {...getRootProps()}>
              <input {...getInputProps()} />
              {imagePreview ? (
                <ProfileImage src={imagePreview} alt={user.username} />
              ) : (
                <ProfilePlaceholder>
                  <FaCamera />
                </ProfilePlaceholder>
              )}
              <UploadOverlay>
                <FaCamera />
                <span>Change Photo</span>
              </UploadOverlay>
            </DropzoneContainer>
          ) : (
            imagePreview ? (
              <ProfileImage src={imagePreview} alt={user.username} />
            ) : (
              <ProfilePlaceholder>
                <FaCamera />
              </ProfilePlaceholder>
            )
          )}
        </ProfileImageContainer>
        
        <ProfileInfo>
          <ProfileName>{user.username}</ProfileName>
          <ProfileEmail>{user.email}</ProfileEmail>
          
          {!isEditing && (
            <EditButton onClick={() => setIsEditing(true)}>
              <FaEdit />
              <span>Edit Profile</span>
            </EditButton>
          )}
        </ProfileInfo>
      </ProfileHeader>
      
      {isEditing ? (
        <ProfileForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
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
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={handleCancel} disabled={loading}>
              <FaTimes />
              <span>Cancel</span>
            </CancelButton>
            
            <SaveButton type="submit" disabled={loading}>
              <FaCheck />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </SaveButton>
          </ButtonGroup>
        </ProfileForm>
      ) : (
        <ProfileBio>
          <BioLabel>Bio</BioLabel>
          <BioContent>
            {user.bio ? user.bio : 'No bio added yet.'}
          </BioContent>
        </ProfileBio>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileImageContainer = styled.div`
  position: relative;
  margin-right: 2.5rem;
  
  @media (max-width: 640px) {
    margin-right: 0;
    margin-bottom: 1.5rem;
  }
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ProfilePlaceholder = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #999999;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const DropzoneContainer = styled.div`
  position: relative;
  cursor: pointer;
  
  &:hover > div {
    opacity: 1;
  }
`;

const UploadOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  
  svg {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  span {
    font-size: 0.875rem;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h1`
  font-size: 2rem;
  color: #333333;
  margin: 0 0 0.5rem;
`;

const ProfileEmail = styled.p`
  color: #666666;
  margin: 0 0 1.5rem;
`;

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  background-color: #f0f0f0;
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ProfileBio = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const BioLabel = styled.h2`
  font-size: 1.25rem;
  color: #333333;
  margin: 0 0 1rem;
`;

const BioContent = styled.p`
  color: #666666;
  line-height: 1.6;
  white-space: pre-line;
`;

const ProfileForm = styled.form`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  svg {
    margin-right: 0.5rem;
  }
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: #666666;
  border: 1px solid #dddddd;
  
  &:hover {
    background-color: #f2f2f2;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background-color: #ff7e5f;
  color: white;
  border: none;
  
  &:hover {
    background-color: #ff6347;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #666666;
`;

export default Profile;