// client/src/pages/EditThought.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import {
  useThought,
  useUpdateThought,
  useDeleteThought,
} from '../hooks/queries/useThoughts';

// ─── Design tokens — NOIR palette ────────────────────────────────────────────
const NOIR = {
  ink: '#0a0a0b',
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  border: 'rgba(10,10,11,0.08)',
  salmon: '#e87c5a',
  sage: '#7aab8c',
};

const MAX_CONTENT_LENGTH = 280;
const MAX_TAGS = 5;

const EditThought = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: thoughtResponse, isLoading, error } = useThought(id);
  const updateThought = useUpdateThought();
  const deleteThought = useDeleteThought();

  // ── Unwrap API response — same pattern as PostDetail ─────────────────────
  // useThought returns { success: true, data: { _id, content, tags, ... } }
  const thought = thoughtResponse?.data ?? thoughtResponse;

  // ── Seed form once data arrives ───────────────────────────────────────────
  useEffect(() => {
    if (thought) {
      setContent(thought.content || '');
      setTags(thought.tags || []);
    }
  }, [thought]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!isLoading && !isAdmin) {
      navigate('/');
      toast.error("You don't have permission to edit thoughts");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }
    try {
      await updateThought.mutateAsync({
        id,
        payload: {
          content,
          // Backend does JSON.parse(tags) — must send as JSON string
          tags: JSON.stringify(tags),
        },
      });
      // /thoughts/:id doesn't exist as a route — go back to the feed
      navigate('/thoughts');
    } catch {
      // error toast handled in the hook
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await deleteThought.mutateAsync(id);
      navigate('/thoughts');
    } catch {
      // error toast handled in the hook
    }
  };

  // ── Tag helpers ───────────────────────────────────────────────────────────
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (tags.includes(tag)) {
      toast.error(`Tag "${tag}" already added`);
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove) =>
    setTags(tags.filter((t) => t !== tagToRemove));

  const isSubmitting = updateThought.isPending || deleteThought.isPending;
  const remaining = MAX_CONTENT_LENGTH - content.length;
  const nearLimit = remaining <= MAX_CONTENT_LENGTH * 0.1;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingState>
            <LoadingBar />
            <LoadingBar $w='60%' />
            <LoadingBar $w='40%' />
          </LoadingState>
        </Container>
      </PageWrapper>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !thought) {
    return (
      <PageWrapper>
        <Container>
          <ErrorBox>
            <ErrorText>{error?.message || 'Thought not found'}</ErrorText>
            <BackLink to='/thoughts'>
              <FaArrowLeft /> Back to Thoughts
            </BackLink>
          </ErrorBox>
        </Container>
      </PageWrapper>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <Container>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <PageHeader>
          <BackLink to='/thoughts'>
            <FaArrowLeft />
            <span>Thoughts</span>
          </BackLink>
          <PageTitle>Edit Thought</PageTitle>
        </PageHeader>

        {/* ── Form card ───────────────────────────────────────────────────── */}
        <FormCard onSubmit={handleSubmit}>
          {/* Content */}
          <FieldGroup>
            <TextAreaWrapper>
              <ContentArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={MAX_CONTENT_LENGTH}
                required
              />
              <CharCount $warning={nearLimit}>{remaining}</CharCount>
            </TextAreaWrapper>
          </FieldGroup>

          {/* Tags */}
          <FieldGroup>
            <FieldLabel>
              Tags <FieldHint>(optional · up to {MAX_TAGS})</FieldHint>
            </FieldLabel>
            <TagsArea>
              {tags.map((tag, i) => (
                <TagChip key={i}>
                  #{tag}
                  <ChipRemove
                    type='button'
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    <FaTimes />
                  </ChipRemove>
                </TagChip>
              ))}
              {tags.length < MAX_TAGS && (
                <TagInlineInput
                  type='text'
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  placeholder='add tag…'
                />
              )}
            </TagsArea>
          </FieldGroup>

          {/* Actions */}
          <ActionRow>
            <DeleteBtn
              type='button'
              onClick={() => setShowDeleteModal(true)}
              disabled={isSubmitting}
            >
              <FaTrash />
              Delete
            </DeleteBtn>
            <SaveBtn type='submit' disabled={isSubmitting || !content.trim()}>
              <FaCheck />
              {updateThought.isPending ? 'Saving…' : 'Save Changes'}
            </SaveBtn>
          </ActionRow>
        </FormCard>
      </Container>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <ModalBackdrop onClick={() => setShowDeleteModal(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete Thought?</ModalTitle>
            <ModalBody>
              This thought will be permanently removed. This action cannot be
              undone.
            </ModalBody>
            <ModalActions>
              <ModalCancelBtn
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </ModalCancelBtn>
              <ModalConfirmBtn onClick={handleDelete} disabled={isSubmitting}>
                {deleteThought.isPending ? 'Deleting…' : 'Delete'}
              </ModalConfirmBtn>
            </ModalActions>
          </ModalBox>
        </ModalBackdrop>
      )}
    </PageWrapper>
  );
};

export default EditThought;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

const skeletonBg = `
  background: linear-gradient(90deg, ${NOIR.dust} 25%, ${NOIR.warmWhite} 50%, ${NOIR.dust} 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${NOIR.warmWhite};
  padding: 0 0 80px;
  animation: ${fadeUp} 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;

  /* Sidebar offsets — match AppNav */
  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
    box-sizing: border-box;
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
`;

