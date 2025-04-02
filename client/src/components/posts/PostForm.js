import React, { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaCamera,
  FaVideo,
  FaImage,
  FaPlusCircle,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const PostForm = () => {
  const [step, setStep] = useState("upload");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (mediaFiles.length + acceptedFiles.length > 20) {
        toast.error("Maximum 20 media files allowed per post");
        return;
      }

      const newPreviews = acceptedFiles.map((file) => {
        const isVideo = file.type.startsWith("video/");
        const preview = URL.createObjectURL(file);
        return {
          file,
          preview,
          type: isVideo ? "video" : "image",
          name: file.name,
          size: formatFileSize(file.size),
        };
      });

      setPreviews((prev) => [...prev, ...newPreviews]);
      setMediaFiles((prev) => [...prev, ...acceptedFiles]);
      if (step === "upload") setStep("edit");
    },
    [mediaFiles, step]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxSize: 2 * 1024 * 1024 * 1024,
    multiple: true,
  });

  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        onDrop([e.target.files[0]]);
      }
    };
    input.click();
  };

  const handleVideoCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.capture = "environment";
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        onDrop([e.target.files[0]]);
      }
    };
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("content", content);
      formData.append("tags", tags);

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post("/api/posts", formData);
      toast.success("Post created successfully!");
      navigate(`/post/${response.data.data._id}`);
    } catch (err) {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>Create New Post</FormTitle>
      <FormGroup>
        <Label>Caption</Label>
        <Input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Enter a caption"
          required
        />
      </FormGroup>
      <FormGroup>
        <Label>Content</Label>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post content..."
          rows={4}
        />
      </FormGroup>
      <FormGroup>
        <Label>Tags</Label>
        <Input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Add tags separated by commas"
        />
      </FormGroup>
      <FormGroup>
        <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
          <input {...getInputProps()} />
          <DropzoneContent>
            <FaUpload size={32} />
            <p>
              {isDragActive
                ? "Drop files here..."
                : "Drag & drop or click to select"}
            </p>
          </DropzoneContent>
        </DropzoneContainer>
        <MediaButtonRow>
          <IconButton type="button" onClick={handleCameraCapture}>
            <FaCamera /> Photo
          </IconButton>
          <IconButton type="button" onClick={handleVideoCapture}>
            <FaVideo /> Video
          </IconButton>
        </MediaButtonRow>
        <MediaPreviewGrid>
          {previews.map((media, index) => (
            <MediaPreviewItem key={index}>
              {media.type === "image" ? (
                <PreviewImage src={media.preview} alt={media.name} />
              ) : (
                <PreviewVideo src={media.preview} controls />
              )}
              <RemoveButton
                onClick={() => {
                  setPreviews((prev) => prev.filter((_, i) => i !== index));
                  setMediaFiles((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                <FaTimes />
              </RemoveButton>
            </MediaPreviewItem>
          ))}
        </MediaPreviewGrid>
      </FormGroup>
      <SubmitButton type="submit" disabled={loading}>
        {loading ? "Saving..." : "Create Post"}
      </SubmitButton>
    </FormContainer>
  );
};

// Styled components
const FormContainer = styled.form`
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
`;

const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #ccc;
  padding: 1.5rem;
  text-align: center;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

const DropzoneContent = styled.div`
  color: #666;
`;

const MediaButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const IconButton = styled.button`
  flex: 1;
  background: #eee;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const MediaPreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
`;

const MediaPreviewItem = styled.div`
  position: relative;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
`;

const PreviewVideo = styled.video`
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  padding: 0.25rem 0.4rem;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  background: #ff7e5f;
  color: white;
  border: none;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #ff6347;
  }
`;

export default PostForm;
