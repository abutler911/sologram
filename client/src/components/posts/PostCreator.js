import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaImage,
  FaVideo,
  FaCamera,
  FaTimes,
  FaArrowRight,
  FaArrowLeft,
  FaFilter,
  FaCheck,
  FaTag,
  FaPencilAlt,
  FaLocationArrow,
} from "react-icons/fa";
import { COLORS, THEME } from "../../theme";
import { useUploadManager } from "../../hooks/useUploadManager";

// Default placeholder - using data URI instead of external service
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

// Styled components - Updated for more Instagram-like experience
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 2px 10px ${COLORS.shadow};
  color: ${COLORS.textPrimary};

  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;

  h1 {
    flex-grow: 1;
    text-align: center;
    font-size: 20px;
    color: ${COLORS.textPrimary};
    margin: 0;
  }

  @media (max-width: 768px) {
    padding-bottom: 10px;
    border-bottom: 1px solid ${COLORS.divider};
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 100%;
  top: 40px;

  @media (max-width: 768px) {
    top: 30px;
  }
`;

const Step = styled.div`
  padding: 6px 12px;
  background-color: ${(props) =>
    props.active ? COLORS.primaryPurple : COLORS.elevatedBackground};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin: 0 5px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  color: ${(props) => (props.active ? "#fff" : COLORS.textSecondary)};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: ${(props) => (props.active ? "none" : "translateY(-2px)")};
  }
`;

const MediaSection = styled.div`
  margin-top: 35px;
`;

const DropArea = styled.div`
  border: 2px dashed ${COLORS.border};
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.elevatedBackground}10;

  &:hover {
    border-color: ${COLORS.primaryPurple};
    background-color: rgba(94, 53, 177, 0.05);
  }

  p {
    margin: 15px 0;
    color: ${COLORS.textSecondary};
    max-width: 80%;
    line-height: 1.5;
  }
`;

const UploadIcon = styled.div`
  display: flex;
  gap: 20px;
  font-size: 40px;
  color: ${COLORS.textTertiary};

  svg {
    transition: transform 0.3s, color 0.3s;
  }

  ${DropArea}:hover & svg {
    color: ${COLORS.primaryPurple};
    transform: scale(1.1);
  }
`;

// Updated button styles for a more Instagram-like feel
const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 25px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 500px;
`;

const MediaButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: ${COLORS.cardBackground};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 5px ${COLORS.shadow};

  &:hover {
    transform: translateY(-2px);
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 4px 8px ${COLORS.primaryPurple}20;
  }

  &:active {
    transform: translateY(1px);
  }

  svg {
    font-size: 18px;
    transition: transform 0.2s ease;
  }
`;

const CameraButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryGreen};
  }
`;

const VideoCameraButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryRed || "#e53935"};
  }
`;

const GalleryButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryBlue};
  }
`;

const MediaPreview = styled.div`
  margin-bottom: ${(props) => (props.small ? "20px" : "30px")};
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 600px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px ${COLORS.shadow}30;

  @media (max-width: 768px) {
    border-radius: 0;
    margin-left: -15px;
    margin-right: -15px;
    width: calc(100% + 30px);
  }
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;

  &.filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale {
    filter: grayscale(1);
  }

  &.filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  &.filter-clarendon {
    filter: contrast(1.2) saturate(1.35);
  }

  &.filter-gingham {
    filter: brightness(1.05) hue-rotate(-10deg) sepia(0.2);
  }

  &.filter-moon {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }

  &.filter-lark {
    filter: brightness(1.1) contrast(0.9) saturate(1.1);
  }
`;

const VideoPreview = styled.video`
  max-width: 100%;
  max-height: 100%;

  &.filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale {
    filter: grayscale(1);
  }

  &.filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  &.filter-clarendon {
    filter: contrast(1.2) saturate(1.35);
  }

  &.filter-gingham {
    filter: brightness(1.05) hue-rotate(-10deg) sepia(0.2);
  }

  &.filter-moon {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }

  &.filter-lark {
    filter: brightness(1.1) contrast(0.9) saturate(1.1);
  }
`;

const UploadOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
`;

const UploadProgress = styled.div`
  width: 80%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const UploadProgressInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background-color: ${COLORS.primaryPurple};
  transition: width 0.3s;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(244, 67, 54, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;

  button {
    background: white;
    color: ${COLORS.error};
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    margin-top: 10px;
    cursor: pointer;
    font-weight: bold;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  z-index: 3;
  transition: background-color 0.2s;

  &:hover {
    background: ${COLORS.error};
  }
`;

const NavigationButtons = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 3;
`;

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s, background-color 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${COLORS.primaryPurple};
    transform: scale(1.05);
  }
`;

const MediaCounter = styled.div`
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 12px;
`;

// Instagram-like filter options
const FilterOptions = styled.div`
  margin-top: 20px;
`;

const FiltersGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 15px;
  padding: 10px 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    padding-bottom: 15px;
  }
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: ${(props) => (props.active ? 1 : 0.7)};
  transform: ${(props) => (props.active ? "scale(1.05)" : "scale(1)")};
  transition: all 0.2s ease;

  span {
    margin-top: 8px;
    font-size: 12px;
    color: ${(props) =>
      props.active ? COLORS.primaryPurple : COLORS.textTertiary};
    font-weight: ${(props) => (props.active ? "600" : "normal")};
  }

  &:hover {
    opacity: 1;
  }
`;

const FilterPreview = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.filter-warm img {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  &.filter-cool img {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  &.filter-grayscale img {
    filter: grayscale(1);
  }

  &.filter-vintage img {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  &.filter-clarendon img {
    filter: contrast(1.2) saturate(1.35);
  }

  &.filter-gingham img {
    filter: brightness(1.05) hue-rotate(-10deg) sepia(0.2);
  }

  &.filter-moon img {
    filter: grayscale(1) brightness(1.1) contrast(1.1);
  }

  &.filter-lark img {
    filter: brightness(1.1) contrast(0.9) saturate(1.1);
  }
`;

// Instagram-style action bar
const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: ${COLORS.cardBackground};
  border-top: 1px solid ${COLORS.divider};
  padding: 12px 0;
  margin: 0 -10px;
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  color: ${(props) =>
    props.active ? COLORS.primaryPurple : COLORS.textSecondary};

  svg {
    font-size: 20px;
    margin-bottom: 4px;
  }

  span {
    font-size: 11px;
    font-weight: 500;
  }

  &:hover {
    color: ${COLORS.primaryPurple};
  }
`;

const AddMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: transparent;
  color: ${COLORS.primaryPurple};
  border: 1px solid ${COLORS.primaryPurple};
  border-radius: 20px;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  margin: 15px auto;

  &:hover {
    background-color: ${COLORS.primaryPurple}10;
  }

  svg {
    font-size: 16px;
  }
`;

const NextButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  background: transparent;
  color: ${COLORS.primaryPurple};
  border: none;
  padding: 0 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? "0.5" : "1")};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const BackButton = styled.button`
  position: absolute;
  left: 0;
  top: 0;
  background: transparent;
  color: ${COLORS.textSecondary};
  border: none;
  padding: 0 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    color: ${COLORS.textPrimary};
  }
`;

// Details Section Styles (Improved Instagram-like)
const DetailsSection = styled.div`
  margin-top: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  position: relative;

  &:first-of-type {
    border-top: 1px solid ${COLORS.divider};
    padding-top: 15px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 2px ${COLORS.primaryPurple}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 0 0 2px ${COLORS.primaryPurple}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const CharCount = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  font-size: 12px;
  color: ${(props) => (props.overLimit ? COLORS.error : COLORS.textTertiary)};
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  background-color: ${COLORS.elevatedBackground};
  overflow: hidden;

  svg {
    color: ${COLORS.textTertiary};
    margin: 0 12px;
    font-size: 18px;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 0 12px 0;

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }
`;

const PublishButton = styled.button`
  background-color: ${THEME.button.action.background};
  color: ${THEME.button.action.text};
  border: none;
  border-radius: 4px;
  padding: 12px 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 20px;

  &:disabled {
    background-color: ${COLORS.elevatedBackground};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${THEME.button.action.hoverBackground};
  }

  @media (max-width: 768px) {
    position: sticky;
    bottom: 0;
    border-radius: 0;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${COLORS.divider};
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${COLORS.elevatedBackground};
  overflow: hidden;
  margin-right: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.textPrimary};
`;

const MainContent = styled.div`
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  padding-right: 5px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${COLORS.divider};
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    max-height: calc(100vh - 180px);
  }
`;

// New components for Instagram-like details UI
const LocationPicker = styled.div`
  margin-top: 20px;
`;

const LocationButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  border: none;
  padding: 8px 0;
  color: ${COLORS.primaryBlue};
  font-size: 14px;
  cursor: pointer;

  svg {
    margin-right: 8px;
  }
`;

// Main component (Updated with Instagram-like flow)
function PostCreator({ initialData = null, isEditing = false }) {
  // Component state
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(
    initialData?.tags ? initialData.tags.join(", ") : ""
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeAction, setActiveAction] = useState("filter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const navigate = useNavigate();
  const inputFileRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoCameraInputRef = useRef(null);
  const { startUpload, mountedRef } = useUploadManager(setMedia);

  // Instagram-like filters
  const filters = [
    { id: "none", name: "Normal", className: "" },
    { id: "clarendon", name: "Clarendon", className: "filter-clarendon" },
    { id: "gingham", name: "Gingham", className: "filter-gingham" },
    { id: "moon", name: "Moon", className: "filter-moon" },
    { id: "lark", name: "Lark", className: "filter-lark" },
    { id: "warm", name: "Warm", className: "filter-warm" },
    { id: "cool", name: "Cool", className: "filter-cool" },
    { id: "bw", name: "B&W", className: "filter-grayscale" },
    { id: "vintage", name: "Vintage", className: "filter-vintage" },
  ];

  // Load existing media when editing
  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const existingMedia = initialData.media.map((item) => {
        const filter = item.filter || "none";
        const filterClass =
          filters.find((f) => f.id === filter)?.className || "";

        return {
          id:
            item._id ||
            `existing_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 8)}`,
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.mediaType,
          filter: filter,
          filterClass: filterClass,
          isExisting: true,
          uploading: false,
          error: false,
        };
      });

      setMedia(existingMedia);
    }
  }, [isEditing, initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      // Revoke object URLs to prevent memory leaks
      media.forEach((item) => {
        if (item.previewUrl && !item.isExisting) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (err) {
            console.error("Failed to revoke URL:", err);
          }
        }
      });
    };
  }, [media]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const uniqueFiles = acceptedFiles.filter((file) => {
        const isDuplicate = media.some(
          (m) =>
            m.file?.name === file.name &&
            m.file?.size === file.size &&
            m.file?.lastModified === file.lastModified
        );

        if (isDuplicate) {
          toast.error(`File "${file.name}" is already added.`);
          return false;
        }
        return true;
      });

      if (uniqueFiles.length === 0) return;

      // Add all files to the media array first
      const newItems = uniqueFiles.map((file) => {
        const id = `media_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        const isVideo = file.type.startsWith("video/");
        const objectUrl = URL.createObjectURL(file);

        console.log(
          `Processing ${isVideo ? "video" : "image"}: ${file.name}, type: ${
            file.type
          }`
        );

        return {
          id,
          file,
          previewUrl: objectUrl,
          type: isVideo ? "video" : "image",
          mediaType: isVideo ? "video" : "image", // Ensure both properties are set
          filter: "none",
          filterClass: "",
          uploading: true,
          progress: 0,
          error: false,
        };
      });

      setMedia((prev) => [...prev, ...newItems]);

      // Then start uploads for each item
      newItems.forEach((item) => {
        // Pass the explicit file type to startUpload
        startUpload(item.file, item.id, item.type)
          .then((result) => {
            console.log(`Upload complete for ${item.id}:`, result);
          })
          .catch((error) => {
            console.error(`Upload failed for ${item.id}:`, error);
          });
      });
    },
    [media, startUpload]
  );

  // Configure dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    onDrop,
    maxSize: 25 * 1024 * 1024, // 25MB
  });

  // Handle camera capture
  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    console.log(`Camera capture - File: ${file.name}, Type: ${file.type}`);

    const isDuplicate = media.some(
      (m) =>
        m.file?.name === file.name &&
        m.file?.size === file.size &&
        m.file?.lastModified === file.lastModified
    );

    if (isDuplicate) {
      toast.error(`File "${file.name}" is already added.`);
      return;
    }

    const id = `camera_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const isVideo = file.type.startsWith("video/");
    const objectUrl = URL.createObjectURL(file);
    const mediaType = isVideo ? "video" : "image";

    console.log(`Camera captured a ${mediaType}: ${file.name}`);

    // First add the file to the media list
    setMedia((current) => [
      ...current,
      {
        id,
        file,
        previewUrl: objectUrl,
        type: mediaType,
        mediaType: mediaType, // Set both properties for consistency
        filter: "none",
        filterClass: "",
        uploading: true,
        progress: 0,
        error: false,
      },
    ]);

    // Then start the upload with explicit file type
    try {
      const result = await startUpload(file, id, mediaType);
      console.log(`Upload completed successfully:`, result);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Navigation between media items
  const showPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const showNext = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Apply filter to current media
  const applyFilter = (filterId) => {
    setActiveFilter(filterId);

    // Find the class name associated with this filter ID
    const filterClass = filters.find((f) => f.id === filterId)?.className || "";

    // Update the filter on the current media item
    setMedia((currentMedia) =>
      currentMedia.map((item, index) =>
        index === currentIndex
          ? { ...item, filter: filterId, filterClass }
          : item
      )
    );
  };

  // Remove media item
  const removeMedia = (indexToRemove) => {
    // Remove the item
    setMedia((current) => {
      const newMedia = current.filter((_, index) => index !== indexToRemove);

      // Adjust current index if needed
      if (currentIndex >= newMedia.length) {
        setCurrentIndex(Math.max(0, newMedia.length - 1));
      }

      return newMedia;
    });
  };

  const totalProgress = media.length
    ? Math.round(
        media.reduce((sum, item) => sum + (item.progress || 0), 0) /
          media.length
      )
    : 0;

  // Submit the post
  const handleSubmit = async () => {
    if (media.length === 0) {
      toast.error("Please add at least one photo or video");
      return;
    }

    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }

    // Check for any uploads still in progress
    if (media.some((item) => item.uploading)) {
      toast.error("Please wait for uploads to complete");
      return;
    }

    // Check for any failed uploads
    const failedItems = media.filter((item) => item.error);
    if (failedItems.length > 0) {
      toast.error(
        `Please remove ${failedItems.length} failed upload(s) before continuing`
      );
      return;
    }

    // Make sure all media items have the required properties
    const incompleteItems = media.filter(
      (item) => !item.mediaUrl || !item.cloudinaryId
    );

    if (incompleteItems.length > 0) {
      toast.error(
        `${incompleteItems.length} media item(s) failed to upload properly`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the media items for submission
      const mediaItems = media
        .filter((item) => !item.error && !item.isExisting)
        .map((item) => ({
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.mediaType || item.type,
          filter: item.filter || "none",
        }));

      console.log("Submitting media items:", mediaItems);

      // Create the payload
      const payload = {
        caption,
        content,
        tags,
        media: mediaItems,
        location,
      };

      let response;

      if (isEditing) {
        // Add existing media IDs to keep
        const existingMediaIds = media
          .filter((item) => item.isExisting)
          .map((item) => item.id)
          .join(",");

        if (existingMediaIds) {
          payload.keepMedia = existingMediaIds;
        }

        response = await axios.put(`/api/posts/${initialData._id}`, payload);
        toast.success("Post updated successfully!");
      } else {
        response = await axios.post("/api/posts", payload);
        toast.success("Post created successfully!");
      }

      console.log("Server response:", response.data);
      navigate(`/post/${response.data.data._id}`);
    } catch (error) {
      console.error("Error creating/updating post:", error);
      const errorMessage = error.response?.data?.message || "Please try again";
      toast.error(
        `Failed to ${isEditing ? "update" : "create"} post: ${errorMessage}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the Instagram-like UI
  return (
    <Container>
      <Header>
        {step === 1 ? (
          <>
            <h1>{isEditing ? "Edit Post" : "New Post"}</h1>
            {media.length > 0 && (
              <NextButton
                onClick={() => setStep(2)}
                disabled={media.some(
                  (item) => !item.mediaUrl || item.uploading
                )}
              >
                Next
              </NextButton>
            )}
          </>
        ) : (
          <>
            <BackButton onClick={() => setStep(1)}>Back</BackButton>
            <h1>New Post</h1>
            <NextButton
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !caption.trim() ||
                media.length === 0 ||
                media.some((item) => item.uploading)
              }
            >
              Share
            </NextButton>
          </>
        )}
      </Header>

      {step === 1 ? (
        <MediaSection>
          {media.length === 0 ? (
            <DropArea {...getRootProps()}>
              <input {...getInputProps()} ref={inputFileRef} />
              <UploadIcon>
                <FaImage />
                <FaVideo />
              </UploadIcon>
              <p>Create a new post by uploading your photos and videos</p>
              <ButtonGroup>
                <CameraButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cameraInputRef.current) {
                      cameraInputRef.current.accept = "image/*";
                      cameraInputRef.current.capture = "environment";
                      cameraInputRef.current.click();
                    }
                  }}
                >
                  <FaCamera />
                  <span>Camera</span>
                </CameraButton>
                <VideoCameraButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoCameraInputRef.current) {
                      videoCameraInputRef.current.accept = "video/*";
                      videoCameraInputRef.current.capture = "environment";
                      videoCameraInputRef.current.click();
                    }
                  }}
                >
                  <FaVideo />
                  <span>Video</span>
                </VideoCameraButton>
                <GalleryButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const galleryInput = document.createElement("input");
                    galleryInput.type = "file";
                    galleryInput.accept = "image/*,video/*";
                    galleryInput.multiple = true;
                    galleryInput.style.display = "none";

                    galleryInput.onchange = (event) => {
                      if (event.target.files?.length) {
                        onDrop(Array.from(event.target.files));
                      }
                    };

                    document.body.appendChild(galleryInput);
                    galleryInput.click();

                    setTimeout(() => {
                      document.body.removeChild(galleryInput);
                    }, 1000);
                  }}
                >
                  <FaImage />
                  <span>Gallery</span>
                </GalleryButton>
              </ButtonGroup>
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleCameraCapture}
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
              />
              <input
                type="file"
                ref={videoCameraInputRef}
                onChange={handleCameraCapture}
                accept="video/*"
                capture="environment"
                style={{ display: "none" }}
              />
            </DropArea>
          ) : (
            <>
              <MediaPreview>
                {media.some((item) => item.uploading) && (
                  <div
                    style={{
                      textAlign: "center",
                      margin: "10px 0",
                      color: COLORS.textSecondary,
                      fontSize: "14px",
                    }}
                  >
                    Uploading... {totalProgress}%
                  </div>
                )}

                <PreviewContainer>
                  {media[currentIndex].type === "video" ||
                  media[currentIndex].mediaType === "video" ? (
                    <VideoPreview
                      src={
                        media[currentIndex].mediaUrl ||
                        media[currentIndex].previewUrl
                      }
                      className={
                        media[currentIndex].filterClass ||
                        filters.find((f) => f.id === media[currentIndex].filter)
                          ?.className ||
                        ""
                      }
                      controls
                      playsInline // Add this for better mobile compatibility
                      onError={(e) => {
                        console.error("Video error:", e);
                        e.target.src = PLACEHOLDER_IMG;
                      }}
                    />
                  ) : (
                    <ImagePreview
                      src={
                        media[currentIndex].mediaUrl ||
                        media[currentIndex].previewUrl
                      }
                      className={
                        media[currentIndex].filterClass ||
                        filters.find((f) => f.id === media[currentIndex].filter)
                          ?.className ||
                        ""
                      }
                      alt="Preview"
                      onError={(e) => {
                        console.error("Image error:", e);
                        e.target.src = PLACEHOLDER_IMG;
                      }}
                    />
                  )}
                  ) : (
                  <ImagePreview
                    src={
                      media[currentIndex].mediaUrl ||
                      media[currentIndex].previewUrl
                    }
                    className={
                      media[currentIndex].filterClass ||
                      filters.find((f) => f.id === media[currentIndex].filter)
                        ?.className ||
                      ""
                    }
                    alt="Preview"
                    onError={(e) => {
                      e.target.src = PLACEHOLDER_IMG;
                    }}
                  />
                  {media[currentIndex].uploading && (
                    <UploadOverlay>
                      <UploadProgress>
                        <UploadProgressInner
                          width={media[currentIndex].progress}
                        />
                      </UploadProgress>
                      <p>Uploading... {media[currentIndex].progress}%</p>
                    </UploadOverlay>
                  )}
                  {media[currentIndex].error && (
                    <ErrorOverlay>
                      <p>Upload failed</p>
                      {media[currentIndex].errorMessage && (
                        <p style={{ fontSize: "12px", marginTop: "5px" }}>
                          {media[currentIndex].errorMessage}
                        </p>
                      )}
                      <button onClick={() => removeMedia(currentIndex)}>
                        Remove
                      </button>
                    </ErrorOverlay>
                  )}
                  <RemoveButton onClick={() => removeMedia(currentIndex)}>
                    <FaTimes />
                  </RemoveButton>
                  {media.length > 1 && (
                    <NavigationButtons>
                      <NavButton
                        onClick={showPrevious}
                        disabled={currentIndex === 0}
                      >
                        <FaArrowLeft />
                      </NavButton>
                      <MediaCounter>
                        {currentIndex + 1} / {media.length}
                      </MediaCounter>
                      <NavButton
                        onClick={showNext}
                        disabled={currentIndex === media.length - 1}
                      >
                        <FaArrowRight />
                      </NavButton>
                    </NavigationButtons>
                  )}
                </PreviewContainer>
              </MediaPreview>

              {/* Instagram-like Action Bar */}
              <ActionBar>
                <ActionButton
                  active={activeAction === "filter"}
                  onClick={() => setActiveAction("filter")}
                >
                  <FaFilter />
                  <span>Filter</span>
                </ActionButton>
                <ActionButton
                  active={activeAction === "add"}
                  onClick={() => {
                    setActiveAction("add");
                    const galleryInput = document.createElement("input");
                    galleryInput.type = "file";
                    galleryInput.accept = "image/*,video/*";
                    galleryInput.multiple = true;
                    galleryInput.style.display = "none";

                    galleryInput.onchange = (event) => {
                      if (event.target.files?.length) {
                        onDrop(Array.from(event.target.files));
                      }
                    };

                    document.body.appendChild(galleryInput);
                    galleryInput.click();

                    setTimeout(() => {
                      document.body.removeChild(galleryInput);
                    }, 1000);
                  }}
                >
                  <FaImage />
                  <span>Add</span>
                </ActionButton>
              </ActionBar>

              {activeAction === "filter" && (
                <FilterOptions>
                  <FiltersGrid>
                    {filters.map((filter) => (
                      <FilterItem
                        key={filter.id}
                        active={media[currentIndex].filter === filter.id}
                        onClick={() => applyFilter(filter.id)}
                      >
                        <FilterPreview className={filter.className}>
                          <img
                            src={
                              media[currentIndex].mediaUrl ||
                              media[currentIndex].previewUrl
                            }
                            alt={filter.name}
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_IMG;
                            }}
                          />
                        </FilterPreview>
                        <span>{filter.name}</span>
                      </FilterItem>
                    ))}
                  </FiltersGrid>
                </FilterOptions>
              )}
            </>
          )}
        </MediaSection>
      ) : (
        <DetailsSection>
          <MainContent>
            {/* User info header - Instagram style */}
            <UserInfo>
              <UserAvatar>
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%23f0f0f0'/%3E%3Ccircle cx='18' cy='14' r='6' fill='%23cccccc'/%3E%3Cpath d='M8,30 C8,24 12,20 18,20 C24,20 28,24 28,30' fill='%23cccccc'/%3E%3C/svg%3E"
                  alt="Your profile"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EYou%3C/text%3E%3C/svg%3E";
                  }}
                />
              </UserAvatar>
              <UserName>Your Username</UserName>
            </UserInfo>

            <FormGroup>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={4}
                maxLength={2200}
                required
              />
              <CharCount overLimit={caption.length > 2000}>
                {caption.length}/2200
              </CharCount>
            </FormGroup>

            <FormGroup>
              <InputGroup>
                <FaLocationArrow />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup>
                <FaTag />
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Add tags (comma separated)"
                />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup>
                <FaPencilAlt />
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add additional content (optional)"
                />
              </InputGroup>
            </FormGroup>
          </MainContent>

          <PublishButton
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !caption.trim() ||
              media.length === 0 ||
              media.some((item) => item.uploading)
            }
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Sharing..."
              : isEditing
              ? "Update"
              : "Share"}
          </PublishButton>
        </DetailsSection>
      )}
    </Container>
  );
}

export default PostCreator;
