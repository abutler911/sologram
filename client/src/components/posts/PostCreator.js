// client/src/components/posts/PostCreator.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
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

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const createSafeBlobUrl = (file) => {
  try {
    if (file.type.startsWith('image/')) {
      if (isMobileDevice()) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      } else {
        const url = URL.createObjectURL(file);
        return Promise.resolve(url);
      }
    }
    const url = URL.createObjectURL(file);
    return Promise.resolve(url);
  } catch {
    return Promise.resolve(null);
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
    contentType: 'general',
    tone: 'casual',
    additionalContext: '',
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const contentTypes = [
    { value: 'general', label: 'General Post' },
    { value: 'product', label: 'Product Showcase' },
    { value: 'behind-scenes', label: 'Behind the Scenes' },
    { value: 'educational', label: 'Educational' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'announcement', label: 'Announcement' },
  ];

  const tones = [
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'professional', label: 'Professional' },
    { value: 'playful', label: 'Fun & Playful' },
    { value: 'inspirational', label: 'Inspirational' },
    { value: 'minimalist', label: 'Clean & Minimal' },
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
              placeholder='Describe what your post is about...'
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
  const { startUpload, mountedRef } = useUploadManager(setMedia);

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
          const isVideo = fileToMediaType(file) === 'video';
          const previewUrl = await createSafeBlobUrl(file);
          return {
            id,
            file,
            previewUrl,
            mediaType: isVideo ? 'video' : 'image',
            filter: 'none',
            filterClass: '',
            uploading: true,
            progress: 0,
            error: false,
            isMobile: isMobileDevice(),
          };
        })
      );

      setMedia((prev) => [...prev, ...newItems]);
      newItems.forEach((item) => {
        startUpload(item.file, item.id, item.mediaType).catch((err) => {
          console.error(`Upload failed for ${item.id}:`, err);
        });
      });
    },
    [media, startUpload]
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

  const removeMedia = (indexToRemove) => {
    const itemToRemove = media[indexToRemove];
    if (
      itemToRemove?.previewUrl &&
      !itemToRemove.isExisting &&
      itemToRemove.previewUrl.startsWith('blob:')
    ) {
      try {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      } catch {}
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
    const filterClass = filterToClass(filterId);
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

  // ── AI content ─────────────────────────────────────────────────────────────

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

  // ── Tags ───────────────────────────────────────────────────────────────────

  const addTag = (tagText = null) => {
    const tagToAdd = tagText || currentTag.trim();
    if (!tagToAdd || tags.includes(tagToAdd)) return;
    if (tags.length >= 5) {
      toast.error('Maximum 5 tags allowed');
      return;
    }
    setTags([...tags, tagToAdd]);
    setCurrentTag('');
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (currentTag.trim()) addTag();
    } else if (e.key === 'Backspace' && !currentTag && tags.length > 0) {
      setTags(tags.slice(0, -1));
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
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
        // ── keepMedia: tell the backend which existing media to retain ──────
        // Without this, the backend treats all existing media as "removed" and
        // deletes them from Cloudinary.
        const keepMedia = media
          .filter((item) => item.isExisting && item._id)
          .map((item) => item._id);

        // New uploads only — existing ones are preserved via keepMedia
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
          keepMedia, // ← critical: IDs of existing media to keep
          media: newMedia,
        };

        response = await api.updatePost(initialData._id, payload);

        // Let the parent invalidate the RQ cache before navigating so the
        // feed and detail page both reflect the update immediately.
        if (onSuccess) await onSuccess(initialData._id);

        toast.success('Post updated successfully!');
        // For edits we already know the ID — no need to parse the response.
        navigate(`/post/${initialData._id}`);
        return; // early return — skip the create navigation path below
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

      // For new posts, parse the ID from the response.
      const postId = response?.data?._id ?? response?._id;

      if (!postId) {
        // Response shape unexpected — go home rather than /post/undefined
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
                    onRemove={removeMedia}
                    onFilter={openFilterModal}
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
