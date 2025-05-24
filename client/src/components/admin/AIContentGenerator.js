import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaRobot,
  FaLightbulb,
  FaEdit,
  FaHistory,
  FaCopy,
  FaSave,
  FaMagic,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { COLORS, THEME } from "../../theme";

// Styled Components matching SoloGram design system
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  color: ${COLORS.textPrimary};
  display: flex;
  flex-direction: column;

  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const AppHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${THEME.header.background};
  position: sticky;
  top: 0;
  z-index: 10;
  color: ${THEME.header.text};
  box-shadow: 0 2px 8px ${COLORS.shadow};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${THEME.header.icon};
  font-size: 1.25rem;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 8px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateX(-2px);
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  text-align: center;
  color: ${THEME.header.text};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const HeaderAction = styled.button`
  background: none;
  border: none;
  color: ${COLORS.accentMint};
  font-weight: 600;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  border-radius: 6px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: ${COLORS.accentSalmon};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding: 16px;
  gap: 20px;
`;

const Card = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  overflow: hidden;
  box-shadow: 0 2px 8px ${COLORS.shadow};
`;

const CardHeader = styled.div`
  padding: 16px 20px;
  background: ${COLORS.elevatedBackground};
  border-bottom: 1px solid ${COLORS.border};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const CardBody = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${COLORS.textSecondary};
  margin-bottom: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 3px ${COLORS.primaryMint}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const Select = styled.select`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 0 0 3px ${COLORS.primaryMint}20;
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CharacterCount = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
  text-align: right;
  margin-top: 4px;
`;

const ErrorMessage = styled.div`
  background: ${COLORS.error}15;
  border: 1px solid ${COLORS.error}30;
  color: ${COLORS.error};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GenerateButton = styled.button`
  width: 100%;
  background: ${THEME.button.action.background};
  color: ${THEME.button.action.text};
  border: none;
  border-radius: 8px;
  padding: 14px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: ${THEME.button.action.hoverBackground};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${COLORS.primarySalmon}30;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const SecondaryButton = styled.button`
  flex: 1;
  background: ${THEME.button.secondary.background};
  color: ${THEME.button.secondary.text};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: ${THEME.button.secondary.hoverBackground};
    border-color: ${COLORS.primaryMint};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled.button`
  flex: 1;
  background: ${COLORS.primaryMint};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: ${COLORS.accentMint};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GeneratedContentCard = styled(Card)`
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
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

const ContentSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ContentLabel = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  margin: 0;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primaryMint};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${COLORS.primaryMint}20;
    color: ${COLORS.primaryBlueGray};
  }

  &.copied {
    color: ${COLORS.success};
  }
`;

const ContentBox = styled.div`
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px;
  color: ${COLORS.textPrimary};
  white-space: pre-wrap;
  line-height: 1.5;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  background: ${COLORS.primaryMint}20;
  color: ${COLORS.primaryBlueGray};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const HistoryToggle = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primaryMint};
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  transition: color 0.2s ease;

  &:hover {
    color: ${COLORS.primaryBlueGray};
  }
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${COLORS.elevatedBackground};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border};
    border-radius: 2px;
  }
`;

const HistoryItem = styled.div`
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 2px 8px ${COLORS.shadow};
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const HistoryTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0;
  flex: 1;
`;

const HistoryDate = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
`;

const HistoryDescription = styled.p`
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
  margin: 4px 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HistoryTags = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const HistoryTag = styled.span`
  background: ${COLORS.border};
  color: ${COLORS.textSecondary};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
`;

const UseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primaryMint};
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s ease;

  &:hover {
    color: ${COLORS.primaryBlueGray};
    text-decoration: underline;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${COLORS.textTertiary};
`;

const AIContentGenerator = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const textareaRef = useRef(null);

  const [formData, setFormData] = useState({
    description: "",
    contentType: "general",
    tone: "casual",
    additionalContext: "",
  });

  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentHistory, setContentHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const [copiedStates, setCopiedStates] = useState({});

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

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      toast.error("You need admin access to use this feature");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.description]);

  // Fetch history when toggled
  useEffect(() => {
    if (showHistory) {
      fetchContentHistory();
    }
  }, [showHistory]);

  const fetchContentHistory = async () => {
    try {
      const response = await fetch(
        "https://sologram-api.onrender.com/api/admin/ai-content/history",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        console.warn("History API not available");
        setContentHistory([]);
        return;
      }

      const data = await response.json();
      setContentHistory(data.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setContentHistory([]);
    }
  };

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

  const handleSaveContent = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        "https://sologram-api.onrender.com/api/admin/ai-content/save",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...generatedContent,
            originalDescription: formData.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      toast.success("Content saved to history!", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.border}`,
        },
      });

      if (showHistory) {
        fetchContentHistory();
      }
    } catch (error) {
      toast.error("Failed to save content", {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.error,
          border: `1px solid ${COLORS.error}30`,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyField = async (content, fieldName) => {
    try {
      await navigator.clipboard.writeText(content);

      setCopiedStates((prev) => ({ ...prev, [fieldName]: true }));

      toast.success(`${fieldName} copied to clipboard!`, {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.border}`,
        },
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [fieldName]: false }));
      }, 2000);
    } catch (error) {
      toast.error(`Failed to copy ${fieldName.toLowerCase()}`, {
        style: {
          background: COLORS.cardBackground,
          color: COLORS.error,
          border: `1px solid ${COLORS.error}30`,
        },
      });
    }
  };

  const handleUseContent = (content) => {
    const contentText = `Title: ${content.title}\n\nCaption: ${
      content.caption
    }\n\nTags: ${content.tags?.map((tag) => `#${tag}`).join(" ") || ""}`;

    navigator.clipboard
      .writeText(contentText)
      .then(() => {
        toast.success("Content copied to clipboard!", {
          style: {
            background: COLORS.cardBackground,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
          },
        });
      })
      .catch(() => {
        toast.error("Failed to copy content");
      });
  };

  const resetForm = () => {
    setFormData({
      description: "",
      contentType: "general",
      tone: "casual",
      additionalContext: "",
    });
    setGeneratedContent(null);
    setError("");
    setCopiedStates({});
  };

  const goBack = () => {
    navigate("/");
  };

  return (
    <PageWrapper>
      <AppHeader>
        <BackButton onClick={goBack} aria-label="Go back">
          <FaArrowLeft />
        </BackButton>
        <HeaderTitle>
          <FaRobot />
          AI Content Generator
        </HeaderTitle>
        <HeaderAction onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Hide" : "History"}
        </HeaderAction>
      </AppHeader>

      <MainContent>
        {/* Input Form */}
        <Card>
          <CardHeader>
            <FaEdit color={COLORS.primaryMint} />
            <CardTitle>Generate Content</CardTitle>
          </CardHeader>
          <CardBody>
            <FormGroup>
              <Label>Content Description *</Label>
              <TextArea
                ref={textareaRef}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what your post is about... (e.g., 'New product launch - innovative wireless headphones')"
                rows="3"
                maxLength="500"
                required
              />
              <CharacterCount>
                {formData.description.length}/500 characters
              </CharacterCount>
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
              <TextArea
                name="additionalContext"
                value={formData.additionalContext}
                onChange={handleInputChange}
                placeholder="Any additional details, target audience, or specific requirements..."
                rows="2"
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

            <ButtonRow>
              <SecondaryButton onClick={resetForm}>
                <FaTimes />
                Reset
              </SecondaryButton>
              <HistoryToggle onClick={() => setShowHistory(!showHistory)}>
                <FaHistory />
                {showHistory ? "Hide History" : "Show History"}
              </HistoryToggle>
            </ButtonRow>
          </CardBody>
        </Card>

        {/* Generated Content */}
        {generatedContent && (
          <GeneratedContentCard>
            <CardHeader>
              <FaLightbulb color={COLORS.primarySalmon} />
              <CardTitle>Generated Content</CardTitle>
            </CardHeader>
            <CardBody>
              <ContentSection>
                <ContentHeader>
                  <ContentLabel>Title</ContentLabel>
                  <CopyButton
                    onClick={() =>
                      handleCopyField(generatedContent.title, "Title")
                    }
                    className={copiedStates.Title ? "copied" : ""}
                  >
                    {copiedStates.Title ? <FaCheck /> : <FaCopy />}
                    {copiedStates.Title ? "Copied!" : "Copy"}
                  </CopyButton>
                </ContentHeader>
                <ContentBox>{generatedContent.title}</ContentBox>
              </ContentSection>

              <ContentSection>
                <ContentHeader>
                  <ContentLabel>Caption</ContentLabel>
                  <CopyButton
                    onClick={() =>
                      handleCopyField(generatedContent.caption, "Caption")
                    }
                    className={copiedStates.Caption ? "copied" : ""}
                  >
                    {copiedStates.Caption ? <FaCheck /> : <FaCopy />}
                    {copiedStates.Caption ? "Copied!" : "Copy"}
                  </CopyButton>
                </ContentHeader>
                <ContentBox>{generatedContent.caption}</ContentBox>
              </ContentSection>

              <ContentSection>
                <ContentHeader>
                  <ContentLabel>Tags</ContentLabel>
                  <CopyButton
                    onClick={() =>
                      handleCopyField(
                        generatedContent.tags
                          ?.map((tag) => `#${tag}`)
                          .join(" ") || "",
                        "Tags"
                      )
                    }
                    className={copiedStates.Tags ? "copied" : ""}
                  >
                    {copiedStates.Tags ? <FaCheck /> : <FaCopy />}
                    {copiedStates.Tags ? "Copied!" : "Copy"}
                  </CopyButton>
                </ContentHeader>
                <TagsContainer>
                  {generatedContent.tags?.map((tag, index) => (
                    <Tag key={index}>#{tag}</Tag>
                  ))}
                </TagsContainer>
              </ContentSection>

              <ButtonRow>
                <SecondaryButton
                  onClick={handleSaveContent}
                  disabled={isSaving}
                >
                  {isSaving ? <LoadingSpinner /> : <FaSave />}
                  {isSaving ? "Saving..." : "Save"}
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => handleUseContent(generatedContent)}
                >
                  <FaCopy />
                  Copy All
                </PrimaryButton>
              </ButtonRow>
            </CardBody>
          </GeneratedContentCard>
        )}

        {/* Content History */}
        {showHistory && (
          <Card>
            <CardHeader>
              <FaHistory color={COLORS.primaryBlueGray} />
              <CardTitle>Recent Content</CardTitle>
            </CardHeader>
            <CardBody>
              {contentHistory.length === 0 ? (
                <EmptyState>
                  <FaHistory
                    size={32}
                    style={{ marginBottom: "12px", opacity: 0.5 }}
                  />
                  <p>No content history yet</p>
                  <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                    Generated content will appear here
                  </p>
                </EmptyState>
              ) : (
                <HistoryList>
                  {contentHistory.map((item) => (
                    <HistoryItem key={item._id}>
                      <HistoryHeader>
                        <HistoryTitle>
                          {item.generatedContent?.title || "Untitled"}
                        </HistoryTitle>
                        <HistoryDate>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </HistoryDate>
                      </HistoryHeader>
                      <HistoryDescription>
                        {item.originalDescription}
                      </HistoryDescription>
                      <HistoryTags>
                        <HistoryTag>{item.contentType}</HistoryTag>
                        <HistoryTag>{item.tone}</HistoryTag>
                        {item.used && (
                          <HistoryTag
                            style={{
                              background: COLORS.success + "20",
                              color: COLORS.success,
                            }}
                          >
                            Used
                          </HistoryTag>
                        )}
                      </HistoryTags>
                      <UseButton
                        onClick={() => handleUseContent(item.generatedContent)}
                      >
                        Use this content
                      </UseButton>
                    </HistoryItem>
                  ))}
                </HistoryList>
              )}
            </CardBody>
          </Card>
        )}
      </MainContent>
    </PageWrapper>
  );
};

export default AIContentGenerator;
