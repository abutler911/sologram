import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
} from "react";
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
import { AuthContext } from "../context/AuthContext";
import { COLORS, THEME } from "../theme"; // Import the theme

// Styled Components (moved to the top)
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  color: ${COLORS.textPrimary};
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
  border-bottom: 1px solid ${COLORS.border};
  background-color: ${COLORS.cardBackground};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 1.25rem;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.primaryBlue};
    transform: translateX(-2px);
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  text-align: center;
  color: ${COLORS.textPrimary};
`;

const NextButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primaryGreen};
  font-weight: 600;
  padding: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.accentGreen};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
`;

// Media Preview
const MediaPreviewContainer = styled.div`
  width: 100%;
  aspect-ratio: 9 / 16;
  position: relative;
  background-color: ${COLORS.cardBackground};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${COLORS.border};
`;

const MainPreviewImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
`;

const MainPreviewVideo = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  video {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }
`;

const VideoIcon = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: ${COLORS.textPrimary};
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
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 0, 0, 0.3);
    transform: scale(1.1);
  }
`;

// Styled Components for Dropzone
const DropzoneArea = styled.div`
  width: 100%;
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed
    ${(props) => (props.isDragActive ? COLORS.primaryBlue : COLORS.border)};
  background-color: ${COLORS.cardBackground};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${COLORS.primaryBlue}80;
    background-color: ${COLORS.elevatedBackground};
  }
`;

const DropzoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textSecondary};
  text-align: center;
  padding: 16px;
  width: 100%;
`;

const DragActiveContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${COLORS.primaryBlue};
  text-align: center;
  padding: 16px;
  width: 100%;
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  color: ${COLORS.primaryBlue};
`;

const ActionButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 400px;
  margin-top: 24px;
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border-radius: 8px;
  border: none;
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  font-weight: 500;
  gap: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;

  svg {
    font-size: 1.5rem;
    color: ${COLORS.textSecondary};
    transition: color 0.3s ease;
  }

  &:hover {
    background-color: ${COLORS.primaryPurple}20;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};

    svg {
      color: ${COLORS.primaryPurple};
    }
  }

  &:nth-child(2):hover {
    background-color: ${COLORS.primaryBlue}20;

    svg {
      color: ${COLORS.primaryBlue};
    }
  }

  &:nth-child(3):hover {
    background-color: ${COLORS.primaryGreen}20;

    svg {
      color: ${COLORS.primaryGreen};
    }
  }
`;

// Thumbnails
const ThumbnailContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 12px;
  gap: 8px;
  background-color: ${COLORS.elevatedBackground};
  scrollbar-width: none;
  border-top: 1px solid ${COLORS.border};
  border-bottom: 1px solid ${COLORS.border};

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ThumbnailItem = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  border: 2px solid
    ${(props) => (props.isSelected ? COLORS.primaryPurple : "transparent")};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ThumbnailVideo = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ThumbnailVideoIcon = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: ${COLORS.textPrimary};
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
`;

const AddMediaThumbnail = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background-color: ${COLORS.elevatedBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  color: ${COLORS.primaryGreen};
  font-size: 1.5rem;
  border: 1px dashed ${COLORS.border};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${COLORS.primaryGreen}20;
    color: ${COLORS.accentGreen};
    transform: scale(1.05);
  }
`;

// Caption
const CaptionContainer = styled.div`
  padding: 16px;
  border-top: 1px solid ${COLORS.border};
  margin-top: 8px;
  background-color: ${COLORS.cardBackground};
`;

const CaptionTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  resize: none;
  padding: 8px 0;
  min-height: 60px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

// Upload Progress
const UploadProgressContainer = styled.div`
  margin: 16px;
  background-color: ${COLORS.cardBackground};
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${COLORS.border};
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressBarInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background: linear-gradient(
    90deg,
    ${COLORS.primaryPurple},
    ${COLORS.primaryBlue}
  );
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
  text-align: center;
`;

// Compress Option
const CompressOptionContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: ${COLORS.primaryBlue}10;
  border-radius: 4px;
  margin: 8px 16px;
  border: 1px solid ${COLORS.primaryBlue}30;
