// pages/Profile.js
import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { AuthContext } from '../context/AuthContext';
import {
  FaUser,
  FaEnvelope,
  FaCamera,
  FaPencilAlt,
  FaSave,
  FaCheck,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { COLORS } from '../theme';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Profile — SoloGram account settings
 *
 * Design direction: refined minimalism.
 * One card, clean form, avatar takes center stage.
 * Zero persistent animations — one fade-in entrance only.
 * Every color from COLORS tokens.
 */

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    bio: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate from auth context
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
      });
      if (user.profileImage) setImagePreview(user.profileImage);
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
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => toast.error('Image too large. Max 5 MB.'),
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('firstName', formData.firstName);
    data.append('lastName', formData.lastName);
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('bio', formData.bio);
    if (profileImage) data.append('profileImage', profileImage);

    try {
      const success = await updateProfile(data);
      if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        toast.success('Profile saved');
        navigate('/');
      } else {
        toast.error('Update failed — please try again');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const initials =
    [formData.firstName, formData.lastName]
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .join('') ||
    (formData.username?.[0]?.toUpperCase() ?? 'A');

  return (
    <PageWrapper>
      <Card>
        {/* ── Page title ── */}
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardSubtitle>Manage your SoloGram profile</CardSubtitle>
        </CardHeader>

        <Divider />

        {/* ── Avatar ── */}
        <AvatarSection>
          {imagePreview ? (
            <AvatarWrap>
              <AvatarImg src={imagePreview} alt='Profile' />
              <AvatarEditBtn
                type='button'
                onClick={() => {
                  setProfileImage(null);
                  setImagePreview(null);
                }}
                title='Remove photo'
              >
                <FaPencilAlt />
              </AvatarEditBtn>
            </AvatarWrap>
          ) : (
            <DropZone
              {...getRootProps()}
              $active={isDragActive}
              title='Upload a photo'
            >
              <input {...getInputProps()} />
              <AvatarFallback>{initials}</AvatarFallback>
              <DropOverlay>
                <FaCamera />
                <span>Add photo</span>
              </DropOverlay>
            </DropZone>
          )}
          <AvatarMeta>
            <AvatarName>
              {formData.firstName
                ? `${formData.firstName} ${formData.lastName}`.trim()
                : formData.username || 'Your Name'}
            </AvatarName>
            <AvatarHandle>@{formData.username || 'username'}</AvatarHandle>
          </AvatarMeta>
        </AvatarSection>

        <Divider />

        {/* ── Form ── */}
        <ProfileForm onSubmit={handleSubmit}>
          <FieldRow>
            <FieldGroup>
              <FieldLabel htmlFor='firstName'>First Name</FieldLabel>
              <FieldWrap>
                <FieldIcon>
                  <FaUser />
                </FieldIcon>
                <FieldInput
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder='First name'
                  required
                />
              </FieldWrap>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor='lastName'>Last Name</FieldLabel>
              <FieldWrap>
                <FieldIcon>
                  <FaUser />
                </FieldIcon>
                <FieldInput
                  id='lastName'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder='Last name'
                />
              </FieldWrap>
            </FieldGroup>
          </FieldRow>

          <FieldGroup>
            <FieldLabel htmlFor='username'>Username</FieldLabel>
            <FieldWrap>
              <FieldPrefix>@</FieldPrefix>
              <FieldInput
                id='username'
                name='username'
                value={formData.username}
                onChange={handleChange}
                placeholder='username'
                required
                $hasPrefix
              />
            </FieldWrap>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <FieldWrap>
              <FieldIcon>
                <FaEnvelope />
              </FieldIcon>
              <FieldInput
                id='email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='you@example.com'
                required
              />
            </FieldWrap>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor='bio'>Bio</FieldLabel>
            <FieldTextarea
              id='bio'
              name='bio'
              value={formData.bio}
              onChange={handleChange}
              placeholder='Tell the world a little about yourself…'
              rows={4}
              maxLength={300}
            />
            <CharCount $warn={formData.bio.length > 260}>
              {formData.bio.length} / 300
            </CharCount>
          </FieldGroup>

          <SaveButton type='submit' disabled={loading} $saved={saved}>
            {loading ? (
              <LoadingSpinner size='18px' noMinHeight />
            ) : saved ? (
              <>
                <FaCheck />
                <span>Saved</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save changes</span>
              </>
            )}
          </SaveButton>
        </ProfileForm>
      </Card>
    </PageWrapper>
  );
};

