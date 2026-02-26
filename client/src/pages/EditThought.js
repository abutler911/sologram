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

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const MAX_CONTENT = 280;
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

  // Unwrap API envelope { success, data: { _id, content, ... } }
  const thought = thoughtResponse?.data ?? thoughtResponse;

  useEffect(() => {
    if (thought) {
      setContent(thought.content || '');
      setTags(thought.tags || []);
    }
  }, [thought]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
    else if (!isLoading && !isAdmin) {
      navigate('/');
      toast.error("You don't have permission to edit thoughts");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }
    try {
      await updateThought.mutateAsync({
        id,
        payload: { content, tags: JSON.stringify(tags) },
      });
      navigate('/thoughts');
    } catch {
      /* handled in hook */
    }
  };

  const handleDelete = async () => {
    try {
      await deleteThought.mutateAsync(id);
      navigate('/thoughts');
    } catch {
      /* handled in hook */
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (tags.includes(tag)) {
      toast.error(`"${tag}" already added`);
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`Max ${MAX_TAGS} tags`);
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));
  const isSubmitting = updateThought.isPending || deleteThought.isPending;
  const remaining = MAX_CONTENT - content.length;
  const nearLimit = remaining <= MAX_CONTENT * 0.1;

  if (isLoading)
    return (
      <Shell>
        <Inner>
          <SkeletonGroup>
            <SkeletonBar $w='30%' $h='12px' />
            <SkeletonBar $w='100%' $h='180px' $mt='28px' />
            <SkeletonBar $w='100%' $h='44px' $mt='12px' />
            <SkeletonBar $w='40%' $h='36px' $mt='24px' />
          </SkeletonGroup>
        </Inner>
      </Shell>
    );

  if (error || !thought)
    return (
      <Shell>
        <Inner>
          <ErrorCard>
            <ErrorMsg>{error?.message || 'Thought not found'}</ErrorMsg>
            <BackLink to='/thoughts'>
              <FaArrowLeft /> Back to Thoughts
            </BackLink>
          </ErrorCard>
        </Inner>
      </Shell>
    );

  return (
    <Shell>
      <Inner>
        {/* ── Masthead ────────────────────────────────────────────────────── */}
        <Masthead>
          <BackLink to='/thoughts'>
            <FaArrowLeft />
            <span>Thoughts</span>
          </BackLink>
          <PageTitle>Edit Thought</PageTitle>
        </Masthead>

        {/* ── Editor ──────────────────────────────────────────────────────── */}
        <EditorForm onSubmit={handleSubmit}>
          {/* Content — borderless textarea, bottom rule only */}
          <ContentBlock>
            <ContentArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={MAX_CONTENT}
              required
            />
            {/* Progress bar replaces the overlapping corner counter */}
            <ProgressRow>
              <ProgressTrack>
                <ProgressFill
                  $pct={(content.length / MAX_CONTENT) * 100}
                  $warn={nearLimit}
                />
              </ProgressTrack>
              <ProgressCount $warn={nearLimit}>{remaining}</ProgressCount>
            </ProgressRow>
          </ContentBlock>

          {/* Tags */}
          <TagsBlock>
            <BlockLabel>
              Tags <BlockHint>optional · up to {MAX_TAGS}</BlockHint>
            </BlockLabel>
            <TagsRow>
              {tags.map((tag, i) => (
                <TagPill key={i}>
                  #{tag}
                  <PillX type='button' onClick={() => removeTag(tag)}>
                    <FaTimes />
                  </PillX>
                </TagPill>
              ))}
              {tags.length < MAX_TAGS && (
                <TagInput
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  placeholder='add tag…'
                />
              )}
            </TagsRow>
          </TagsBlock>

          {/* Feed preview — shows the Cormorant headline split */}
          {content.trim() && (
            <PreviewBlock>
              <BlockLabel>Feed preview</BlockLabel>
              <PreviewHeadline>
                {content.split('\n')[0].slice(0, 120)}
              </PreviewHeadline>
              {content.split('\n').slice(1).join('\n').trim() && (
                <PreviewBody>
                  {content.split('\n').slice(1).join('\n').trim().slice(0, 80)}
                  {content.split('\n').slice(1).join('\n').trim().length > 80 &&
                    '…'}
                </PreviewBody>
              )}
            </PreviewBlock>
          )}

          {/* Actions */}
          <ActionsRow>
            <DeleteBtn
              type='button'
              onClick={() => setShowDeleteModal(true)}
              disabled={isSubmitting}
            >
              <FaTrash /> Delete
            </DeleteBtn>
            <SaveBtn type='submit' disabled={isSubmitting || !content.trim()}>
              <FaCheck />
              {updateThought.isPending ? 'Saving…' : 'Save Changes'}
            </SaveBtn>
          </ActionsRow>
        </EditorForm>
      </Inner>

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      {showDeleteModal && (
        <Backdrop onClick={() => setShowDeleteModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete Thought?</ModalTitle>
            <ModalBody>
              This thought will be permanently removed. This action cannot be
              undone.
            </ModalBody>
            <ModalFooter>
              <ModalCancel
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </ModalCancel>
              <ModalDelete onClick={handleDelete} disabled={isSubmitting}>
                {deleteThought.isPending ? 'Deleting…' : 'Delete'}
              </ModalDelete>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}
    </Shell>
  );
};

export default EditThought;

// ─── Keyframes ────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -500px 0; }
  100% { background-position:  500px 0; }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const Shell = styled.div`
  min-height: 100vh;
  background: ${NOIR.warmWhite};

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

const Inner = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 24px 80px;
  box-sizing: border-box;
  animation: ${fadeUp} 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

// ─── Masthead ─────────────────────────────────────────────────────────────────

const Masthead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 32px 0 24px;
  margin-bottom: 0;
  position: relative;

  /* Salmon-to-sage accent line at top of page */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -24px;
    right: -24px;
    height: 2px;
    background: linear-gradient(90deg, ${NOIR.salmon}, ${NOIR.sage});
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  text-decoration: none;
  transition: color 0.15s;
  svg {
    width: 9px;
    height: 9px;
  }
  &:hover {
    color: ${NOIR.salmon};
  }
`;

const PageTitle = styled.h1`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.7rem;
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.02em;
  color: ${NOIR.ink};
  margin: 0;
  line-height: 1;
`;

// ─── Editor form ──────────────────────────────────────────────────────────────

/* No card/border — the page background is the writing surface.
   Fields are separated by bottom rules only, like a printed form. */
const EditorForm = styled.form`
  padding-top: 28px;
`;

// ─── Content block ────────────────────────────────────────────────────────────

const ContentBlock = styled.div`
  margin-bottom: 28px;
`;

const ContentArea = styled.textarea`
  display: block;
  width: 100%;
  padding: 0 0 14px;
  box-sizing: border-box;
  background: none;
  border: none;
  border-bottom: 1px solid ${NOIR.dust};
  font-family: 'Instrument Sans', sans-serif;
  font-size: 1.05rem;
  line-height: 1.72;
  color: ${NOIR.charcoal};
  resize: none;
  outline: none;
  min-height: 160px;
  transition: border-color 0.2s;

  &::placeholder {
    color: ${NOIR.dust};
  }
  &:focus {
    border-bottom-color: ${NOIR.salmon};
  }
`;

/* Thin progress bar + numeric counter below the textarea */
const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
`;

const ProgressTrack = styled.div`
  flex: 1;
  height: 2px;
  background: ${NOIR.dust};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(p) => Math.min(p.$pct, 100)}%;
  background: ${(p) => (p.$warn ? NOIR.salmon : NOIR.sage)};
  transition: width 0.1s linear, background 0.2s;
