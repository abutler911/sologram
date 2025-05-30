import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
} from "react";
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
  FaPlus,
  FaFilter,
  FaTag,
  FaPencilAlt,
  FaLocationArrow,
  FaCalendarDay,
  FaRobot,
  FaMagic,
  FaGripVertical,
  FaCheck,
} from "react-icons/fa";
import { COLORS } from "../../theme";
import { useUploadManager } from "../../hooks/useUploadManager";
import { AuthContext } from "../../context/AuthContext";

// Constants
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

const FILTERS = [
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

// Utility Functions
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const createSafeBlobUrl = (file) => {
  console.log(
    "Creating preview for:",
    file.name,
    "Type:",
    file.type,
    "Size:",
    file.size
  );

  try {
    // For images, always use data URL on mobile, blob URL on desktop
    if (file.type.startsWith("image/")) {
      if (isMobileDevice()) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log("Data URL created for mobile:", file.name);
            resolve(e.target.result);
          };
          reader.onerror = (e) => {
            console.error("FileReader error:", e);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      } else {
        // Desktop: use blob URL
        const url = URL.createObjectURL(file);
        console.log("Blob URL created for desktop:", file.name, url);
        return Promise.resolve(url);
      }
    }

    // For videos, always use blob URL
    const url = URL.createObjectURL(file);
    console.log("Blob URL created for video:", file.name, url);
    return Promise.resolve(url);
  } catch (error) {
    console.error("Failed to create preview URL for:", file.name, error);
    return Promise.resolve(null);
  }
};

const getSafeImageSrc = (mediaItem) => {
  // Always prioritize uploaded URL first
  if (mediaItem.mediaUrl) {
    return mediaItem.mediaUrl;
  }

  // Then use preview URL (blob or data URL)
  if (mediaItem.previewUrl) {
    return mediaItem.previewUrl;
  }

  // Fallback to placeholder
  return PLACEHOLDER_IMG;
};

// Styled Components - Base Components First
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: ${COLORS.cardBackground};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid ${COLORS.border};

  @media (max-width: 768px) {
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
    min-height: 100vh;
  }
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${COLORS.border};
  background: linear-gradient(
    135deg,
    ${COLORS.primaryMint}15 0%,
    ${COLORS.primarySalmon}15 100%
  );
`;

const HeaderContent = styled.div`
  text-align: center;

  h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: ${COLORS.textPrimary};
  }

  p {
    margin: 0;
    color: ${COLORS.textSecondary};
    font-size: 14px;
  }
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 20px;
  }
`;

const MediaSection = styled.div`
  min-height: 200px;
`;

const DropArea = styled.div`
  border: 2px dashed
    ${(props) => (props.isDragActive ? COLORS.primarySalmon : COLORS.border)};
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.isDragActive
      ? `${COLORS.primarySalmon}08`
      : COLORS.elevatedBackground};

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}08;
  }

  &:hover .upload-icon svg {
    color: ${COLORS.primarySalmon};
  }
`;

const UploadIcon = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;

  svg {
    font-size: 32px;
    color: ${COLORS.primaryBlueGray};
    transition: color 0.3s ease;
  }
`;

const DropText = styled.div`
  margin-bottom: 24px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.textPrimary};
  }

  p {
    margin: 0;
    color: ${COLORS.textSecondary};
    font-size: 14px;
  }
`;

const UploadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS.accentSalmon};
    transform: translateY(-1px);
  }

  svg {
    font-size: 14px;
  }
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MediaItemContainer = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: ${COLORS.elevatedBackground};
  border: 2px solid
    ${(props) => (props.isDragging ? COLORS.primarySalmon : COLORS.border)};
  transition: all 0.2s ease;
  cursor: ${(props) => (props.isDragging ? "grabbing" : "grab")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:hover .drag-handle {
    opacity: 1;
  }

  &:hover .media-actions {
    opacity: 1;
  }
`;

const DragHandle = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  svg {
    font-size: 12px;
  }
`;

const MediaContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  img,
  video {
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
  }

  /* Stories-style image fallback */
  &.image-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${COLORS.cardBackground};

    &:before {
      content: "\\f03e";
      font-family: "Font Awesome 5 Free";
      font-weight: 900;
      font-size: 1.2rem;
      color: ${COLORS.textTertiary};
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &.processing-state {
    background: ${COLORS.elevatedBackground};
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Stories-style image and video components
const StoryStyleImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: ${COLORS.cardBackground};
`;

const StoryStyleVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: none;
`;

const ProcessingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${COLORS.textSecondary};
  text-align: center;
  padding: 8px;
`;

const ProcessingText = styled.div`
  font-size: 11px;
  font-weight: 500;
`;

const MediaActions = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS.primarySalmon};
  }

  &.remove:hover {
    background: ${COLORS.error};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 12px;
  }
`;

const FilterBadge = styled.div`
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
`;

const UploadOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`;

const UploadProgress = styled.div`
  width: 70%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const UploadProgressInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background: ${COLORS.primarySalmon};
  transition: width 0.3s ease;
`;

const UploadText = styled.div`
  font-size: 10px;
  font-weight: 500;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(244, 67, 54, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 8px;
`;

const ErrorText = styled.div`
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const RetryButton = styled.button`
  background: white;
  color: ${COLORS.error};
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
`;

const AddMoreButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 1;
  background: ${COLORS.elevatedBackground};
  border: 2px dashed ${COLORS.border};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${COLORS.textSecondary};

  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}08;
  }

  svg {
    font-size: 20px;
  }

  span {
    font-size: 12px;
    font-weight: 500;
  }
`;

const PostDetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.textPrimary};
  }
`;

const AIButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryMint} 0%,
    ${COLORS.primarySalmon} 100%
  );
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  svg {
    font-size: 14px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TwoColumnGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  color: ${COLORS.textPrimary};
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  color: ${COLORS.textPrimary};
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const IconInput = styled.div`
  display: flex;
  align-items: center;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }

  svg {
    margin: 0 12px;
    color: ${COLORS.primarySalmon};
    font-size: 16px;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 12px 12px 0;

    &:focus {
      outline: none;
    }
  }
`;

const TagInput = styled(IconInput)``;

const TagInputField = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 12px 12px 0;

  &:focus {
    outline: none;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: ${COLORS.elevatedBackground};
  border-radius: 8px;
  border: 1px dashed ${COLORS.border};
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${COLORS.primarySalmon}20;
  color: ${COLORS.primarySalmon};
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;

  &:hover {
    background: ${COLORS.primarySalmon}30;
  }

  svg {
    font-size: 10px;
  }
`;

const CharCount = styled.div`
  font-size: 12px;
  color: ${COLORS.textTertiary};
  text-align: right;
`;

const ActionBar = styled.div`
  padding: 24px;
  border-top: 1px solid ${COLORS.border};
  background: ${COLORS.elevatedBackground};

  @media (max-width: 768px) {
    position: sticky;
    bottom: 0;
    z-index: 100;
  }
`;

const PostButton = styled.button`
  width: 100%;
  background: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${COLORS.accentSalmon};
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${COLORS.border};
    cursor: not-allowed;
    transform: none;
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${COLORS.border};

  h3 {
    margin: 0;
    color: ${COLORS.textPrimary};
    font-size: 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;

  &:hover {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.textPrimary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Select = styled.select`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const ErrorMessage = styled.div`
  background: ${COLORS.error}15;
  border: 1px solid ${COLORS.error}30;
  color: ${COLORS.error};
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const GenerateButton = styled.button`
  width: 100%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon} 0%,
    ${COLORS.accentSalmon} 100%
  );
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${COLORS.primarySalmon}30;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const GeneratedSection = styled.div`
  border-top: 1px solid ${COLORS.border};
  padding-top: 1.5rem;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SectionTitle = styled.h4`
  color: ${COLORS.textPrimary};
  margin: 0 0 1rem 0;
  font-size: 1rem;
`;

const ContentPreview = styled.div`
  margin-bottom: 1rem;
`;

const ContentLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.5rem;
`;

const ContentBox = styled.div`
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  line-height: 1.5;
  font-size: 0.875rem;
`;

const TagsPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagPreview = styled.span`
  background: ${COLORS.primarySalmon}20;
  color: ${COLORS.primarySalmon};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const SecondaryButton = styled.button`
  flex: 1;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS.border};
    color: ${COLORS.textPrimary};
  }
`;

const ApplyButton = styled.button`
  flex: 2;
  background: ${COLORS.primaryMint};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: ${COLORS.accentMint};
    transform: translateY(-1px);
  }
`;

// Filter Modal Styled Components
const FilterModalContent = styled(ModalContent)`
  max-width: 600px;
`;

const FilterPreviewSection = styled.div`
  padding: 0;
`;

const MainPreview = styled.div`
  padding: 0;
  background: ${COLORS.background};
  border-bottom: 1px solid ${COLORS.border};
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
`;

const FilterOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.active ? 1 : 0.7)};

  &:hover {
    opacity: 1;
    background: ${COLORS.elevatedBackground};
  }
`;

const FilterThumbnail = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid
    ${(props) => (props.active ? COLORS.primarySalmon : COLORS.border)};

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

const FilterName = styled.span`
  margin-top: 8px;
  font-size: 12px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textSecondary};
`;

const FilterActionBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid ${COLORS.border};
`;

// AI Content Generator Modal Component
const AIContentModal = ({ isOpen, onClose, onApplyContent }) => {
  const [formData, setFormData] = useState({
    description: "",
    contentType: "general",
    tone: "casual",
    additionalContext: "",
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const contentTypes = [
    { value: "general", label: "General Post" },
    { value: "product", label: "Product Showcase" },
    { value: "behind-scenes", label: "Behind the Scenes" },
    { value: "educational", label: "Educational" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "announcement", label: "Announcement" },
  ];

  const tones = [
    { value: "casual", label: "Casual & Friendly" },
    { value: "professional", label: "Professional" },
    { value: "playful", label: "Fun & Playful" },
    { value: "inspirational", label: "Inspirational" },
    { value: "minimalist", label: "Clean & Minimal" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleGenerate = async () => {
    if (!formData.description.trim()) {
      setError("Please provide a description for your content");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(
        "https://sologram-api.onrender.com/api/admin/ai-content/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate content");
      }

      setGeneratedContent(data.data);
      toast.success("Content generated successfully!");
    } catch (error) {
      setError(
        error.message || "Failed to generate content. Please try again."
      );
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApplyContent(generatedContent);
      onClose();
      setGeneratedContent(null);
      setFormData({
        description: "",
        contentType: "general",
        tone: "casual",
        additionalContext: "",
      });
      setError("");
    }
  };

  const handleClose = () => {
    onClose();
    setGeneratedContent(null);
    setFormData({
      description: "",
      contentType: "general",
      tone: "casual",
      additionalContext: "",
    });
    setError("");
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>✨ Generate AI Content</h3>
          <CloseButton onClick={handleClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label>Content Description *</Label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what your post is about..."
              maxLength="500"
            />
            <CharCount>{formData.description.length}/500</CharCount>
          </FormGroup>

          <InputRow>
            <FormGroup>
              <Label>Content Type</Label>
              <Select
                name="contentType"
                value={formData.contentType}
                onChange={handleInputChange}
              >
                {contentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Tone</Label>
              <Select
                name="tone"
                value={formData.tone}
                onChange={handleInputChange}
              >
                {tones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </InputRow>

          <FormGroup>
            <Label>Additional Context (Optional)</Label>
            <Input
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              placeholder="Any additional details..."
              maxLength="200"
            />
          </FormGroup>

          {error && (
            <ErrorMessage>
              <FaTimes />
              {error}
            </ErrorMessage>
          )}

          <GenerateButton
            onClick={handleGenerate}
            disabled={isGenerating || !formData.description.trim()}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              <>
                <FaMagic />
                Generate Content
              </>
            )}
          </GenerateButton>

          {generatedContent && (
            <GeneratedSection>
              <SectionTitle>Generated Content</SectionTitle>

              <ContentPreview>
                <ContentLabel>Title</ContentLabel>
                <ContentBox>{generatedContent.title}</ContentBox>
              </ContentPreview>

              <ContentPreview>
                <ContentLabel>Caption</ContentLabel>
                <ContentBox>{generatedContent.caption}</ContentBox>
              </ContentPreview>

              {generatedContent.tags && generatedContent.tags.length > 0 && (
                <ContentPreview>
                  <ContentLabel>Suggested Tags</ContentLabel>
                  <TagsPreview>
                    {generatedContent.tags.map((tag, index) => (
                      <TagPreview key={index}>#{tag}</TagPreview>
                    ))}
                  </TagsPreview>
                </ContentPreview>
              )}

              <ButtonRow>
                <SecondaryButton onClick={() => setGeneratedContent(null)}>
                  Generate New
                </SecondaryButton>
                <ApplyButton onClick={handleApply}>
                  Use This Content
                </ApplyButton>
              </ButtonRow>
            </GeneratedSection>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// Filter Selection Modal Component
const FilterModal = ({ isOpen, onClose, mediaItem, onApplyFilter }) => {
  const [selectedFilter, setSelectedFilter] = useState(
    mediaItem?.filter || "none"
  );

  useEffect(() => {
    if (mediaItem) {
      setSelectedFilter(mediaItem.filter || "none");
    }
  }, [mediaItem]);

  const handleApplyFilter = () => {
    onApplyFilter(selectedFilter);
    onClose();
  };

  if (!isOpen || !mediaItem) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <FilterModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Choose Filter</h3>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <FilterPreviewSection>
          <MainPreview>
            {mediaItem.mediaType === "video" ? (
              <video
                src={getSafeImageSrc(mediaItem)}
                className={
                  FILTERS.find((f) => f.id === selectedFilter)?.className || ""
                }
                style={{ width: "100%", height: "300px", objectFit: "cover" }}
                controls
                playsInline
              />
            ) : (
              <img
                src={getSafeImageSrc(mediaItem)}
                className={
                  FILTERS.find((f) => f.id === selectedFilter)?.className || ""
                }
                style={{ width: "100%", height: "300px", objectFit: "cover" }}
                alt="Preview"
              />
            )}
          </MainPreview>

          <FiltersGrid>
            {FILTERS.map((filter) => (
              <FilterOption
                key={filter.id}
                active={selectedFilter === filter.id}
                onClick={() => setSelectedFilter(filter.id)}
              >
                <FilterThumbnail className={filter.className}>
                  <img
                    src={getSafeImageSrc(mediaItem)}
                    alt={filter.name}
                    onError={(e) => {
                      e.target.src = PLACEHOLDER_IMG;
                    }}
                  />
                </FilterThumbnail>
                <FilterName active={selectedFilter === filter.id}>
                  {filter.name}
                </FilterName>
              </FilterOption>
            ))}
          </FiltersGrid>

          <FilterActionBar>
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <ApplyButton onClick={handleApplyFilter}>
              <FaCheck /> Apply Filter
            </ApplyButton>
          </FilterActionBar>
        </FilterPreviewSection>
      </FilterModalContent>
    </ModalOverlay>
  );
};

// Media Item Component with Stories-style preview handling
const MediaItem = ({
  mediaItem,
  index,
  onRemove,
  onFilter,
  onReorder,
  isDragging,
  ...dragProps
}) => {
  const [imageSrc, setImageSrc] = useState(getSafeImageSrc(mediaItem));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(
    !mediaItem.mediaUrl && !mediaItem.previewUrl
  );

  useEffect(() => {
    const newSrc = getSafeImageSrc(mediaItem);
    console.log(
      "MediaItem effect - updating src:",
      newSrc,
      "for item:",
      mediaItem.id
    );
    setImageSrc(newSrc);
    setHasError(false);
    setIsLoading(!mediaItem.mediaUrl && !mediaItem.previewUrl);
  }, [mediaItem.mediaUrl, mediaItem.previewUrl]);

  const handleImageError = (e) => {
    console.error("Image load error for:", mediaItem.id, "src:", e.target.src);

    // Hide the broken image and show fallback
    e.target.style.display = "none";
    if (e.target.parentNode) {
      e.target.parentNode.classList.add("image-fallback");
    }
    setHasError(true);
  };

  const handleImageLoad = () => {
    console.log("Image loaded successfully for:", mediaItem.id);
    setIsLoading(false);
    setHasError(false);
  };

  // Show processing state if no preview available yet
  if ((!imageSrc || imageSrc === PLACEHOLDER_IMG) && !mediaItem.mediaUrl) {
    return (
      <MediaItemContainer isDragging={isDragging} {...dragProps}>
        <MediaContent className="processing-state">
          <ProcessingOverlay>
            <ProcessingText>
              {mediaItem.uploading
                ? `Uploading... ${mediaItem.progress || 0}%`
                : "Processing..."}
            </ProcessingText>
            {mediaItem.uploading && (
              <UploadProgress>
                <UploadProgressInner width={mediaItem.progress || 0} />
              </UploadProgress>
            )}
          </ProcessingOverlay>
        </MediaContent>
        <MediaActions className="media-actions">
          <ActionButton
            onClick={() => onRemove(index)}
            className="remove"
            title="Remove media"
          >
            <FaTimes />
          </ActionButton>
        </MediaActions>
      </MediaItemContainer>
    );
  }

  return (
    <MediaItemContainer isDragging={isDragging} {...dragProps}>
      <DragHandle className="drag-handle">
        <FaGripVertical />
      </DragHandle>

      <MediaContent>
        {mediaItem.mediaType === "video" ? (
          <StoryStyleVideo
            src={imageSrc}
            className={mediaItem.filterClass || ""}
            onError={handleImageError}
            onLoadedData={handleImageLoad}
            playsInline
            muted
            preload="metadata"
            loading="lazy"
          />
        ) : (
          <StoryStyleImage
            src={imageSrc}
            className={mediaItem.filterClass || ""}
            alt="Media preview"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        )}

        {mediaItem.uploading && (
          <UploadOverlay>
            <UploadProgress>
              <UploadProgressInner width={mediaItem.progress || 0} />
            </UploadProgress>
            <UploadText>Uploading... {mediaItem.progress || 0}%</UploadText>
          </UploadOverlay>
        )}

        {mediaItem.error && (
          <ErrorOverlay>
            <ErrorText>Upload failed</ErrorText>
            <RetryButton onClick={() => onRemove(index)}>Remove</RetryButton>
          </ErrorOverlay>
        )}
      </MediaContent>

      <MediaActions className="media-actions">
        <ActionButton
          onClick={() => onFilter(mediaItem, index)}
          disabled={mediaItem.uploading || mediaItem.error || hasError}
          title="Apply filter"
        >
          <FaFilter />
        </ActionButton>
        <ActionButton
          onClick={() => onRemove(index)}
          className="remove"
          title="Remove media"
        >
          <FaTimes />
        </ActionButton>
      </MediaActions>

      {mediaItem.filter && mediaItem.filter !== "none" && (
        <FilterBadge>
          {FILTERS.find((f) => f.id === mediaItem.filter)?.name}
        </FilterBadge>
      )}
    </MediaItemContainer>
  );
};

// Main PostCreator Component
function PostCreator({ initialData = null, isEditing = false }) {
  // State management
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState(initialData?.title || "");
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [location, setLocation] = useState(initialData?.location || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState(() => {
    const rawDate = initialData?.date || new Date().toISOString();
    return rawDate.split("T")[0];
  });
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMediaForFilter, setSelectedMediaForFilter] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Refs and hooks
  const navigate = useNavigate();
  const inputFileRef = useRef(null);
  const { startUpload, mountedRef } = useUploadManager(setMedia);
  const { user } = useContext(AuthContext);

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Only revoke blob URLs, not data URLs
      media.forEach((item) => {
        if (
          item.previewUrl &&
          !item.isExisting &&
          item.previewUrl.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (err) {
            console.warn("Failed to revoke URL:", err);
          }
        }
      });
    };
  }, []);

  // Load existing media when editing
  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const existingMedia = initialData.media.map((item) => {
        const filter = item.filter || "none";
        const filterClass =
          FILTERS.find((f) => f.id === filter)?.className || "";

        return {
          id:
            item._id ||
            `existing_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 8)}`,
          _id: item._id,
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

  // File drop handler
  const onDrop = useCallback(
    async (acceptedFiles) => {
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

      const newItems = await Promise.all(
        uniqueFiles.map(async (file) => {
          const id = `media_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}`;
          const isVideo = file.type.startsWith("video/");
          const previewUrl = await createSafeBlobUrl(file);

          return {
            id,
            file,
            previewUrl,
            type: isVideo ? "video" : "image",
            mediaType: isVideo ? "video" : "image",
            filter: "none",
            filterClass: "",
            uploading: true,
            progress: 0,
            error: false,
            isMobile: isMobileDevice(),
          };
        })
      );

      setMedia((prev) => [...prev, ...newItems]);

      // Start uploads
      newItems.forEach((item) => {
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
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    onDrop,
    maxSize: 25 * 1024 * 1024, // 25MB
    noClick: media.length > 0, // Disable click when media exists
  });

  // Media management functions
  const removeMedia = (indexToRemove) => {
    const itemToRemove = media[indexToRemove];

    // Only revoke blob URLs, not data URLs
    if (
      itemToRemove?.previewUrl &&
      !itemToRemove.isExisting &&
      itemToRemove.previewUrl.startsWith("blob:")
    ) {
      try {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      } catch (err) {
        console.warn("Failed to revoke URL:", err);
      }
    }

    setMedia((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  };

  const openFilterModal = (mediaItem, index) => {
    setSelectedMediaForFilter({ ...mediaItem, index });
    setShowFilterModal(true);
  };

  const applyFilter = (filterId) => {
    if (!selectedMediaForFilter) return;

    const filterClass = FILTERS.find((f) => f.id === filterId)?.className || "";

    setMedia((currentMedia) =>
      currentMedia.map((item, index) =>
        index === selectedMediaForFilter.index
          ? { ...item, filter: filterId, filterClass }
          : item
      )
    );
  };

  const reorderMedia = (fromIndex, toIndex) => {
    setMedia((currentMedia) => {
      const newMedia = [...currentMedia];
      const [movedItem] = newMedia.splice(fromIndex, 1);
      newMedia.splice(toIndex, 0, movedItem);
      return newMedia;
    });
  };

  // AI content handler
  const handleAIContentApply = (generatedContent) => {
    if (generatedContent.title) {
      setTitle(generatedContent.title);
    }

    if (generatedContent.caption) {
      setCaption(generatedContent.caption);
    }

    if (generatedContent.tags && generatedContent.tags.length > 0) {
      const availableSlots = 5 - tags.length;
      const newTags = generatedContent.tags.slice(0, availableSlots);
      setTags((prev) => [...prev, ...newTags]);

      toast.success(`Content applied with ${newTags.length} tags!`);
    } else {
      toast.success("Content applied!");
    }
  };

  // Tag management
  const addTag = (tagText = null) => {
    const tagToAdd = tagText || currentTag.trim();
    if (!tagToAdd || tags.includes(tagToAdd)) return;
    if (tags.length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }
    setTags([...tags, tagToAdd]);
    setCurrentTag("");
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (currentTag.trim()) {
        addTag();
      }
    } else if (e.key === "Backspace" && !currentTag && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    if (value.includes(" ")) {
      const tagText = value.split(" ")[0].trim();
      if (tagText) {
        addTag(tagText);
      }
    } else {
      setCurrentTag(value);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Submit handler
  const handleSubmit = async () => {
    if (media.length === 0) {
      toast.error("Please add at least one photo or video");
      return;
    }

    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }

    if (media.some((item) => item.uploading)) {
      toast.error("Please wait for uploads to complete");
      return;
    }

    const failedItems = media.filter((item) => item.error);
    if (failedItems.length > 0) {
      toast.error(
        `Please remove ${failedItems.length} failed upload(s) before continuing`
      );
      return;
    }

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
      const mediaItems = media
        .filter((item) => !item.error && !item.isExisting)
        .map((item) => ({
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.mediaType || item.type,
          filter: item.filter || "none",
        }));

      const payload = {
        title: title ?? "",
        caption: caption ?? "",
        content: content ?? "",
        tags: tags.join(","),
        media: mediaItems,
        location: location ?? "",
        date: eventDate,
      };

      let response;

      if (isEditing) {
        const existingMediaIds = media
          .filter((item) => item.isExisting && item._id)
          .map((item) => item._id)
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

  const addMoreMedia = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,video/*";
    fileInput.multiple = true;
    fileInput.style.display = "none";

    fileInput.onchange = (e) => {
      if (e.target.files?.length) {
        onDrop(Array.from(e.target.files));
      }
      document.body.removeChild(fileInput);
    };

    document.body.appendChild(fileInput);
    fileInput.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files?.length) {
      onDrop(Array.from(e.target.files));
      e.target.value = ""; // Reset input
    }
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderMedia(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const isFormValid =
    media.length > 0 &&
    title.trim() &&
    caption.trim() &&
    !media.some((item) => item.uploading || item.error);

  return (
    <Container>
      <Header>
        <HeaderContent>
          <h1>{isEditing ? "Edit Post" : "Create New Post"}</h1>
          <p>Share your moments with the world</p>
        </HeaderContent>
      </Header>

      <ContentSection>
        {/* Media Upload/Display Section */}
        <MediaSection>
          {media.length === 0 ? (
            <DropArea {...getRootProps()} isDragActive={isDragActive}>
              <input {...getInputProps()} />
              <UploadIcon className="upload-icon">
                <FaImage />
                <FaVideo />
              </UploadIcon>
              <DropText>
                <h3>Add photos and videos</h3>
                <p>Drag and drop or click to upload</p>
              </DropText>
              <UploadButton
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (inputFileRef.current) {
                    inputFileRef.current.click();
                  }
                }}
              >
                <FaPlus /> Select from device
              </UploadButton>
              <input
                type="file"
                ref={inputFileRef}
                onChange={handleFileInputChange}
                accept="image/*,video/*"
                multiple
                style={{ display: "none" }}
              />
            </DropArea>
          ) : (
            <MediaGrid>
              {media.map((item, index) => (
                <MediaItem
                  key={item.id}
                  mediaItem={item}
                  index={index}
                  onRemove={removeMedia}
                  onFilter={openFilterModal}
                  onReorder={reorderMedia}
                  isDragging={draggedIndex === index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                />
              ))}

              <AddMoreButton onClick={addMoreMedia}>
                <FaPlus />
                <span>Add more</span>
              </AddMoreButton>

              <input
                type="file"
                ref={inputFileRef}
                onChange={handleFileInputChange}
                accept="image/*,video/*"
                multiple
                style={{ display: "none" }}
              />
            </MediaGrid>
          )}
        </MediaSection>

        {/* Post Details Form */}
        <PostDetailsSection>
          <SectionHeader>
            <h3>Post Details</h3>
            <AIButton onClick={() => setShowAIModal(true)}>
              <FaRobot />
              <span>AI Assist</span>
            </AIButton>
          </SectionHeader>

          <FormGroup>
            <Label>Title *</Label>
            <FormInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a catchy title..."
              maxLength={100}
            />
            <CharCount>{title.length}/100</CharCount>
          </FormGroup>

          <FormGroup>
            <Label>Caption *</Label>
            <FormTextarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption that tells your story..."
              rows={4}
              maxLength={2200}
            />
            <CharCount>{caption.length}/2200</CharCount>
          </FormGroup>

          <TwoColumnGroup>
            <FormGroup>
              <Label>Event Date</Label>
              <IconInput>
                <FaCalendarDay />
                <FormInput
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </IconInput>
            </FormGroup>

            <FormGroup>
              <Label>Location</Label>
              <IconInput>
                <FaLocationArrow />
                <FormInput
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                />
              </IconInput>
            </FormGroup>
          </TwoColumnGroup>

          <FormGroup>
            <Label>Tags</Label>
            <TagInput>
              <FaTag />
              <TagInputField
                value={currentTag}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type tags and press space to add..."
                maxLength={30}
              />
            </TagInput>

            {tags.length > 0 && (
              <TagsContainer>
                {tags.map((tag, index) => (
                  <Tag key={index}>
                    #{tag}
                    <TagRemoveButton onClick={() => removeTag(tag)}>
                      <FaTimes />
                    </TagRemoveButton>
                  </Tag>
                ))}
              </TagsContainer>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Additional Content</Label>
            <IconInput>
              <FaPencilAlt />
              <FormInput
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add any additional details (optional)"
              />
            </IconInput>
          </FormGroup>
        </PostDetailsSection>
      </ContentSection>

      {/* Action Bar */}
      <ActionBar>
        <PostButton
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Publishing..."
            : isEditing
            ? "Update Post"
            : "Publish Post"}
        </PostButton>
      </ActionBar>

      {/* Modals */}
      <AIContentModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplyContent={handleAIContentApply}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        mediaItem={selectedMediaForFilter}
        onApplyFilter={applyFilter}
      />
    </Container>
  );
}

export default PostCreator;