// ─── Header ───────────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 24px;

  /* Gradient accent line top — PostCard signature */
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -20px;
    right: -20px;
    height: 2px;
    background: linear-gradient(90deg, ${NOIR.salmon} 0%, ${NOIR.sage} 100%);
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  text-decoration: none;
  transition: color 0.15s;

  svg {
    width: 10px;
    height: 10px;
  }

  &:hover {
    color: ${NOIR.salmon};
  }
`;

const PageTitle = styled.h1`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.5rem;
  font-weight: 600;
  font-style: italic;
  letter-spacing: -0.02em;
  color: ${NOIR.ink};
  margin: 0;
`;

// ─── Form card ────────────────────────────────────────────────────────────────

const FormCard = styled.form`
  background: ${NOIR.warmWhite};
  border: 1px solid ${NOIR.dust};
  border-top: none; /* header's accent line serves as the top edge */
  padding: 24px 0 0;
`;

const FieldGroup = styled.div`
  margin-bottom: 20px;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  margin-bottom: 8px;
`;

const FieldHint = styled.span`
  font-size: 0.58rem;
  opacity: 0.7;
  text-transform: none;
  letter-spacing: 0;
`;

// ─── Textarea ─────────────────────────────────────────────────────────────────

const TextAreaWrapper = styled.div`
  position: relative;
`;

const ContentArea = styled.textarea`
  width: 100%;
  min-height: 160px;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(10, 10, 11, 0.02);
  border: 1px solid ${NOIR.dust};
  border-radius: 0;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.65;
  color: ${NOIR.charcoal};
  resize: vertical;
  transition: border-color 0.15s;

  &::placeholder {
    color: ${NOIR.ash};
  }

  &:focus {
    outline: none;
    border-color: ${NOIR.salmon};
    background: ${NOIR.warmWhite};
  }
`;

const CharCount = styled.div`
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  color: ${(p) => (p.$warning ? NOIR.salmon : NOIR.ash)};
  pointer-events: none;
`;

// ─── Tags ─────────────────────────────────────────────────────────────────────

const TagsArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid ${NOIR.dust};
  min-height: 44px;
  background: rgba(10, 10, 11, 0.02);
  transition: border-color 0.15s;

  &:focus-within {
    border-color: ${NOIR.salmon};
    background: ${NOIR.warmWhite};
  }
`;

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border: 1px solid ${NOIR.dust};
  color: ${NOIR.ash};
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${NOIR.salmon};
    color: ${NOIR.salmon};
  }
`;

const ChipRemove = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${NOIR.ash};
  font-size: 0.5rem;
  transition: color 0.15s;
  &:hover {
    color: ${NOIR.salmon};
  }
`;

const TagInlineInput = styled.input`
  background: none;
  border: none;
  outline: none;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  color: ${NOIR.charcoal};
  min-width: 100px;
  flex: 1;

  &::placeholder {
    color: ${NOIR.ash};
    font-size: 0.78rem;
  }
`;

// ─── Action row ───────────────────────────────────────────────────────────────

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 0 0;
  border-top: 1px solid ${NOIR.border};
  margin-top: 4px;
`;

const DeleteBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: 1px solid rgba(192, 57, 43, 0.25);
  color: #c0392b;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 9px 16px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  svg {
    width: 11px;
    height: 11px;
  }

  &:hover:not(:disabled) {
    background: rgba(192, 57, 43, 0.06);
    border-color: #c0392b;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const SaveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: ${NOIR.salmon};
  border: 1px solid ${NOIR.salmon};
  color: ${NOIR.warmWhite};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 9px 20px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  svg {
    width: 11px;
    height: 11px;
  }

  &:hover:not(:disabled) {
    background: ${NOIR.charcoal};
    border-color: ${NOIR.charcoal};
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

// ─── Delete modal ─────────────────────────────────────────────────────────────

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 11, 0.55);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalBox = styled.div`
  background: ${NOIR.warmWhite};
  border: 1px solid ${NOIR.dust};
  border-top: 2px solid ${NOIR.salmon};
  max-width: 400px;
  width: 100%;
  padding: 28px 24px 24px;
  box-shadow: 0 20px 60px rgba(10, 10, 11, 0.2);
`;

const ModalTitle = styled.h3`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.4rem;
  font-weight: 600;
  font-style: italic;
  color: ${NOIR.ink};
  margin: 0 0 10px;
`;

const ModalBody = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.88rem;
  line-height: 1.6;
  color: ${NOIR.ash};
  margin: 0 0 24px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ModalCancelBtn = styled.button`
  background: none;
  border: 1px solid ${NOIR.dust};
  color: ${NOIR.ash};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 16px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  &:hover {
    border-color: ${NOIR.ash};
    color: ${NOIR.charcoal};
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ModalConfirmBtn = styled.button`
  background: #c0392b;
  border: 1px solid #c0392b;
  color: ${NOIR.warmWhite};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) {
    background: #96281b;
    border-color: #96281b;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const LoadingState = styled.div`
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LoadingBar = styled.div`
  height: ${(p) => p.$h || '18px'};
  width: ${(p) => p.$w || '100%'};
  ${skeletonBg}
`;

// ─── Error ────────────────────────────────────────────────────────────────────

const ErrorBox = styled.div`
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ErrorText = styled.div`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  color: #c0392b;
  background: rgba(192, 57, 43, 0.06);
  border: 1px solid rgba(192, 57, 43, 0.2);
  padding: 14px 20px;
  text-align: center;
  max-width: 400px;
`;