`;

const ProgressCount = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.05em;
  color: ${(p) => (p.$warn ? NOIR.salmon : NOIR.ash)};
  flex-shrink: 0;
  min-width: 20px;
  text-align: right;
  transition: color 0.2s;
`;

// ─── Tags block ───────────────────────────────────────────────────────────────

const TagsBlock = styled.div`
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid ${NOIR.dust};
`;

const BlockLabel = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  margin-bottom: 10px;
`;

const BlockHint = styled.span`
  font-size: 0.55rem;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.65;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 28px;
`;

const TagPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  padding: 4px 9px;
  border: 1px solid ${NOIR.dust};
  color: ${NOIR.ash};
  transition: border-color 0.15s, color 0.15s;
  &:hover {
    border-color: ${NOIR.salmon};
    color: ${NOIR.salmon};
  }
`;

const PillX = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font-size: 0.45rem;
  opacity: 0.55;
  transition: opacity 0.15s;
  &:hover {
    opacity: 1;
  }
`;

const TagInput = styled.input`
  background: none;
  border: none;
  outline: none;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  color: ${NOIR.charcoal};
  min-width: 80px;
  flex: 1;
  &::placeholder {
    color: ${NOIR.dust};
  }
`;

// ─── Preview block ────────────────────────────────────────────────────────────

const PreviewBlock = styled.div`
  margin-bottom: 28px;
  padding: 16px 18px;
  border-left: 2px solid ${NOIR.dust};
  background: rgba(10, 10, 11, 0.02);
