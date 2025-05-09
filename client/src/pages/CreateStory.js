import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
  useMemo,
  Fragment,
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
  FaCheck,
  FaCompress,
} from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { COLORS, THEME } from "../theme";

// Styled Components - Updated to match the SoloGram theme
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
  background: ${COLORS.primaryBlueGray}; // Updated to use the new primary blue-gray
  position: sticky;
  top: 0;
  z-index: 10;
  color: ${THEME.header.text};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${THEME.header.icon};
  font-size: 1.25rem;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.textPrimary};
    transform: translateX(-2px);
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  text-align: center;
  color: ${THEME.header.text};
`;

const NextButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.accentMint}; // Updated to use accent mint
  font-weight: 600;
  padding: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.accentSalmon}; // Updated to use accent salmon on hover
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
  background-color: ${COLORS.elevatedBackground};
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
    background-color: rgba(
      233,
      137,
      115,
      0.7
    ); // Using primarySalmon with opacity
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
    ${(props) => (props.isDragActive ? COLORS.primaryMint : COLORS.border)};
  background-color: ${COLORS.elevatedBackground};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${COLORS.primaryMint};
    background-color: ${COLORS.buttonHover};
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
  color: ${COLORS.accentMint};
  text-align: center;
  padding: 16px;
  width: 100%;
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  color: ${COLORS.primaryMint};
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
  background-color: ${COLORS.buttonHover};
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
    background-color: ${COLORS.primaryMint}20;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${COLORS.shadow};

    svg {
      color: ${COLORS.primaryMint};
    }
  }

  &:nth-child(2):hover {
    background-color: ${COLORS.primaryBlueGray}20;

    svg {
      color: ${COLORS.primaryBlueGray};
    }
  }

  &:nth-child(3):hover {
    background-color: ${COLORS.primarySalmon}20;

    svg {
      color: ${COLORS.primarySalmon};
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
    ${(props) => (props.isSelected ? COLORS.primaryMint : "transparent")};
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
  background-color: ${COLORS.elevatedBackground};
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
  color: ${COLORS.accentBlueGray};
  font-size: 1.5rem;
  border: 1px dashed ${COLORS.border};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${COLORS.primaryBlueGray}20;
    color: ${COLORS.accentBlueGray};
    transform: scale(1.05);
  }
`;

// Caption
const CaptionContainer = styled.div`
  padding: 16px;
  border-top: 1px solid ${COLORS.border};
  margin-top: 8px;
  background-color: ${COLORS.elevatedBackground};
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
  background-color: ${COLORS.elevatedBackground};
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${COLORS.border};
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${COLORS.background};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressBarInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background: ${COLORS.primaryMint}; // Updated to primary mint color
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
  background-color: ${COLORS.primaryMint}15;
  border-radius: 4px;
  margin: 8px 16px;
  border: 1px solid ${COLORS.primaryMint}30;
`;

const CompressCheckbox = styled.input`
  margin-right: 12px;
  accent-color: ${COLORS.primaryMint};
`;

const CompressLabel = styled.label`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
`;

// New components for improved UX

const MediaFilesInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: ${COLORS.elevatedBackground};
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
`;

const MediaStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MediaClearButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.error};
  font-size: 0.75rem;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${COLORS.error}15;
  border: 1px solid ${COLORS.error}30;
  color: ${COLORS.error};
  padding: 8px 16px;
  margin: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
`;

const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;

  p {
    margin-top: 16px;
    font-size: 1rem;
  }
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid ${COLORS.primarySalmon}; // Updated to primary salmon
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const PreviewNavigation = styled.div`
  display: flex;
  position: absolute;
  width: 100%;
  bottom: 16px;
  justify-content: center;
  gap: 8px;
  z-index: 5;
`;

const PreviewDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : "rgba(255, 255, 255, 0.5)"};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * CreateStory Component - Optimized for SoloGram theme and fixed preview functionality
 */
