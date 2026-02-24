import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaUpload,
  FaTimes,
  FaCamera,
  FaImage,
  FaVideo,
  FaArrowLeft,
  FaPlusCircle,
} from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { COLORS, THEME } from '../theme';
import { useUploadManager } from '../hooks/useUploadManager';

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  color: ${COLORS.textPrimary};
  display: flex;
  flex-direction: column;
  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const AppHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${COLORS.primaryBlueGray};
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

const ShareButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.accentMint};
  font-weight: 600;
  padding: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  &:hover {
    color: ${COLORS.accentSalmon};
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
    background-color: rgba(233, 137, 115, 0.7);
    transform: scale(1.1);
  }
`;

const UploadOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;
`;

const ProgressRing = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: ${COLORS.primaryMint};
  animation: spin 0.9s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

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
    svg {
      color: ${COLORS.primaryMint};
    }
  }
`;

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
    ${(props) => (props.isSelected ? COLORS.primaryMint : 'transparent')};
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
    transform: scale(1.05);
  }
`;

const TitleContainer = styled.div`
  padding: 12px 16px 0;
  border-top: 1px solid ${COLORS.border};
  background-color: ${COLORS.elevatedBackground};
`;

const TitleInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  font-weight: 600;
  padding: 4px 0;
  outline: none;
  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const TitleCounter = styled.div`
  font-size: 0.7rem;
  text-align: right;
  color: ${(props) => (props.near ? COLORS.warning : COLORS.textTertiary)};
  padding: 2px 0 8px;
`;

const CaptionContainer = styled.div`
  padding: 8px 16px 16px;
  background-color: ${COLORS.elevatedBackground};
`;

const CaptionTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 0.95rem;
  resize: none;
  padding: 4px 0;
  min-height: 48px;
  outline: none;
  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

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
    props.active ? COLORS.primarySalmon : 'rgba(255,255,255,0.5)'};
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.2);
  }
`;

const LoaderOverlay = styled.div`
  position: fixed;
  inset: 0;
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
  border-top-color: ${COLORS.primarySalmon};
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const TITLE_MAX = 100;

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Component ─────────────────────────────────────────────────────────────────

