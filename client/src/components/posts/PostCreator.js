// client/src/components/posts/PostCreator.jsx
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import MediaItem from './PostCreator/media/MediaItem';

import {
  Container,
  Header,
  HeaderContent,
  ContentSection,
  MediaSection,
  DropArea,
  UploadIcon,
  DropText,
  UploadButton,
  MediaGrid,
  ActionBar,
  PostButton,
  AddMoreButton,
  PostDetailsSection,
  SectionHeader,
  AIButton,
  FormGroup,
  Label,
  FormInput,
  FormTextarea,
  TwoColumnGroup,
  IconInput,
  TagInput,
  TagInputField,
  TagsContainer,
  Tag,
  TagRemoveButton,
  CharCount,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  Select,
  InputRow,
  Input,
  ErrorMessage,
  GenerateButton,
  LoadingSpinner,
  GeneratedSection,
  SectionTitle,
  ContentPreview,
  ContentLabel,
  ContentBox,
  TagsPreview,
  TagPreview,
  ButtonRow,
  SecondaryButton,
  ApplyButton,
  FilterModalContent,
  FilterPreviewSection,
  MainPreview,
  FiltersGrid,
  FilterOption,
  FilterThumbnail,
  FilterName,
  FilterActionBar,
} from './PostCreator.styles';

import {
  FaImage,
  FaVideo,
  FaTimes,
  FaPlus,
  FaTag,
  FaPencilAlt,
  FaLocationArrow,
  FaCalendarDay,
  FaRobot,
  FaMagic,
  FaCheck,
} from 'react-icons/fa';
import { useUploadManager } from '../../hooks/useUploadManager';
import MediaGridSortable from './MediaGridSortable';
import { filterToClass, fileToMediaType, FILTERS } from '../../lib/media';
import { api } from '../../services/api';

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

