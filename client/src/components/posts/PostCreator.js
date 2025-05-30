import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaImage,
  FaVideo,
  FaCamera,
  FaTimes,
  FaArrowRight,
  FaArrowLeft,
  FaFilter,
  FaTag,
  FaPencilAlt,
  FaLocationArrow,
  FaCalendarDay,
  FaRobot,
  FaMagic,
} from "react-icons/fa";
import { COLORS } from "../../theme";
import { useUploadManager } from "../../hooks/useUploadManager";
import { AuthContext } from "../../context/AuthContext";

// Default placeholder - using data URI instead of external service
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

// AI Content Generator Modal Component
const AIContentModal = ({ isOpen, onClose, onApplyContent }) => {
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
    { value: "general", label: "General Post" },
    { value: "product", label: "Product Showcase" },
    { value: "behind-scenes", label: "Behind the Scenes" },
    { value: "educational", label: "Educational" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "announcement", label: "Announcement" },
  ];

  const tones = [
    { value: "casual", label: "Casual & Friendly" },
    { value: "professional", label: "Professional" },
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
      setError("Please provide a description for your content");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(
        "https://sologram-api.onrender.com/api/admin/ai-content/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate content");
      }

      setGeneratedContent(data.data);
      toast.success("Content generated successfully!", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.border}`,
        },
      });
    } catch (error) {
      setError(
        error.message || "Failed to generate content. Please try again."
      );
      toast.error("Failed to generate content", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.error,
          border: `1px solid ${COLORS.error}30`,
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApplyContent(generatedContent);
      onClose();
      // Reset modal state
      setGeneratedContent(null);
      setFormData({
        description: "",
        contentType: "general",
        tone: "casual",
        additionalContext: "",
      });
      setError("");
    }
  };

  const handleClose = () => {
    onClose();
    // Reset modal state
    setGeneratedContent(null);
    setFormData({
      description: "",
      contentType: "general",
      tone: "casual",
      additionalContext: "",
    });
    setError("");
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>✨ Generate AI Content</h3>
          <CloseButton onClick={handleClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label>Content Description *</Label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what your post is about... (e.g., 'New product launch - innovative wireless headphones')"
              maxLength="500"
            />
            <CharCount>{formData.description.length}/500</CharCount>
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
              placeholder="Any additional details, target audience, or specific requirements..."
              maxLength="200"
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
                <ContentLabel>Title</ContentLabel>
                <ContentBox>{generatedContent.title}</ContentBox>
              </ContentPreview>

              <ContentPreview>
                <ContentLabel>Caption</ContentLabel>
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

// Styled Components (keeping your existing styles, adding new ones for AI modal)
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 4px 15px ${COLORS.shadow};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.primaryMint}20;

  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px ${COLORS.shadow};
  }
`;

const PageTitle = styled.div`
  text-align: center;
  margin-bottom: 20px;
  color: ${COLORS.primaryBlueGray};

  h1 {
    font-size: 24px;
    margin-bottom: 5px;
    font-weight: 700;
  }

  p {
    color: ${COLORS.textSecondary};
    font-size: 14px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 15px;
  border-bottom: 2px solid ${COLORS.primarySalmon}20;

  h1 {
    flex-grow: 1;
    text-align: center;
    font-size: 20px;
    color: ${COLORS.primaryBlueGray};
    margin: 0;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding-bottom: 10px;
  }
`;

// AI Modal Styled Components
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

const FormGroup = styled.div`
  margin-bottom: 1rem;
  position: relative;

  &:first-of-type {
    border-top: 1px solid ${COLORS.primaryMint}20;
    padding-top: 15px;
  }
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

// Enhanced form components for details section
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

// Your existing styled components continue here...
const MediaSection = styled.div`
  margin-top: 35px;
`;

const DropArea = styled.div`
  border: 2px dashed ${COLORS.primaryMint};
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.background}85;

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primaryKhaki}15;
    transform: translateY(-2px);
  }

  p {
    margin: 15px 0;
    color: ${COLORS.textSecondary};
    max-width: 80%;
    line-height: 1.5;
  }
