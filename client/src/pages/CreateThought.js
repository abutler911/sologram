// client/src/pages/CreateThought.js
import React, { useState, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaTimes,
  FaImage,
  FaPaperPlane,
  FaHashtag,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS, THEME } from "../theme"; // Import the theme

const CreateThought = () => {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("creative");
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const moodOptions = [
    { value: "inspired", label: "Inspired", emoji: "✨" },
    { value: "reflective", label: "Reflective", emoji: "🌙" },
    { value: "excited", label: "Excited", emoji: "🔥" },
    { value: "creative", label: "Creative", emoji: "🎨" },
    { value: "calm", label: "Calm", emoji: "🌊" },
    { value: "curious", label: "Curious", emoji: "🔍" },
    { value: "nostalgic", label: "Nostalgic", emoji: "📷" },
    { value: "amused", label: "Amused", emoji: "😄" },
  ];

  // Updated mood colors to match new theme
  const moodColors = {
    inspired: COLORS.primaryKhaki,
    reflective: COLORS.primaryBlueGray,
    excited: COLORS.primarySalmon,
    creative: COLORS.primaryMint,
    calm: COLORS.accentMint,
    curious: COLORS.accentBlueGray,
    nostalgic: COLORS.accentSalmon,
    amused: COLORS.primaryKhaki,
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setMedia(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setMedia(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (!currentTag.trim() || tags.includes(currentTag.trim())) return;
    if (tags.length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }
    setTags([...tags, currentTag.trim()]);
    setCurrentTag("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (content.length > 800) {
      toast.error("Content must be 800 characters or less");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("content", content);
      formData.append("mood", mood);
      formData.append("tags", JSON.stringify(tags));

      if (media) {
        formData.append("media", media);
      }

      await axios.post("/api/thoughts", formData);

      toast.success("Thought created successfully!");
      navigate("/thoughts");
    } catch (err) {
      console.error("Error creating thought:", err);
      toast.error(err.response?.data?.message || "Failed to create thought");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user || !["admin", "creator"].includes(user.role)) {
    return (
      <MainLayout>
        <AccessDenied>
          <h2>Access Denied</h2>
          <p>You must be logged in with permission to create thoughts.</p>
          <BackLink to="/thoughts">Back to Thoughts</BackLink>
        </AccessDenied>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageWrapper>
        <Header>
          <BackLink to="/thoughts">
            <FaArrowLeft />
            <span>Back to Thoughts</span>
          </BackLink>
          <PageTitle>New Thought</PageTitle>
        </Header>

        <FormContainer onSubmit={handleSubmit}>
          <FormGroup>
            <ContentTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              required
              maxLength={800}
            />
            <ProgressWrapper>
              <ProgressBar
                percentage={(content.length / 800) * 100}
                charCount={content.length}
              />
              {content.length > 800 && (
                <CharWarning>
                  Thought is too long! Keep it under 800 characters.
                </CharWarning>
              )}
            </ProgressWrapper>
          </FormGroup>

          <MoodSelector>
            <Label>Mood</Label>
            <MoodOptions>
              {moodOptions.map((option) => (
                <MoodOption
                  key={option.value}
                  selected={mood === option.value}
                  moodColor={moodColors[option.value]}
                  onClick={() => setMood(option.value)}
                  type="button"
                >
                  <span>{option.emoji}</span> {option.label}
                </MoodOption>
              ))}
            </MoodOptions>
          </MoodSelector>

          <FormGroup>
            <Label>Tags (optional)</Label>
            <TagForm onSubmit={addTag}>
              <TagInput
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag..."
                maxLength={20}
              />
              <AddTagButton type="submit">
                <FaHashtag />
              </AddTagButton>
            </TagForm>
            {tags.length > 0 && (
              <TagsContainer>
                {tags.map((tag, index) => (
                  <Tag key={index} moodColor={moodColors[mood]}>
                    #{tag}
                    <RemoveTagButton onClick={() => removeTag(tag)}>
                      <FaTimes />
                    </RemoveTagButton>
                  </Tag>
                ))}
              </TagsContainer>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Image (optional)</Label>
            {preview ? (
              <ImagePreview>
                <img src={preview} alt="Preview" />
                <RemoveImageButton onClick={removeImage}>
                  <FaTimes />
                </RemoveImageButton>
              </ImagePreview>
            ) : (
              <ImageUpload>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <UploadButton
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaImage />
                  <span>Add Image</span>
                </UploadButton>
              </ImageUpload>
            )}
          </FormGroup>

          <SubmitButton
            type="submit"
            disabled={loading || !content.trim() || content.length > 800}
          >
            <FaPaperPlane />
            <span>{loading ? "Posting..." : "Post Thought"}</span>
          </SubmitButton>
        </FormContainer>
      </PageWrapper>
    </MainLayout>
  );
};

// Styled components updated with new theme colors
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  margin-bottom: 1rem;
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const FormContainer = styled.form`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  background-color: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  color: ${COLORS.textPrimary};
  padding: 1rem;
  font-size: 1.125rem;
  min-height: 150px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const CharCount = styled.div`
  text-align: right;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${COLORS.textTertiary};

  &.warning {
    color: ${COLORS.warning};
  }
`;

const Label = styled.label`
  display: block;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.75rem;
  font-weight: 500;
`;

const MoodSelector = styled.div`
  margin-bottom: 1.5rem;
`;

const MoodOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const MoodOption = styled.button`
  background-color: ${(props) =>
    props.selected ? props.moodColor : COLORS.elevatedBackground};
  color: ${(props) =>
    props.selected ? COLORS.textPrimary : COLORS.textSecondary};
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => props.moodColor};
    color: ${COLORS.textPrimary};
  }

  span {
    margin-right: 0.25rem;
  }
`;

const TagForm = styled.form`
  display: flex;
  margin-bottom: 0.75rem;
`;

const TagInput = styled.input`
  flex: 1;
  background-color: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: ${COLORS.textPrimary};
  padding: 0.75rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const AddTagButton = styled.button`
  background-color: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-left: none;
  border-radius: 0 8px 8px 0;
  color: ${COLORS.textTertiary};
  padding: 0 1rem;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(
    ${(props) => {
      const hexColor = props.moodColor || COLORS.primarySalmon;
      // Convert hex to RGB with opacity
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      return `${r}, ${g}, ${b}, 0.2`;
    }}
  );
  color: ${(props) => props.moodColor || COLORS.primarySalmon};
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  padding: 0;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ImageUpload = styled.div`
  display: flex;
  justify-content: center;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.cardBackground};
  border: 1px dashed ${COLORS.border};
  border-radius: 8px;
  color: ${COLORS.textTertiary};
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.elevatedBackground};
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.textPrimary};
  }

  svg {
    font-size: 1.125rem;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  max-height: 300px;

  img {
    width: 100%;
    max-height: 300px;
    object-fit: contain;
    background-color: ${COLORS.cardBackground};
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 0, 0, 0.7);
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  background-color: ${COLORS.primarySalmon};
  border: none;
  border-radius: 8px;
  color: white;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #cc6e5f; /* Darker salmon on hover */
  }

  &:disabled {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.textTertiary};
    cursor: not-allowed;
  }
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${COLORS.textPrimary};

  h2 {
    margin-bottom: 1rem;
  }

  p {
    color: ${COLORS.textSecondary};
    margin-bottom: 2rem;
  }
