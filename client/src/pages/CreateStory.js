import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaUpload, FaTimes, FaCamera, FaImage, FaVideo } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";

const CreateStory = () => {
  const [title, setTitle] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPWA, setIsPWA] = useState(
    window.matchMedia("(display-mode: standalone)").matches
  );
  const navigate = useNavigate();

  // Check if running as PWA
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setIsPWA(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Handle file uploads with enhanced error handling
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files first
    if (rejectedFiles && rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        if (errors[0]?.code === "file-too-large") {
          toast.error(`File ${file.name} is too large. Max size is 25MB for images and 50MB for videos.`);
        } else if (errors[0]?.code === "file-invalid-type") {
          toast.error(
            `File ${file.name} has an invalid type. Only images (JPG, PNG, GIF) and videos (MP4, MOV) are allowed.`
          );
        } else {
          toast.error(
            `File ${file.name} couldn't be uploaded. ${errors[0]?.message}`
          );
        }
      });
    }

    // Process accepted files
    if (acceptedFiles && acceptedFiles.length > 0) {
      console.log("Accepted files:", acceptedFiles);

      setMediaFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);

      // Create previews
      const newPreviews = acceptedFiles.map((file) => {
        const isVideo = file.type.startsWith("video/");
        const preview = URL.createObjectURL(file);
        return { file, preview, type: isVideo ? "video" : "image" };
      });

      setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    }
  }, []);

  // Configure dropzone with more specific options to improve mobile compatibility
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB for videos
    maxFiles: 10, // Reasonable limit
    noClick: isPWA, // Disable click in PWA mode (use buttons instead)
    noKeyboard: false, // Allow keyboard navigation
    preventDropOnDocument: true, // Prevent dropping on document
    useFsAccessApi: false, // Disable File System Access API which can cause issues
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

  // Handle direct camera access
  const handleCameraCapture = () => {
    // Create a hidden file input specifically for camera
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Use the back camera

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        // Process the file as if it was dropped
        onDrop([file], []);
      }
    };

    input.click();
  };

  // Handle video recording
  const handleVideoCapture = () => {
    // Create a hidden file input specifically for video
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.capture = "environment"; // Use the back camera

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        // Process the file as if it was dropped
        onDrop([file], []);
      }
    };

    input.click();
  };

  // Handle selecting media from gallery
  const handleGallerySelect = () => {
    // This explicitly calls the dropzone's open method
    open();
  };

  // Handle form submission with improved error handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please provide a title for your story");
      return;
    }

    if (mediaFiles.length === 0) {
      toast.error("Please add at least one image or video to your story");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post("/api/stories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      console.log("Upload response:", response);
      toast.success("Story created successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error creating story:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to create story";
      toast.error(errorMessage);
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
            <Label>Add Images & Videos</Label>
            <DropzoneContainer
              {...getRootProps()}
              isDragActive={isDragActive}
              isPWA={isPWA}
            >
              <input {...getInputProps()} />
              <UploadIcon>
                <FaUpload />
              </UploadIcon>
              {isPWA ? (
                <p>Use the buttons below to add media</p>
              ) : (
                <p>Drag & drop images or videos here, or click to select files</p>
              )}
              <MediaTypes>
                <MediaTypeIcon>
                  <FaImage />
                  <span>Images (25MB max)</span>
                </MediaTypeIcon>
                <MediaTypeIcon>
                  <FaVideo />
                  <span>Videos (50MB max)</span>
                </MediaTypeIcon>
              </MediaTypes>
            </DropzoneContainer>

            {/* Explicit buttons for PWA mode and better mobile UX */}
            <ActionButtonsContainer>
              <CameraButton type="button" onClick={handleCameraCapture}>
                <FaCamera />
                <span>Take Photo</span>
              </CameraButton>

              <VideoButton type="button" onClick={handleVideoCapture}>
                <FaVideo />
                <span>Record Video</span>
              </VideoButton>

              <GalleryButton type="button" onClick={handleGallerySelect}>
                <FaImage />
                <span>Choose from Gallery</span>
              </GalleryButton>
            </ActionButtonsContainer>
          </FormGroup>

          {previews.length > 0 && (
            <PreviewSection>
              <Label>Selected Media ({previews.length})</Label>
              <PreviewList>
                {previews.map((item, index) => (
                  <PreviewItem key={index}>
                    {item.type === "image" ? (
                      <PreviewImage src={item.preview} alt={`Preview ${index}`} />
                    ) : (
                      <PreviewVideo>
                        <video src={item.preview} controls muted />
                        <VideoIcon><FaVideo /></VideoIcon>
                      </PreviewVideo>
                    )}
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

  /* Fix for iOS to better handle full height */
  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  /* Ensure good rendering in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }
`;

const PageHeader = styled.h1`
  color: #fff;
  margin-bottom: 2rem;
  font-size: 1.75rem;

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

const StoryForm = styled.form`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 480px) {
    padding: 1.5rem;
  }

  /* Ensure proper rendering in PWA mode */
  @media screen and (display-mode: standalone) {
    width: 100%;
    box-sizing: border-box;
  }
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
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  /* Prevent zoom on iOS */
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${(props) => (props.isDragActive ? "#ff7e5f" : "#444")};
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  background-color: #252525;
  cursor: ${(props) => (props.isPWA ? "default" : "pointer")};
  transition: border-color 0.3s;
  color: #aaa;
  margin-bottom: 1rem;

  &:hover {
    border-color: ${(props) => (props.isPWA ? "#444" : "#ff7e5f")};
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #ff7e5f;
`;

const MediaTypes = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const MediaTypeIcon = styled.div`
  display: flex;
  align-items: center;
  color: #888;
  font-size: 0.8rem;
  
  svg {
    color: #ff7e5f;
    margin-right: 0.5rem;
    font-size: 1rem;
  }
`;

const ActionButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr 1fr;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  gap: 0.5rem;
  border: none;
  font-size: 1rem;

  svg {
    font-size: 1.25rem;
  }
`;

const CameraButton = styled(ActionButton)`
  background-color: #ff7e5f;
  color: white;

  &:hover {
    background-color: #ff6347;
  }
`;

const VideoButton = styled(ActionButton)`
  background-color: #e74c3c;
  color: white;

  &:hover {
    background-color: #c0392b;
  }
`;

const GalleryButton = styled(ActionButton)`
  background-color: #4a90e2;
  color: white;

  &:hover {
    background-color: #3a70b2;
  }
`;

const PreviewSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PreviewList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const PreviewItem = styled.div`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid #333;
  background-color: #000;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PreviewVideo = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoIcon = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 480px) {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }
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

  /* Larger touch target on mobile */
  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
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