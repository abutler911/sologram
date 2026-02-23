// client/src/pages/EditThought.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaEdit, FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import {
  useThought,
  useUpdateThought,
  useDeleteThought,
} from '../hooks/queries/useThoughts';

const MAX_CONTENT_LENGTH = 280;
const MAX_TAGS = 5;

const EditThought = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  // Local form state
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // React Query
  const { data: thought, isLoading, error } = useThought(id);
  const updateThought = useUpdateThought();
  const deleteThought = useDeleteThought();

  // Seed form state once data arrives
  useEffect(() => {
    if (thought) {
      setContent(thought.content || '');
      setTags(thought.tags || []);
    }
  }, [thought]);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!isLoading && !isAdmin) {
      navigate('/');
      toast.error("You don't have permission to edit thoughts");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  // Page title
  useEffect(() => {
    document.title = thought ? `Edit Thought | SoloGram` : 'SoloGram';
    return () => {
      document.title = 'SoloGram';
    };
  }, [thought]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }
    try {
      await updateThought.mutateAsync({ id, payload: { content, tags } });
      navigate(`/thoughts/${id}`);
    } catch {
      // error toast handled in the hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteThought.mutateAsync(id);
      navigate('/thoughts');
    } catch {
      // error toast handled in the hook
    }
  };

  // Tag helpers
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

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

  const removeTag = (tagToRemove) =>
    setTags(tags.filter((tag) => tag !== tagToRemove));

  const isSubmitting = updateThought.isPending || deleteThought.isPending;

  if (isLoading) {
    return (
      <MainLayout>
        <PageWrapper>
          <Container>
            <LoadingMessage>Loading thought...</LoadingMessage>
          </Container>
        </PageWrapper>
      </MainLayout>
    );
  }

  if (error || !thought) {
    return (
      <MainLayout>
        <PageWrapper>
          <Container>
            <ErrorContainer>
              <ErrorMessage>
                {error?.message || 'Thought not found'}
              </ErrorMessage>
              <BackLink to='/thoughts'>
                <FaArrowLeft />
                <span>Back to Thoughts</span>
              </BackLink>
            </ErrorContainer>
          </Container>
        </PageWrapper>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageWrapper>
        <Container>
          <Header>
            <BackLink to={`/thoughts/${id}`}>
              <FaArrowLeft />
              <span>Back to Thought</span>
            </BackLink>
            <PageTitle>
              <FaEdit />
              <span>Edit Thought</span>
            </PageTitle>
          </Header>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <TextAreaWrapper>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={MAX_CONTENT_LENGTH}
                  required
                />
                <CharCount warning={content.length > MAX_CONTENT_LENGTH * 0.9}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </CharCount>
              </TextAreaWrapper>
            </FormGroup>

            <FormGroup>
              <Label>Tags (optional)</Label>
              <TagsContainer>
                {tags.map((tag, index) => (
                  <Tag key={index}>
                    <span>#{tag}</span>
                    <RemoveTagButton onClick={() => removeTag(tag)}>
                      <FaTimes />
                    </RemoveTagButton>
                  </Tag>
                ))}
                {tags.length < MAX_TAGS && (
                  <TagInput
                    type='text'
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    placeholder='Add tags (press Enter)'
                  />
                )}
              </TagsContainer>
              <TagInfo>
                Up to {MAX_TAGS} tags, press Enter or comma to add
              </TagInfo>
            </FormGroup>

            <ButtonGroup>
              <DeleteButton
                type='button'
                onClick={() => setShowDeleteModal(true)}
                disabled={isSubmitting}
              >
                <FaTrash />
                <span>Delete</span>
              </DeleteButton>
              <SaveButton
                type='submit'
                disabled={isSubmitting || !content.trim()}
              >
                <FaCheck />
                <span>
                  {updateThought.isPending ? 'Saving...' : 'Save Changes'}
                </span>
              </SaveButton>
            </ButtonGroup>
          </Form>

          {showDeleteModal && (
            <Backdrop>
              <DeleteModal>
                <DeleteModalContent>
                  <h3>Delete Thought</h3>
                  <p>
                    Are you sure you want to delete this thought? This action
                    cannot be undone.
                  </p>
                  <DeleteModalButtons>
                    <CancelButton
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </CancelButton>
                    <ConfirmDeleteButton
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      {deleteThought.isPending ? 'Deleting...' : 'Delete'}
                    </ConfirmDeleteButton>
                  </DeleteModalButtons>
                </DeleteModalContent>
              </DeleteModal>
            </Backdrop>
          )}
        </Container>
      </PageWrapper>
    </MainLayout>
  );
};

// ── Styled Components (unchanged) ─────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: #1a1a2e;
  min-height: 100vh;
  padding: 2rem 0;
`;

const Container = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #aaaaaa;
  text-decoration: none;
  transition: color 0.3s;
  &:hover {
    color: #e98973;
  }
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0;
`;

const Form = styled.form`
  background-color: #16213e;
  border-radius: 12px;
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  color: #aaaaaa;
  margin-bottom: 0.5rem;
`;

const TextAreaWrapper = styled.div`
  position: relative;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  background-color: #0f3460;
  border: 1px solid #333366;
  border-radius: 8px;
  padding: 1rem;
  color: #ffffff;
  font-size: 1rem;
  resize: vertical;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #e98973;
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: ${({ warning }) => (warning ? '#e74c3c' : '#aaaaaa')};
  margin-top: 0.25rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #0f3460;
  border: 1px solid #333366;
  border-radius: 8px;
  min-height: 44px;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: #1a1a6e;
  color: #aaaaff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #aaaaaa;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  &:hover {
    color: #e74c3c;
  }
`;

const TagInput = styled.input`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 0.875rem;
  outline: none;
  min-width: 120px;
  flex: 1;
`;

const TagInfo = styled.p`
  font-size: 0.75rem;
  color: #777777;
  margin-top: 0.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
  &:hover:not(:disabled) {
    background-color: rgba(231, 76, 60, 0.2);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e98973;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
  &:hover:not(:disabled) {
    background-color: #d4745e;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DeleteModal = styled.div`
  z-index: 1001;
`;

const DeleteModalContent = styled.div`
  background-color: #16213e;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  h3 {
    color: #ffffff;
    margin-bottom: 1rem;
  }
  p {
    color: #aaaaaa;
    margin-bottom: 1.5rem;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #444444;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #c0392b;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #aaaaaa;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(248, 215, 218, 0.2);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

export default EditThought;
