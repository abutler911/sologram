import React, { useState, useCallback, useEffect } from "react";
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
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import pandaImg from "../../assets/panda.jpg";

const filters = [
  { name: "None", class: "" },
  { name: "Warm", class: "filter-warm" },
  { name: "Cool", class: "filter-cool" },
  { name: "Grayscale", class: "filter-grayscale" },
  { name: "Vintage", class: "filter-vintage" },
];

const CreatePostWorkflow = ({ initialData = null, isEditing = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [loading, setLoading] = useState(false);

  const [captionFocused, setCaptionFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const [tagSuggestions] = useState(["travel", "fitness", "fun", "adventure"]);

  const navigate = useNavigate();

  const hasPendingUploads = mediaPreviews.some(
    (media) => media.uploading || !media.mediaUrl
  );

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

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles = []) => {
      // Show errors for rejected
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          toast.error(`${file.name}: ${errors[0]?.message || "Upload error"}`);
        });
      }

      const totalFiles =
        mediaPreviews.length + existingMedia.length + acceptedFiles.length;
      if (totalFiles > 25) {
        toast.error("Maximum 25 media files allowed");
        return;
      }

      for (const file of acceptedFiles) {
        const id = Date.now() + Math.random().toString();
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

        try {
          const onProgress = (percent) => {
            setMediaPreviews((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
            );
          };

          const uploaded = await uploadToCloudinary(file, onProgress);

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
        } catch (err) {
          toast.error(`Upload failed: ${file.name}`);
          setMediaPreviews((prev) =>
            prev.map((p) => (p.id === id ? { ...p, error: true } : p))
          );
        }
      }
    },
    [mediaPreviews, existingMedia]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxSize: 25 * 1024 * 1024,
    multiple: true,
  });

  // Get the current media being displayed
  const getCurrentMedia = () => {
    const allMedia = [...existingMedia, ...mediaPreviews];

    return allMedia[activePreviewIndex] || null;
  };

  // Remove a preview file
  const removePreviewFile = (id) => {
    const previewIndex = mediaPreviews.findIndex((p) => p.id === id);
    if (previewIndex !== -1) {
      // Remove the preview
      setMediaPreviews((prev) => prev.filter((p) => p.id !== id));

      // Adjust active preview index if needed
      if (activePreviewIndex >= mediaPreviews.length - 1) {
        setActivePreviewIndex(Math.max(0, mediaPreviews.length - 2));
      }
    }
  };

  // Remove an existing media
  const removeExistingMedia = (id) => {
    setExistingMedia((prev) => prev.filter((m) => m.id !== id));

    // Adjust active preview index if needed
    if (activePreviewIndex >= existingMedia.length - 1) {
      setActivePreviewIndex(Math.max(0, existingMedia.length - 2));
    }
  };

  // Navigate to next media preview
  const nextPreview = () => {
    const totalMedia = mediaPreviews.length + existingMedia.length;
    if (activePreviewIndex < totalMedia - 1) {
      setActivePreviewIndex((prev) => prev + 1);
    }
  };

  // Navigate to previous media preview
  const prevPreview = () => {
    if (activePreviewIndex > 0) {
      setActivePreviewIndex((prev) => prev - 1);
    }
  };

  // Apply filter to current media
  const applyFilter = (filterIndex) => {
    setSelectedFilter(filterIndex);

    // Apply filter to the active media
    const allMedia = [...existingMedia, ...mediaPreviews];
    if (activePreviewIndex < allMedia.length) {
      const newMediaPreviews = [...mediaPreviews];
      const targetIndex = activePreviewIndex - existingMedia.length;

      if (targetIndex >= 0 && targetIndex < newMediaPreviews.length) {
        newMediaPreviews[targetIndex].filter = filters[filterIndex].class;
        setMediaPreviews(newMediaPreviews);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!caption.trim()) return toast.error("Please add a caption");
    if (
      mediaPreviews.filter((m) => m.mediaUrl && !m.error).length === 0 &&
      existingMedia.length === 0
    ) {
      return toast.error("Add at least one uploaded image or video");
    }

    setLoading(true);

    try {
      const existingCloudinaryIds = existingMedia.map((m) => m.cloudinaryId);

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

      const formattedExistingMedia = existingMedia.map((m) => ({
        mediaUrl: m.mediaUrl,
        cloudinaryId: m.cloudinaryId,
        mediaType: m.mediaType,
        filter: m.filter || "",
      }));

      const payload = {
        caption,
        content,
        tags,
        media: uploadedMedia,
        keepMedia: existingMedia.map((m) => m.id).join(","),
      };

      let response;
      if (isEditing) {
        payload.keepMedia = existingMedia.map((m) => m.id).join(",");
        response = await axios.put(`/api/posts/${initialData._id}`, payload);
        toast.success("Post updated!");
      } else {
        response = await axios.post("/api/posts", payload);
        toast.success("Post created!");
      }

      navigate(`/post/${response.data.data._id}`);
    } catch (err) {
      console.error("Post failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const retryUpload = async (filePreview) => {
    try {
      setMediaPreviews((prev) =>
        prev.map((item) =>
          item.id === filePreview.id
            ? { ...item, error: false, progress: 0 }
            : item
        )
      );

      const onProgress = (percent) => {
        setMediaPreviews((prev) =>
          prev.map((item) =>
            item.id === filePreview.id ? { ...item, progress: percent } : item
          )
        );
      };

      const uploaded = await uploadToCloudinary(filePreview.file, onProgress);
      uploaded.filter = filePreview.filter || "";

      // Replace the errored one with the successfully uploaded
      setMediaPreviews((prev) =>
        prev.filter((item) => item.id !== filePreview.id)
      );
      setExistingMedia((prev) => [...prev, uploaded]);
      toast.success("Upload succeeded!");
    } catch (err) {
      toast.error("Retry failed. Try again later.");
    }
  };

  // Detect if we're on media step with no media
  const isMediaStepEmpty =
    currentStep === 1 &&
    mediaPreviews.length === 0 &&
    existingMedia.length === 0;

  // Add a hashtag from suggestions
  const addTag = (tag) => {
    const currentTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setTags(newTags.join(", "));
    }
  };
  const handleCameraFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video/");
      const preview = {
        id: Date.now() + Math.random().toString(),
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
        filter: "",
      };
      setMediaPreviews((prev) => [...prev, preview]);
    }

    // ✅ Reset input so camera can be triggered again
    e.target.value = null;
  };

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
                >
                  <input {...getInputProps({ capture: "environment" })} />
                  <DropzoneIcon>
                    <FaCloudUploadAlt />
                  </DropzoneIcon>
                  <DropzoneText>
                    {isDragActive
                      ? "Drop your files here"
                      : "Drag photos and videos here, or click to browse"}
                  </DropzoneText>
                  <MediaTypeIcons>
                    <FaImage />
                    <FaVideo />
                  </MediaTypeIcons>
                  <DropzoneSubtext>
                    You can add up to 25 photos and videos. Max file size: 25MB
                  </DropzoneSubtext>
                </DropzoneContainer>

                {/* Camera trigger outside the Dropzone */}
                <CameraControlsContainer>
                  <label htmlFor="camera-input">
                    <CameraButton as="div">
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
                      >
                        Retry Upload
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
                      />
                    ) : (
                      <PreviewImage
                        src={
                          getCurrentMedia()?.mediaUrl ||
                          getCurrentMedia()?.preview
                        }
                        className={getCurrentMedia()?.filter || ""}
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
                    >
                      <FaTimes />
                    </RemoveMediaButton>
                  </CurrentMediaPreview>

                  {existingMedia.length + mediaPreviews.length > 1 && (
                    <>
                      <NavButtons>
                        <NavButton
                          onClick={prevPreview}
                          disabled={activePreviewIndex === 0}
                        >
                          <FaArrowLeft />
                        </NavButton>
                        <NavButton
                          onClick={nextPreview}
                          disabled={
                            activePreviewIndex ===
                            existingMedia.length + mediaPreviews.length - 1
                          }
                        >
                          <FaArrowRight />
                        </NavButton>
                      </NavButtons>

                      <PaginationIndicator>
                        {activePreviewIndex + 1} /{" "}
                        {existingMedia.length + mediaPreviews.length}
                      </PaginationIndicator>
                    </>
                  )}
                </MediaCarousel>

                <FilterSection>
                  <FilterTitle>Filters</FilterTitle>
                  <FilterList>
                    {filters.map((filter, index) => (
                      <FilterItem
                        key={filter.name}
                        onClick={() => applyFilter(index)}
                        className={selectedFilter === index ? "active" : ""}
                      >
                        <FilterPreviewImage
                          src={
                            getCurrentMedia()?.preview ||
                            getCurrentMedia()?.mediaUrl ||
                            pandaImg
                          }
                          alt={filter.name}
                          className={filter.class}
                        />

                        <FilterName>{filter.name}</FilterName>
                      </FilterItem>
                    ))}
                  </FilterList>
                </FilterSection>

                <ActionButtonsRow>
                  <AddMoreWrapper {...getRootProps()}>
                    <MediaActionButton as="div">
                      <FaImage />
                      <span>Add More</span>
                    </MediaActionButton>
                    <input {...getInputProps()} />
                  </AddMoreWrapper>

                  <label htmlFor="camera-input">
                    <MediaActionButton as="div">
                      <FaCamera />
                      <span>Add Photo</span>
                    </MediaActionButton>
                  </label>

                  <input
                    id="camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handleCameraFile}
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
                <InputLabel>Caption</InputLabel>
                <TextInput
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  onFocus={() => setCaptionFocused(true)}
                  onBlur={() => setCaptionFocused(false)}
                  required
                />
              </InputGroup>

              <InputGroup focused={contentFocused}>
                <InputLabel>Content (optional)</InputLabel>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add more details about your post..."
                  rows={4}
                  onFocus={() => setContentFocused(true)}
                  onBlur={() => setContentFocused(false)}
                />
              </InputGroup>

              <InputGroup focused={tagInputFocused}>
                <InputLabel>Tags (optional)</InputLabel>
                <TextInput
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
                        <TagSuggestion key={tag} onClick={() => addTag(tag)}>
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
                      />
                    )}

                    {existingMedia.length + mediaPreviews.length > 1 && (
                      <PostPreviewPagination>
                        {[
                          ...Array(existingMedia.length + mediaPreviews.length),
                        ].map((_, i) => (
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
      <StepIndicator>
        <StepCircle
          active={currentStep === 1}
          completed={currentStep > 1}
          onClick={() => setCurrentStep(1)}
        >
          {currentStep > 1 ? <FaCheck /> : 1}
        </StepCircle>
        <StepConnector completed={currentStep > 1} />
        <StepCircle
          active={currentStep === 2}
          completed={currentStep > 2}
          onClick={() => !isMediaStepEmpty && setCurrentStep(2)}
        >
          {currentStep > 2 ? <FaCheck /> : 2}
        </StepCircle>
      </StepIndicator>

      {renderStepContent()}

      <NavigationButtons>
        {currentStep > 1 && (
          <BackButton onClick={() => setCurrentStep((prev) => prev - 1)}>
            <FaArrowLeft />
            <span>Back</span>
          </BackButton>
        )}

        {currentStep === 1 && !isMediaStepEmpty && (
          <NextButton onClick={() => setCurrentStep(2)}>
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

      <CancelButton onClick={() => navigate(-1)}>Cancel</CancelButton>
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
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: #ff7e5f;
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

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
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
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
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

  &:hover {
    background-color: #ff6a4b;
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
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #444;
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
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;

  &:hover {
    background-color: #ff7e5f;
    color: #fff;
    border-color: #ff7e5f;
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
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #ff6a4b;
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
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const ProgressText = styled.div`
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
`;

export default CreatePostWorkflow;
