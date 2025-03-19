import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaImage,
  FaCheck,
  FaFolder,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const CollectionForm = ({ initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    isPublic: initialData?.isPublic !== undefined ? initialData.isPublic : true,
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(
    initialData?.coverImage || null
  );
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Set cover image file
    setCoverImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const removeCoverImage = () => {
    setCoverPreview(null);
    setCoverImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create form data for submission
      const collectionFormData = new FormData();
      collectionFormData.append("name", formData.name);
      collectionFormData.append("description", formData.description);
      collectionFormData.append("isPublic", formData.isPublic);

      if (coverImage) {
        collectionFormData.append("coverImage", coverImage);
      }

      let response;

      if (isEditing) {
        // Update existing collection
        response = await axios.put(
          `/api/collections/${initialData._id}`,
          collectionFormData
        );
        toast.success("Collection updated successfully!");
      } else {
        // Create new collection
        response = await axios.post("/api/collections", collectionFormData);
        toast.success("Collection created successfully!");
      }

      // Redirect to the collection detail page
      navigate(`/collections/${response.data.data._id}`);
    } catch (err) {
      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : isEditing
          ? "Failed to update collection"
          : "Failed to create collection";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>
        <FaFolder />
        <span>{isEditing ? "Edit Collection" : "Create New Collection"}</span>
      </FormTitle>

      <FormGroup>
        <Label htmlFor="name">Collection Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter a name for your collection"
          required
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description (Optional)</Label>
        <TextArea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add a description for your collection"
          rows={4}
        />
      </FormGroup>

      <FormGroup>
        <Label>Cover Image (Optional)</Label>
        {coverPreview ? (
          <CoverPreviewContainer>
            <CoverPreviewImage src={coverPreview} alt="Cover preview" />
            <RemoveCoverButton type="button" onClick={removeCoverImage}>
              <FaTimes />
            </RemoveCoverButton>
          </CoverPreviewContainer>
        ) : (
          <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
            <input {...getInputProps()} />
            <DropzoneIcon>
              <FaCloudUploadAlt />
            </DropzoneIcon>
            <DropzoneText>
              {isDragActive
                ? "Drop your cover image here"
                : "Drag & drop a cover image, or click to select"}
            </DropzoneText>
            <DropzoneSubtext>
              Supports: JPG, PNG, GIF (Max: 5MB)
            </DropzoneSubtext>
            <FaImage />
          </DropzoneContainer>
        )}
      </FormGroup>

      <FormGroup>
        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
          />
          <CheckboxLabel htmlFor="isPublic">
            Make this collection public
          </CheckboxLabel>
        </CheckboxContainer>
        <CheckboxHelp>
          Public collections are visible to everyone. Private collections are
          only visible to you.
        </CheckboxHelp>
      </FormGroup>

      <ButtonGroup>
        <CancelButton type="button" onClick={() => navigate(-1)}>
          Cancel
        </CancelButton>
        <SubmitButton type="submit" disabled={loading}>
          <FaCheck />
          <span>
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Collection"
              : "Create Collection"}
          </span>
        </SubmitButton>
      </ButtonGroup>
    </FormContainer>
  );
};

// Styled Components
const FormContainer = styled.form`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  color: #ffffff;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
    font-size: 1.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #dddddd;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &::placeholder {
    color: #888888;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &::placeholder {
    color: #888888;
  }
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${(props) => (props.isDragActive ? "#ff7e5f" : "#444444")};
  background-color: ${(props) =>
    props.isDragActive ? "rgba(255, 126, 95, 0.1)" : "#272727"};
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ff7e5f;
  }
`;

const DropzoneIcon = styled.div`
  color: #ff7e5f;
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const DropzoneText = styled.p`
  font-size: 1.25rem;
  color: #cccccc;
  margin-bottom: 0.5rem;
`;

const DropzoneSubtext = styled.p`
  font-size: 0.875rem;
  color: #999999;
  margin-bottom: 1rem;
`;

const CoverPreviewContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
  border-radius: 4px;
  overflow: hidden;
  max-height: 300px;
  background-color: #272727;
`;

const CoverPreviewImage = styled.img`
  display: block;
  width: 100%;
  max-height: 300px;
  object-fit: contain;
`;

const RemoveCoverButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Checkbox = styled.input`
  margin-right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #ff7e5f;
`;

const CheckboxLabel = styled.label`
  font-weight: 500;
  color: #dddddd;
  cursor: pointer;
`;

const CheckboxHelp = styled.p`
  font-size: 0.875rem;
  color: #aaaaaa;
  margin-top: 0.25rem;
  margin-left: 2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;

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
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const CancelButton = styled(Button)`
  background-color: #333333;
  color: #dddddd;
  border: 1px solid #444444;

  &:hover {
    background-color: #444444;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #ff7e5f;
  color: white;
  border: none;

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #555555;
    cursor: not-allowed;
  }
`;

export default CollectionForm;