`;

const UploadIcon = styled.div`
  display: flex;
  gap: 20px;
  font-size: 40px;
  color: ${COLORS.primaryBlueGray};

  svg {
    transition: transform 0.3s, color 0.3s;
  }

  ${DropArea}:hover & svg {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 25px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 500px;
`;

const MediaButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: ${COLORS.cardBackground};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.primaryMint}40;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 5px ${COLORS.shadow};

  &:hover {
    transform: translateY(-2px);
    border-color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primaryKhaki}10;
    box-shadow: 0 4px 8px ${COLORS.primarySalmon}20;
  }

  &:active {
    transform: translateY(1px);
  }

  svg {
    font-size: 18px;
    transition: transform 0.2s ease;
  }
`;

const CameraButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primarySalmon};
  }
`;

const VideoCameraButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryBlueGray};
  }
`;

const GalleryButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryMint};
  }
`;

// Continue with all your existing styled components...
// (I'll include the essential ones for the functionality)

// Continue with all your existing styled components...
// (I'll include the essential ones for the functionality)

const MediaPreview = styled.div`
  margin-bottom: ${(props) => (props.small ? "20px" : "30px")};
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 600px;
  background-color: ${COLORS.background};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  border: 1px solid ${COLORS.primaryMint}20;

  @media (max-width: 768px) {
    border-radius: 8px;
    margin: 0 auto 15px;
    width: 100%;
  }
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;

  &.filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale {
    filter: grayscale(1);
  }

  &.filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  &.filter-clarendon {
    filter: contrast(1.2) saturate(1.35);
  }

  &.filter-gingham {
    filter: brightness(1.05) hue-rotate(-10deg) sepia(0.2);
  }

  &.filter-moon {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }

  &.filter-lark {
    filter: brightness(1.1) contrast(0.9) saturate(1.1);
  }
`;

const VideoPreview = styled.video`
  max-width: 100%;
  max-height: 100%;

  &.filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale {
    filter: grayscale(1);
  }

  &.filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  &.filter-clarendon {
    filter: contrast(1.2) saturate(1.35);
  }

  &.filter-gingham {
    filter: brightness(1.05) hue-rotate(-10deg) sepia(0.2);
  }

  &.filter-moon {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }

  &.filter-lark {
    filter: brightness(1.1) contrast(0.9) saturate(1.1);
  }
`;

const UploadOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
`;

const UploadProgress = styled.div`
  width: 80%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const UploadProgressInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background-color: ${COLORS.primarySalmon};
  transition: width 0.3s;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(244, 67, 54, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;

  button {
    background: white;
    color: ${COLORS.error};
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    margin-top: 10px;
    cursor: pointer;
    font-weight: bold;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${COLORS.primarySalmon};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  z-index: 3;
  transition: background-color 0.2s, transform 0.2s;

  &:hover {
    background: ${COLORS.error};
    transform: scale(1.05);
  }
`;

const NavigationButtons = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 3;
`;

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${COLORS.primaryBlueGray};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s, background-color 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${COLORS.primarySalmon};
    transform: scale(1.05);
  }
`;

const MediaCounter = styled.div`
  background: ${COLORS.primaryMint};
  color: ${COLORS.textPrimary};
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: ${COLORS.cardBackground};
  border-top: 1px solid ${COLORS.primarySalmon}20;
  border-bottom: 1px solid ${COLORS.primarySalmon}20;
  padding: 12px 0;
  margin: 15px -10px;
  position: sticky;
  bottom: 0;
  z-index: 10;
  border-radius: 8px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.primaryBlueGray};

  svg {
    font-size: 20px;
    margin-bottom: 4px;
  }

  span {
    font-size: 11px;
    font-weight: 500;
  }

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const FilterOptions = styled.div`
  margin-top: 20px;
`;

const FiltersGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 15px;
  padding: 15px 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background-color: ${COLORS.background}50;
  border-radius: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    padding-bottom: 15px;
  }
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: ${(props) => (props.active ? 1 : 0.7)};
  transform: ${(props) => (props.active ? "scale(1.05)" : "scale(1)")};
  transition: all 0.2s ease;

  span {
    margin-top: 8px;
    font-size: 12px;
    color: ${(props) =>
      props.active ? COLORS.primarySalmon : COLORS.textSecondary};
    font-weight: ${(props) => (props.active ? "600" : "normal")};
  }

  &:hover {
    opacity: 1;
  }
`;

