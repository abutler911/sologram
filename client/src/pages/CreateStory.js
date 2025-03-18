import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaUpload, FaTimes } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";

const CreateStory = () => {
  const [title, setTitle] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle file uploads
  const onDrop = (acceptedFiles) => {
    setMediaFiles([...mediaFiles, ...acceptedFiles]);

    // Create previews
    const newPreviews = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      return { file, preview };
    });

    setPreviews([...previews, ...newPreviews]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Remove a preview and its file
  const removePreview = (index) => {
    const newPreviews = [...previews];
    const newMediaFiles = [...mediaFiles];

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index].preview);

    newPreviews.splice(index, 1);
    newMediaFiles.splice(index, 1);

    setPreviews(newPreviews);
    setMediaFiles(newMediaFiles);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please provide a title for your story");
      return;
    }

    if (mediaFiles.length === 0) {
      toast.error("Please add at least one image to your story");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      await axios.post("/api/stories", formData);

      toast.success("Story created successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error creating story:", err);
      toast.error("Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Container>
        <PageHeader>Create New Story</PageHeader>

        <StoryForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Story Title</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a title"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Add Images</Label>
            <DropzoneContainer {...getRootProps()}>
              <input {...getInputProps()} />
              <UploadIcon>
                <FaUpload />
              </UploadIcon>
              <p>Drag & drop images here, or click to select files</p>
              <small>Max 5MB per image</small>
            </DropzoneContainer>
          </FormGroup>

          {previews.length > 0 && (
            <PreviewSection>
              <Label>Selected Images ({previews.length})</Label>
              <PreviewList>
                {previews.map((item, index) => (
                  <PreviewItem key={index}>
                    <PreviewImage src={item.preview} alt={`Preview ${index}`} />
                    <RemoveButton onClick={() => removePreview(index)}>
                      <FaTimes />
                    </RemoveButton>
                  </PreviewItem>
                ))}
              </PreviewList>
            </PreviewSection>
          )}

          <ButtonGroup>
            <CancelButton type="button" onClick={() => navigate("/")}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Story"}
            </SubmitButton>
          </ButtonGroup>
        </StoryForm>
      </Container>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PageHeader = styled.h1`
  color: #fff;
  margin-bottom: 2rem;
  font-size: 1.75rem;
`;

const StoryForm = styled.form`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #ddd;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #444;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  background-color: #252525;
  cursor: pointer;
  transition: border-color 0.3s;
  color: #aaa;

  &:hover {
    border-color: #ff7e5f;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #ff7e5f;
`;

const PreviewSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PreviewList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const PreviewItem = styled.div`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 0, 0, 0.7);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: #ddd;
  border: 1px solid #444;

  &:hover {
    background-color: #333;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #ff7e5f;
  color: white;
  border: none;

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

export default CreateStory;