`;

const PreviewHeadline = styled.p`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.2rem;
  font-weight: 600;
  font-style: italic;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: ${NOIR.ink};
  margin: 0 0 6px;
`;

const PreviewBody = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  line-height: 1.6;
  color: ${NOIR.ash};
  margin: 0;
`;

// ─── Actions ─────────────────────────────────────────────────────────────────

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DeleteBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: 1px solid rgba(192, 57, 43, 0.22);
  color: #c0392b;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 18px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  svg {
    width: 10px;
    height: 10px;
  }
  &:hover:not(:disabled) {
    background: rgba(192, 57, 43, 0.06);
    border-color: #c0392b;
  }
  &:disabled {
    opacity: 0.4;
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
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 22px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  svg {
    width: 10px;
    height: 10px;
  }
  &:hover:not(:disabled) {
    background: ${NOIR.charcoal};
    border-color: ${NOIR.charcoal};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ─── Delete modal ─────────────────────────────────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 11, 0.5);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Modal = styled.div`
  background: ${NOIR.warmWhite};
  border: 1px solid ${NOIR.dust};
  border-top: 2px solid ${NOIR.salmon};
  max-width: 360px;
  width: 100%;
  padding: 26px 22px 20px;
  box-shadow: 0 20px 60px rgba(10, 10, 11, 0.18);
`;

const ModalTitle = styled.h3`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.3rem;
  font-weight: 400;
  font-style: italic;
  color: ${NOIR.ink};
  margin: 0 0 10px;
`;

const ModalBody = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.87rem;
  line-height: 1.6;
  color: ${NOIR.ash};
  margin: 0 0 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ModalCancel = styled.button`
  background: none;
  border: 1px solid ${NOIR.dust};
  color: ${NOIR.ash};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 8px 14px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  &:hover {
    border-color: ${NOIR.ash};
    color: ${NOIR.charcoal};
  }
  &:disabled {
    opacity: 0.4;
  }
`;

const ModalDelete = styled.button`
  background: #c0392b;
  border: 1px solid #c0392b;
  color: ${NOIR.warmWhite};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) {
    background: #96281b;
    border-color: #96281b;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonGroup = styled.div`
  padding: 40px 0;
  display: flex;
  flex-direction: column;
`;

const SkeletonBar = styled.div`
  height: ${(p) => p.$h || '14px'};
  width: ${(p) => p.$w || '100%'};
  margin-top: ${(p) => p.$mt || '8px'};
  background: linear-gradient(
    90deg,
    ${NOIR.dust} 25%,
    ${NOIR.warmWhite} 50%,
    ${NOIR.dust} 75%
  );
  background-size: 500px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

// ─── Error ────────────────────────────────────────────────────────────────────

const ErrorCard = styled.div`
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ErrorMsg = styled.div`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  color: #c0392b;
  background: rgba(192, 57, 43, 0.05);
  border: 1px solid rgba(192, 57, 43, 0.18);
  padding: 14px 20px;
  max-width: 400px;
  text-align: center;
`;
