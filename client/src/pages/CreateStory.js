import React, { useState, useCallback, useRef, useEffect } from "react";
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
  FaInfoCircle,
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCompressOption, setShowCompressOption] = useState(false);
  const [compressVideo, setCompressVideo] = useState(false);

  const textAreaRef = useRef(null);
  const navigate = useNavigate();

  // Check if running as PWA
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => setIsPWA(e.matches);

    // Use the appropriate event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
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
    maxSize: 300 * 1024 * 1024, // 300MB max file size
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
            // This is just a check if we can access the camera
            // In a full implementation, you would set up MediaRecorder here
            // and capture an image or video

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

  // Handle video recording
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
            // This is just a check if we can access the camera
            // In a full implementation, you would set up MediaRecorder here

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

  // Fallback method using file input
  const fallbackToFileInput = (mediaType) => {
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
                {
                  duration: 4000,
                }
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
    open();
  };

  // Show video size guide
  const showVideoSizeGuide = () => {
    const sizeGuide = `
      Estimated Video Sizes for 30 seconds:
      - Low quality (480p): ~20-50MB
      - Medium quality (720p): ~50-100MB
      - High quality (1080p): ~100-200MB
      - Very high quality (4K): ~200-300MB
      
      Maximum upload size: 300MB
    `;

    toast(
      <div style={{ whiteSpace: "pre-line", textAlign: "left" }}>
        {sizeGuide}
      </div>,
      { duration: 8000 }
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

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

  // Go to next step
  const goToNextStep = () => {
    if (!caption || mediaFiles.length === 0) {
      toast.error("Please add a caption and at least one media item.");
      return;
    }

    handleSubmit();
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
  const handleMediaSelect = (mediaType) => {
    // Handle different media types (gallery, camera, or video)
    if (mediaType === "gallery") {
      open(); // For gallery
    } else if (mediaType === "camera") {
      handleCameraCapture(); // Camera function
    } else if (mediaType === "video") {
      handleVideoCapture(); // Video function
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
          aria-label="Drop zone for media files"
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
          <DropzoneSubtext>
            You can add up to 20 photos and videos. Max file size: 20MB for
            images, 300MB for videos (approx. 30 seconds of 4K video)
          </DropzoneSubtext>
        </DropzoneContainer>

        <ActionButtonsContainer>
          <ActionButton
            onClick={() => handleMediaSelect("gallery")}
            aria-label="Select media from gallery"
          >
            <FaImage />
            <span>Gallery</span>
          </ActionButton>
          <ActionButton
            onClick={() => handleMediaSelect("camera")}
            aria-label="Take a photo with camera"
          >
            <FaCamera />
            <span>Camera</span>
          </ActionButton>
          <ActionButton
            onClick={() => handleMediaSelect("video")}
            aria-label="Record a video"
          >
            <FaVideo />
            <span>Video</span>
          </ActionButton>
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
                <PreviewImage src={item.preview} alt={`Preview ${index + 1}`} />
              ) : (
                <PreviewVideo>
                  <video src={item.preview} controls muted />
                  <VideoIcon>
                    <FaVideo />
                  </VideoIcon>
                </PreviewVideo>
              )}
              <RemoveButton
                onClick={() => removePreview(index)}
                aria-label={`Remove ${item.type} ${index + 1}`}
              >
                <FaTimes />
              </RemoveButton>
              {previews.length > 1 && (
                <PreviewNumber>{index + 1}</PreviewNumber>
              )}
            </PreviewItem>
          ))}
        </MediaPreview>

        {previews.length > 0 && (
          <AddMoreButton onClick={open} aria-label="Add more media">
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
      </DetailsContainer>
    </>
  );

  return (
    <PageWrapper>
      <AppHeader>
        <BackButton onClick={goToPreviousStep} aria-label="Go back">
          <FaArrowLeft />
        </BackButton>
        <HeaderTitle>
          {currentStep === "upload" && "New Story"}
          {currentStep === "edit" && "Edit"}
          {currentStep === "details" && "New Story"}
        </HeaderTitle>
        {currentStep !== "upload" && (
          <NextButton
            onClick={goToNextStep}
            disabled={loading}
            aria-label={
              currentStep === "details"
                ? loading
                  ? "Posting..."
                  : "Share"
                : "Next"
            }
          >
            {currentStep === "details"
              ? loading
                ? "Posting..."
                : "Share"
              : "Next"}
          </NextButton>
        )}
      </AppHeader>

      <MainContent>
        <UploadContainer>
          {/* Uploading & Previewing Media */}
          <MediaPreview>
            {previews.map((item, index) => (
              <PreviewItem key={index}>
                {item.type === "image" ? (
                  <PreviewImage
                    src={item.preview}
                    alt={`Preview ${index + 1}`}
                  />
                ) : (
                  <PreviewVideo>
                    <video src={item.preview} controls />
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

          {/* Caption Field */}
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

          {/* Submit/Next Button */}
          <NextButton onClick={goToNextStep} disabled={loading}>
            {loading ? "Posting..." : "Share"}
          </NextButton>
        </UploadContainer>
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

const DropzoneSubtext = styled.p`
  color: #666;
  font-size: 0.75rem;
  text-align: center;
  max-width: 80%;
  margin-top: 8px;
`;

const ActionButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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

// const InfoButton = styled(ActionButton)`
//   background-color: #262626;
//   color: #aaaaaa;

//   &:hover {
//     color: #ff7e5f;
//     background-color: #363636;
//   }
// `;

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
  width: ${(props) => props.width}%;
  background-color: #ff7e5f;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.75rem;
  color: #aaa;
  text-align: center;
`;

const CompressOptionContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 126, 95, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
`;

const CompressCheckbox = styled.input`
  margin-right: 0.75rem;
`;

const CompressLabel = styled.label`
  font-size: 0.875rem;
  color: #fff;
`;

const InfoButton = styled.button`
  background: none;
  border: none;
  color: #aaaaaa;
  font-size: 1rem;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }
`;

export default CreateStory;
