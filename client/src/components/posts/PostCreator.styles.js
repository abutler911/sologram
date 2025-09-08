// client/src/components/posts/PostCreator.styles.js
import styled from "styled-components";
import { COLORS } from "../../theme";

export const Container = styled.div`
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

export const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${COLORS.border};
  background: linear-gradient(
    135deg,
    ${COLORS.primaryMint}15 0%,
    ${COLORS.primarySalmon}15 100%
  );
`;

export const HeaderContent = styled.div`
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

export const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 20px;
  }
`;

export const MediaSection = styled.div`
  min-height: 200px;
`;

export const DropArea = styled.div`
  border: 2px dashed
    ${(p) => (p.isDragActive ? COLORS.primarySalmon : COLORS.border)};
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${(p) =>
    p.isDragActive ? `${COLORS.primarySalmon}08` : COLORS.elevatedBackground};

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}08;
  }

  &:hover .upload-icon svg {
    color: ${COLORS.primarySalmon};
  }
`;

export const UploadIcon = styled.div`
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

export const DropText = styled.div`
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

export const UploadButton = styled.button`
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

export const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const MediaItemContainer = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: ${COLORS.elevatedBackground};
  border: 2px solid
    ${(p) => (p.isDragging ? COLORS.primarySalmon : COLORS.border)};
  transition: all 0.2s ease;
  cursor: ${(p) => (p.isDragging ? "grabbing" : "grab")};
  transform: ${(p) => (p.isDragging ? "scale(1.05)" : "scale(1)")};
  opacity: ${(p) => (p.isDragging ? "0.8" : "1")};
  z-index: ${(p) => (p.isDragging ? "10" : "1")};

  &:hover {
    transform: ${(p) => (p.isDragging ? "scale(1.05)" : "translateY(-2px)")};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:hover .drag-handle {
    opacity: 1;
  }

  &:hover .media-actions {
    opacity: 1;
  }

  &:hover .drag-indicator {
    opacity: 1;
  }

  &[data-drag-over="true"] {
    border-color: ${COLORS.primaryMint};
    background: ${COLORS.primaryMint}10;
  }
`;

export const DragHandle = styled.div`
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
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  svg {
    font-size: 12px;
  }
`;

export const DragIndicator = styled.div`
  position: absolute;
  bottom: 4px;
  left: 4px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

export const MediaContent = styled.div`
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

export const StoryStyleImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: ${COLORS.cardBackground};
`;

export const StoryStyleVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  outline: none;
`;

export const ProcessingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${COLORS.textSecondary};
  text-align: center;
  padding: 8px;
`;

export const ProcessingText = styled.div`
  font-size: 11px;
  font-weight: 500;
`;

export const MediaActions = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

export const ActionButton = styled.button`
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

export const FilterBadge = styled.div`
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

export const UploadOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`;

export const UploadProgress = styled.div`
  width: 70%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
`;

export const UploadProgressInner = styled.div`
  height: 100%;
  width: ${(p) => p.width}%;
  background: ${COLORS.primarySalmon};
  transition: width 0.3s ease;
`;

export const UploadText = styled.div`
  font-size: 10px;
  font-weight: 500;
`;

export const ErrorOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(244, 67, 54, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 8px;
`;

export const ErrorText = styled.div`
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
`;

export const RetryButton = styled.button`
  background: white;
  color: ${COLORS.error};
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
`;

export const AddMoreButton = styled.button`
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

export const PostDetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SectionHeader = styled.div`
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

export const AIButton = styled.button`
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

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TwoColumnGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
`;

export const FormInput = styled.input`
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

export const FormTextarea = styled.textarea`
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

export const IconInput = styled.div`
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

export const TagInput = styled(IconInput)``;

export const TagInputField = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 12px 12px 0;

  &:focus {
    outline: none;
  }
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: ${COLORS.elevatedBackground};
  border-radius: 8px;
  border: 1px dashed ${COLORS.border};
`;

export const Tag = styled.div`
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

export const TagRemoveButton = styled.button`
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

export const CharCount = styled.div`
  font-size: 12px;
  color: ${COLORS.textTertiary};
  text-align: right;
`;

export const ActionBar = styled.div`
  padding: 24px;
  border-top: 1px solid ${COLORS.border};
  background: ${COLORS.elevatedBackground};

  @media (max-width: 768px) {
    position: sticky;
    bottom: 0;
    z-index: 100;
  }
`;

export const PostButton = styled.button`
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

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

export const ModalContent = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

export const ModalHeader = styled.div`
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

export const CloseButton = styled.button`
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

export const ModalBody = styled.div`
  padding: 1.5rem;
`;

export const Select = styled.select`
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

export const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const Input = styled.input`
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

export const ErrorMessage = styled.div`
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

export const GenerateButton = styled.button`
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

export const LoadingSpinner = styled.div`
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

export const GeneratedSection = styled.div`
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

export const SectionTitle = styled.h4`
  color: ${COLORS.textPrimary};
  margin: 0 0 1rem 0;
  font-size: 1rem;
`;

export const ContentPreview = styled.div`
  margin-bottom: 1rem;
`;

export const ContentLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.5rem;
`;

export const ContentBox = styled.div`
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.75rem;
  color: ${COLORS.textPrimary};
  line-height: 1.5;
  font-size: 0.875rem;
`;

export const TagsPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const TagPreview = styled.span`
  background: ${COLORS.primarySalmon}20;
  color: ${COLORS.primarySalmon};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

export const SecondaryButton = styled.button`
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

export const ApplyButton = styled.button`
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

export const FilterModalContent = styled(ModalContent)`
  max-width: 600px;
`;

export const FilterPreviewSection = styled.div`
  padding: 0;
`;

export const MainPreview = styled.div`
  padding: 0;
  background: ${COLORS.background};
  border-bottom: 1px solid ${COLORS.border};
`;

export const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
`;

export const FilterOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  opacity: ${(p) => (p.active ? 1 : 0.7)};

  &:hover {
    opacity: 1;
    background: ${COLORS.elevatedBackground};
  }
`;

export const FilterThumbnail = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${(p) => (p.active ? COLORS.primarySalmon : COLORS.border)};

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

export const FilterName = styled.span`
  margin-top: 8px;
  font-size: 12px;
  font-weight: ${(p) => (p.active ? "600" : "400")};
  color: ${(p) => (p.active ? COLORS.primarySalmon : COLORS.textSecondary)};
`;

export const FilterActionBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid ${COLORS.border};
`;
