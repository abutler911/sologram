import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
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
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme';
import { useUploadManager } from '../hooks/useUploadManager';

// ─── Constants ────────────────────────────────────────────────────────────────

const TITLE_MAX = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// ─── Component ────────────────────────────────────────────────────────────────

const CreateStory = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useContext(AuthContext);

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

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated || !['admin', 'creator'].includes(user?.role))
    ) {
      toast.error('You are not authorized to create a story.');
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [caption]);

  // ── Scroll selected thumbnail into view ───────────────────────────────────
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

  // ── Cleanup blob URLs on unmount ──────────────────────────────────────────
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

  // ── Add files ──────────────────────────────────────────────────────────────
  const addFiles = useCallback(
    async (files) => {
      setError('');

      if (media.length + files.length > 20) {
        toast.error('Maximum 20 files per story');
        return;
      }

      const newItems = [];

      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (isImage && file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20 MB`);
          continue;
        }
        if (isVideo && file.size > 300 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 300 MB`);
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let previewUrl = null;

        try {
          previewUrl = isVideo
            ? URL.createObjectURL(new Blob([file], { type: file.type }))
            : await readFileAsDataURL(file);
        } catch (_) {}

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
        setSelectedIndex(prev.length);
        return [...prev, ...newItems];
      });

      for (const item of newItems) startUpload(item.file, item.id, item.type);
    },
    [media.length, startUpload]
  );

  // ── Dropzone ───────────────────────────────────────────────────────────────
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

  // ── Remove ─────────────────────────────────────────────────────────────────
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

  // ── Camera capture ─────────────────────────────────────────────────────────
  const captureMedia = useCallback(
    (mediaType) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = mediaType === 'video' ? 'video/*' : 'image/*';
      input.capture = 'environment';
      if (mediaType === 'video')
        toast('Max video length: 60 seconds', { icon: '🎥', duration: 3000 });
      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) await addFiles(files);
      };
      input.click();
    },
    [addFiles]
  );

  // ── Derived state ──────────────────────────────────────────────────────────
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!media.length) return toast.error('Add at least one image or video');
    if (!title.trim()) return toast.error('A title is required');
    if (title.trim().length > TITLE_MAX)
      return toast.error(`Title must be ${TITLE_MAX} characters or less`);
    if (anyUploading) return toast.error('Wait for uploads to finish');
    if (anyError)
      return toast.error('Some files failed — remove them and try again');
    if (!navigator.onLine) return toast.error('No internet connection');

    setError('');
    setSubmitting(true);
    const toastId = toast.loading('Creating story…');

    try {
      await api.createStory({
        title: title.trim(),
        caption,
        media: media.map((m) => ({
          mediaUrl: m.mediaUrl,
          cloudinaryId: m.cloudinaryId,
          mediaType: m.type,
        })),
      });
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

  // ── Render ─────────────────────────────────────────────────────────────────
  if (authLoading) return null;

  const selectedItem = media[selectedIndex];
  const submitLabel = submitting
    ? 'Posting…'
    : anyUploading
    ? 'Uploading…'
    : 'Publish';

  return (
    <PageWrapper>
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <TopBar>
        <NavBtn onClick={() => navigate('/')} aria-label='Go back'>
          <FaArrowLeft />
        </NavBtn>
        <TopBarTitle>New Story</TopBarTitle>
        <PublishBtn onClick={handleSubmit} disabled={!canSubmit}>
          {submitLabel}
        </PublishBtn>
      </TopBar>

      <MainContent>
        {/* File stats row */}
        {media.length > 0 && (
          <StatsRow>
            <StatText>
              {mediaStats.total} file{mediaStats.total !== 1 ? 's' : ''}
              {mediaStats.images > 0 &&
                ` · ${mediaStats.images} photo${
                  mediaStats.images !== 1 ? 's' : ''
                }`}
              {mediaStats.videos > 0 &&
                ` · ${mediaStats.videos} video${
                  mediaStats.videos !== 1 ? 's' : ''
                }`}
              {anyUploading && <UploadingBadge>uploading…</UploadingBadge>}
            </StatText>
            <ClearBtn onClick={removeAll}>
              <FaTimes size={10} /> Clear all
            </ClearBtn>
          </StatsRow>
        )}

        {error && <InlineError>{error}</InlineError>}

        {/* ── Main preview / dropzone ──────────────────────────────────── */}
        {media.length > 0 ? (
          <PreviewFrame>
            {selectedItem &&
              (selectedItem.type === 'image' ? (
                selectedItem.previewUrl ? (
                  <PreviewImg
                    src={selectedItem.previewUrl}
                    alt={`Preview ${selectedIndex + 1}`}
                  />
                ) : (
                  <PlaceholderIcon>
                    <FaImage />
                  </PlaceholderIcon>
                )
              ) : selectedItem.previewUrl ? (
                <PreviewVideoWrap>
                  <video
                    src={selectedItem.previewUrl}
                    controls
                    muted
                    playsInline
                    preload='metadata'
                  />
                  <VideoTag>
                    <FaVideo />
                  </VideoTag>
                </PreviewVideoWrap>
              ) : (
                <PlaceholderIcon>
                  <FaVideo />
                </PlaceholderIcon>
              ))}

            {/* Upload progress overlay */}
            {selectedItem?.uploading && (
              <MediaOverlay>
                <SpinRing />
                <OverlayText>{selectedItem.progress || 0}%</OverlayText>
              </MediaOverlay>
            )}

            {/* Error overlay */}
            {selectedItem?.error && (
              <MediaOverlay $error>
                <OverlayText>Upload failed</OverlayText>
                <OverlaySubText>Remove and try again</OverlaySubText>
              </MediaOverlay>
            )}

            <RemoveBtn
              onClick={() => removeItem(selectedIndex)}
              aria-label='Remove media'
            >
              <FaTimes />
            </RemoveBtn>

            {/* Pill dots */}
            {media.length > 1 && (
              <DotRow>
                {media.map((_, i) => (
                  <Dot
                    key={i}
                    $active={i === selectedIndex}
                    onClick={() => setSelectedIndex(i)}
                  />
                ))}
              </DotRow>
            )}
          </PreviewFrame>
        ) : (
          <Dropzone {...getRootProps()} $active={isDragActive}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <DropContent>
                <DropIcon $active>
                  <FaUpload />
                </DropIcon>
                <DropLabel>Drop your files here</DropLabel>
              </DropContent>
            ) : (
              <DropContent>
                <DropIcon>
                  <FaPlusCircle />
                </DropIcon>
                <DropLabel>Add photos &amp; videos to your story</DropLabel>
                <ActionGrid>
                  <ActionBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    aria-label='Gallery'
                  >
                    <FaImage />
                    <span>Gallery</span>
                  </ActionBtn>
                  <ActionBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      captureMedia('image');
                    }}
                    aria-label='Camera'
                  >
                    <FaCamera />
                    <span>Camera</span>
                  </ActionBtn>
                  <ActionBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      captureMedia('video');
                    }}
                    aria-label='Video'
                  >
                    <FaVideo />
                    <span>Video</span>
                  </ActionBtn>
                </ActionGrid>
              </DropContent>
            )}
          </Dropzone>
        )}

        {/* ── Thumbnail strip ──────────────────────────────────────────── */}
        {media.length > 0 && (
          <ThumbStrip ref={thumbnailContainerRef}>
            {media.map((item, index) => (
              <Thumb
                key={item.id}
                $selected={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
              >
                {item.type === 'image' ? (
                  item.previewUrl ? (
                    <ThumbImg
                      src={item.previewUrl}
                      alt={`Thumb ${index + 1}`}
                      loading='lazy'
                    />
                  ) : (
                    <FaImage color={COLORS.textTertiary} />
                  )
                ) : (
                  <ThumbVideoWrap>
                    {item.previewUrl ? (
                      <video src={item.previewUrl} />
                    ) : (
                      <FaVideo color={COLORS.textTertiary} />
                    )}
                    <ThumbVideoIcon>
                      <FaVideo />
                    </ThumbVideoIcon>
                  </ThumbVideoWrap>
                )}
                {item.uploading && (
                  <ThumbOverlay>
                    <MiniSpinner />
                  </ThumbOverlay>
                )}
                {item.error && <ThumbOverlay $error />}
              </Thumb>
            ))}

            {media.length < 20 && (
              <AddThumb
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
                aria-label='Add more'
              >
                <FaPlusCircle />
              </AddThumb>
            )}
          </ThumbStrip>
        )}

        {/* ── Title ────────────────────────────────────────────────────── */}
        <FieldBlock>
          <FieldInput
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder='Title (required)'
            aria-label='Story title'
            maxLength={TITLE_MAX}
            $bold
          />
          <CharCount $warn={title.length > TITLE_MAX * 0.85}>
            {title.length}/{TITLE_MAX}
          </CharCount>
        </FieldBlock>

        {/* ── Caption ──────────────────────────────────────────────────── */}
        <FieldBlock $borderless>
          <FieldTextarea
            ref={textAreaRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder='Caption (optional)'
            rows={1}
            aria-label='Story caption'
            maxLength={2200}
          />
        </FieldBlock>
      </MainContent>

      {/* Full-page submit overlay */}
      {submitting && (
        <SubmitOverlay>
          <SpinRing $large />
          <OverlayText>Creating your story…</OverlayText>
        </SubmitOverlay>
      )}
    </PageWrapper>
  );
};

