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
  FaArrowRight,
  FaArrowLeft,
  FaFilter,
  FaTag,
  FaPencilAlt,
  FaLocationArrow,
  FaCalendarDay,
} from "react-icons/fa";
import { COLORS } from "../../theme";
import { useUploadManager } from "../../hooks/useUploadManager";
import { AuthContext } from "../../context/AuthContext";

// Default placeholder - using data URI instead of external service
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

// Styled components - Updated for SoloGram theme
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 4px 15px ${COLORS.shadow};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.primaryMint}20;

  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px ${COLORS.shadow};
  }
`;

const PageTitle = styled.div`
  text-align: center;
  margin-bottom: 20px;
  color: ${COLORS.primaryBlueGray};

  h1 {
    font-size: 24px;
    margin-bottom: 5px;
    font-weight: 700;
  }

  p {
    color: ${COLORS.textSecondary};
    font-size: 14px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 15px;
  border-bottom: 2px solid ${COLORS.primarySalmon}20;

  h1 {
    flex-grow: 1;
    text-align: center;
    font-size: 20px;
    color: ${COLORS.primaryBlueGray};
    margin: 0;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding-bottom: 10px;
  }
`;

const MediaSection = styled.div`
  margin-top: 35px;
`;

const DropArea = styled.div`
  border: 2px dashed ${COLORS.primaryMint};
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
  background-color: ${COLORS.background}85;

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primaryKhaki}15;
    transform: translateY(-2px);
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
  color: ${COLORS.primaryBlueGray};

  svg {
    transition: transform 0.3s, color 0.3s;
  }

  ${DropArea}:hover & svg {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

// Updated button styles for theme-aligned feel
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
  border: 1px solid ${COLORS.primaryMint}40;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 5px ${COLORS.shadow};

  &:hover {
    transform: translateY(-2px);
    border-color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primaryKhaki}10;
    box-shadow: 0 4px 8px ${COLORS.primarySalmon}20;
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
    color: ${COLORS.primarySalmon};
  }
`;

const VideoCameraButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryBlueGray};
  }
`;

const GalleryButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryMint};
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
  background-color: ${COLORS.background};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  border: 1px solid ${COLORS.primaryMint}20;

  @media (max-width: 768px) {
    border-radius: 8px;
    margin: 0 auto 15px;
    width: 100%;
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
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const UploadProgressInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background-color: ${COLORS.primarySalmon};
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
  background: ${COLORS.primarySalmon};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  z-index: 3;
  transition: background-color 0.2s, transform 0.2s;

  &:hover {
    background: ${COLORS.error};
    transform: scale(1.05);
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
  background: ${COLORS.primaryBlueGray};
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
    background: ${COLORS.primarySalmon};
    transform: scale(1.05);
  }
`;

const MediaCounter = styled.div`
  background: ${COLORS.primaryMint};
  color: ${COLORS.textPrimary};
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
`;

// Filter options with updated colors
const FilterOptions = styled.div`
  margin-top: 20px;
`;

const FiltersGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 15px;
  padding: 15px 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background-color: ${COLORS.background}50;
  border-radius: 8px;

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
      props.active ? COLORS.primarySalmon : COLORS.textSecondary};
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
  border: 2px solid
    ${(props) => (props.active ? COLORS.primarySalmon : "transparent")};

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

// Action bar with theme colors
const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: ${COLORS.cardBackground};
  border-top: 1px solid ${COLORS.primarySalmon}20;
  border-bottom: 1px solid ${COLORS.primarySalmon}20;
  padding: 12px 0;
  margin: 15px -10px;
  position: sticky;
  bottom: 0;
  z-index: 10;
  border-radius: 8px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.primaryBlueGray};

  svg {
    font-size: 20px;
    margin-bottom: 4px;
  }

  span {
    font-size: 11px;
    font-weight: 500;
  }

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const NextButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  background: transparent;
  color: ${COLORS.primarySalmon};
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
  color: ${COLORS.primaryBlueGray};
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

// Details Section Styles
const DetailsSection = styled.div`
  margin-top: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  position: relative;

  &:first-of-type {
    border-top: 1px solid ${COLORS.primaryMint}20;
    padding-top: 15px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.primaryMint}30;
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 2px ${COLORS.primarySalmon}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.primaryMint}30;
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 2px ${COLORS.primarySalmon}20;
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
  border: 1px solid ${COLORS.primaryMint}30;
  border-radius: 4px;
  background-color: ${COLORS.elevatedBackground};
  overflow: hidden;
  transition: all 0.2s;

  &:focus-within {
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 2px ${COLORS.primarySalmon}20;
  }

  svg {
    color: ${COLORS.primarySalmon};
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
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  width: 100%;
  margin-top: 20px;
  box-shadow: 0 2px 8px ${COLORS.primarySalmon}30;

  &:disabled {
    background-color: ${COLORS.elevatedBackground};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-1px);
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
  border-bottom: 1px solid ${COLORS.primaryMint}30;
`;

const UserAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: ${COLORS.elevatedBackground};
  overflow: hidden;
  margin-right: 10px;
  border: 2px solid ${COLORS.primaryMint};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.primaryBlueGray};

  span {
    display: block;
    font-size: 12px;
    color: ${COLORS.textSecondary};
    margin-top: 2px;
    font-weight: normal;
  }
`;

const MainContent = styled.div`
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  padding-right: 5px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${COLORS.primarySalmon}30;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    max-height: calc(100vh - 180px);
  }
`;

// Custom progress indicator
const ProgressBar = styled.div`
  height: 6px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 3px;
  margin: 10px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => props.percent || 0}%;
  background-color: ${COLORS.primarySalmon};
  transition: width 0.3s ease;
`;

const TagInputWrapper = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
`;

const TagInputField = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  padding: 12px 0;
  font-size: 16px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const TagInputPreview = styled.div`
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background-color: ${COLORS.primarySalmon}15;
  color: ${COLORS.primarySalmon};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${COLORS.primarySalmon}30;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  border: 1px dashed ${COLORS.primaryMint}30;
  min-height: 48px;
  align-items: flex-start;
  align-content: flex-start;

  ${(props) =>
    props.isEmpty &&
    `
    &::before {
      content: "Your tags will appear here...";
      color: ${COLORS.textTertiary};
      font-size: 14px;
      font-style: italic;
      display: flex;
      align-items: center;
      height: 100%;
      min-height: 24px;
    }
  `}
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${COLORS.primarySalmon}20;
  color: ${COLORS.primarySalmon};
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid ${COLORS.primarySalmon}30;

  &:hover {
    background-color: ${COLORS.primarySalmon}30;
    transform: translateY(-1px);
  }
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

// Main component (Updated with SoloGram theme)
function PostCreator({ initialData = null, isEditing = false }) {
  // Component state
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState(initialData?.title || "");
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [location, setLocation] = useState(initialData?.location || "");
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeAction, setActiveAction] = useState("filter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [eventDate, setEventDate] = useState(() => {
    const rawDate = initialData?.date || new Date().toISOString();
    return rawDate.split("T")[0];
  });

  const navigate = useNavigate();
  const inputFileRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoCameraInputRef = useRef(null);
  const { startUpload, mountedRef } = useUploadManager(setMedia);
  const { user } = useContext(AuthContext);

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
      // Remove last tag when backspacing on empty input
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    // Prevent spaces from being typed (since space creates tags)
    if (value.includes(" ")) {
      // Extract the tag before the space and create it
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

    if (!title.trim()) {
      toast.error("Please add a title");
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

      // Create the payload with all required fields
      const payload = {
        title: title ?? "",
        caption: caption ?? "",
        content: content ?? "",
        tags: tags.join(","),
        media: mediaItems,
        location: location ?? "",
        date: eventDate,
      };

      console.log("Submitting post payload:", payload);

      let response;

      if (isEditing) {
        // Add existing media IDs to keep
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

  // Render the SoloGram-themed UI
  return (
    <Container>
      <PageTitle>
        <h1>{isEditing ? "Edit Post" : "Create New Post"}</h1>
        <p>Share your moments with SoloGram</p>
      </PageTitle>

      <Header>
        {step === 1 ? (
          <>
            <h1>Select Media</h1>
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
            <h1>Post Details</h1>
            <NextButton
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !title.trim() ||
                !caption.trim() ||
                media.length === 0 ||
                media.some((item) => item.uploading)
              }
            >
              {isSubmitting ? "Sharing..." : "Share"}
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
                  <div style={{ margin: "15px 0" }}>
                    <ProgressBar>
                      <ProgressFill percent={totalProgress} />
                    </ProgressBar>
                    <div
                      style={{
                        textAlign: "center",
                        color: COLORS.primaryBlueGray,
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Uploading... {totalProgress}%
                    </div>
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

              {/* Themed Action Bar */}
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
                        <FilterPreview
                          className={filter.className}
                          active={media[currentIndex].filter === filter.id}
                        >
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
            {/* Enhanced User info header */}
            <UserInfo>
              <UserAvatar>
                <img
                  src={
                    user?.avatar ||
                    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23e7d4c0'/%3E%3Ccircle cx='25' cy='20' r='8' fill='%23658ea9'/%3E%3Cpath d='M11,40 C11,30 17,25 25,25 C33,25 39,30 39,40' fill='%23658ea9'/%3E%3C/svg%3E`
                  }
                  alt="Your profile"
                  onError={(e) => {
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23e7d4c0'/%3E%3Ccircle cx='25' cy='20' r='8' fill='%23658ea9'/%3E%3Cpath d='M11,40 C11,30 17,25 25,25 C33,25 39,30 39,40' fill='%23658ea9'/%3E%3C/svg%3E`;
                  }}
                />
              </UserAvatar>
              <UserName>
                {user?.name || user?.username || "Your Profile"}
                <span>{user?.role || "Creator"}</span>
              </UserName>
            </UserInfo>

            {/* Title field */}
            <FormGroup>
              <InputGroup>
                <FaPencilAlt />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a title for your post"
                  maxLength={100}
                  required
                />
              </InputGroup>
              <CharCount overLimit={title.length > 80}>
                {title.length}/100
              </CharCount>
            </FormGroup>

            {/* Date field with calendar icon */}
            <FormGroup>
              <InputGroup>
                <FaCalendarDay />
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </InputGroup>
            </FormGroup>

            {/* Caption field */}
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

            {/* Location field */}
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

            {/* Tags field */}
            <FormGroup>
              <InputGroup>
                <FaTag />
                <TagInputWrapper>
                  <TagInputField
                    value={currentTag}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Type tags and press space to add..."
                    maxLength={30}
                  />
                  {currentTag.trim() && (
                    <TagInputPreview>#{currentTag.trim()}</TagInputPreview>
                  )}
                </TagInputWrapper>
              </InputGroup>

              {tags.length > 0 && (
                <TagsContainer isEmpty={tags.length === 0}>
                  {tags.map((tag, index) => (
                    <Tag key={index}>
                      #{tag}
                      <RemoveTagButton onClick={() => removeTag(tag)}>
                        <FaTimes />
                      </RemoveTagButton>
                    </Tag>
                  ))}
                </TagsContainer>
              )}
            </FormGroup>

            {/* Additional content field */}
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

          {/* Enhanced Publish Button */}
          <PublishButton
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !title.trim() ||
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
              ? "Update Post"
              : "Share Post"}
          </PublishButton>
        </DetailsSection>
      )}
    </Container>
  );
}

export default PostCreator;