`;

const ProgressWrapper = styled.div`
  width: 100%;
  margin-top: 0.5rem;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 10px;
  border-radius: 5px;
  background-color: ${COLORS.elevatedBackground};
  margin-bottom: 0.5rem;

  &::after {
    content: "${(props) => props.charCount}/800";
    position: absolute;
    top: -1.75rem;
    right: 0;
    font-size: 0.85rem;
    color: ${(props) =>
      props.charCount > 800 ? COLORS.error : COLORS.textTertiary};
  }

  &::before {
    content: "";
    display: block;
    height: 100%;
    width: ${(props) =>
      props.charCount > 800 ? "100%" : `${props.percentage}%`};
    background-color: ${(props) => {
      const c = props.charCount;
      const p = props.percentage;
      if (c > 800) return COLORS.error; // over limit
      if (p > 90) return COLORS.error; // almost there
      if (p > 65) return COLORS.warning; // getting close
      return COLORS.primaryMint; // chill zone
    }};
    border-radius: 5px;
    transition: width 0.3s ease, background-color 0.3s ease;
    animation: ${(props) =>
      props.charCount > 800 ? "pulseRed 1s infinite ease-in-out" : "none"};
  }

  @keyframes pulseRed {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(255, 77, 77, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 77, 77, 0);
    }
  }
`;

const CharWarning = styled.div`
  color: ${COLORS.error};
  font-size: 0.9rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  text-align: right;
`;

export default CreateThought;
