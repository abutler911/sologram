import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaImage,
  FaVideo,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaHashtag,
  FaCamera,
  FaExclamationTriangle,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import LoadingSpinner from "../common/loadingSpinner";
import pandaImg from "../../assets/panda.jpg";

// Define filters outside component to avoid recreation on renders
const FILTERS = [
  { name: "None", class: "" },
  { name: "Warm", class: "filter-warm" },
  { name: "Cool", class: "filter-cool" },
  { name: "Grayscale", class: "filter-grayscale" },
  { name: "Vintage", class: "filter-vintage" },
];

// Constants to avoid magic numbers/strings
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_MEDIA_COUNT = 25;
const FILE_TYPES = {
  IMAGE: {
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    icon: FaImage,
  },
  VIDEO: {
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    icon: FaVideo,
  },
};

// Define a cancelable request utility
const createCancelableRequest = () => {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: source.cancel,
  };
};

const CreatePostWorkflow = ({ initialData = null, isEditing = false }) => {
  // Refs for cleanup and preventing memory leaks
  const cancelTokensRef = useRef([]);
  const mountedRef = useRef(true);

  // Component state
  const [currentStep, setCurrentStep] = useState(1);
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // UI state
  const [captionFocused, setCaptionFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const [tagSuggestions] = useState([
    "travel",
    "fitness",
    "fun",
    "adventure",
    "food",
    "photography",
  ]);

  const navigate = useNavigate();

  // Check if we have any pending uploads
  const hasPendingUploads = mediaPreviews.some(
    (media) => media.uploading || !media.mediaUrl
  );

  // Calculate the total number of media items
  const totalMediaCount = existingMedia.length + mediaPreviews.length;

  // Reset component on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Cancel any ongoing uploads when component unmounts
      cancelTokensRef.current.forEach((cancelToken) => {
        if (cancelToken && cancelToken.cancel) {
          cancelToken.cancel("Component unmounted");
        }
      });

      // Revoke object URLs to prevent memory leaks
      mediaPreviews.forEach((media) => {
        if (media.preview) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, [mediaPreviews]);

  // Load existing media when editing
  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const mapped = initialData.media.map((media) => ({
        id: media._id,
        mediaUrl: media.mediaUrl,
        cloudinaryId: media.cloudinaryId,
        mediaType: media.mediaType,
        isExisting: true,
        filter: media.filter || "",
      }));
      setExistingMedia(mapped);
    }
  }, [isEditing, initialData]);

  // Handle file drops with improved error handling and progress tracking
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (totalMediaCount + acceptedFiles.length > MAX_MEDIA_COUNT) {
        toast.error(`Maximum ${MAX_MEDIA_COUNT} files allowed`);
        return;
      }

      setUploading(true);

      const newUploads = acceptedFiles.map((file) => {
        return new Promise(async (resolve) => {
          const id = `upload_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;
          const isVideo = file.type.startsWith("video/");

          const preview = {
            id,
            file,
            preview: URL.createObjectURL(file),
            type: isVideo ? "video" : "image",
            filter: "",
            uploading: true,
            progress: 0,
            error: false,
          };

          setMediaPreviews((prev) => [...prev, preview]);
          setUploadProgress((prev) => ({ ...prev, [id]: 0 }));

          try {
            const cancelToken = createCancelableRequest();
            cancelTokensRef.current.push(cancelToken);

            const uploaded = await uploadToCloudinary(
              file,
              (percent) => {
                if (!mountedRef.current) return;
                setUploadProgress((prev) => ({ ...prev, [id]: percent }));
                setMediaPreviews((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, progress: percent } : p
                  )
                );
              },
              cancelToken.token
            );

            if (!mountedRef.current) return;

            resolve({ success: true, id, uploaded }); // ✅ critical fix: pass uploaded
          } catch (err) {
            if (!axios.isCancel(err)) {
              console.error("❌ Upload failed:", err.message);
              toast.error(`Upload failed: ${file.name}`);
            }

            setMediaPreviews((prev) =>
              prev.map((p) =>
                p.id === id ? { ...p, error: true, uploading: false } : p
              )
            );

            resolve({ success: false, id });
          }
        });
      });

      try {
        const uploadResults = await Promise.all(newUploads);

        // ✅ Merge upload data into mediaPreviews once
        setMediaPreviews((prev) => {
          const updated = prev.map((preview) => {
            const result = uploadResults.find((res) => res.id === preview.id);
            if (result?.success && result?.uploaded) {
              const { mediaUrl, cloudinaryId, mediaType } = result.uploaded;
              return {
                ...preview,
                uploading: false,
                mediaUrl,
                cloudinaryId,
                mediaType,
              };
            }
            return preview;
          });

          console.log("🧩 Final mediaPreviews after all uploads:", updated);
          return updated;
        });

        console.log("🟢 All uploads completed");
      } catch (err) {
        console.error("Upload batch error:", err);
      } finally {
        if (mountedRef.current) {
          setUploading(false);
        }
      }
    },
    [totalMediaCount]
  );

  // Configure dropzone with validation
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      ...FILE_TYPES.IMAGE.accept,
      ...FILE_TYPES.VIDEO.accept,
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: uploading || totalMediaCount >= MAX_MEDIA_COUNT,
    validator: (file) => {
      if (file.size > MAX_FILE_SIZE) {
        return {
          code: "file-too-large",
          message: `File is larger than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        };
      }

      // Make sure it's either an image or video
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        return {
          code: "file-invalid-type",
          message: "File must be an image or video",
        };
      }

      return null;
    },
  });

  // Get the current media being displayed
  const getCurrentMedia = () => {
    const allMedia = [...existingMedia, ...mediaPreviews];
    const current = allMedia[activePreviewIndex] || null;
    console.log("📸 getCurrentMedia:", current); // 🔍 ADD THIS LINE
    return current;
  };

  // Remove a preview file with cleanup
  const removePreviewFile = useCallback(
    (id) => {
      const previewIndex = mediaPreviews.findIndex((p) => p.id === id);

      if (previewIndex !== -1) {
        // Cancel any ongoing upload for this file
        const preview = mediaPreviews[previewIndex];

        // Clean up object URL to prevent memory leaks
        if (preview.preview) {
          URL.revokeObjectURL(preview.preview);
        }

        // Remove the preview
        setMediaPreviews((prev) => prev.filter((p) => p.id !== id));

        // Adjust active preview index if needed
        if (activePreviewIndex >= totalMediaCount - 1) {
          setActivePreviewIndex(Math.max(0, totalMediaCount - 2));
        }
      }
    },
    [mediaPreviews, activePreviewIndex, totalMediaCount]
  );

  // Remove an existing media
  const removeExistingMedia = useCallback(
    (id) => {
      setExistingMedia((prev) => prev.filter((m) => m.id !== id));

      // Adjust active preview index if needed
      if (activePreviewIndex >= totalMediaCount - 1) {
        setActivePreviewIndex(Math.max(0, totalMediaCount - 2));
      }
    },
    [activePreviewIndex, totalMediaCount]
  );

  // Navigation between media previews
  const nextPreview = useCallback(() => {
    if (activePreviewIndex < totalMediaCount - 1) {
      setActivePreviewIndex((prev) => prev + 1);
    }
  }, [activePreviewIndex, totalMediaCount]);

  const prevPreview = useCallback(() => {
    if (activePreviewIndex > 0) {
      setActivePreviewIndex((prev) => prev - 1);
    }
  }, [activePreviewIndex]);

  // Apply filter to current media
  const applyFilter = useCallback(
    (filterIndex) => {
      setSelectedFilter(filterIndex);

      // Apply filter to the active media
      const allMedia = [...existingMedia, ...mediaPreviews];
      if (activePreviewIndex < allMedia.length) {
        const targetIndex = activePreviewIndex - existingMedia.length;

        if (targetIndex >= 0 && targetIndex < mediaPreviews.length) {
          setMediaPreviews((prev) =>
            prev.map((item, idx) =>
              idx === targetIndex
                ? { ...item, filter: FILTERS[filterIndex].class }
                : item
            )
          );
        }
      }
    },
    [activePreviewIndex, existingMedia.length, mediaPreviews]
  );

  // Handle tag suggestions
  const addTag = useCallback(
    (tag) => {
      const currentTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");

      if (!currentTags.includes(tag)) {
        const newTags = [...currentTags, tag];
        setTags(newTags.join(", "));
      }
    },
    [tags]
  );

  // Handle camera capture with error handling
  const handleCameraFile = useCallback(
    (e) => {
      try {
        const file = e.target.files?.[0];
        if (file) {
          // Early return if max files reached
          if (totalMediaCount >= MAX_MEDIA_COUNT) {
            toast.error(`Maximum ${MAX_MEDIA_COUNT} files allowed`);
            return;
          }

          const isVideo = file.type.startsWith("video/");

          // Size validation
          if (file.size > MAX_FILE_SIZE) {
            toast.error(
              `File exceeds the maximum size of ${
                MAX_FILE_SIZE / (1024 * 1024)
              }MB`
            );
            return;
          }

          // Create new ID for this file
          const id = `camera_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;

          // Create object URL for preview
          const preview = URL.createObjectURL(file);

          // Create media preview object
          const newMedia = {
            id,
            file,
            preview,
            type: isVideo ? "video" : "image",
            filter: "",
            uploading: true,
            progress: 0,
          };

          // Add to state
          setMediaPreviews((prev) => [...prev, newMedia]);

          // Start upload immediately
          const cancelToken = createCancelableRequest();
          cancelTokensRef.current.push(cancelToken);

          // Upload with progress tracking
          uploadToCloudinary(
            file,
            (percent) => {
              if (!mountedRef.current) return;
              setMediaPreviews((prev) =>
                prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
              );
            },
            cancelToken.token
          )
            .then((uploaded) => {
              if (!mountedRef.current) return;

              setMediaPreviews((prev) =>
                prev.map((p) =>
                  p.id === id
                    ? {
                        ...p,
                        uploading: false,
                        mediaUrl: uploaded.mediaUrl,
                        cloudinaryId: uploaded.cloudinaryId,
                        mediaType: uploaded.mediaType,
                      }
                    : p
                )
              );

              // Remove from active tokens
              cancelTokensRef.current = cancelTokensRef.current.filter(
                (token) => token !== cancelToken
              );
            })
            .catch((err) => {
              if (!mountedRef.current) return;

              if (!axios.isCancel(err)) {
                toast.error(`Upload failed: ${file.name}`);
                setMediaPreviews((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, error: true, uploading: false } : p
                  )
                );
              }
            });
        }
      } catch (err) {
        console.error("Camera capture error:", err);
        toast.error("Failed to capture image. Please try again.");
      } finally {
        // Reset input so camera can be triggered again
        if (e.target) e.target.value = null;
      }
    },
    [totalMediaCount]
  );

  // Retry upload with improved error handling
  const retryUpload = async (filePreview) => {
    if (!filePreview || !filePreview.file) {
      toast.error("Cannot retry upload: File not available");
      return;
    }

    try {
      setMediaPreviews((prev) =>
        prev.map((item) =>
          item.id === filePreview.id
            ? { ...item, error: false, uploading: true, progress: 0 }
            : item
        )
      );

      const cancelToken = createCancelableRequest();
      cancelTokensRef.current.push(cancelToken);

      const onProgress = (percent) => {
        if (!mountedRef.current) return;
        setMediaPreviews((prev) =>
          prev.map((item) =>
            item.id === filePreview.id ? { ...item, progress: percent } : item
          )
        );
      };

      const uploaded = await uploadToCloudinary(
        filePreview.file,
        onProgress,
        cancelToken.token
      );

      if (!mountedRef.current) return;

      setMediaPreviews((prev) =>
        prev.map((item) =>
          item.id === filePreview.id
            ? {
                ...item,
                uploading: false,
                mediaUrl: uploaded.mediaUrl,
                cloudinaryId: uploaded.cloudinaryId,
                mediaType: uploaded.mediaType,
                error: false,
              }
            : item
        )
      );
      console.log("🔁 Retry upload complete:", uploaded);
      // Cleanup token
      cancelTokensRef.current = cancelTokensRef.current.filter(
        (token) => token !== cancelToken
      );

      toast.success("Upload succeeded!");
    } catch (err) {
      if (!mountedRef.current) return;

      if (!axios.isCancel(err)) {
        console.error("Retry upload error:", err);
        toast.error("Retry failed. Try again later.");

        setMediaPreviews((prev) =>
          prev.map((item) =>
            item.id === filePreview.id
              ? { ...item, error: true, uploading: false }
              : item
          )
        );
      }
    }
  };

  // Submit form with optimistic updates and error handling
  const handleSubmit = async () => {
    // Validate input
    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }

    if (
      mediaPreviews.filter((m) => m.mediaUrl && !m.error).length === 0 &&
      existingMedia.length === 0
    ) {
      toast.error("Add at least one image or video");
      return;
    }

    // Check for pending uploads
    if (hasPendingUploads) {
      toast.error("Please wait for all uploads to complete");
      return;
    }

    setLoading(true);

    try {
      // Prepare existing media IDs
      const existingCloudinaryIds = existingMedia.map((m) => m.cloudinaryId);
      console.log("🚨 Final mediaPreviews before submit:", mediaPreviews);
      // Prepare uploaded media that isn't already saved
      const uploadedMedia = mediaPreviews
        .filter(
          (m) =>
            m.mediaUrl &&
            !m.error &&
            !existingCloudinaryIds.includes(m.cloudinaryId)
        )
        .map((m) => ({
          mediaUrl: m.mediaUrl,
          cloudinaryId: m.cloudinaryId,
          mediaType: m.mediaType,
          filter: m.filter || "",
        }));

      // Prepare payload
      const payload = {
        caption,
        content,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        media: uploadedMedia,
      };

      let response;

      // Handle different API endpoints for create vs edit
      if (isEditing) {
        payload.keepMedia = existingMedia.map((m) => m.id).join(",");
        response = await axios.put(`/api/posts/${initialData._id}`, payload);
        toast.success("Post updated!");
      } else {
        response = await axios.post("/api/posts", payload);
        toast.success("Post created!");
      }

      // Navigate to the post view page on success
      navigate(`/post/${response.data.data._id}`);
    } catch (err) {
      console.error("Post failed:", err);

      // More specific error messages based on response
      if (err.response?.status === 413) {
        toast.error("Post too large. Try reducing the number of media files.");
      } else if (err.response?.status === 401) {
        toast.error("Please log in to create a post.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if the media step has no media
  const isMediaStepEmpty = currentStep === 1 && totalMediaCount === 0;

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (e) => {
      // Only process when on the media step with media items
      if (currentStep !== 1 || isMediaStepEmpty) return;

      if (e.key === "ArrowRight") {
        nextPreview();
      } else if (e.key === "ArrowLeft") {
        prevPreview();
      }
    },
    [currentStep, isMediaStepEmpty, nextPreview, prevPreview]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Media Selection Step
        return (
          <StepContainer>
            <StepTitle>
              {isEditing ? "Edit your media" : "Add photos or videos"}
            </StepTitle>

            {isMediaStepEmpty ? (
              <>
                <DropzoneContainer
                  {...getRootProps()}
                  isDragActive={isDragActive}
                  isDisabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                >
                  <input {...getInputProps()} />
                  <DropzoneIcon>
                    <FaCloudUploadAlt />
                  </DropzoneIcon>
                  <DropzoneText>
                    {isDragActive
                      ? "Drop your files here"
                      : uploading
                      ? "Uploading..."
                      : totalMediaCount >= MAX_MEDIA_COUNT
                      ? `Maximum ${MAX_MEDIA_COUNT} files reached`
                      : "Drag photos and videos here, or click to browse"}
                  </DropzoneText>
                  <MediaTypeIcons>
                    <FaImage />
                    <FaVideo />
                  </MediaTypeIcons>
                  <DropzoneSubtext>
                    You can add up to {MAX_MEDIA_COUNT} photos and videos. Max
                    file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
                  </DropzoneSubtext>
                </DropzoneContainer>

                {/* Camera trigger outside the Dropzone */}
                <CameraControlsContainer>
                  <label htmlFor="camera-input">
                    <CameraButton
                      as="div"
                      disabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                    >
                      <FaCamera />
                      <span>Take Photo</span>
                    </CameraButton>
                  </label>
                  <input
                    id="camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handleCameraFile}
                    disabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                  />
                </CameraControlsContainer>
              </>
            ) : (
              <MediaPreviewSection>
                <MediaCarousel>
                  <CurrentMediaPreview>
                    {getCurrentMedia()?.error && (
                      <RetryButton
                        onClick={() => retryUpload(getCurrentMedia())}
                        disabled={uploading}
                      >
                        <FaExclamationTriangle /> Retry Upload
                      </RetryButton>
                    )}

                    {getCurrentMedia()?.mediaType === "video" ||
                    getCurrentMedia()?.type === "video" ? (
                      <PreviewVideo
                        src={
                          getCurrentMedia()?.mediaUrl ||
                          getCurrentMedia()?.preview
                        }
                        controls
                        className={getCurrentMedia()?.filter || ""}
                        onError={(e) => {
                          console.error("Video loading error", e);
                          e.target.onerror = null; // Prevent infinite error loop
                          toast.error("Error loading video preview");
                        }}
                      />
                    ) : (
                      <PreviewImage
                        src={
                          getCurrentMedia()?.mediaUrl ||
                          getCurrentMedia()?.preview
                        }
                        className={getCurrentMedia()?.filter || ""}
                        alt="Media preview"
                        onError={(e) => {
                          console.error("Image loading error", e);
                          e.target.onerror = null; // Prevent infinite error loop
                          e.target.src = pandaImg; // Fallback image
                          toast.error("Error loading image preview");
                        }}
                      />
                    )}

                    {getCurrentMedia()?.uploading && (
                      <ProgressOverlay>
                        <ProgressText>
                          Uploading... {getCurrentMedia()?.progress || 0}%
                        </ProgressText>
                      </ProgressOverlay>
                    )}

                    <RemoveMediaButton
                      onClick={() =>
                        getCurrentMedia()?.isExisting
                          ? removeExistingMedia(getCurrentMedia().id)
                          : removePreviewFile(getCurrentMedia().id)
                      }
                      disabled={uploading}
                      aria-label="Remove media"
                    >
                      <FaTimes />
                    </RemoveMediaButton>
                  </CurrentMediaPreview>

                  {totalMediaCount > 1 && (
                    <>
                      <NavButtons>
                        <NavButton
                          onClick={prevPreview}
                          disabled={activePreviewIndex === 0}
                          aria-label="Previous media"
                        >
                          <FaArrowLeft />
                        </NavButton>
                        <NavButton
                          onClick={nextPreview}
                          disabled={activePreviewIndex === totalMediaCount - 1}
                          aria-label="Next media"
                        >
                          <FaArrowRight />
                        </NavButton>
                      </NavButtons>

                      <PaginationIndicator>
                        {activePreviewIndex + 1} / {totalMediaCount}
                      </PaginationIndicator>
                    </>
                  )}
                </MediaCarousel>

                <FilterSection>
                  <FilterTitle>Filters</FilterTitle>
                  <FilterList>
                    {FILTERS.map((filter, index) => (
                      <FilterItem
                        key={filter.name}
                        onClick={() => applyFilter(index)}
                        className={selectedFilter === index ? "active" : ""}
                        aria-label={`${filter.name} filter`}
                        aria-selected={selectedFilter === index}
                      >
                        <FilterPreviewImage
                          src={
                            getCurrentMedia()?.preview ||
                            getCurrentMedia()?.mediaUrl ||
                            pandaImg
                          }
                          alt={`${filter.name} filter preview`}
                          className={filter.class}
                        />
                        <FilterName>{filter.name}</FilterName>
                      </FilterItem>
                    ))}
                  </FilterList>
                </FilterSection>

                <ActionButtonsRow>
                  <AddMoreWrapper
                    {...getRootProps()}
                    disabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                  >
                    <MediaActionButton
                      as="div"
                      disabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                    >
                      <FaImage />
                      <span>Add More</span>
                    </MediaActionButton>
                    <input {...getInputProps()} />
                  </AddMoreWrapper>

                  <label htmlFor="camera-input-2">
                    <MediaActionButton
                      as="div"
                      disabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                    >
                      <FaCamera />
                      <span>Add Photo</span>
                    </MediaActionButton>
                  </label>

                  <input
                    id="camera-input-2"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handleCameraFile}
                    disabled={uploading || totalMediaCount >= MAX_MEDIA_COUNT}
                  />
                </ActionButtonsRow>
              </MediaPreviewSection>
            )}
          </StepContainer>
        );

      case 2: // Details Step
        return (
          <StepContainer>
            <StepTitle>Add post details</StepTitle>

            <FormSection>
              <InputGroup focused={captionFocused}>
                <InputLabel htmlFor="caption-input">Caption</InputLabel>
                <TextInput
                  id="caption-input"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  onFocus={() => setCaptionFocused(true)}
                  onBlur={() => setCaptionFocused(false)}
                  required
                  maxLength={2200} // Instagram's limit
                />
                <CharacterCount warning={caption.length > 2000}>
                  {caption.length}/2200
                </CharacterCount>
              </InputGroup>

              <InputGroup focused={contentFocused}>
                <InputLabel htmlFor="content-input">
                  Content (optional)
                </InputLabel>
                <TextArea
                  id="content-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add more details about your post..."
                  rows={4}
                  onFocus={() => setContentFocused(true)}
                  onBlur={() => setContentFocused(false)}
                />
              </InputGroup>

              <InputGroup focused={tagInputFocused}>
                <InputLabel htmlFor="tags-input">Tags (optional)</InputLabel>
                <TextInput
                  id="tags-input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Add tags separated by commas..."
                  onFocus={() => setTagInputFocused(true)}
                  onBlur={() => setTagInputFocused(false)}
                />

                {tagInputFocused && (
                  <TagSuggestions>
                    <TagSuggestionsLabel>Suggestions:</TagSuggestionsLabel>
                    <TagsList>
                      {tagSuggestions.map((tag) => (
                        <TagSuggestion
                          key={tag}
                          onClick={() => addTag(tag)}
                          aria-label={`Add ${tag} tag`}
                        >
                          <FaHashtag />
                          <span>{tag}</span>
                        </TagSuggestion>
                      ))}
                    </TagsList>
                  </TagSuggestions>
                )}
              </InputGroup>
            </FormSection>

            <PreviewSection>
              <PreviewTitle>Preview</PreviewTitle>
              <PostPreview>
                {getCurrentMedia() && (
                  <PostPreviewMedia>
                    {getCurrentMedia()?.mediaType === "video" ||
                    getCurrentMedia()?.type === "video" ? (
                      <PostPreviewVideo
                        src={
                          getCurrentMedia()?.mediaUrl ||
                          getCurrentMedia()?.preview
                        }
                        className={getCurrentMedia()?.filter || ""}
                      />
                    ) : (
                      <PostPreviewImage
                        src={
                          getCurrentMedia()?.mediaUrl ||
                          getCurrentMedia()?.preview
                        }
                        className={getCurrentMedia()?.filter || ""}
                        alt="Post preview"
                      />
                    )}

                    {totalMediaCount > 1 && (
                      <PostPreviewPagination>
                        {[...Array(totalMediaCount)].map((_, i) => (
                          <PaginationDot
                            key={i}
                            active={i === activePreviewIndex}
                          />
                        ))}
                      </PostPreviewPagination>
                    )}
                  </PostPreviewMedia>
                )}

                <PostPreviewContent>
                  <PostPreviewCaption>
                    {caption || "Your caption will appear here"}
                  </PostPreviewCaption>

                  {tags && (
                    <PostPreviewTags>
                      {tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag)
                        .map((tag) => (
                          <PostPreviewTag key={tag}>#{tag}</PostPreviewTag>
                        ))}
                    </PostPreviewTags>
                  )}
                </PostPreviewContent>
              </PostPreview>
            </PreviewSection>
          </StepContainer>
        );

      default:
        return null;
    }
  };

  return (
    <WorkflowContainer>
      {/* Accessible step indicators */}
      <StepIndicator role="navigation" aria-label="Post creation steps">
        <StepCircle
          active={currentStep === 1}
          completed={currentStep > 1}
          onClick={() => setCurrentStep(1)}
          aria-label="Step 1: Add media"
          aria-current={currentStep === 1 ? "step" : undefined}
        >
          {currentStep > 1 ? <FaCheck /> : 1}
        </StepCircle>
        <StepConnector completed={currentStep > 1} aria-hidden="true" />
        <StepCircle
          active={currentStep === 2}
          completed={currentStep > 2}
          onClick={() => !isMediaStepEmpty && setCurrentStep(2)}
          aria-label="Step 2: Add details"
          aria-current={currentStep === 2 ? "step" : undefined}
          aria-disabled={isMediaStepEmpty}
        >
          {currentStep > 2 ? <FaCheck /> : 2}
        </StepCircle>
      </StepIndicator>

      <main aria-label="Create Post Workflow">{renderStepContent()}</main>

      {loading && (
        <LoadingOverlay aria-live="polite" aria-busy="true">
          <LoadingSpinner />
        </LoadingOverlay>
      )}

      <NavigationButtons>
        {currentStep > 1 && (
          <BackButton
            onClick={() => setCurrentStep((prev) => prev - 1)}
            aria-label="Go back to previous step"
          >
            <FaArrowLeft />
            <span>Back</span>
          </BackButton>
        )}

        {currentStep === 1 && !isMediaStepEmpty && (
          <NextButton
            onClick={() => setCurrentStep(2)}
            disabled={uploading}
            aria-label="Continue to next step"
          >
            <span>Next</span>
            <FaArrowRight />
          </NextButton>
        )}

        {currentStep === 2 && (
          <PublishButton
            onClick={handleSubmit}
            disabled={
              loading ||
              hasPendingUploads ||
              !caption.trim() ||
              (mediaPreviews.length === 0 && existingMedia.length === 0)
            }
            aria-label={isEditing ? "Update post" : "Publish post"}
          >
            <FaCheck />
            <span>
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Publishing..."
                : isEditing
                ? "Update"
                : hasPendingUploads
                ? "Uploading..."
                : "Publish"}
            </span>
          </PublishButton>
        )}
      </NavigationButtons>

      <CancelButton
        onClick={() => navigate(-1)}
        aria-label="Cancel and go back"
      >
        Cancel
      </CancelButton>
    </WorkflowContainer>
  );
};

// Styled Components
const WorkflowContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
    border-radius: 0;
    padding: 1.5rem;
    box-shadow: none;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
`;

const StepCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? "#ff7e5f" : props.completed ? "#4caf50" : "#333333"};
  color: ${(props) => (props.active || props.completed ? "white" : "#aaaaaa")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  position: relative;
  cursor: ${(props) =>
    props.completed ? "pointer" : props.active ? "default" : "not-allowed"};
  transition: all 0.3s ease;

  &:hover {
    transform: ${(props) =>
      props.completed || props.active ? "scale(1.05)" : "none"};
  }
`;

const StepConnector = styled.div`
  height: 2px;
  width: 120px;
  background-color: ${(props) => (props.completed ? "#4caf50" : "#333333")};
  margin: 0 1rem;
  transition: background-color 0.3s ease;
`;

const StepContainer = styled.div`
  min-height: 400px;
`;

const StepTitle = styled.h2`
  font-size: 1.5rem;
  text-align: center;
  color: #ffffff;
  margin-bottom: 2rem;
`;

// Media Selection Step
const DropzoneContainer = styled.div`
  border: 2px dashed ${(props) => (props.isDragActive ? "#ff7e5f" : "#444444")};
  background-color: ${(props) =>
    props.isDragActive ? "rgba(255, 126, 95, 0.1)" : "#272727"};
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: ${(props) => (props.isDisabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.isDisabled ? 0.7 : 1)};

  &:hover {
    border-color: ${(props) => (props.isDisabled ? "#444444" : "#ff7e5f")};
  }
`;

const DropzoneIcon = styled.div`
  color: #ff7e5f;
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const DropzoneText = styled.p`
  font-size: 1.25rem;
  color: #cccccc;
  margin-bottom: 1rem;
`;

const MediaTypeIcons = styled.div`
  display: flex;
  gap: 1.5rem;
  color: #999999;
  font-size: 2rem;
  margin-bottom: 1.5rem;
`;

const DropzoneSubtext = styled.p`
  font-size: 0.875rem;
  color: #888888;
`;

// Media Preview Section
const MediaPreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MediaCarousel = styled.div`
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #272727;
  min-height: 300px;
`;

const CurrentMediaPreview = styled.div`
  width: 100%;
  height: 400px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const PreviewImage = styled.img`
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
`;

const PreviewVideo = styled.video`
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
`;

const RemoveMediaButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 1.25rem;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${(props) =>
      props.disabled ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.8)"};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const NavButtons = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 10;
`;

const NavButton = styled.button`
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: white;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PaginationIndicator = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 16px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
`;

const FilterSection = styled.div`
  margin-top: 1rem;
`;

const FilterTitle = styled.h3`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #dddddd;
`;

const FilterList = styled.div`
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #333;
  }

  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 4px;
  }
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover,
  &.active {
    opacity: 1;
  }

  &.active::after {
    content: "";
    display: block;
    width: 100%;
    height: 2px;
    background-color: #ff7e5f;
    margin-top: 0.5rem;
  }
`;

const FilterName = styled.span`
  font-size: 0.875rem;
  color: #bbbbbb;
  margin-top: 0.5rem;
`;

// Details Step
const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const InputGroup = styled.div`
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: ${(props) => (props.focused ? "#ff7e5f" : "transparent")};
    transition: background-color 0.3s ease;
  }
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  color: #aaaaaa;
  margin-bottom: 0.5rem;
  display: block;
`;

const CharacterCount = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  font-size: 0.75rem;
  color: ${(props) => (props.warning ? "#ffaa00" : "#888")};
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.75rem 0;
  border: none;
  border-bottom: 1px solid #444444;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  background-color: transparent;
  color: #ffffff;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #666666;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 0;
  border: none;
  border-bottom: 1px solid #444444;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  background-color: transparent;
  color: #ffffff;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #666666;
  }
`;

const TagSuggestions = styled.div`
  margin-top: 0.75rem;
  background-color: #333333;
  border-radius: 8px;
  padding: 1rem;
`;

const TagSuggestionsLabel = styled.div`
  font-size: 0.875rem;
  color: #aaaaaa;
  margin-bottom: 0.75rem;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const TagSuggestion = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: #444444;
  border-radius: 16px;
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
  color: #dddddd;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ff7e5f;
    color: white;
  }

  svg {
    font-size: 0.75rem;
  }
`;

// Preview Section
const PreviewSection = styled.div`
  margin-top: 2rem;
  border-top: 1px solid #444444;
  padding-top: 2rem;
`;

const PreviewTitle = styled.h3`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #dddddd;
`;

const PostPreview = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  margin: 0 auto;
  background-color: #1a1a1a;
`;

const PostPreviewMedia = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PostPreviewImage = styled.img`
  width: 100%;
  height: 100%;
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
`;

const PostPreviewVideo = styled.video`
  width: 100%;
  height: 100%;
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
`;

const PostPreviewPagination = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const PaginationDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? "white" : "rgba(255, 255, 255, 0.5)"};
  transition: background-color 0.3s ease;
`;

const PostPreviewContent = styled.div`
  padding: 1rem;
  background-color: #2a2a2a;
`;

const PostPreviewCaption = styled.p`
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: #dddddd;
`;

const PostPreviewTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PostPreviewTag = styled.span`
  font-size: 0.85rem;
  color: #ff7e5f;
`;

// Navigation Buttons
const NavigationButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 640px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: transparent;
  color: #aaaaaa;
  border: 1px solid #444444;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333333;
  }
`;

const NextButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#ff7e5f" : "#ff6a4b")};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const PublishButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #ff6a4b;
  }

  &:disabled {
    background-color: #444444;
    cursor: not-allowed;
    color: #888888;
  }
`;

const CancelButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background-color: transparent;
  color: #888888;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #dddddd;
    text-decoration: underline;
  }
`;

const CameraButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: #333;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  margin-top: 1rem;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#333" : "#444")};
  }

  svg {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

const CameraControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed #444444;

  > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  label {
    color: #bbbbbb;
    font-size: 0.875rem;
  }
`;

const MediaActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #2e2e2e;
  color: #ffffff;
  border: 1px solid #444;
  border-radius: 999px;
  padding: 0.65rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  min-width: 140px;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#2e2e2e" : "#ff7e5f")};
    color: ${(props) => (props.disabled ? "#ffffff" : "#fff")};
    border-color: ${(props) => (props.disabled ? "#444" : "#ff7e5f")};
  }

  svg {
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    width: auto;
  }
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const AddMoreWrapper = styled.div`
  position: relative;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
`;

const FilterPreviewImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;

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
`;

const RetryButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 5;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#ff7e5f" : "#ff6a4b")};
  }

  &:disabled {
    cursor: not-allowed;
  }

  svg {
    font-size: 1rem;
  }
`;

const ProgressOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const ProgressText = styled.div`
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

export default CreatePostWorkflow;