export default CreateStory;

// ─── Animations ───────────────────────────────────────────────────────────────

const spin = keyframes`to { transform: rotate(360deg); }`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─── Page shell ───────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background: ${COLORS.background};
  min-height: 100vh;
  color: ${COLORS.textPrimary};
  display: flex;
  flex-direction: column;

  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 32px;
`;

// ─── Top bar ──────────────────────────────────────────────────────────────────

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${COLORS.cardBackground};
  border-bottom: 1px solid ${COLORS.border};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const NavBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 1.1rem;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: color 0.2s, transform 0.2s;
  min-width: 40px;

  &:hover {
    color: ${COLORS.textPrimary};
    transform: translateX(-2px);
  }
`;

const TopBarTitle = styled.h1`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0;
  flex: 1;
  text-align: center;
  letter-spacing: -0.01em;
`;

const PublishBtn = styled.button`
  min-width: 68px;
  padding: 7px 14px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px ${COLORS.primarySalmon}44;
  white-space: nowrap;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px ${COLORS.primarySalmon}55;
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

// ─── Stats row ────────────────────────────────────────────────────────────────

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 16px;
  background: ${COLORS.elevatedBackground};
  border-bottom: 1px solid ${COLORS.border};
`;

const StatText = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UploadingBadge = styled.span`
  color: ${COLORS.primaryMint};
  font-weight: 600;
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.error};
  font-size: 0.72rem;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: ${COLORS.error}18;
  }
`;