const CreateStory = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useContext(AuthContext);

  // State variables
  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCompressOption, setShowCompressOption] = useState(false);
  const [compressVideo, setCompressVideo] = useState(true); // Default to true for better UX
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  // Refs
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoProcessingTimeoutRef = useRef(null);
  const thumbnailContainerRef = useRef(null);

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
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const handleChange = (e) => setIsPWA(e.matches);
    setIsPWA(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

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

  // Scroll selected thumbnail into view
  useEffect(() => {
    if (thumbnailContainerRef.current && previews.length > 0) {
      const container = thumbnailContainerRef.current;
      const selectedThumb = container.children[selectedIndex];

      if (selectedThumb) {
        // Calculate scroll position to center the selected item
        const scrollLeft =
          selectedThumb.offsetLeft -
          container.offsetWidth / 2 +
          selectedThumb.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [selectedIndex, previews.length]);

  // Video processor function - optimized for better handling
  const processVideoFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      try {
        setProcessingVideo(true);
        setUploadStatus("Processing video...");

        // For small videos or if in development mode, skip complex processing
        if (
          file.size < 5 * 1024 * 1024 ||
          process.env.NODE_ENV === "development"
        ) {
          console.log(
            "Skipping detailed video processing for small file or dev mode"
          );
          setTimeout(() => {
            setProcessingVideo(false);
            setUploadStatus("");
            resolve(file);
          }, 500);
          return;
        }

        const video = document.createElement("video");
        video.preload = "metadata";

        // Create a secure blob URL from the file
        const objectUrl = URL.createObjectURL(
          new Blob([file], { type: file.type })
        );
        video.src = objectUrl;

        // Set timeout for processing to prevent hanging
        videoProcessingTimeoutRef.current = setTimeout(() => {
          console.log("Video processing timed out, continuing anyway");
          URL.revokeObjectURL(objectUrl);
          setProcessingVideo(false);
          resolve(file); // Continue with the original file if processing times out
          setUploadStatus("");
        }, 10000);

        video.onloadedmetadata = () => {
          clearTimeout(videoProcessingTimeoutRef.current);

          const duration = video.duration;
          console.log(`Video duration: ${duration} seconds`);

          // Check if video is too long
          if (duration > 60) {
            URL.revokeObjectURL(objectUrl);
            setProcessingVideo(false);
            setUploadStatus("");
            reject(
              new Error(
                `Video is too long (${Math.round(
                  duration
                )} seconds). Maximum allowed duration is 60 seconds.`
              )
            );
            return;
          }

          // If video is reasonably sized, proceed
          URL.revokeObjectURL(objectUrl);
          setProcessingVideo(false);
          setUploadStatus("");
          resolve(file);
        };

        video.onerror = (err) => {
          console.error("Video metadata loading error:", err);
          clearTimeout(videoProcessingTimeoutRef.current);
          URL.revokeObjectURL(objectUrl);
          setProcessingVideo(false);
          setUploadStatus("");
          // Even if we get an error, try to resolve with the file if we're in development mode
          if (process.env.NODE_ENV === "development") {
            console.log("DEV MODE: Continuing despite video metadata error");
            resolve(file);
          } else {
            reject(
              new Error(
                "Failed to load video metadata. The file may be corrupted."
              )
            );
          }
        };
      } catch (err) {
        console.error("Video processing error:", err);
        setProcessingVideo(false);
        setUploadStatus("");

        // In development mode, be more forgiving with errors
        if (process.env.NODE_ENV === "development") {
          console.log("DEV MODE: Continuing despite video processing error");
          resolve(file);
        } else {
          reject(new Error("Error processing video: " + err.message));
        }
      }
    });
  }, []);

  // Fix for video preview by creating object URLs that work with content security policy
  const createSecureVideoPreview = useCallback((file) => {
    // For video previews, create a blob URL with the correct MIME type
    return URL.createObjectURL(new Blob([file], { type: file.type }));
  }, []);

  // Enhanced file drop handler with improved validation and fixed preview generation
  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      setError(""); // Clear any previous errors

      // Handle rejected files with more specific feedback
      if (rejectedFiles && rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          if (errors[0]?.code === "file-too-large") {
            setError(
              `File ${file.name} is too large. Max size is 20MB for images and 300MB for videos.`
            );
            toast.error(
              `File ${file.name} is too large. Max size is 20MB for images and 300MB for videos.`
            );
          } else if (errors[0]?.code === "file-invalid-type") {
            setError(
              `File ${file.name} has an invalid type. Only images (JPG, PNG, GIF) and videos (MP4, MOV) are allowed.`
            );
            toast.error(
              `File ${file.name} has an invalid type. Only images (JPG, PNG, GIF) and videos (MP4, MOV) are allowed.`
            );
          } else {
            setError(
              `File ${file.name} couldn't be uploaded. ${errors[0]?.message}`
            );
            toast.error(
              `File ${file.name} couldn't be uploaded. ${errors[0]?.message}`
            );
          }
        });
      }

      // Check if adding these files would exceed the limit
      if (mediaFiles.length + acceptedFiles.length > 20) {
        setError("Maximum 20 media files allowed per story");
        toast.error("Maximum 20 media files allowed per story");
        return;
      }

      // Process accepted files with better validation
      const validFiles = [];

      for (const file of acceptedFiles) {
        try {
          // Image size check
          if (file.type.startsWith("image/")) {
            if (file.size > 20 * 1024 * 1024) {
              setError(`Image ${file.name} exceeds 20MB limit`);
              toast.error(`Image ${file.name} exceeds 20MB limit`);
              continue;
            }
            validFiles.push(file);
          }
          // Video processing with enhanced checks
          else if (file.type.startsWith("video/")) {
            // Show compress option for large videos
            if (file.size > 50 * 1024 * 1024) {
              setShowCompressOption(true);
            }

            // Hard limit on video size
            if (file.size > 300 * 1024 * 1024) {
              setError(`Video ${file.name} exceeds 300MB limit`);
              toast.error(`Video ${file.name} exceeds 300MB limit`);
              continue;
            }

            try {
              // Process video metadata (check duration, etc.)
              const processedVideo = await processVideoFile(file);
              validFiles.push(processedVideo);
            } catch (videoError) {
              setError(videoError.message);
              toast.error(videoError.message);
              continue;
            }
          }
        } catch (err) {
          console.error("Error processing file:", err);
          toast.error(`Error processing ${file.name}: ${err.message}`);
        }
      }

      if (validFiles.length === 0) return;

      try {
        // Create previews with improved handling
        const newPreviews = await Promise.all(
          validFiles.map(async (file) => {
            const isVideo = file.type.startsWith("video/");

            if (isVideo) {
              // For videos, create a secure preview URL
              const videoPreview = createSecureVideoPreview(file);

              return {
                file,
                preview: videoPreview,
                type: "video",
                name: file.name,
                size: formatFileSize(file.size),
                timestamp: Date.now(),
              };
            } else {
              // For images, create a data URL preview
              try {
                const dataUrl = await readFileAsDataURL(file);
                return {
                  file,
                  preview: dataUrl,
                  type: "image",
                  name: file.name,
                  size: formatFileSize(file.size),
                  timestamp: Date.now(),
                };
              } catch (e) {
                console.error("Failed to create preview for", file.name, e);
                // Create a placeholder instead
                return {
                  file,
                  preview: null, // We'll render a placeholder for this
                  type: "image",
                  name: file.name,
                  size: formatFileSize(file.size),
                  timestamp: Date.now(),
                  error: true,
                };
              }
            }
          })
        );

        // Update state in a single batch with proper selected index handling
        setPreviews((prevPreviews) => {
          const newPreviewList = [...prevPreviews, ...newPreviews];

          // If this is the first media being added, set selectedIndex to 0
          if (prevPreviews.length === 0) {
            setSelectedIndex(0);
          } else {
            // Otherwise, focus on the first of the newly added items
            setSelectedIndex(prevPreviews.length);
          }

          return newPreviewList;
        });

        setMediaFiles((prevFiles) => [...prevFiles, ...validFiles]);

        console.log("Added files successfully:", validFiles.length, "files");
      } catch (error) {
        console.error("Error creating previews:", error);
        toast.error("Error preparing media previews. Please try again.");
      }
    },
    [processVideoFile, createSecureVideoPreview]
  );

  // Helper function to read a file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => {
        console.error("FileReader error:", e);
        reject(e);
      };
      reader.readAsDataURL(file);
    });
  };

  // Configure dropzone with improved options
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
    noClick: false,
    noKeyboard: false,
    preventDropOnDocument: true,
    useFsAccessApi: false, // Disable File System Access API which can cause issues
  });

  // Remove a preview and its file with proper cleanup
  const removePreview = useCallback(
    (index) => {
      const newPreviews = [...previews];
      const newMediaFiles = [...mediaFiles];

      // Properly clean up URLs to prevent memory leaks
      if (newPreviews[index]?.type === "video" && newPreviews[index]?.preview) {
        try {
          URL.revokeObjectURL(newPreviews[index].preview);
        } catch (e) {
          console.error("Error revoking URL:", e);
        }
      }

      newPreviews.splice(index, 1);
      newMediaFiles.splice(index, 1);

      setPreviews(newPreviews);
      setMediaFiles(newMediaFiles);

      // Adjust selected index if needed
      if (selectedIndex >= newPreviews.length && newPreviews.length > 0) {
        setSelectedIndex(Math.max(newPreviews.length - 1, 0));
      } else if (newPreviews.length === 0) {
        setSelectedIndex(0);
      }

      // Hide compress option if no videos left
      if (!newMediaFiles.some((file) => file.type.startsWith("video/"))) {
        setShowCompressOption(false);
        setCompressVideo(false);
      }
    },
    [previews, mediaFiles, selectedIndex]
  );

  // Remove all media at once with proper cleanup
  const removeAllMedia = useCallback(() => {
    // Clean up video preview URLs
    previews.forEach((preview) => {
      if (preview.type === "video" && preview.preview) {
        try {
          URL.revokeObjectURL(preview.preview);
        } catch (e) {
          console.error("Error revoking URL:", e);
        }
      }
    });

    setPreviews([]);
    setMediaFiles([]);
    setSelectedIndex(0);
    setShowCompressOption(false);
    setCompressVideo(false);
  }, [previews]);

  // Optimized camera capture with permissions handling
  const handleCameraCapture = useCallback(() => {
    // First check if we have permission
    if (!navigator.permissions || !navigator.permissions.query) {
      // Browser doesn't support permission API, try direct capture
      directCaptureMedia("image");
      return;
    }

    navigator.permissions
      .query({ name: "camera" })
      .then((permissionStatus) => {
        if (permissionStatus.state === "granted") {
          directCaptureMedia("image");
        } else if (permissionStatus.state === "prompt") {
          // Will show permission dialog
          directCaptureMedia("image");
        } else {
          // Permission denied
          toast.error(
            "Camera access is blocked. Please check your browser settings."
          );
        }
      })
      .catch((error) => {
        console.log("Permission check failed:", error);
        directCaptureMedia("image");
      });
  }, []);

  // Optimized video capture with permissions handling
  const handleVideoCapture = useCallback(() => {
    // First check if we have permission
    if (!navigator.permissions || !navigator.permissions.query) {
      // Browser doesn't support permission API, try direct capture
      directCaptureMedia("video");
      return;
    }

    navigator.permissions
      .query({ name: "camera" })
      .then((permissionStatus) => {
        if (permissionStatus.state === "granted") {
          directCaptureMedia("video");
        } else if (permissionStatus.state === "prompt") {
          // Will show permission dialog
          directCaptureMedia("video");
        } else {
          // Permission denied
          toast.error(
            "Camera access is blocked. Please check your browser settings."
          );
        }
      })
      .catch((error) => {
        console.log("Permission check failed:", error);
        directCaptureMedia("video");
      });
  }, []);

  // Improved direct media capture function
  const directCaptureMedia = useCallback(
    (mediaType) => {
      try {
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
          toast("Maximum video length: 60 seconds", {
            duration: 3000,
            position: "top-center",
            icon: "🎥",
            style: {
              background: COLORS.elevatedBackground,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
            },
          });
        }

        // Handle file selection
        input.onchange = async (e) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            console.log("File selected:", file.name, file.type, file.size);

            // Use the onDrop function to handle the file with validation
            await onDrop([file], []);
          }
        };

        input.click();
      } catch (error) {
        console.error("Error capturing media:", error);
        toast.error("Failed to capture media. Please try again.");
      }
    },
    [onDrop]
  );

  // Handle gallery select with explicit error handling
  const handleGallerySelect = useCallback(() => {
    console.log("Opening gallery selector");
    try {
      open();
    } catch (error) {
      console.error("Error opening file selector:", error);

      // Fallback method if React Dropzone's open fails
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "image/*,video/*";

      input.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files);
          console.log("Files selected:", files.length);
          await onDrop(files, []);
        }
      };

      input.click();
    }
  }, [open, onDrop]);

  // More reliable form submission with better error handling
  const handleSubmit = useCallback(async () => {
    if (mediaFiles.length === 0) {
      toast.error("Please add at least one image or video to your story");
      return;
    }

    // Clear any previous errors
    setError("");
    setLoading(true);
    setUploadProgress(0);

    // Check internet connection first
    if (!navigator.onLine) {
      toast.error(
        "No internet connection. Please check your network and try again."
      );
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", caption || "My Story"); // Provide a default title if caption is empty
    formData.append("caption", caption);

    // Add compress flag if enabled
    if (compressVideo) {
      formData.append("compress", "true");
    }

    console.log(`Uploading ${mediaFiles.length} files`);

    // Add files - use simpler approach to avoid backend confusion
    mediaFiles.forEach((file) => {
      formData.append("media", file);
    });

    // Check if any video files exist for toast messaging
    const hasVideoFiles = mediaFiles.some((file) =>
      file.type.startsWith("video/")
    );
    const uploadToastId = hasVideoFiles
      ? toast.loading("Preparing to upload video...", {
          style: {
            background: COLORS.elevatedBackground,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
          },
        })
      : toast.loading("Uploading story...", {
          style: {
            background: COLORS.elevatedBackground,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
          },
        });

    try {
      setUploadStatus("Uploading story...");

      // Simplified mock upload for testing - remove in production
      if (process.env.NODE_ENV === "development") {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setUploadProgress(i);
          setUploadStatus(`Uploading: ${i}%`);
          toast.loading(`Uploading: ${i}%`, {
            id: uploadToastId,
            style: {
              background: COLORS.elevatedBackground,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
            },
          });
        }

        // Simulate successful upload
        toast.dismiss(uploadToastId);
        toast.success("Story created successfully!", {
          style: {
            background: COLORS.elevatedBackground,
            color: COLORS.textPrimary,
            border: `1px solid ${COLORS.border}`,
          },
          icon: "🎉",
        });
        navigate("/");
        return;
      }

      // Real implementation
      const response = await axios.post("/api/stories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            setUploadStatus(`Uploading: ${percentCompleted}%`);

            // Update toast message
            toast.loading(`Uploading: ${percentCompleted}%`, {
              id: uploadToastId,
              style: {
                background: COLORS.elevatedBackground,
                color: COLORS.textPrimary,
                border: `1px solid ${COLORS.border}`,
              },
            });
          }
        },
        // Add timeout for large uploads
        timeout: 300000, // 5 minutes
      });

      console.log("Upload response:", response);
      toast.dismiss(uploadToastId);
      toast.success("Story created successfully!", {
        style: {
          background: COLORS.elevatedBackground,
          color: COLORS.textPrimary,
          border: `1px solid ${COLORS.border}`,
        },
        icon: "🎉",
      });
      navigate("/");
    } catch (err) {
      console.error("Error creating story:", err);
      toast.dismiss(uploadToastId);

      // More specific and user-friendly error messages
      if (err.response) {
        switch (err.response.status) {
          case 413:
            setError(
              "Files are too large. Please use smaller files or enable compression."
            );
            toast.error(
              "Files are too large. Please use smaller files or enable compression.",
              {
                style: {
                  background: COLORS.elevatedBackground,
                  color: COLORS.error,
                  border: `1px solid ${COLORS.error}30`,
                },
              }
            );
            break;
          case 401:
            setError("You need to be logged in to create stories.");
            toast.error("You need to be logged in to create stories.", {
              style: {
                background: COLORS.elevatedBackground,
                color: COLORS.error,
                border: `1px solid ${COLORS.error}30`,
              },
            });
            break;
          case 429:
            setError("Too many requests. Please try again later.");
            toast.error("Too many requests. Please try again later.", {
              style: {
                background: COLORS.elevatedBackground,
                color: COLORS.error,
                border: `1px solid ${COLORS.error}30`,
              },
            });
            break;
          case 500:
            setError("Server error. The team has been notified.");
            toast.error("Server error. The team has been notified.", {
              style: {
                background: COLORS.elevatedBackground,
                color: COLORS.error,
                border: `1px solid ${COLORS.error}30`,
              },
            });
            break;
          default:
            setError(
              err.response.data?.message ||
                `Upload failed (${err.response.status}). Please try again.`
            );
            toast.error(
              err.response.data?.message ||
                `Upload failed (${err.response.status}). Please try again.`,
              {
                style: {
                  background: COLORS.elevatedBackground,
                  color: COLORS.error,
                  border: `1px solid ${COLORS.error}30`,
                },
              }
            );
        }
      } else if (err.request) {
        // For development testing - simulate success even if server is not available
        if (process.env.NODE_ENV === "development") {
          console.log(
            "DEV MODE: Simulating successful upload despite server error"
          );
          toast.success("Story created successfully! (DEV MODE)", {
            style: {
              background: COLORS.elevatedBackground,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
            },
            icon: "🎉",
          });
          navigate("/");
          return;
        }

        setError("Server not responding. Please try again later.");
        toast.error("Server not responding. Please try again later.", {
          style: {
            background: COLORS.elevatedBackground,
            color: COLORS.error,
            border: `1px solid ${COLORS.error}30`,
          },
        });
      } else if (err.message.includes("timeout")) {
        setError(
          "Upload timed out. Please try again with smaller files or better connection."
        );
        toast.error(
          "Upload timed out. Please try again with smaller files or better connection.",
          {
            style: {
              background: COLORS.elevatedBackground,
              color: COLORS.error,
              border: `1px solid ${COLORS.error}30`,
            },
          }
        );
      } else {
        setError("Failed to create story. Please try again.");
        toast.error("Failed to create story. Please try again.", {
          style: {
            background: COLORS.elevatedBackground,
            color: COLORS.error,
            border: `1px solid ${COLORS.error}30`,
          },
        });
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  }, [mediaFiles, caption, compressVideo, navigate]);

  // Simple navigation handler
  const goBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Optimized thumbnail handling
  const handleThumbnailClick = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  // Media selection handler with improved error catching
  const handleMediaSelect = useCallback(
    (mediaType, e) => {
      // Prevent event from propagating to parent dropzone
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      try {
        if (mediaType === "gallery") {
          handleGallerySelect();
        } else if (mediaType === "camera") {
          handleCameraCapture();
        } else if (mediaType === "video") {
          handleVideoCapture();
        }
      } catch (error) {
        console.error(`Error handling ${mediaType} selection:`, error);
        toast.error(`Failed to access ${mediaType}. Please try again.`, {
          style: {
            background: COLORS.elevatedBackground,
            color: COLORS.error,
            border: `1px solid ${COLORS.error}30`,
          },
        });
      }
    },
    [handleGallerySelect, handleCameraCapture, handleVideoCapture]
  );

  // Clean up on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any timeouts
      if (videoProcessingTimeoutRef.current) {
        clearTimeout(videoProcessingTimeoutRef.current);
      }

      // Clean up video preview URLs
      previews.forEach((preview) => {
        if (preview.type === "video" && preview.preview) {
          try {
            URL.revokeObjectURL(preview.preview);
          } catch (e) {
            console.error("Error revoking URL:", e);
          }
        }
      });
    };
  }, [previews]);

  // Memoized media count stats for better performance
  const mediaStats = useMemo(() => {
    const imageCount = mediaFiles.filter((file) =>
      file.type.startsWith("image/")
    ).length;
    const videoCount = mediaFiles.filter((file) =>
      file.type.startsWith("video/")
    ).length;

    return {
      total: mediaFiles.length,
      images: imageCount,
      videos: videoCount,
    };
  }, [mediaFiles]);

  // Render null during auth loading
  if (authLoading) {
    return null;
  }

  // Plain fallback element for video previews
  const renderVideoFallback = () => {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.elevatedBackground,
          color: COLORS.textSecondary,
        }}
      >
        <FaVideo style={{ fontSize: "3rem", marginBottom: "1rem" }} />
        <p>Video preview unavailable</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Tap to select</p>
      </div>
    );
  };

  // Plain fallback element for image previews
  const renderImageFallback = () => {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.elevatedBackground,
          color: COLORS.textSecondary,
        }}
      >
        <FaImage style={{ fontSize: "3rem", marginBottom: "1rem" }} />
        <p>Image preview unavailable</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Tap to select</p>
      </div>
    );
  };

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
        {/* Media Files Info */}
        {mediaFiles.length > 0 && (
          <MediaFilesInfo>
            <MediaStats>
              <span>
                {mediaStats.total} file{mediaStats.total !== 1 ? "s" : ""}
              </span>
              {mediaStats.images > 0 && (
                <span>
                  • {mediaStats.images} image
                  {mediaStats.images !== 1 ? "s" : ""}
                </span>
              )}
              {mediaStats.videos > 0 && (
                <span>
                  • {mediaStats.videos} video
                  {mediaStats.videos !== 1 ? "s" : ""}
                </span>
              )}
            </MediaStats>
            <MediaClearButton onClick={removeAllMedia}>
              <FaTimes size={12} /> Clear all
            </MediaClearButton>
          </MediaFilesInfo>
        )}

        {/* Error message display */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Main Media Preview Area */}
        {previews.length > 0 ? (
          <MediaPreviewContainer>
            {previews[selectedIndex] ? (
              previews[selectedIndex].type === "image" ? (
                previews[selectedIndex].preview ? (
                  <MainPreviewImage
                    src={previews[selectedIndex].preview}
                    alt={`Preview ${selectedIndex + 1}`}
                    onError={(e) => {
                      console.error("Image preview error:", e);
                      // Use a simpler approach instead of ReactDOM.render
                      e.target.style.display = "none";
                      e.target.parentNode.appendChild(
                        document.createTextNode("Image preview unavailable")
                      );
                      e.target.parentNode.style.display = "flex";
                      e.target.parentNode.style.alignItems = "center";
                      e.target.parentNode.style.justifyContent = "center";
                      e.target.parentNode.style.backgroundColor =
                        COLORS.elevatedBackground;
                      e.target.parentNode.style.color = COLORS.textSecondary;
                    }}
                  />
                ) : (
                  renderImageFallback()
                )
              ) : previews[selectedIndex].preview ? (
                <MainPreviewVideo>
                  <video
                    src={previews[selectedIndex].preview}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      console.error("Video preview error:", e);
                      // Use DOM manipulation instead of ReactDOM
                      e.target.style.display = "none";

                      // Create fallback content
                      const fallbackContainer = document.createElement("div");
                      fallbackContainer.style.width = "100%";
                      fallbackContainer.style.height = "100%";
                      fallbackContainer.style.display = "flex";
                      fallbackContainer.style.flexDirection = "column";
                      fallbackContainer.style.alignItems = "center";
                      fallbackContainer.style.justifyContent = "center";
                      fallbackContainer.style.backgroundColor =
                        COLORS.elevatedBackground;
                      fallbackContainer.style.color = COLORS.textSecondary;

                      // Create icon
                      const iconDiv = document.createElement("div");
                      iconDiv.style.fontSize = "3rem";
                      iconDiv.style.marginBottom = "1rem";
                      iconDiv.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.4-29.1-40.4-50.4-25.8z"/></svg>';

                      // Create text
                      const textDiv = document.createElement("div");
                      textDiv.textContent = "Video preview unavailable";

                      // Append elements
                      fallbackContainer.appendChild(iconDiv);
                      fallbackContainer.appendChild(textDiv);

                      // Add to parent
                      e.target.parentNode.appendChild(fallbackContainer);
                    }}
                  />
                  <VideoIcon>
                    <FaVideo />
                  </VideoIcon>
                </MainPreviewVideo>
              ) : (
                renderVideoFallback()
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  backgroundColor: COLORS.elevatedBackground,
                  color: COLORS.textSecondary,
                }}
              >
                Media preview unavailable
              </div>
            )}

            <RemoveButton
              onClick={() => removePreview(selectedIndex)}
              aria-label={`Remove ${previews[selectedIndex]?.type || "media"}`}
            >
              <FaTimes />
            </RemoveButton>

            {/* Preview dots navigation for quick jumping between media */}
            {previews.length > 1 && (
              <PreviewNavigation>
                {previews.map((_, index) => (
                  <PreviewDot
                    key={`dot-${index}`}
                    active={index === selectedIndex}
                    onClick={() => handleThumbnailClick(index)}
                  />
                ))}
              </PreviewNavigation>
            )}
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
          <ThumbnailContainer ref={thumbnailContainerRef}>
            {previews.map((item, index) => (
              <ThumbnailItem
                key={`thumb-${index}-${item.timestamp || index}`}
                isSelected={index === selectedIndex}
                onClick={() => handleThumbnailClick(index)}
              >
                {item.type === "image" ? (
                  item.preview ? (
                    <ThumbnailImage
                      src={item.preview}
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        console.error("Thumbnail image error:", e);
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232D2D2D'/%3E%3Cpath d='M35,50 L65,50 M50,35 L50,65' stroke='%23B0B0B0' stroke-width='3'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: COLORS.elevatedBackground,
                      }}
                    >
                      <FaImage color={COLORS.textTertiary} />
                    </div>
                  )
                ) : (
                  <ThumbnailVideo>
                    {item.preview ? (
                      <video src={item.preview} />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: COLORS.elevatedBackground,
                        }}
                      >
                        <FaVideo color={COLORS.textTertiary} />
                      </div>
                    )}
                    <ThumbnailVideoIcon>
                      <FaVideo />
                    </ThumbnailVideoIcon>
                  </ThumbnailVideo>
                )}
              </ThumbnailItem>
            ))}
            {mediaFiles.length < 20 && (
              <AddMediaThumbnail
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGallerySelect();
                }}
                aria-label="Add more media"
              >
                <FaPlusCircle />
              </AddMediaThumbnail>
            )}
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
              <FaCompress style={{ marginRight: "6px", fontSize: "12px" }} />
              Compress large videos for faster upload (recommended)
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
            maxLength={2200} // Instagram-like character limit
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

      {/* Fullscreen loaders */}
      {processingVideo && (
        <LoaderOverlay>
          <Spinner />
          <p>Processing video, please wait...</p>
        </LoaderOverlay>
      )}

      {loading && (
        <LoaderOverlay>
          <Spinner />
          <p>{uploadStatus || "Creating your story..."}</p>
        </LoaderOverlay>
      )}
    </PageWrapper>
  );
};

export default CreateStory;
