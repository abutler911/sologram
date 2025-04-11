// client/src/pages/EditThought.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaEdit, FaTimes, FaCheck, FaTrash } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";

const EditThought = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const [thought, setThought] = useState(null);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Character limits
  const MAX_CONTENT_LENGTH = 280;
  const MAX_TAGS = 5;

  // Fetch thought data
  useEffect(() => {
    const fetchThought = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/thoughts/${id}`);

        if (response.data.success) {
          const thoughtData = response.data.data;
          setThought(thoughtData);
          setContent(thoughtData.content || "");
          setTags(thoughtData.tags || []);
          setError(null);
        } else {
          throw new Error(response.data.message || "Failed to load thought");
        }
      } catch (err) {
        console.error("Error fetching thought:", err);
        setError(
          "Failed to load thought. It may have been deleted or does not exist."
        );
        toast.error("Failed to load thought");
      } finally {
        setLoading(false);
      }
    };

    fetchThought();
  }, [id]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    } else if (!loading && !isAdmin) {
      navigate("/");
      toast.error("You don't have permission to edit thoughts");
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    try {
      setSubmitting(true);

      const thoughtData = {
        content,
        tags,
      };

      const response = await axios.put(`/api/thoughts/${id}`, thoughtData);

      if (response.data.success) {
        toast.success("Thought updated successfully");
        navigate(`/thoughts/${id}`);
      } else {
        throw new Error(response.data.message || "Failed to update thought");
      }
    } catch (err) {
      console.error("Error updating thought:", err);
      toast.error(err.response?.data?.message || "Failed to update thought");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle tag input
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
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
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle thought deletion
  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const response = await axios.delete(`/api/thoughts/${id}`);

      if (response.data.success) {
        toast.success("Thought deleted successfully");
        navigate("/thoughts");
      } else {
        throw new Error(response.data.message || "Failed to delete thought");
      }
    } catch (err) {
      console.error("Error deleting thought:", err);
      toast.error(err.response?.data?.message || "Failed to delete thought");
    } finally {
      setSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  // Render loading state
  if (loading) {
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

  // Render error state
  if (error || !thought) {
    return (
      <MainLayout>
        <PageWrapper>
          <Container>
            <ErrorContainer>
              <ErrorMessage>{error || "Thought not found"}</ErrorMessage>
              <BackLink to="/thoughts">
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
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    placeholder="Add tags (press Enter)"
                  />
                )}
              </TagsContainer>
              <TagInfo>
                Up to {MAX_TAGS} tags, press Enter or comma to add
              </TagInfo>
            </FormGroup>

            <ButtonGroup>
              <DeleteButton
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={submitting}
              >
                <FaTrash />
                <span>Delete</span>
              </DeleteButton>
              <SaveButton
                type="submit"
                disabled={submitting || !content.trim()}
              >
                <FaCheck />
                <span>{submitting ? "Saving..." : "Save Changes"}</span>
              </SaveButton>
            </ButtonGroup>
          </Form>

          {/* Delete confirmation modal */}
          {showDeleteModal && (
            <DeleteModal>
              <DeleteModalContent>
                <h3>Delete Thought</h3>
                <p>
                  Are you sure you want to delete this thought? This action
                  cannot be undone.
                </p>
                <DeleteModalButtons>
                  <CancelButton onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </CancelButton>
                  <ConfirmDeleteButton onClick={handleDelete}>
                    Delete Thought
                  </ConfirmDeleteButton>
                </DeleteModalButtons>
              </DeleteModalContent>
              <Backdrop onClick={() => setShowDeleteModal(false)} />
            </DeleteModal>
          )}
        </Container>
      </PageWrapper>
    </MainLayout>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 2rem 0;

  @media (max-width: 768px) {
    padding: 1rem 0;
  }
`;

const Container = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
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
  display: flex;
  align-items: center;
  font-size: 2rem;
  color: #ffffff;
  margin: 0;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
  }
`;

const Form = styled.form`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const TextAreaWrapper = styled.div`
  position: relative;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background-color: #333333;
  border: 1px solid #444444;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1.125rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &::placeholder {
    color: #888888;
  }
`;

const CharCount = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  font-size: 0.75rem;
  color: ${(props) => (props.warning ? "#ff7e5f" : "#aaaaaa")};
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #dddddd;
  font-weight: 500;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #333333;
  border: 1px solid #444444;
  border-radius: 8px;
  min-height: 2.5rem;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  background-color: #ff7e5f;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  gap: 0.25rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  cursor: pointer;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

const TagInput = styled.input`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 0.875rem;
  flex: 1;
  min-width: 100px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #888888;
  }
`;

const TagInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #888888;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #555555;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    order: -1;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: transparent;
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(255, 107, 107, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DeleteModalContent = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h3 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  p {
    color: #dddddd;
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

  @media (max-width: 480px) {
    order: 2;
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

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
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