// Local YYYY-MM-DD helper (prevents UTC day rollback)
const toLocalDateInput = (dateLike) => {
  const d = dateLike ? new Date(dateLike) : new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

// ── FIX #2: Killed the mobile FileReader path. URL.createObjectURL is
//    supported on every browser shipping since 2017. The old readAsDataURL
//    code was creating a full base64 copy of every file in the JS heap —
//    a 10 MB photo became ~13 MB of string *before* the upload even started.
//    Now synchronous, zero-copy, and returns a revocable blob: URL.
const createBlobUrl = (file) => {
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
};

const getSafeImageSrc = (mediaItem) => {
  if (mediaItem.mediaUrl) return mediaItem.mediaUrl;
  if (mediaItem.previewUrl) return mediaItem.previewUrl;
  return PLACEHOLDER_IMG;
};

// ─── AI Content Modal ─────────────────────────────────────────────────────────

const AIContentModal = ({ isOpen, onClose, onApplyContent }) => {
  const [formData, setFormData] = useState({
    description: '',
    contentType: 'photography',
    tone: 'thoughtful',
    additionalContext: '',
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const contentTypes = [
    { value: 'photography', label: 'Photography' },
    { value: 'aviation', label: 'Aviation & Training' },
    { value: 'observation', label: 'Observation' },
    { value: 'music', label: 'Piano & Music' },
    { value: 'travel', label: 'Travel & Utah' },
    { value: 'thought', label: 'Thought' },
    { value: 'reading', label: 'Reading' },
  ];

  const tones = [
    { value: 'thoughtful', label: 'Thoughtful' },
    { value: 'dry', label: 'Dry & Understated' },
    { value: 'reflective', label: 'Reflective' },
    { value: 'observational', label: 'Observational' },
  ];

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError('');
  };

  const handleGenerate = async () => {
    if (!formData.description.trim()) {
      setError('Please provide a description for your content');
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const data = await api.generateAIContent(formData);
      setGeneratedContent(data?.data ?? data);
      toast.success('Content generated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to generate content. Please try again.');
      toast.error('Failed to generate content');
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
        description: '',
        contentType: 'general',
        tone: 'casual',
        additionalContext: '',
      });
      setError('');
    }
  };

  const handleClose = () => {
    onClose();
    setGeneratedContent(null);
    setFormData({
      description: '',
      contentType: 'general',
      tone: 'casual',
      additionalContext: '',
    });
    setError('');
  };

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
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              placeholder='Describe what you want to post about...'
              maxLength='500'
            />
            <CharCount>{formData.description.length}/500</CharCount>
          </FormGroup>

          <InputRow>
            <FormGroup>
              <Label>Content Type</Label>
              <Select
                name='contentType'
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
                name='tone'
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
              name='additionalContext'
              value={formData.additionalContext}
              onChange={handleInputChange}
              placeholder='Any additional details...'
              maxLength='200'
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

// ─── Filter Modal ─────────────────────────────────────────────────────────────

const FilterModal = ({ isOpen, onClose, mediaItem, onApplyFilter }) => {
  const [selectedFilter, setSelectedFilter] = useState(
    mediaItem?.filter || 'none'
  );

  useEffect(() => {
    if (mediaItem) {
      setSelectedFilter(mediaItem.filter || 'none');
    }
  }, [mediaItem]);

  if (!isOpen || !mediaItem) return null;

  const handleApplyFilter = () => {
    onApplyFilter(selectedFilter);
    onClose();
  };

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
            {mediaItem.mediaType === 'video' ? (
              <video
                src={getSafeImageSrc(mediaItem)}
                className={
                  FILTERS.find((f) => f.id === selectedFilter)?.className || ''
                }
                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                controls
                playsInline
              />
            ) : (
              <img
                src={getSafeImageSrc(mediaItem)}
                className={
                  FILTERS.find((f) => f.id === selectedFilter)?.className || ''
                }
                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                alt='Preview'
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

// ─── FIX #5: Memoized form section ────────────────────────────────────────
// Extracted so that `uploadProgress` state changes (which fire dozens of
// times per upload) never re-render the text inputs. This component only
// re-renders when its own props change (title, caption, tags, etc.).

const PostDetailsForm = memo(function PostDetailsForm({
  title,
  setTitle,
  caption,
  setCaption,
  content,
  setContent,
  tags,
  setTags,
  currentTag,
  setCurrentTag,
  location,
  setLocation,
  eventDate,
  setEventDate,
  onOpenAIModal,
}) {
  const addTag = (tagText = null) => {
    const tagToAdd = tagText || currentTag.trim();
    if (!tagToAdd || tags.includes(tagToAdd)) return;
    if (tags.length >= 5) {
      toast.error('Maximum 5 tags allowed');
      return;
    }
    setTags((prev) => [...prev, tagToAdd]);
    setCurrentTag('');
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (currentTag.trim()) addTag();
    } else if (e.key === 'Backspace' && !currentTag && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    if (value.includes(' ')) {
      const tagText = value.split(' ')[0].trim();
      if (tagText) addTag(tagText);
    } else {
      setCurrentTag(value);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  return (
    <PostDetailsSection>
      <SectionHeader>
        <h3>Post Details</h3>
        <AIButton onClick={onOpenAIModal}>
          <FaRobot />
          <span>AI Assist</span>
        </AIButton>
      </SectionHeader>

      <FormGroup>
        <Label>Title *</Label>
        <FormInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Add a catchy title...'
          maxLength={100}
        />
        <CharCount>{title.length}/100</CharCount>
      </FormGroup>

      <FormGroup>
        <Label>Caption *</Label>
        <FormTextarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder='Write a caption that tells your story...'
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
              type='date'
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
              placeholder='Add location'
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
            placeholder='Type tags and press space to add...'
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
            placeholder='Add any additional details (optional)'
          />
        </IconInput>
      </FormGroup>
    </PostDetailsSection>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

function PostCreator({ initialData = null, isEditing = false, onSuccess }) {
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState(initialData?.title || '');
  const [caption, setCaption] = useState(initialData?.caption || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState('');
  const [location, setLocation] = useState(initialData?.location || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventDate, setEventDate] = useState(() =>
    toLocalDateInput(initialData?.eventDate)
  );
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMediaForFilter, setSelectedMediaForFilter] = useState(null);

  const navigate = useNavigate();
  const { startUpload, cancelUpload, uploadProgress, mountedRef } =
    useUploadManager(setMedia);

  // ── FIX #4: mediaRef gives onDrop a stable, always-current view of
  //    media without needing `media` in the dependency array. This
  //    prevents the callback from being recreated on every media change
  //    and eliminates the stale-closure race condition.
  const mediaRef = useRef(media);
  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      mediaRef.current.forEach((item) => {
        if (
          item?.previewUrl &&
          !item.isExisting &&
          item.previewUrl.startsWith('blob:')
        ) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
      });
    };
  }, []);

  // Populate existing media when editing
  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const existingMedia = initialData.media.map((item) => {
        const filter = item.filter || 'none';
        const filterClass = filterToClass(filter);
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
          filter,
          filterClass,
          isExisting: true,
          uploading: false,
          error: false,
        };
      });
      setMedia(existingMedia);
    }
  }, [isEditing, initialData]);

  // ── Dropzone ───────────────────────────────────────────────────────────────
  //
  // FIX #2 + #4: onDrop is now synchronous (no async/await needed since
  // createBlobUrl is sync). Reads current media from mediaRef instead of
  // closing over `media` state, so the dependency array is stable: only
  // [startUpload]. This means dropping files never fights with in-flight
  // upload state updates.

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      // Dupe-check against the ref — always current, no stale closure.
      const current = mediaRef.current;
      const uniqueFiles = acceptedFiles.filter((file) => {
        const isDupe = current.some(
          (m) =>
            m.file?.name === file.name &&
            m.file?.size === file.size &&
            m.file?.lastModified === file.lastModified
        );
        if (isDupe) {
          toast.error(`File "${file.name}" is already added.`);
        }
        return !isDupe;
      });

      if (uniqueFiles.length === 0) return;

      const newItems = uniqueFiles.map((file) => {
        const id = `media_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        return {
          id,
          file,
          previewUrl: createBlobUrl(file), // sync, zero-copy blob: URL
          mediaType: fileToMediaType(file) === 'video' ? 'video' : 'image',
          filter: 'none',
          filterClass: '',
          uploading: true,
          progress: 0,
          error: false,
        };
      });

      setMedia((prev) => [...prev, ...newItems]);

      newItems.forEach((item) => {
        startUpload(item.file, item.id, item.mediaType).catch((err) => {
          console.error(`Upload failed for ${item.id}:`, err);
        });
      });
    },
    [startUpload] // ← stable deps, no more [media, startUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    onDrop,
    maxSize: 300 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  // ── Media handlers ─────────────────────────────────────────────────────────
  //
  // FIX #1: Every mutation is now by item.id, never by index.
  // Indices shift when items are added/removed concurrently (e.g. an upload
  // finishes while you tap "remove" on another item). IDs are stable for
  // the lifetime of the item.

  const removeMedia = useCallback(
    (idToRemove) => {
      // If this item is still uploading or queued, abort/dequeue it
      cancelUpload(idToRemove);

      setMedia((current) => {
        const item = current.find((m) => m.id === idToRemove);
        if (
          item?.previewUrl &&
          !item.isExisting &&
          item.previewUrl.startsWith('blob:')
        ) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
        return current.filter((m) => m.id !== idToRemove);
      });
    },
    [cancelUpload]
  );

  const openFilterModal = useCallback((mediaItem) => {
    setSelectedMediaForFilter(mediaItem);
    setShowFilterModal(true);
  }, []);

  const applyFilter = useCallback(
    (filterId) => {
      if (!selectedMediaForFilter) return;
      const filterClass = filterToClass(filterId);
      setMedia((current) =>
        current.map((item) =>
          item.id === selectedMediaForFilter.id
            ? { ...item, filter: filterId, filterClass }
            : item
        )
      );
    },
    [selectedMediaForFilter]
  );

  // reorderMedia stays index-based — DnD is inherently positional and
  // this runs as a single synchronous splice, so no race condition here.
  const reorderMedia = useCallback((fromIndex, toIndex) => {
    setMedia((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // ── AI content ─────────────────────────────────────────────────────────────

  // Stable ref — won't break PostDetailsForm's memo
  const openAIModal = useCallback(() => setShowAIModal(true), []);

  const handleAIContentApply = (generatedContent) => {
    if (generatedContent.title) setTitle(generatedContent.title);
    if (generatedContent.caption) setCaption(generatedContent.caption);
    if (generatedContent.tags?.length > 0) {
      const availableSlots = 5 - tags.length;
      const newTags = generatedContent.tags.slice(0, availableSlots);
      setTags((prev) => [...prev, ...newTags]);
      toast.success(`Content applied with ${newTags.length} tags!`);
    } else {
      toast.success('Content applied!');
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (media.length === 0) {
      toast.error('Please add at least one photo or video');
      return;
    }
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }
    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }
    if (media.some((item) => item.uploading)) {
      toast.error('Please wait for uploads to complete');
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
      let response;

      if (isEditing) {
        const keepMedia = media
          .filter((item) => item.isExisting && item._id)
          .map((item) => item._id);

        const newMedia = media
          .filter((item) => !item.isExisting)
          .map((item, index) => ({
            mediaUrl: item.mediaUrl,
            cloudinaryId: item.cloudinaryId,
            mediaType: item.mediaType || item.type,
            filter: item.filter || 'none',
            order: index,
          }));

        const payload = {
          title: title ?? '',
          caption: caption ?? '',
          content: content ?? '',
          tags: tags.join(','),
          location: location ?? '',
          date: eventDate,
          keepMedia,
          media: newMedia,
        };

        response = await api.updatePost(initialData._id, payload);

        if (onSuccess) await onSuccess(initialData._id);

        toast.success('Post updated successfully!');
        navigate(`/post/${initialData._id}`);
        return;
      } else {
        const payload = {
          title: title ?? '',
          caption: caption ?? '',
          content: content ?? '',
          tags: tags.join(','),
          location: location ?? '',
          date: eventDate,
          media: media
            .filter((item) => !item.error)
            .map((item, index) => ({
              mediaUrl: item.mediaUrl,
              cloudinaryId: item.cloudinaryId,
              mediaType: item.mediaType || item.type,
              filter: item.filter || 'none',
              order: index,
            })),
        };

        response = await api.createPost(payload);
        toast.success('Post created successfully!');
      }

      const postId = response?.data?._id ?? response?._id;

      if (!postId) {
        navigate('/');
        return;
      }

      navigate(`/post/${postId}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Please try again';
      toast.error(
        `Failed to ${isEditing ? 'update' : 'create'} post: ${errorMessage}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    media.length > 0 &&
    title.trim() &&
    caption.trim() &&
    !media.some((item) => item.uploading || item.error);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container>
      <Header>
        <HeaderContent>
          <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
          <p>Share your moments with the world</p>
        </HeaderContent>
      </Header>

      <ContentSection>
        <MediaSection>
          {media.length === 0 ? (
            <DropArea {...getRootProps()} isDragActive={isDragActive}>
              <input {...getInputProps()} />
              <UploadIcon className='upload-icon'>
                <FaImage />
                <FaVideo />
              </UploadIcon>
              <DropText>
                <h3>Add photos and videos</h3>
                <p>Drag and drop or click to upload</p>
              </DropText>
              <UploadButton
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
              >
                <FaPlus /> Select from device
              </UploadButton>
            </DropArea>
          ) : (
            <MediaGrid>
              <MediaGridSortable
                items={media}
                onReorder={reorderMedia}
                renderItem={(item, index) => (
                  <MediaItem
                    key={item.id}
                    mediaItem={item}
                    index={index}
                    progress={uploadProgress[item.id] ?? null}
                    onRemove={() => removeMedia(item.id)}
                    onFilter={() => openFilterModal(item)}
                    onReorder={reorderMedia}
                    isDragging={false}
                  />
                )}
                AddMoreButton={
                  <AddMoreButton onClick={open}>
                    <FaPlus />
                    <span>Add more</span>
                  </AddMoreButton>
                }
              />
            </MediaGrid>
          )}
        </MediaSection>

        <PostDetailsForm
          title={title}
          setTitle={setTitle}
          caption={caption}
          setCaption={setCaption}
          content={content}
          setContent={setContent}
          tags={tags}
          setTags={setTags}
          currentTag={currentTag}
          setCurrentTag={setCurrentTag}
          location={location}
          setLocation={setLocation}
          eventDate={eventDate}
          setEventDate={setEventDate}
          onOpenAIModal={openAIModal}
        />
      </ContentSection>

      <ActionBar>
        <PostButton
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting
            ? isEditing
              ? 'Updating...'
              : 'Publishing...'
            : isEditing
            ? 'Update Post'
            : 'Publish Post'}
        </PostButton>
      </ActionBar>

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
