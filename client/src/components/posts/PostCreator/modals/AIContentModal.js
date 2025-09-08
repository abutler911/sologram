import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  FormGroup,
  Label,
  Select,
  InputRow,
  Input,
  ErrorMessage,
  GenerateButton,
  LoadingSpinner,
  GeneratedSection,
  SectionTitle,
  ContentPreview,
  ContentLabel,
  ContentBox,
  TagsPreview,
  TagPreview,
  ButtonRow,
  SecondaryButton,
  ApplyButton,
} from "../../PostCreator.styles";
import { FaTimes, FaMagic } from "react-icons/fa";

export default function AIContentModal({ isOpen, onClose, onApplyContent }) {
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

  if (!isOpen) return null;

  const onChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!formData.description.trim()) {
      setError("Please provide a description for your content");
      return;
    }
    setIsGenerating(true);
    setError("");

    try {
      const { data } = await axios.post(
        "/api/admin/ai-content/generate",
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setGeneratedContent(data?.data);
      toast.success("Content generated successfully!");
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Something went wrong."
      );
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedContent) return;
    onApplyContent(generatedContent);
    onClose();
    setGeneratedContent(null);
    setFormData({
      description: "",
      contentType: "general",
      tone: "casual",
      additionalContext: "",
    });
    setError("");
  };

  const handleClose = () => {
    onClose();
    setGeneratedContent(null);
    setFormData({
      description: "",
      contentType: "general",
      tone: "casual",
      additionalContext: "",
    });
    setError("");
  };

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
              onChange={onChange}
              placeholder="Describe what your post is about..."
              maxLength="500"
            />
            <div style={{ textAlign: "right", fontSize: 12 }}>
              {formData.description.length}/500
            </div>
          </FormGroup>

          <InputRow>
            <FormGroup>
              <Label>Content Type</Label>
              <Select
                name="contentType"
                value={formData.contentType}
                onChange={onChange}
              >
                {contentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Tone</Label>
              <Select name="tone" value={formData.tone} onChange={onChange}>
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
              onChange={onChange}
              placeholder="Any additional details..."
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

              {generatedContent.tags?.length > 0 && (
                <ContentPreview>
                  <ContentLabel>Suggested Tags</ContentLabel>
                  <TagsPreview>
                    {generatedContent.tags.map((tag, i) => (
                      <TagPreview key={`${tag}-${i}`}>#{tag}</TagPreview>
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
}