const FilterPreview = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  border: 2px solid
    ${(props) => (props.active ? COLORS.primarySalmon : "transparent")};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.filter-warm img {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool img {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale img {
    filter: grayscale(1);
  }

  &.filter-vintage img {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  &.filter-clarendon img {
    filter: contrast(1.2) saturate(1.35);
  }

  &.filter-gingham img {
    filter: brightness(1.05) hue-rotate(-10deg) sepia(0.2);
  }

  &.filter-moon img {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }

  &.filter-lark img {
    filter: brightness(1.1) contrast(0.9) saturate(1.1);
  }
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 3px;
  margin: 10px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => props.percent || 0}%;
  background-color: ${COLORS.primarySalmon};
  transition: width 0.3s ease;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.primaryMint}30;
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 2px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${COLORS.primaryMint}30;
  border-radius: 4px;
  background-color: ${COLORS.elevatedBackground};
  overflow: hidden;
  transition: all 0.2s;

  &:focus-within {
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 2px ${COLORS.primarySalmon}20;
  }

  svg {
    color: ${COLORS.primarySalmon};
    margin: 0 12px;
    font-size: 18px;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 0 12px 0;

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }
`;

const NextButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  background: transparent;
  color: ${COLORS.primarySalmon};
  border: none;
  padding: 0 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? "0.5" : "1")};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const BackButton = styled.button`
  position: absolute;
  left: 0;
  top: 0;
  background: transparent;
  color: ${COLORS.primaryBlueGray};
  border: none;
  padding: 0 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    color: ${COLORS.textPrimary};
  }
`;

const PublishButton = styled.button`
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  width: 100%;
  margin-top: 20px;
  box-shadow: 0 2px 8px ${COLORS.primarySalmon}30;

  &:disabled {
    background-color: ${COLORS.elevatedBackground};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    position: sticky;
    bottom: 0;
    border-radius: 0;
  }