export default ProfilePage;

// ─────────────────────────────────────────────────────────────────────────────
// Animation — entrance only, nothing persistent
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${COLORS.background};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px 80px;

  @media (min-width: 600px) {
    padding: 48px 24px 80px;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  overflow: hidden;
  animation: ${fadeUp} 0.22s ease both;
`;

const CardHeader = styled.div`
  padding: 24px 24px 20px;
`;

const CardTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  margin: 0 0 3px;
  letter-spacing: -0.2px;
`;

const CardSubtitle = styled.p`
  font-size: 0.82rem;
  color: ${COLORS.textTertiary};
  margin: 0;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${COLORS.border};
  margin: 0;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Avatar section
// ─────────────────────────────────────────────────────────────────────────────
const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
`;

const avatarSize = '72px';

const AvatarWrap = styled.div`
  position: relative;
  width: ${avatarSize};
  height: ${avatarSize};
  flex-shrink: 0;
`;

const AvatarImg = styled.img`
  width: ${avatarSize};
  height: ${avatarSize};
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid ${COLORS.primarySalmon}70;
  display: block;
`;

const AvatarEditBtn = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${COLORS.primarySalmon};
  color: #fff;
  border: 2px solid ${COLORS.cardBackground};
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  cursor: pointer;
  transition: background 0.12s, transform 0.1s;
  &:hover {
    background: ${COLORS.accentSalmon};
    transform: scale(1.1);
  }
`;

/* Dropzone — shown when no image selected */
const DropZone = styled.div`
  position: relative;
  width: ${avatarSize};
  height: ${avatarSize};
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  border: 2.5px dashed
    ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.border)};
  transition: border-color 0.15s;
  overflow: hidden;
  &:hover {
    border-color: ${COLORS.primarySalmon};
  }
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
`;

const DropOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  svg {
    font-size: 1rem;
  }

  ${DropZone}:hover & {
    opacity: 1;
  }
`;

const AvatarMeta = styled.div`
  min-width: 0;
`;

const AvatarName = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AvatarHandle = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.textTertiary};
`;

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────
const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FieldWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const FieldIcon = styled.div`
  position: absolute;
  left: 12px;
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  pointer-events: none;
  display: flex;
`;

const FieldPrefix = styled.div`
  position: absolute;
  left: 12px;
  color: ${COLORS.textTertiary};
  font-size: 0.88rem;
  font-weight: 600;
  pointer-events: none;
`;

const FieldInput = styled.input`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  padding: ${(p) =>
    p.$hasPrefix ? '10px 12px 10px 28px' : '10px 12px 10px 36px'};
  transition: border-color 0.12s, box-shadow 0.12s;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}18;
  }
`;

const FieldTextarea = styled.textarea`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  padding: 10px 12px;
  resize: vertical;
  min-height: 90px;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.12s, box-shadow 0.12s;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}18;
  }
`;

const CharCount = styled.div`
  font-size: 0.72rem;
  color: ${(p) => (p.$warn ? COLORS.primarySalmon : COLORS.textTertiary)};
  text-align: right;
  margin-top: 2px;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.15s, transform 0.1s, opacity 0.15s;
  align-self: flex-end;
  min-width: 140px;

  background: ${(p) => (p.$saved ? COLORS.primaryMint : COLORS.primarySalmon)};
  color: #fff;
  opacity: ${(p) => (p.disabled && !p.$saved ? 0.65 : 1)};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$saved ? COLORS.accentMint : COLORS.accentSalmon)};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  svg {
    font-size: 0.85rem;
  }
`;