`;

const CompressCheckbox = styled.input`
  margin-right: 12px;
  accent-color: ${COLORS.primaryBlue};
`;

const CompressLabel = styled.label`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
`;

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const CreateStory = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useContext(AuthContext);

  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCompressOption, setShowCompressOption] = useState(false);
  const [compressVideo, setCompressVideo] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check auth on component mount
  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated || !["admin", "creator"].includes(user?.role))
    ) {
      toast.error("You are not authorized to create a story.");
      navigate("/", { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Check if running as PWA
  useEffect(() => {
    // Check initial PWA status
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    // Define the handler
    const handleChange = (e) => setIsPWA(e.matches);

    // Use standard event listener if available
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [caption]);

  // Handle file uploads with enhanced error handling
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files first
    if (rejectedFiles && rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        if (errors[0]?.code === "file-too-large") {
          toast.error(
            `File ${file.name} is too large. Max size is 20MB for images and 300MB for videos.`
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

    // Check if adding these files would exceed the 20 file limit
    if (mediaFiles.length + acceptedFiles.length > 20) {
      toast.error("Maximum 20 media files allowed per story");
      return;
    }

    // Process accepted files - apply validations
    const validFiles = acceptedFiles.filter((file) => {
      // Image size check
      if (file.type.startsWith("image/") && file.size > 20 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 20MB limit`);
        return false;
      }

      // Video size check
      if (file.type.startsWith("video/")) {
        // Show compress option for large videos
        if (file.size > 150 * 1024 * 1024) {
          setShowCompressOption(true);
        }

        // Hard limit on video size
        if (file.size > 300 * 1024 * 1024) {
          toast.error(`Video ${file.name} exceeds 300MB limit`);
          return false;
        }
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews and update state together
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

    // Update state in a single batch
    setPreviews((prevPreviews) => {
      const newPreviewList = [...prevPreviews, ...newPreviews];
      // If this is the first media being added, set selectedIndex to 0
      if (prevPreviews.length === 0) {
        setSelectedIndex(0);
      }
      return newPreviewList;
    });

    setMediaFiles((prevFiles) => [...prevFiles, ...validFiles]);

    console.log("Media files updated:", validFiles.length, "added");
  }, []); // No mediaFiles dependency to avoid recreating onDrop for each change

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
    maxSize: 300 * 1024 * 1024, // 300MB max file size
    maxFiles: 20,
    noClick: false, // Allow clicking on the dropzone
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

    // Adjust selected index if needed
    if (selectedIndex >= newPreviews.length) {
      setSelectedIndex(Math.max(newPreviews.length - 1, 0));
    }
  };

  // Handle direct camera capture with React refs
  const handleCameraCapture = () => {
    if ("mediaDevices" in navigator) {
      try {
        // Try modern MediaDevices API first
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .then((stream) => {
            // Clean up the stream when done
            stream.getTracks().forEach((track) => track.stop());

            // For now, fall back to the input element approach
            fallbackToFileInput("image");
          })
          .catch((err) => {
            console.log("MediaDevices error:", err);
            fallbackToFileInput("image");
          });
      } catch (err) {
        fallbackToFileInput("image");
      }
    } else {
      fallbackToFileInput("image");
    }
  };

  // Handle video recording with improved cleanup
  const handleVideoCapture = () => {
    if ("mediaDevices" in navigator) {
      try {
        // Try modern MediaDevices API first
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .then((stream) => {
            // Clean up the stream when done
            stream.getTracks().forEach((track) => track.stop());

            // For now, fall back to the input element approach
            fallbackToFileInput("video");
          })
          .catch((err) => {
            console.log("MediaDevices error:", err);
            fallbackToFileInput("video");
          });
      } catch (err) {
        fallbackToFileInput("video");
      }
    } else {
      fallbackToFileInput("video");
    }
  };

  // Fallback method using file input with React ref
  const fallbackToFileInput = (mediaType) => {
    // Create a temporary input element
    const input = document.createElement("input");
    input.type = "file";

    if (mediaType === "image") {
      input.accept = "image/*";
      input.capture = "environment"; // Use the back camera
    } else {
      input.accept = "video/*";
      input.capture = "environment";

      // Show toast about time limit
      toast("Maximum video length: 30 seconds", {
        duration: 3000,
        position: "top-center",
      });
    }

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        console.log("File selected:", file.name, file.type, file.size);

        // Additional client-side validation for videos
        if (file.type.startsWith("video/")) {
          // Check if we can determine the duration
          const video = document.createElement("video");
          video.preload = "metadata";

          // Create safe object URL management
          const videoUrl = URL.createObjectURL(file);
          video.src = videoUrl;

          // Set timeout to handle case where metadata never loads
          const timeoutId = setTimeout(() => {
            URL.revokeObjectURL(videoUrl);
          }, 5000);

          video.onloadedmetadata = function () {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(videoUrl);
            const duration = video.duration;

            // If video is longer than 30 seconds, show warning
            if (duration > 30) {
              toast.warning(
                `Video is ${Math.round(
                  duration
                )} seconds long. Only the first 30 seconds will be used.`,
                { duration: 4000 }
              );
            }
          };

          video.onerror = function () {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(videoUrl);
          };
        }

        onDrop([file], []);
      }
    };

    input.click();
  };

  // Handle selecting media from gallery
  const handleGallerySelect = () => {
    console.log("Opening gallery selector");
    open();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      toast.error("Please add at least one image or video to your story");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("title", caption || "My Story"); // Provide a default title if caption is empty
    formData.append("caption", caption);

    // Add compress flag if enabled
    if (compressVideo) {
      formData.append("compress", "true");
    }

    mediaFiles.forEach((file) => {
      formData.append("media", file);
    });

    // Check if any video files exist
    const hasVideoFiles = mediaFiles.some((file) =>
      file.type.startsWith("video/")
    );

    // Add upload progress monitoring
    const uploadToast = hasVideoFiles
      ? toast.loading("Uploading video... 0%")
      : null;

    try {
      await axios.post("/api/stories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);

          if (hasVideoFiles && uploadToast) {
            toast.loading(`Uploading video... ${percentCompleted}%`, {
              id: uploadToast,
            });
          }
        },
      });

      if (uploadToast) {
        toast.dismiss(uploadToast);
      }

      toast.success("Story created successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error creating story:", err);

      if (!navigator.onLine) {
        toast.error(
          "No internet connection. Please check your network and try again."
        );
        return;
      }

      // More specific error messages based on error type
      if (err.response) {
        // Handle specific HTTP error codes
        switch (err.response.status) {
          case 413:
            toast.error(
              "Video file is too large for the server to process. Please use a shorter video or reduce the quality."
            );
            break;
          case 401:
            toast.error("You need to be logged in to create stories.");
            break;
          case 429:
            toast.error("Too many requests. Please try again later.");
            break;
          default:
            toast.error(
              err.response.data?.message ||
                `Upload failed (${err.response.status}). Please try again.`
            );
        }
      } else if (err.request) {
        // Request was made but no response received
        toast.error("Server not responding. Please try again later.");
      } else if (err.message.includes("timeout")) {
        toast.error(
          "Upload timed out. Please use a shorter video or check your internet connection."
        );
      } else {
        toast.error("Failed to create story. Please try again.");
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
      if (uploadToast) {
        toast.dismiss(uploadToast);
      }
    }
  };

  // Go back (cancel creating story)
  const goBack = () => {
    navigate("/");
  };

  // Handle media selection in thumbnails
  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
  };

  // Handle media selection
  const handleMediaSelect = (mediaType, e) => {
    // Prevent event from propagating to parent dropzone
    if (e) {
      e.stopPropagation();
    }

    // Handle different media types (gallery, camera, or video)
    if (mediaType === "gallery") {
      handleGallerySelect(); // For gallery
    } else if (mediaType === "camera") {
      handleCameraCapture(); // Camera function
    } else if (mediaType === "video") {
      handleVideoCapture(); // Video function
    }
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs when component unmounts
      previews.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
    };
  }, [previews]);

  // Render null during auth loading
  if (authLoading) {
    return null;
  }

  return (
    <PageWrapper>
      <AppHeader>
        <BackButton onClick={goBack} aria-label="Go back">
          <FaArrowLeft />
        </BackButton>
        <HeaderTitle>New Story</HeaderTitle>
        <NextButton
          onClick={handleSubmit}
          disabled={loading || mediaFiles.length === 0}
          aria-label={loading ? "Posting..." : "Share"}
        >
          {loading ? "Posting..." : "Share"}
        </NextButton>
      </AppHeader>

      <MainContent>
        {/* Main Media Preview Area */}
        {previews.length > 0 ? (
          <MediaPreviewContainer>
            {previews[selectedIndex]?.type === "image" ? (
              <MainPreviewImage
                src={previews[selectedIndex].preview}
                alt={`Preview ${selectedIndex + 1}`}
              />
            ) : (
              <MainPreviewVideo>
                <video src={previews[selectedIndex].preview} controls muted />
                <VideoIcon>
                  <FaVideo />
                </VideoIcon>
              </MainPreviewVideo>
            )}
            <RemoveButton
              onClick={() => removePreview(selectedIndex)}
              aria-label={`Remove ${previews[selectedIndex]?.type || "media"}`}
            >
              <FaTimes />
            </RemoveButton>
          </MediaPreviewContainer>
        ) : (
          <DropzoneArea
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
                <p>Add photos and videos to your story</p>
                <ActionButtonsContainer>
                  <ActionButton
                    onClick={(e) => handleMediaSelect("gallery", e)}
                    aria-label="Select media from gallery"
                  >
                    <FaImage />
                    <span>Gallery</span>
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => handleMediaSelect("camera", e)}
                    aria-label="Take a photo with camera"
                  >
                    <FaCamera />
                    <span>Camera</span>
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => handleMediaSelect("video", e)}
                    aria-label="Record a video"
                  >
                    <FaVideo />
                    <span>Video</span>
                  </ActionButton>
                </ActionButtonsContainer>
              </DropzoneContent>
            )}
          </DropzoneArea>
        )}

        {/* Thumbnails for multi-media stories */}
        {previews.length > 0 && (
          <ThumbnailContainer>
            {previews.map((item, index) => (
              <ThumbnailItem
                key={index}
                isSelected={index === selectedIndex}
                onClick={() => handleThumbnailClick(index)}
              >
                {item.type === "image" ? (
                  <ThumbnailImage
                    src={item.preview}
                    alt={`Thumbnail ${index + 1}`}
                  />
                ) : (
                  <ThumbnailVideo>
                    <video src={item.preview} />
                    <ThumbnailVideoIcon>
                      <FaVideo />
                    </ThumbnailVideoIcon>
                  </ThumbnailVideo>
                )}
              </ThumbnailItem>
            ))}
            <AddMediaThumbnail
              onClick={() => handleGallerySelect()}
              aria-label="Add more media"
            >
              <FaPlusCircle />
            </AddMediaThumbnail>
          </ThumbnailContainer>
        )}

        {/* Video Compression Option (if applicable) */}
        {showCompressOption && (
          <CompressOptionContainer>
            <CompressCheckbox
              type="checkbox"
              id="compress-video"
              checked={compressVideo}
              onChange={(e) => setCompressVideo(e.target.checked)}
              aria-label="Compress video"
            />
            <CompressLabel htmlFor="compress-video">
              Compress large videos for faster upload (may reduce quality)
            </CompressLabel>
          </CompressOptionContainer>
        )}

        {/* Caption Input */}
        <CaptionContainer>
          <CaptionTextarea
            ref={textAreaRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={1}
            aria-label="Story caption"
          />
        </CaptionContainer>

        {/* Upload Progress (when submitting) */}
        {loading && uploadProgress > 0 && (
          <UploadProgressContainer>
            <ProgressBarOuter>
              <ProgressBarInner width={uploadProgress} />
            </ProgressBarOuter>
            <ProgressText>{uploadProgress}% Uploaded</ProgressText>
          </UploadProgressContainer>
        )}
      </MainContent>
    </PageWrapper>
  );
};

export default CreateStory;