const CreateStory = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useContext(AuthContext);

  // media items: { id, file, previewUrl, type, name, size, uploading, progress, mediaUrl, cloudinaryId, error }
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const thumbnailContainerRef = useRef(null);
  const textAreaRef = useRef(null);
  const { startUpload, cancelUpload } = useUploadManager(setMedia, {
    folder: 'sologram',
  });

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated || !['admin', 'creator'].includes(user?.role))
    ) {
      toast.error('You are not authorized to create a story.');
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // ── Auto-resize textarea ────────────────────────────────────────────────────
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [caption]);

  // ── Scroll selected thumbnail into view ─────────────────────────────────────
  useEffect(() => {
    if (!thumbnailContainerRef.current || media.length === 0) return;
    const container = thumbnailContainerRef.current;
    const thumb = container.children[selectedIndex];
    if (thumb) {
      container.scrollTo({
        left:
          thumb.offsetLeft - container.offsetWidth / 2 + thumb.offsetWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, media.length]);

  // ── Add files ────────────────────────────────────────────────────────────────
  const addFiles = useCallback(
    async (files) => {
      setError('');

      if (media.length + files.length > 20) {
        setError('Maximum 20 media files allowed per story');
        toast.error('Maximum 20 media files allowed per story');
        return;
      }

      const newItems = [];

      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (isImage && file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB image limit`);
          continue;
        }
        if (isVideo && file.size > 300 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 300MB video limit`);
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let previewUrl = null;

        if (isVideo) {
          previewUrl = URL.createObjectURL(
            new Blob([file], { type: file.type })
          );
        } else {
          try {
            previewUrl = await readFileAsDataURL(file);
          } catch (_) {}
        }

        newItems.push({
          id,
          file,
          previewUrl,
          type: isVideo ? 'video' : 'image',
          name: file.name,
          size: formatFileSize(file.size),
          uploading: true,
          progress: 0,
          mediaUrl: null,
          cloudinaryId: null,
          error: false,
        });
      }

      if (newItems.length === 0) return;

      setMedia((prev) => {
        const next = [...prev, ...newItems];
        // Focus first newly added item
        setSelectedIndex(prev.length);
        return next;
      });

      // Start Cloudinary uploads immediately — don't wait for submit
      for (const item of newItems) {
        startUpload(item.file, item.id, item.type);
      }
    },
    [media.length, startUpload]
  );

  // ── Dropzone ─────────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (accepted, rejected) => {
      rejected.forEach(({ file, errors }) => {
        const reason =
          errors[0]?.code === 'file-too-large'
            ? `${file.name} is too large`
            : `${file.name}: ${errors[0]?.message}`;
        toast.error(reason);
      });
      if (accepted.length > 0) await addFiles(accepted);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxSize: 300 * 1024 * 1024,
    maxFiles: 20,
    noClick: false,
    noKeyboard: false,
    preventDropOnDocument: true,
    useFsAccessApi: false,
  });

  // ── Remove item ───────────────────────────────────────────────────────────────
  const removeItem = useCallback(
    (index) => {
      setMedia((prev) => {
        const item = prev[index];
        if (item) {
          cancelUpload(item.id);
          if (item.type === 'video' && item.previewUrl) {
            try {
              URL.revokeObjectURL(item.previewUrl);
            } catch (_) {}
          }
        }
        const next = prev.filter((_, i) => i !== index);
        setSelectedIndex((si) => Math.min(si, Math.max(next.length - 1, 0)));
        return next;
      });
    },
    [cancelUpload]
  );

  const removeAll = useCallback(() => {
    setMedia((prev) => {
      prev.forEach((item) => {
        cancelUpload(item.id);
        if (item.type === 'video' && item.previewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (_) {}
        }
      });
      return [];
    });
    setSelectedIndex(0);
  }, [cancelUpload]);

  // ── Camera / video capture ────────────────────────────────────────────────────
  const captureMedia = useCallback(
    (mediaType) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = mediaType === 'video' ? 'video/*' : 'image/*';
      input.capture = 'environment';
      if (mediaType === 'video') {
        toast('Maximum video length: 60 seconds', {
          duration: 3000,
          icon: '🎥',
        });
      }
      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) await addFiles(files);
      };
      input.click();
    },
    [addFiles]
  );

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      media.forEach((item) => {
        if (item.type === 'video' && item.previewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (_) {}
        }
      });
    };
  }, []); // intentionally empty — runs only on unmount

  // ── Derived state ─────────────────────────────────────────────────────────────
  const anyUploading = media.some((m) => m.uploading);
  const anyError = media.some((m) => m.error);

  const mediaStats = useMemo(
    () => ({
      total: media.length,
      images: media.filter((m) => m.type === 'image').length,
      videos: media.filter((m) => m.type === 'video').length,
    }),
    [media]
  );

  const canSubmit =
    media.length > 0 &&
    !anyUploading &&
    !anyError &&
    !submitting &&
    title.trim().length > 0;

  // ── Submit — just POST JSON, Cloudinary is already done ──────────────────────
  const handleSubmit = useCallback(async () => {
    if (media.length === 0) {
      toast.error('Please add at least one image or video');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Please add a title for your story');
      return;
    }
    if (trimmedTitle.length > TITLE_MAX) {
      toast.error(`Title must be ${TITLE_MAX} characters or less`);
      return;
    }
    if (anyUploading) {
      toast.error('Please wait for uploads to finish');
      return;
    }
    if (anyError) {
      toast.error(
        'Some files failed to upload. Please remove them and try again.'
      );
      return;
    }
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network.');
      return;
    }

    setError('');
    setSubmitting(true);

    const toastId = toast.loading('Creating story...');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/stories',
        {
          title: trimmedTitle,
          caption,
          media: media.map((m) => ({
            mediaUrl: m.mediaUrl,
            cloudinaryId: m.cloudinaryId,
            mediaType: m.type,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(toastId);
      toast.success('Story created!', { icon: '🎉' });
      navigate('/');
    } catch (err) {
      toast.dismiss(toastId);
      const msg =
        err.response?.data?.message ||
        'Failed to create story. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [media, title, caption, anyUploading, anyError, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────────
  if (authLoading) return null;

  const selectedItem = media[selectedIndex];

  return (
    <PageWrapper>
      <AppHeader>
        <BackButton onClick={() => navigate('/')} aria-label='Go back'>
          <FaArrowLeft />
        </BackButton>
        <HeaderTitle>New Story</HeaderTitle>
        <ShareButton
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label={submitting ? 'Posting...' : 'Share'}
        >
          {submitting ? 'Posting...' : anyUploading ? 'Uploading...' : 'Share'}
        </ShareButton>
      </AppHeader>

      <MainContent>
        {/* Media count info */}
        {media.length > 0 && (
          <MediaFilesInfo>
            <MediaStats>
              <span>
                {mediaStats.total} file{mediaStats.total !== 1 ? 's' : ''}
              </span>
              {mediaStats.images > 0 && (
                <span>
                  • {mediaStats.images} image
                  {mediaStats.images !== 1 ? 's' : ''}
                </span>
              )}
              {mediaStats.videos > 0 && (
                <span>
                  • {mediaStats.videos} video
                  {mediaStats.videos !== 1 ? 's' : ''}
                </span>
              )}
              {anyUploading && (
                <span style={{ color: COLORS.primaryMint }}>
                  • Uploading...
                </span>
              )}
            </MediaStats>
            <MediaClearButton onClick={removeAll}>
              <FaTimes size={12} /> Clear all
            </MediaClearButton>
          </MediaFilesInfo>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Main preview */}
        {media.length > 0 ? (
          <MediaPreviewContainer>
            {selectedItem ? (
              selectedItem.type === 'image' ? (
                selectedItem.previewUrl ? (
                  <MainPreviewImage
                    src={selectedItem.previewUrl}
                    alt={`Preview ${selectedIndex + 1}`}
                  />
                ) : (
                  <FaImage
                    style={{ fontSize: '3rem', color: COLORS.textTertiary }}
                  />
                )
              ) : selectedItem.previewUrl ? (
                <MainPreviewVideo>
                  <video
                    src={selectedItem.previewUrl}
                    controls
                    muted
                    playsInline
                    preload='metadata'
                  />
                  <VideoIcon>
                    <FaVideo />
                  </VideoIcon>
                </MainPreviewVideo>
              ) : (
                <FaVideo
                  style={{ fontSize: '3rem', color: COLORS.textTertiary }}
                />
              )
            ) : null}

            {/* Upload progress overlay */}
            {selectedItem?.uploading && (
              <UploadOverlay>
                <ProgressRing />
                <span>{selectedItem.progress || 0}%</span>
              </UploadOverlay>
            )}

            {/* Error overlay */}
            {selectedItem?.error && (
              <UploadOverlay style={{ background: 'rgba(255,107,107,0.5)' }}>
                <span>Upload failed</span>
                <span style={{ fontSize: '0.75rem' }}>
                  Remove and try again
                </span>
              </UploadOverlay>
            )}

            <RemoveButton
              onClick={() => removeItem(selectedIndex)}
              aria-label='Remove media'
            >
              <FaTimes />
            </RemoveButton>

            {media.length > 1 && (
              <PreviewNavigation>
                {media.map((_, i) => (
                  <PreviewDot
                    key={i}
                    active={i === selectedIndex}
                    onClick={() => setSelectedIndex(i)}
                  />
                ))}
              </PreviewNavigation>
            )}
          </MediaPreviewContainer>
        ) : (
          <DropzoneArea {...getRootProps()} isDragActive={isDragActive}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    aria-label='Select from gallery'
                  >
                    <FaImage />
                    <span>Gallery</span>
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      captureMedia('image');
                    }}
                    aria-label='Take a photo'
                  >
                    <FaCamera />
                    <span>Camera</span>
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      captureMedia('video');
                    }}
                    aria-label='Record a video'
                  >
                    <FaVideo />
                    <span>Video</span>
                  </ActionButton>
                </ActionButtonsContainer>
              </DropzoneContent>
            )}
          </DropzoneArea>
        )}

        {/* Thumbnails */}
        {media.length > 0 && (
          <ThumbnailContainer ref={thumbnailContainerRef}>
            {media.map((item, index) => (
              <ThumbnailItem
                key={item.id}
                isSelected={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
              >
                {item.type === 'image' ? (
                  item.previewUrl ? (
                    <ThumbnailImage
                      src={item.previewUrl}
                      alt={`Thumbnail ${index + 1}`}
                      loading='lazy'
                    />
                  ) : (
                    <FaImage color={COLORS.textTertiary} />
                  )
                ) : (
                  <ThumbnailVideo>
                    {item.previewUrl ? (
                      <video src={item.previewUrl} />
                    ) : (
                      <FaVideo color={COLORS.textTertiary} />
                    )}
                    <ThumbnailVideoIcon>
                      <FaVideo />
                    </ThumbnailVideoIcon>
                  </ThumbnailVideo>
                )}
              </ThumbnailItem>
            ))}
            {media.length < 20 && (
              <AddMediaThumbnail
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
                aria-label='Add more media'
              >
                <FaPlusCircle />
              </AddMediaThumbnail>
            )}
          </ThumbnailContainer>
        )}

        {/* Title — required, max 100 chars */}
        <TitleContainer>
          <TitleInput
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder='Add a title... (required)'
            aria-label='Story title'
            maxLength={TITLE_MAX}
          />
          <TitleCounter near={title.length > TITLE_MAX * 0.85}>
            {title.length}/{TITLE_MAX}
          </TitleCounter>
        </TitleContainer>

        {/* Caption — optional */}
        <CaptionContainer>
          <CaptionTextarea
            ref={textAreaRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder='Write a caption... (optional)'
            rows={1}
            aria-label='Story caption'
            maxLength={2200}
          />
        </CaptionContainer>
      </MainContent>

      {submitting && (
        <LoaderOverlay>
          <Spinner />
          <p>Creating your story...</p>
        </LoaderOverlay>
      )}
    </PageWrapper>
  );
};

export default CreateStory;
