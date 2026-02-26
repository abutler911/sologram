import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
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
} from '../../PostCreator.styles';
import { FaTimes, FaMagic } from 'react-icons/fa';

export default function AIContentModal({ isOpen, onClose, onApplyContent }) {
  const [formData, setFormData] = useState({
    description: '',
    contentType: 'photography',
    tone: 'thoughtful',
    additionalContext: '',
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // ── Mirrors AIContentGenerator.js — keep these in sync ───────────────────
  const contentTypes = [
    { value: 'photography', label: 'Photography' },
    { value: 'aviation', label: 'Aviation & Training' },
    { value: 'observation', label: 'Observation' },
    { value: 'music', label: 'Piano & Music' },
    { value: 'travel', label: 'Travel & Utah' },
    { value: 'thought', label: 'Thought' },
    { value: 'reading', label: 'Reading' },
  ];

  const tones = [
    { value: 'thoughtful', label: 'Thoughtful' },
    { value: 'dry', label: 'Dry & Understated' },
    { value: 'reflective', label: 'Reflective' },
    { value: 'observational', label: 'Observational' },
  ];

  if (!isOpen) return null;

  const onChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!formData.description.trim()) {
      setError('Describe what you want to post about');
      return;
    }
    setIsGenerating(true);
    setError('');

    try {
      const { data } = await axios.post(
        '/api/admin/ai-content/generate',
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setGeneratedContent(data?.data);
      toast.success('Content generated!');
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || 'Something went wrong.'
      );
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedContent) return;
    onApplyContent(generatedContent);
    onClose();
    resetForm();
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setGeneratedContent(null);
    setFormData({
      description: '',
      contentType: 'photography',
      tone: 'thoughtful',
      additionalContext: '',
    });
    setError('');
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
            <Label>What do you want to post about? *</Label>
            <Input
              name='description'
              value={formData.description}
              onChange={onChange}
              placeholder='Describe it in your own words...'
              maxLength='500'
            />
            <div style={{ textAlign: 'right', fontSize: 12 }}>
              {formData.description.length}/500
            </div>
          </FormGroup>

          <InputRow>
            <FormGroup>
              <Label>Type</Label>
              <Select
                name='contentType'
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
              <Select name='tone' value={formData.tone} onChange={onChange}>
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </InputRow>

          <FormGroup>
            <Label>Anything else? (Optional)</Label>
            <Input
              name='additionalContext'
              value={formData.additionalContext}
              onChange={onChange}
              placeholder='Mood, specific moment, what caught your eye...'
              maxLength='200'
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
                <LoadingSpinner /> Generating...
              </>
            ) : (
              <>
                <FaMagic /> Generate Content
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
