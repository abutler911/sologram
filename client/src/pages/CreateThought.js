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
  FaRobot,
  FaMagic,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { COLORS } from "../theme";

// AI Content Generator Modal Component
const AIContentModal = ({ isOpen, onClose, onApplyContent, currentMood }) => {
  const [formData, setFormData] = useState({
    description: "",
    contentType: "general",
    tone: "casual",
    additionalContext: "",
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const contentTypes = [
    { value: "general", label: "General Thought" },
    { value: "reflection", label: "Personal Reflection" },
    { value: "inspiration", label: "Inspiration" },
    { value: "creative", label: "Creative Expression" },
    { value: "observation", label: "Life Observation" },
    { value: "gratitude", label: "Gratitude" },
  ];

  const tones = [
    { value: "casual", label: "Casual & Friendly" },
    { value: "thoughtful", label: "Thoughtful" },
    { value: "playful", label: "Fun & Playful" },
    { value: "inspirational", label: "Inspirational" },
    { value: "minimalist", label: "Clean & Minimal" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleGenerate = async () => {
    if (!formData.description.trim()) {
      setError("Please provide a description for your thought");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Add mood context to the request
      const requestData = {
        ...formData,
        additionalContext:
          `${formData.additionalContext} Current mood: ${currentMood}`.trim(),
      };

      const response = await fetch(
        "https://sologram-api.onrender.com/api/admin/ai-content/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate content");
      }

      setGeneratedContent(data.data);
    } catch (error) {
      setError(
        error.message || "Failed to generate content. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApplyContent(generatedContent);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>✨ Generate AI Content</h3>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label>What's your thought about? *</Label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you want to share... (e.g., 'Reflection on morning coffee routine')"
              maxLength="300"
            />
            <CharCount>{formData.description.length}/300</CharCount>
          </FormGroup>

          <InputRow>
            <FormGroup>
              <Label>Content Type</Label>
              <Select
                name="contentType"
                value={formData.contentType}
                onChange={handleInputChange}
              >
                {contentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Tone</Label>
              <Select
                name="tone"
                value={formData.tone}
                onChange={handleInputChange}
              >
                {tones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </InputRow>

          <FormGroup>
            <Label>Additional Context (Optional)</Label>
            <Input
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              placeholder="Any specific details or style preferences..."
              maxLength="150"
            />
          </FormGroup>

          {error && (
            <ErrorMessage>
              <FaTimes />
              {error}
            </ErrorMessage>
          )}

          <GenerateButton
            onClick={handleGenerate}
            disabled={isGenerating || !formData.description.trim()}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              <>
                <FaMagic />
                Generate Content
              </>
            )}
          </GenerateButton>

          {generatedContent && (
            <GeneratedSection>
              <SectionTitle>Generated Content</SectionTitle>

              <ContentPreview>
                <ContentLabel>Content</ContentLabel>
                <ContentBox>{generatedContent.caption}</ContentBox>
              </ContentPreview>

              {generatedContent.tags && generatedContent.tags.length > 0 && (
                <ContentPreview>
                  <ContentLabel>Suggested Tags</ContentLabel>
                  <TagsPreview>
                    {generatedContent.tags.map((tag, index) => (
                      <TagPreview key={index}>#{tag}</TagPreview>
                    ))}
                  </TagsPreview>
                </ContentPreview>
              )}

              <ButtonRow>
                <SecondaryButton onClick={() => setGeneratedContent(null)}>
                  Generate New
                </SecondaryButton>
                <ApplyButton onClick={handleApply}>
                  Use This Content
                </ApplyButton>
              </ButtonRow>
            </GeneratedSection>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

const CreateThought = () => {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("creative");
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
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

  const handleAIContentApply = (generatedContent) => {
    // Apply the content
    setContent(generatedContent.caption || generatedContent.title || "");

    // Add suggested tags (limit to available slots)
    if (generatedContent.tags && generatedContent.tags.length > 0) {
      const availableSlots = 5 - tags.length;
      const newTags = generatedContent.tags.slice(0, availableSlots);
      setTags((prev) => [...prev, ...newTags]);

      if (newTags.length > 0) {
        toast.success(`Applied content and added ${newTags.length} tags!`);
      } else {
        toast.success("Content applied!");
      }
    } else {
      toast.success("Content applied!");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image size should be less than 25MB");
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

  const addTag = (tagText = null) => {
    const tagToAdd = tagText || currentTag.trim();

    if (!tagToAdd || tags.includes(tagToAdd)) return;
    if (tags.length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }

    setTags([...tags, tagToAdd]);
    setCurrentTag("");
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (currentTag.trim()) {
        addTag();
      }
    } else if (e.key === "Backspace" && !currentTag && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    if (value.includes(" ")) {
      const tagText = value.split(" ")[0].trim();
      if (tagText) {
        addTag(tagText);
      }
    } else {
      setCurrentTag(value);
    }
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
            <ContentHeader>
              <Label>What's on your mind?</Label>
              <AIButton
                type="button"
                onClick={() => setShowAIModal(true)}
                title="Generate content with AI"
              >
                <FaRobot />
                <span>AI Assist</span>
              </AIButton>
            </ContentHeader>
            <ContentTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
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

          <FormGroup style={{ paddingTop: "0.5rem" }}>
            <Label>Tags (optional)</Label>
            <TagInputWrapper>
              <TagInputField
                value={currentTag}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type tags and press space to add..."
                maxLength={30}
              />
              {currentTag.trim() && (
                <TagInputPreview moodColor={moodColors[mood]}>
                  #{currentTag.trim()}
                </TagInputPreview>
              )}
            </TagInputWrapper>

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

        <AIContentModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onApplyContent={handleAIContentApply}
          currentMood={mood}
        />
      </PageWrapper>
    </MainLayout>
  );
};

// Existing styled components remain the same...
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

// New styled components for AI integration
const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const AIButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryMint} 0%,
    ${COLORS.primarySalmon} 100%
  );
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  svg {
    font-size: 1rem;
  }
`;

// Modal styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${COLORS.border};

  h3 {
    margin: 0;
    color: ${COLORS.textPrimary};
    font-size: 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;

  &:hover {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.textPrimary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const Select = styled.select`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CharCount = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
  text-align: right;
  margin-top: 0.25rem;
`;

const ErrorMessage = styled.div`
  background: ${COLORS.error}15;
  border: 1px solid ${COLORS.error}30;
  color: ${COLORS.error};
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const GenerateButton = styled.button`
  width: 100%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon} 0%,
    ${COLORS.accentSalmon} 100%
  );
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${COLORS.primarySalmon}30;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const GeneratedSection = styled.div`
  border-top: 1px solid ${COLORS.border};
  padding-top: 1.5rem;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SectionTitle = styled.h4`
  color: ${COLORS.textPrimary};
  margin: 0 0 1rem 0;
  font-size: 1rem;
`;

const ContentPreview = styled.div`
  margin-bottom: 1rem;
`;

const ContentLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.5rem;
`;

const ContentBox = styled.div`
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  line-height: 1.5;
  font-size: 0.875rem;
`;

const TagsPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagPreview = styled.span`
  background: ${COLORS.primarySalmon}20;
  color: ${COLORS.primarySalmon};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const SecondaryButton = styled.button`
  flex: 1;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS.border};
    color: ${COLORS.textPrimary};
  }
`;

const ApplyButton = styled.button`
  flex: 2;
  background: ${COLORS.primaryMint};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS.accentMint};
    transform: translateY(-1px);
  }
`;

// Existing styled components continue...
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

const TagInputWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
`;

const TagInputField = styled.input`
  width: 100%;
  background-color: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  color: ${COLORS.textPrimary};
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px rgba(211, 119, 106, 0.1);
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const TagInputPreview = styled.div`
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  background-color: rgba(
    ${(props) => {
      const hexColor = props.moodColor || COLORS.primarySalmon;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      return `${r}, ${g}, ${b}, 0.15`;
    }}
  );
  color: ${(props) => props.moodColor || COLORS.primarySalmon};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid
    rgba(
      ${(props) => {
        const hexColor = props.moodColor || COLORS.primarySalmon;
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `${r}, ${g}, ${b}, 0.3`;
      }}
    );
  pointer-events: none;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  border: 1px dashed ${COLORS.border};
  min-height: 2.5rem;
  align-items: flex-start;
  align-content: flex-start;

  &:empty::before {
    content: "Your tags will appear here...";
    color: ${COLORS.textTertiary};
    font-size: 0.875rem;
    font-style: italic;
    display: flex;
    align-items: center;
    height: 100%;
    min-height: 1rem;
  }
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(
    ${(props) => {
      const hexColor = props.moodColor || COLORS.primarySalmon;
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
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(
      ${(props) => {
        const hexColor = props.moodColor || COLORS.primarySalmon;
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `${r}, ${g}, ${b}, 0.3`;
      }}
    );
    transform: translateY(-1px);
  }
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
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
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
    background-color: #cc6e5f;
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
      if (c > 800) return COLORS.error;
      if (p > 90) return COLORS.error;
      if (p > 65) return COLORS.warning;
      return COLORS.primaryMint;
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