const InlineError = styled.div`
  background: ${COLORS.error}12;
  border: 1px solid ${COLORS.error}30;
  color: ${COLORS.error};
  padding: 9px 16px;
  margin: 8px 16px;
  border-radius: 8px;
  font-size: 0.82rem;
`;

// ─── Preview frame ────────────────────────────────────────────────────────────

const PreviewFrame = styled.div`
  width: 100%;
  aspect-ratio: 9 / 16;
  position: relative;
  background: ${COLORS.elevatedBackground};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid ${COLORS.border};
`;

const PreviewImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
`;

const PreviewVideoWrap = styled.div`
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
  }
`;

const VideoTag = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
`;

const PlaceholderIcon = styled.div`
  font-size: 3rem;
  color: ${COLORS.textTertiary};
`;

const MediaOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) =>
    p.$error ? 'rgba(255,107,107,0.55)' : 'rgba(0,0,0,0.55)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const OverlayText = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
`;

const OverlaySubText = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.75);
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s, transform 0.2s;
  z-index: 2;

  &:hover {
    background: ${COLORS.primarySalmon}cc;
    transform: scale(1.1);
  }
`;

// ─── Pill dots ────────────────────────────────────────────────────────────────

const DotRow = styled.div`
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 2;
`;

const Dot = styled.div`
  height: 4px;
  width: ${(p) => (p.$active ? '20px' : '4px')};
  border-radius: 2px;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.38)')};
  cursor: pointer;
  transition: width 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s;
`;

