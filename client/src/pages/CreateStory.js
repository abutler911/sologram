import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FaUpload,
  FaTimes,
  FaCamera,
  FaImage,
  FaVideo,
  FaArrowLeft,
  FaPlusCircle,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const CreateStory = () => {
  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("upload"); // "upload", "edit", "details"
  const [isPWA, setIsPWA] = useState(
    window.matchMedia("(display-mode: standalone)").matches
  );
  const textAreaRef = useRef(null);
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if running as PWA
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setIsPWA(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
  }, [caption]);

  // Handle file uploads with enhanced error handling
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files first
      if (rejectedFiles && rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          if (errors[0]?.code === "file-too-large") {
            toast.error(
              `File ${file.name} is too large. Max size is 20MB for images and 100MB for videos.`
            );
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

       // Check file sizes based on type
    const validFiles = acceptedFiles.filter((file) => {
      if (file.type.startsWith("image/") && file.size > 20 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 20MB limit`);
        return false;
      }
      
      // Increase this limit to 100MB for 30-second videos
      if (file.type.startsWith("video/") && file.size > 100 * 1024 * 1024) {
        toast.error(`Video ${file.name} exceeds 100MB limit`);
        return false;
      }
      return true;
    });
      // Check if adding these files would exceed the 20 file limit
      if (mediaFiles.length + acceptedFiles.length > 20) {
        toast.error("Maximum 20 media files allowed per story");
        return;
      }

      // Process accepted files
      if (acceptedFiles && acceptedFiles.length > 0) {
        // Check file sizes based on type
        const validFiles = acceptedFiles.filter((file) => {
          if (file.type.startsWith("image/") && file.size > 20 * 1024 * 1024) {
            toast.error(`Image ${file.name} exceeds 20MB limit`);
            return false;
          }
          if (
            file.type.startsWith("video/") &&
            file.size > 2 * 1024 * 1024 * 1024
          ) {
            toast.error(`Video ${file.name} exceeds 2GB limit`);
            return false;
          }
          return true;
        });

        if (validFiles.length === 0) return;

        setMediaFiles((prevFiles) => [...prevFiles, ...validFiles]);

        // Create previews
        const newPreviews = validFiles.map((file) => {
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

        setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

        // If this is the first media, automatically go to next step
        if (mediaFiles.length === 0) {
          setCurrentStep("edit");
        }
      }
    },
    [mediaFiles]
  );

  // Configure dropzone with more specific options
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
    },
    maxSize: 100 * 1024 * 1024, // 2GB for videos
    maxFiles: 20,
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

    // If no media left, go back to upload step
    if (newPreviews.length === 0) {
      setCurrentStep("upload");
    }
  };

  // Handle direct camera access
  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Use the back camera

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        onDrop([file], []);
      }
    };

    input.click();
  };

  // Handle video recording
  const handleVideoCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.capture = "environment"; // Use the back camera

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        onDrop([file], []);
      }
    };

    input.click();
  };

  // Handle selecting media from gallery
  const handleGallerySelect = () => {
    open();
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
  
    if (mediaFiles.length === 0) {
      toast.error("Please add at least one image or video to your story");
      return;
    }
  
    setLoading(true);
    setUploadProgress(0); // Add this state variable at the top of your component
  
    try {
      const formData = new FormData();
      formData.append("title", caption || "My Story"); // Provide a default title if caption is empty
      formData.append("caption", caption);
  
      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });
  
      // Check if any video files exist
      const hasVideoFiles = mediaFiles.some(file => 
        file.type.startsWith('video/')
      );
  
      // Add upload progress monitoring
      const uploadToast = hasVideoFiles ? 
        toast.loading('Uploading video... 0%') : null;
  
      await axios.post("/api/stories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          
          if (hasVideoFiles && uploadToast) {
            toast.loading(`Uploading video... ${percentCompleted}%`, 
              { id: uploadToast });
          }
        }
      });
  
      if (uploadToast) {
        toast.dismiss(uploadToast);
      }
      
      toast.success("Story created successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error creating story:", err);
      
      // More specific error messages based on error type
      if (err.response) {
        if (err.response.status === 413) {
          toast.error("Video file is too large for the server to process. Please use a shorter video or reduce the quality.");
        } else if (err.response.data?.message) {
          toast.error(err.response.data.message);
        } else {
          toast.error(`Upload failed (${err.response.status}). Please try again.`);
        }
      } else if (err.message.includes('timeout')) {
        toast.error("Upload timed out. Please use a shorter video or check your internet connection.");
      } else {
        toast.error("Failed to create story. Please try again.");
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Go to next step
  const goToNextStep = () => {
    if (currentStep === "edit") {
      setCurrentStep("details");
    } else if (currentStep === "details") {
      handleSubmit();
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    if (currentStep === "details") {
      setCurrentStep("edit");
    } else if (currentStep === "edit") {
      setCurrentStep("upload");
    } else {
      navigate("/");
    }
  };

  // Render upload step
  const renderUploadStep = () => (
    <>
      <UploadContainer>
        <DropzoneContainer
          {...getRootProps()}
          isDragActive={isDragActive}
          isPWA={isPWA}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <DragActiveContent>
              <UploadIcon>
                <FaUpload />
              </UploadIcon>
              <p>Drop your files here</p>
            </DragActiveContent>
          ) : (
            <DropzoneContent>
              <UploadIcon>
                <FaPlusCircle />
              </UploadIcon>
              {isPWA ? (
                <p>Create a new story</p>
              ) : (
                <p>Drag photos and videos here</p>
              )}
            </DropzoneContent>
          )}
        </DropzoneContainer>

        <ActionButtonsContainer>
          <GalleryButton type="button" onClick={handleGallerySelect}>
            <FaImage />
            <span>Gallery</span>
          </GalleryButton>

          <CameraButton type="button" onClick={handleCameraCapture}>
            <FaCamera />
            <span>Camera</span>
          </CameraButton>

          <VideoButton type="button" onClick={handleVideoCapture}>
            <FaVideo />
            <span>Video</span>
          </VideoButton>
        </ActionButtonsContainer>
      </UploadContainer>
    </>
  );

  

  // Render edit step
  const renderEditStep = () => (
    <>
      <EditContainer>
        <MediaPreview>
          {previews.map((item, index) => (
            <PreviewItem key={index} isActive={index === 0}>
              {item.type === "image" ? (
                <PreviewImage src={item.preview} alt={`Preview ${index}`} />
              ) : (
                <PreviewVideo>
                  <video src={item.preview} controls muted />
                  <VideoIcon>
                    <FaVideo />
                  </VideoIcon>
                </PreviewVideo>
              )}
              <RemoveButton onClick={() => removePreview(index)}>
                <FaTimes />
              </RemoveButton>
              {previews.length > 1 && (
                <PreviewNumber>{index + 1}</PreviewNumber>
              )}
            </PreviewItem>
          ))}
        </MediaPreview>

        {previews.length > 0 && (
          <AddMoreButton onClick={open}>
            <FaPlusCircle />
            <span>Add More</span>
          </AddMoreButton>
        )}
      </EditContainer>
    </>
  );

  // Render details step
  const renderDetailsStep = () => (
    <>
      <DetailsContainer>
        <MediaDetailsPreview>
          {previews[0] && (
            <>
              {previews[0].type === "image" ? (
                <PreviewThumbnail
                  src={previews[0].preview}
                  alt="Media preview"
                />
              ) : (
                <VideoThumbnail>
                  <video src={previews[0].preview} muted />
                  <VideoIcon>
                    <FaVideo />
                  </VideoIcon>
                </VideoThumbnail>
              )}
            </>
          )}
          {previews.length > 1 && (
            <MultipleIndicator>+{previews.length - 1}</MultipleIndicator>
          )}
        </MediaDetailsPreview>

        <CaptionContainer>
          <CaptionTextarea
            ref={textAreaRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={1}
          />
        </CaptionContainer>
      </DetailsContainer>
    </>
  );
  {loading && uploadProgress > 0 && (
    <UploadProgressContainer>
      <ProgressBarOuter>
        <ProgressBarInner width={uploadProgress} />
      </ProgressBarOuter>
      <ProgressText>{uploadProgress}% Uploaded</ProgressText>
    </UploadProgressContainer>
  )}
  return (
    <PageWrapper>
      <AppHeader>
        <BackButton onClick={goToPreviousStep}>
          <FaArrowLeft />
        </BackButton>
        <HeaderTitle>
          {currentStep === "upload" && "New Story"}
          {currentStep === "edit" && "Edit"}
          {currentStep === "details" && "New Story"}
        </HeaderTitle>
        {currentStep !== "upload" && (
          <NextButton onClick={goToNextStep} disabled={loading}>
            {currentStep === "details"
              ? loading
                ? "Posting..."
                : "Share"
              : "Next"}
          </NextButton>
        )}
      </AppHeader>

      <MainContent>
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "edit" && renderEditStep()}
        {currentStep === "details" && renderDetailsStep()}
      </MainContent>
    </PageWrapper>
  );
};

// Styled Components


const PageWrapper = styled.div`
  background-color: #000;
  min-height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;

  /* Fix for iOS to better handle full height */
  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const AppHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #262626;
  background-color: #000;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.h1`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  text-align: center;
`;

const NextButton = styled.button`
  background: none;
  border: none;
  color: #0095f6;
  font-weight: 600;
  padding: 8px;
  cursor: pointer;
  font-size: 0.875rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// Upload Step
const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  flex: 1;
`;

const DropzoneContainer = styled.div`
  width: 100%;
  height: 250px;
  border: 1px dashed ${(props) => (props.isDragActive ? "#0095f6" : "#333")};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.isPWA ? "default" : "pointer")};
  margin-bottom: 24px;
`;

const DropzoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  text-align: center;
  padding: 16px;
`;

const DragActiveContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #0095f6;
  text-align: center;
  padding: 16px;
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  color: #0095f6;
`;

const ActionButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  width: 100%;
  max-width: 400px;
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  gap: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;

  svg {
    font-size: 1.5rem;
  }
`;

const GalleryButton = styled(ActionButton)`
  background-color: #262626;
  color: white;

  &:hover {
    background-color: #363636;
  }
`;

const CameraButton = styled(ActionButton)`
  background-color: #262626;
  color: white;

  &:hover {
    background-color: #363636;
  }
`;

const VideoButton = styled(ActionButton)`
  background-color: #262626;
  color: white;

  &:hover {
    background-color: #363636;
  }
`;

// Edit Step
const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const MediaPreview = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
  background-color: #000;
  overflow: hidden;
`;

const PreviewItem = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: ${(props) => (props.isActive ? "block" : "none")};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const PreviewVideo = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const VideoIcon = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const PreviewNumber = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.75rem;
`;

const AddMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0095f6;
  color: white;
  border: none;
  margin: 16px;
  padding: 12px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  gap: 8px;
`;

// Details Step
const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
`;

const MediaDetailsPreview = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
`;

const PreviewThumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoThumbnail = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MultipleIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
`;

const CaptionContainer = styled.div`
  border-top: 1px solid #262626;
  padding-top: 16px;
`;

const CaptionTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  resize: none;
  padding: 8px 0;
  min-height: 90px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #555;
  }
`;
const UploadProgressContainer = styled.div`
  margin-top: 1rem;
  width: 100%;
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 8px;
  background-color: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressBarInner = styled.div`
  height: 100%;
  width: ${props => props.width}%;
  background-color: #ff7e5f;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.75rem;
  color: #aaa;
  text-align: center;
`;
export default CreateStory;
