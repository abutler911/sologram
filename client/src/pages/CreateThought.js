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

  const moodColors = {
    inspired: "#ffcb66",
    reflective: "#7891c9",
    excited: "#ff7e5f",
    creative: "#7be0ad",
    calm: "#00b2ff",
    curious: "#a06eff",
    nostalgic: "#ff61a6",
    amused: "#fcbe32",
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

// Styled components
const PageWrapper = styled.div`
  background-color: #121212;
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
  color: #dddddd;
  text-decoration: none;
  margin-bottom: 1rem;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  color: #ffffff;
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
  background-color: #1e1e1e;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  padding: 1rem;
  font-size: 1.125rem;
  min-height: 150px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &::placeholder {
    color: #666666;
  }
`;

const CharCount = styled.div`
  text-align: right;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #aaaaaa;

  &.warning {
    color: #ffbb00;
  }
`;

const Label = styled.label`
  display: block;
  color: #dddddd;
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
    props.selected ? props.moodColor : "#2a2a2a"};
  color: ${(props) => (props.selected ? "#121212" : "#dddddd")};
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => props.moodColor};
    color: #121212;
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
  background-color: #1e1e1e;
  border: 1px solid #333333;
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: #ffffff;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &::placeholder {
    color: #666666;
  }
`;

const AddTagButton = styled.button`
  background-color: #1e1e1e;
  border: 1px solid #333333;
  border-left: none;
  border-radius: 0 8px 8px 0;
  color: #aaaaaa;
  padding: 0 1rem;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
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
      const hexColor = props.moodColor || "#ff7e5f";
      // Convert hex to RGB with opacity
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      return `${r}, ${g}, ${b}, 0.2`;
    }}
  );
  color: ${(props) => props.moodColor || "#ff7e5f"};
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
  background-color: #1e1e1e;
  border: 1px dashed #444444;
  border-radius: 8px;
  color: #aaaaaa;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #2a2a2a;
    border-color: #ff7e5f;
    color: #ffffff;
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
    background-color: #1e1e1e;
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
  color: #ffffff;
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
  background-color: #ff7e5f;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #444444;
    cursor: not-allowed;
  }
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #ffffff;

  h2 {
    margin-bottom: 1rem;
  }

  p {
    color: #aaaaaa;
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
  background-color: #333;
  margin-bottom: 0.5rem;

  &::after {
    content: "${(props) => props.charCount}/800";
    position: absolute;
    top: -1.75rem;
    right: 0;
    font-size: 0.85rem;
    color: ${(props) => (props.charCount > 800 ? "#ff4d4d" : "#aaa")};
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
      if (c > 800) return "#ff4d4d"; // over limit — red
      if (p > 90) return "#ff4d4d"; // almost there — red
      if (p > 65) return "#ffc107"; // getting close — yellow
      return "#7be0ad"; // chill zone — green
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
  color: #ff4d4d;
  font-size: 0.9rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  text-align: right;
`;

export default CreateThought;