`;

// Main component with AI integration
function PostCreator({ initialData = null, isEditing = false }) {
  // Component state
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState(initialData?.title || "");
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [location, setLocation] = useState(initialData?.location || "");
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeAction, setActiveAction] = useState("filter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [eventDate, setEventDate] = useState(() => {
    const rawDate = initialData?.date || new Date().toISOString();
    return rawDate.split("T")[0];
  });
  const [showAIModal, setShowAIModal] = useState(false);

  const navigate = useNavigate();
  const inputFileRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoCameraInputRef = useRef(null);
  const { startUpload, mountedRef } = useUploadManager(setMedia);
  const { user } = useContext(AuthContext);

  // Handle AI content application
  const handleAIContentApply = (generatedContent) => {
    // Apply title
    if (generatedContent.title) {
      setTitle(generatedContent.title);
    }

    // Apply caption
    if (generatedContent.caption) {
      setCaption(generatedContent.caption);
    }

    // Add suggested tags (limit to available slots)
    if (generatedContent.tags && generatedContent.tags.length > 0) {
      const availableSlots = 5 - tags.length;
      const newTags = generatedContent.tags.slice(0, availableSlots);
      setTags((prev) => [...prev, ...newTags]);

      if (newTags.length > 0) {
        toast.success(`Applied content with ${newTags.length} tags!`, {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
          },
        });
      } else {
        toast.success("Content applied!", {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
          },
        });
      }
    } else {
      toast.success("Content applied!", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.border}`,
        },
      });
    }
  };

  // Instagram-like filters
  const filters = [
    { id: "none", name: "Normal", className: "" },
    { id: "clarendon", name: "Clarendon", className: "filter-clarendon" },
    { id: "gingham", name: "Gingham", className: "filter-gingham" },
    { id: "moon", name: "Moon", className: "filter-moon" },
    { id: "lark", name: "Lark", className: "filter-lark" },
    { id: "warm", name: "Warm", className: "filter-warm" },
    { id: "cool", name: "Cool", className: "filter-cool" },
    { id: "bw", name: "B&W", className: "filter-grayscale" },
    { id: "vintage", name: "Vintage", className: "filter-vintage" },
  ];

  // Tag management functions
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
      // Remove last tag when backspacing on empty input
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    // Prevent spaces from being typed (since space creates tags)
    if (value.includes(" ")) {
      // Extract the tag before the space and create it
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

  // Load existing media when editing
  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const existingMedia = initialData.media.map((item) => {
        const filter = item.filter || "none";
        const filterClass =
          filters.find((f) => f.id === filter)?.className || "";

        return {
          id:
            item._id ||
            `existing_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 8)}`,
          _id: item._id,
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.mediaType,
          filter: filter,
          filterClass: filterClass,
          isExisting: true,
          uploading: false,
          error: false,
        };
      });

      setMedia(existingMedia);
    }
  }, [isEditing, initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      // Revoke object URLs to prevent memory leaks
      media.forEach((item) => {
        if (item.previewUrl && !item.isExisting) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (err) {
            console.error("Failed to revoke URL:", err);
          }
        }
      });
    };
  }, [media]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const uniqueFiles = acceptedFiles.filter((file) => {
        const isDuplicate = media.some(
          (m) =>
            m.file?.name === file.name &&
            m.file?.size === file.size &&
            m.file?.lastModified === file.lastModified
        );

        if (isDuplicate) {
          toast.error(`File "${file.name}" is already added.`);
          return false;
        }
        return true;
      });

      if (uniqueFiles.length === 0) return;

      // Add all files to the media array first
      const newItems = uniqueFiles.map((file) => {
        const id = `media_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        const isVideo = file.type.startsWith("video/");
        const objectUrl = URL.createObjectURL(file);

        console.log(
          `Processing ${isVideo ? "video" : "image"}: ${file.name}, type: ${
            file.type
          }`
        );

        return {
          id,
          file,
          previewUrl: objectUrl,
          type: isVideo ? "video" : "image",
          mediaType: isVideo ? "video" : "image",
          filter: "none",
          filterClass: "",
          uploading: true,
          progress: 0,
          error: false,
        };
      });

      setMedia((prev) => [...prev, ...newItems]);

      // Then start uploads for each item
      newItems.forEach((item) => {
        startUpload(item.file, item.id, item.type)
          .then((result) => {
            console.log(`Upload complete for ${item.id}:`, result);
          })
          .catch((error) => {
            console.error(`Upload failed for ${item.id}:`, error);
          });
      });
    },
    [media, startUpload]
  );

  // Configure dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    onDrop,
    maxSize: 25 * 1024 * 1024, // 25MB
  });

  // Handle camera capture
  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    console.log(`Camera capture - File: ${file.name}, Type: ${file.type}`);

    const isDuplicate = media.some(
      (m) =>
        m.file?.name === file.name &&
        m.file?.size === file.size &&
        m.file?.lastModified === file.lastModified
    );

    if (isDuplicate) {
      toast.error(`File "${file.name}" is already added.`);
      return;
    }

    const id = `camera_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const isVideo = file.type.startsWith("video/");
    const objectUrl = URL.createObjectURL(file);
    const mediaType = isVideo ? "video" : "image";

    console.log(`Camera captured a ${mediaType}: ${file.name}`);

    // First add the file to the media list
    setMedia((current) => [
      ...current,
      {
        id,
        file,
        previewUrl: objectUrl,
        type: mediaType,
        mediaType: mediaType,
        filter: "none",
        filterClass: "",
        uploading: true,
        progress: 0,
        error: false,
      },
    ]);

    // Then start the upload with explicit file type
    try {
      const result = await startUpload(file, id, mediaType);
      console.log(`Upload completed successfully:`, result);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Navigation between media items
  const showPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const showNext = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Apply filter to current media
  const applyFilter = (filterId) => {
    setActiveFilter(filterId);

    // Find the class name associated with this filter ID
    const filterClass = filters.find((f) => f.id === filterId)?.className || "";

    // Update the filter on the current media item
    setMedia((currentMedia) =>
      currentMedia.map((item, index) =>
        index === currentIndex
          ? { ...item, filter: filterId, filterClass }
          : item
      )
    );
  };

  // Remove media item
  const removeMedia = (indexToRemove) => {
    // Remove the item
    setMedia((current) => {
      const newMedia = current.filter((_, index) => index !== indexToRemove);

      // Adjust current index if needed
      if (currentIndex >= newMedia.length) {
        setCurrentIndex(Math.max(0, newMedia.length - 1));
      }

      return newMedia;
    });
  };

  const totalProgress = media.length
    ? Math.round(
        media.reduce((sum, item) => sum + (item.progress || 0), 0) /
          media.length
      )
    : 0;

  // Submit the post
  const handleSubmit = async () => {
    if (media.length === 0) {
      toast.error("Please add at least one photo or video");
      return;
    }

    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }

    // Check for any uploads still in progress
    if (media.some((item) => item.uploading)) {
      toast.error("Please wait for uploads to complete");
      return;
    }

    // Check for any failed uploads
    const failedItems = media.filter((item) => item.error);
    if (failedItems.length > 0) {
      toast.error(
        `Please remove ${failedItems.length} failed upload(s) before continuing`
      );
      return;
    }

    // Make sure all media items have the required properties
    const incompleteItems = media.filter(
      (item) => !item.mediaUrl || !item.cloudinaryId
    );

    if (incompleteItems.length > 0) {
      toast.error(
        `${incompleteItems.length} media item(s) failed to upload properly`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the media items for submission
      const mediaItems = media
        .filter((item) => !item.error && !item.isExisting)
        .map((item) => ({
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.mediaType || item.type,
          filter: item.filter || "none",
        }));

      console.log("Submitting media items:", mediaItems);

      // Create the payload with all required fields
      const payload = {
        title: title ?? "",
        caption: caption ?? "",
        content: content ?? "",
        tags: tags.join(","),
        media: mediaItems,
        location: location ?? "",
        date: eventDate,
      };

      console.log("Submitting post payload:", payload);

      let response;

      if (isEditing) {
        // Add existing media IDs to keep
        const existingMediaIds = media
          .filter((item) => item.isExisting && item._id)
          .map((item) => item._id)
          .join(",");

        if (existingMediaIds) {
          payload.keepMedia = existingMediaIds;
        }

        response = await axios.put(`/api/posts/${initialData._id}`, payload);
        toast.success("Post updated successfully!");
      } else {
        response = await axios.post("/api/posts", payload);
        toast.success("Post created successfully!");
      }

      console.log("Server response:", response.data);
      navigate(`/post/${response.data.data._id}`);
    } catch (error) {
      console.error("Error creating/updating post:", error);
      const errorMessage = error.response?.data?.message || "Please try again";
      toast.error(
        `Failed to ${isEditing ? "update" : "create"} post: ${errorMessage}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate("/");
  };

  // Render the enhanced UI with AI integration
  return (
    <Container>
      <PageTitle>
        <h1>{isEditing ? "Edit Post" : "Create New Post"}</h1>
        <p>Share your moments with SoloGram</p>
      </PageTitle>

      <Header>
        {step === 1 ? (
          <>
            <h1>Select Media</h1>
            {media.length > 0 && (
              <NextButton
                onClick={() => setStep(2)}
                disabled={media.some(
                  (item) => !item.mediaUrl || item.uploading
                )}
              >
                Next
              </NextButton>
            )}
          </>
        ) : (
          <>
            <BackButton onClick={() => setStep(1)}>Back</BackButton>
            <h1>Post Details</h1>
            <NextButton
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !title.trim() ||
                !caption.trim() ||
                media.length === 0 ||
                media.some((item) => item.uploading)
              }
            >
              {isSubmitting ? "Sharing..." : "Share"}
            </NextButton>
          </>
        )}
      </Header>

      {step === 1 ? (
        <MediaSection>
          {media.length === 0 ? (
            <DropArea {...getRootProps()}>
              <input {...getInputProps()} ref={inputFileRef} />
              <UploadIcon>
                <FaImage />
                <FaVideo />
              </UploadIcon>
              <p>Create a new post by uploading your photos and videos</p>
              <ButtonGroup>
                <CameraButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cameraInputRef.current) {
                      cameraInputRef.current.accept = "image/*";
                      cameraInputRef.current.capture = "environment";
                      cameraInputRef.current.click();
                    }
                  }}
                >
                  <FaCamera />
                  <span>Camera</span>
                </CameraButton>
                <VideoCameraButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoCameraInputRef.current) {
                      videoCameraInputRef.current.accept = "video/*";
                      videoCameraInputRef.current.capture = "environment";
                      videoCameraInputRef.current.click();
                    }
                  }}
                >
                  <FaVideo />
                  <span>Video</span>
                </VideoCameraButton>
                <GalleryButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const galleryInput = document.createElement("input");
                    galleryInput.type = "file";
                    galleryInput.accept = "image/*,video/*";
                    galleryInput.multiple = true;
                    galleryInput.style.display = "none";

                    galleryInput.onchange = (event) => {
                      if (event.target.files?.length) {
                        onDrop(Array.from(event.target.files));
                      }
                    };

                    document.body.appendChild(galleryInput);
                    galleryInput.click();

                    setTimeout(() => {
                      document.body.removeChild(galleryInput);
                    }, 1000);
                  }}
                >
                  <FaImage />
                  <span>Gallery</span>
                </GalleryButton>
              </ButtonGroup>
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleCameraCapture}
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
              />
              <input
                type="file"
                ref={videoCameraInputRef}
                onChange={handleCameraCapture}
                accept="video/*"
                capture="environment"
                style={{ display: "none" }}
              />
            </DropArea>
          ) : (
            <>
              <MediaPreview>
                {media.some((item) => item.uploading) && (
                  <div style={{ margin: "15px 0" }}>
                    <ProgressBar>
                      <ProgressFill percent={totalProgress} />
                    </ProgressBar>
                    <div
                      style={{
                        textAlign: "center",
                        color: COLORS.primaryBlueGray,
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Uploading... {totalProgress}%
                    </div>
                  </div>
                )}

                <PreviewContainer>
                  {media[currentIndex].type === "video" ||
                  media[currentIndex].mediaType === "video" ? (
                    <VideoPreview
                      src={
                        media[currentIndex].mediaUrl ||
                        media[currentIndex].previewUrl
                      }
                      className={
                        media[currentIndex].filterClass ||
                        filters.find((f) => f.id === media[currentIndex].filter)
                          ?.className ||
                        ""
                      }
                      controls
                      playsInline
                      onError={(e) => {
                        console.error("Video error:", e);
                        e.target.src = PLACEHOLDER_IMG;
                      }}
                    />
                  ) : (
                    <ImagePreview
                      src={
                        media[currentIndex].mediaUrl ||
                        media[currentIndex].previewUrl
                      }
                      className={
                        media[currentIndex].filterClass ||
                        filters.find((f) => f.id === media[currentIndex].filter)
                          ?.className ||
                        ""
                      }
                      alt="Preview"
                      onError={(e) => {
                        console.error("Image error:", e);
                        e.target.src = PLACEHOLDER_IMG;
                      }}
                    />
                  )}

                  {media[currentIndex].uploading && (
                    <UploadOverlay>
                      <UploadProgress>
                        <UploadProgressInner
                          width={media[currentIndex].progress}
                        />
                      </UploadProgress>
                      <p>Uploading... {media[currentIndex].progress}%</p>
                    </UploadOverlay>
                  )}
                  {media[currentIndex].error && (
                    <ErrorOverlay>
                      <p>Upload failed</p>
                      {media[currentIndex].errorMessage && (
                        <p style={{ fontSize: "12px", marginTop: "5px" }}>
                          {media[currentIndex].errorMessage}
                        </p>
                      )}
                      <button onClick={() => removeMedia(currentIndex)}>
                        Remove
                      </button>
                    </ErrorOverlay>
                  )}
                  <RemoveButton onClick={() => removeMedia(currentIndex)}>
                    <FaTimes />
                  </RemoveButton>
                  {media.length > 1 && (
                    <NavigationButtons>
                      <NavButton
                        onClick={showPrevious}
                        disabled={currentIndex === 0}
                      >
                        <FaArrowLeft />
                      </NavButton>
                      <MediaCounter>
                        {currentIndex + 1} / {media.length}
                      </MediaCounter>
                      <NavButton
                        onClick={showNext}
                        disabled={currentIndex === media.length - 1}
                      >
                        <FaArrowRight />
                      </NavButton>
                    </NavigationButtons>
                  )}
                </PreviewContainer>
              </MediaPreview>

              {/* Action Bar */}
              <ActionBar>
                <ActionButton
                  active={activeAction === "filter"}
                  onClick={() => setActiveAction("filter")}
                >
                  <FaFilter />
                  <span>Filter</span>
                </ActionButton>
                <ActionButton
                  active={activeAction === "add"}
                  onClick={() => {
                    setActiveAction("add");
                    const galleryInput = document.createElement("input");
                    galleryInput.type = "file";
                    galleryInput.accept = "image/*,video/*";
                    galleryInput.multiple = true;
                    galleryInput.style.display = "none";

                    galleryInput.onchange = (event) => {
                      if (event.target.files?.length) {
                        onDrop(Array.from(event.target.files));
                      }
                    };

                    document.body.appendChild(galleryInput);
                    galleryInput.click();

                    setTimeout(() => {
                      document.body.removeChild(galleryInput);
                    }, 1000);
                  }}
                >
                  <FaImage />
                  <span>Add</span>
                </ActionButton>
              </ActionBar>

              {activeAction === "filter" && (
                <FilterOptions>
                  <FiltersGrid>
                    {filters.map((filter) => (
                      <FilterItem
                        key={filter.id}
                        active={media[currentIndex].filter === filter.id}
                        onClick={() => applyFilter(filter.id)}
                      >
                        <FilterPreview
                          className={filter.className}
                          active={media[currentIndex].filter === filter.id}
                        >
                          <img
                            src={
                              media[currentIndex].mediaUrl ||
                              media[currentIndex].previewUrl
                            }
                            alt={filter.name}
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_IMG;
                            }}
                          />
                        </FilterPreview>
                        <span>{filter.name}</span>
                      </FilterItem>
                    ))}
                  </FiltersGrid>
                </FilterOptions>
              )}
            </>
          )}
        </MediaSection>
      ) : (
        <div style={{ margin: "20px 0" }}>
          {/* Enhanced Post Details Section with AI Integration */}

          {/* Title field with AI assist */}
          <FormGroup>
            <ContentHeader>
              <Label>Post Title *</Label>
              <AIButton
                type="button"
                onClick={() => setShowAIModal(true)}
                title="Generate content with AI"
              >
                <FaRobot />
                <span>AI Assist</span>
              </AIButton>
            </ContentHeader>
            <InputGroup>
              <FaPencilAlt />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title for your post"
                maxLength={100}
                required
              />
            </InputGroup>
            <CharCount overLimit={title.length > 80}>
              {title.length}/100
            </CharCount>
          </FormGroup>

          {/* Date field */}
          <FormGroup>
            <Label>Event Date</Label>
            <InputGroup>
              <FaCalendarDay />
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </InputGroup>
          </FormGroup>

          {/* Caption field */}
          <FormGroup>
            <Label>Caption *</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              maxLength={2200}
              required
            />
            <CharCount overLimit={caption.length > 2000}>
              {caption.length}/2200
            </CharCount>
          </FormGroup>

          {/* Location field */}
          <FormGroup>
            <Label>Location</Label>
            <InputGroup>
              <FaLocationArrow />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
              />
            </InputGroup>
          </FormGroup>

          {/* Tags field */}
          <FormGroup>
            <Label>Tags</Label>
            <InputGroup>
              <FaTag />
              <div style={{ position: "relative", width: "100%" }}>
                <Input
                  value={currentTag}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type tags and press space to add..."
                  maxLength={30}
                  style={{ paddingRight: currentTag.trim() ? "80px" : "12px" }}
                />
                {currentTag.trim() && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "12px",
                      transform: "translateY(-50%)",
                      background: `${COLORS.primarySalmon}15`,
                      color: COLORS.primarySalmon,
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                      border: `1px solid ${COLORS.primarySalmon}30`,
                      pointerEvents: "none",
                    }}
                  >
                    #{currentTag.trim()}
                  </div>
                )}
              </div>
            </InputGroup>

            {tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "8px",
                  padding: "12px",
                  backgroundColor: COLORS.elevatedBackground,
                  borderRadius: "8px",
                  border: `1px dashed ${COLORS.primaryMint}30`,
                  minHeight: "48px",
                }}
              >
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: `${COLORS.primarySalmon}20`,
                      color: COLORS.primarySalmon,
                      padding: "6px 12px",
                      borderRadius: "16px",
                      fontSize: "14px",
                      fontWeight: "500",
                      border: `1px solid ${COLORS.primarySalmon}30`,
                    }}
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        padding: "0",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormGroup>

          {/* Additional content field */}
          <FormGroup>
            <Label>Additional Content</Label>
            <InputGroup>
              <FaPencilAlt />
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add additional content (optional)"
              />
            </InputGroup>
          </FormGroup>

          {/* Publish Button */}
          <PublishButton
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !title.trim() ||
              !caption.trim() ||
              media.length === 0 ||
              media.some((item) => item.uploading)
            }
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Sharing..."
              : isEditing
              ? "Update Post"
              : "Share Post"}
          </PublishButton>
        </div>
      )}

      {/* AI Content Generator Modal */}
      <AIContentModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplyContent={handleAIContentApply}
      />
    </Container>
  );
}

export default PostCreator;