// ─── Dropzone ─────────────────────────────────────────────────────────────────

const Dropzone = styled.div`
  width: 100%;
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed
    ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.border)};
  background: ${(p) =>
    p.$active ? `${COLORS.primarySalmon}08` : COLORS.elevatedBackground};
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}06;
  }
`;

const DropContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  gap: 8px;
`;

const DropIcon = styled.div`
  font-size: 2.8rem;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  margin-bottom: 8px;
  transition: color 0.2s;
`;

const DropLabel = styled.p`
  font-size: 0.9rem;
  color: ${COLORS.textSecondary};
  margin: 0 0 16px;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 320px;
`;

const ActionBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 10px;
  border-radius: 10px;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.cardBackground};
  color: ${COLORS.textSecondary};
  font-size: 0.8rem;
  font-weight: 500;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    font-size: 1.3rem;
    transition: color 0.2s;
  }

  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}0a;
    transform: translateY(-2px);
    svg {
      color: ${COLORS.primarySalmon};
    }
  }
`;

// ─── Thumbnail strip ──────────────────────────────────────────────────────────

const ThumbStrip = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 10px 12px;
  gap: 8px;
  background: ${COLORS.elevatedBackground};
  border-top: 1px solid ${COLORS.border};
  border-bottom: 1px solid ${COLORS.border};
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Thumb = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  border: 2px solid
    ${(p) => (p.$selected ? COLORS.primarySalmon : 'transparent')};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.cardBackground};
  transition: transform 0.2s, border-color 0.2s;
  box-shadow: ${(p) =>
    p.$selected ? `0 0 0 1px ${COLORS.primarySalmon}` : 'none'};

  &:hover {
    transform: scale(1.06);
  }
`;

const ThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ThumbVideoWrap = styled.div`
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

const ThumbVideoIcon = styled.div`
  position: absolute;
  top: 3px;
  right: 3px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
`;

const ThumbOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) => (p.$error ? `${COLORS.error}88` : 'rgba(0,0,0,0.45)')};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AddThumb = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 8px;
  background: ${COLORS.cardBackground};
  border: 1px dashed ${COLORS.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  color: ${COLORS.textTertiary};
  font-size: 1.4rem;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}0a;
    transform: scale(1.06);
  }
`;

// ─── Spinners ─────────────────────────────────────────────────────────────────

const SpinRing = styled.div`
  width: ${(p) => (p.$large ? '48px' : '32px')};
  height: ${(p) => (p.$large ? '48px' : '32px')};
  border: ${(p) => (p.$large ? '4px' : '3px')} solid rgba(255, 255, 255, 0.2);
  border-top-color: ${COLORS.primarySalmon};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const MiniSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: ${COLORS.primaryMint};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

// ─── Text fields ──────────────────────────────────────────────────────────────

const FieldBlock = styled.div`
  padding: ${(p) => (p.$borderless ? '8px 16px 16px' : '10px 16px 0')};
  background: ${COLORS.elevatedBackground};
  border-top: ${(p) => (p.$borderless ? 'none' : `1px solid ${COLORS.border}`)};
  margin-top: 1px;
`;

const FieldInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: ${(p) => (p.$bold ? '1rem' : '0.95rem')};
  font-weight: ${(p) => (p.$bold ? 700 : 400)};
  padding: 4px 0;
  outline: none;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const CharCount = styled.div`
  font-size: 0.68rem;
  text-align: right;
  color: ${(p) => (p.$warn ? COLORS.primarySalmon : COLORS.textTertiary)};
  padding: 2px 0 8px;
  transition: color 0.2s;
`;

const FieldTextarea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  resize: none;
  padding: 4px 0;
  min-height: 44px;
  outline: none;
  line-height: 1.5;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

// ─── Submit overlay ───────────────────────────────────────────────────────────

const SubmitOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 100;
  animation: ${fadeIn} 0.2s ease;
`;
