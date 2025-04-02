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

// Define filters array
const filters = [
  { name: "Original", class: "" },
  { name: "Warm", class: "filter-warm" },
  { name: "Cool", class: "filter-cool" },
  { name: "Grayscale", class: "filter-grayscale" },
  { name: "Vintage", class: "filter-vintage" },
];

// Define tag suggestions
const tagSuggestions = [
  "travel",
  "photography",
  "food",
  "nature",
  "fashion",
  "art",
  "music",
  "fitness",
  "technology",
  "design",
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

  // Add missing focus state hooks
  const [captionFocused, setCaptionFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const [captureMode, setCaptureMode] = useState("environment");

  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const mapped = initialData.media.map((media) => ({
        id: media._id,
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType,
        isExisting: true,
        filter: media.filter || "",
      }));
      setExistingMedia(mapped);
    }
  }, [isEditing, initialData]);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles = []) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          toast.error(`${file.name}: ${errors[0]?.message || "Upload error"}`);
        });
      }

      const totalFiles =
        mediaPreviews.length + existingMedia.length + acceptedFiles.length;
      if (totalFiles > 25) {
        toast.error("Maximum 25 media files allowed per post");
        return;
      }

      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 25MB limit`);
          return false;
        }
        return true;
      });

      const newPreviews = validFiles.map((file) => {
        const isVideo = file.type.startsWith("video/");
        return {
          id: Date.now() + Math.random().toString(),
          file,
          preview: URL.createObjectURL(file),
          type: isVideo ? "video" : "image",
          filter: "",
        };
      });

      setMediaPreviews((prev) => [...prev, ...newPreviews]);
    },
    [mediaPreviews.length, existingMedia.length]
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
    if (!caption.trim()) {
      toast.error("Please add a caption for your post");
      return;
    }

    if (mediaPreviews.length === 0 && existingMedia.length === 0) {
      toast.error("Please add at least one image or video to your post");
      return;
    }

    setLoading(true);

    try {
      // Upload all new media files to Cloudinary first
      const uploadedMedia = [];

      for (let i = 0; i < mediaPreviews.length; i++) {
        const preview = mediaPreviews[i];
        const uploaded = await uploadToCloudinary(preview.file);
        uploaded.filter = preview.filter || "";
        uploadedMedia.push(uploaded);
      }

      // Construct payload
      const payload = {
        caption,
        content,
        tags,
        media: [...existingMedia, ...uploadedMedia], // merge both
      };

      let response;
      if (isEditing) {
        payload.keepMedia = existingMedia.map((m) => m.id).join(",");
        response = await axios.put(`/api/posts/${initialData._id}`, payload);
        toast.success("Post updated successfully!");
      } else {
        response = await axios.post("/api/posts", payload);
        toast.success("Post created successfully!");
      }

      navigate(`/post/${response.data.data._id}`);
    } catch (err) {
      console.error("Post submit failed:", err);
      const message =
        err.response?.data?.message ||
        (isEditing ? "Update failed" : "Create failed");
      toast.error(message);
    } finally {
      setLoading(false);
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
              <DropzoneContainer
                {...getRootProps()}
                isDragActive={isDragActive}
              >
                <input
                  {...getInputProps({
                    capture: "environment",
                    accept: "image/*,video/*",
                  })}
                />
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
            ) : (
              <MediaPreviewSection>
                <MediaCarousel>
                  <CurrentMediaPreview>
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
                  <UseCameraButton>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label htmlFor="camera-select">Camera:</label>
                      <CameraSelect
                        id="camera-select"
                        value={captureMode}
                        onChange={(e) => setCaptureMode(e.target.value)}
                      >
                        <option value="environment">Rear</option>
                        <option value="user">Selfie</option>
                      </CameraSelect>
                    </div>

                    <label>
                      <FaCamera />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        capture={captureMode}
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
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
                        }}
                      />
                    </label>
                  </UseCameraButton>
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
                        <FilterPreview className={filter.class} />
                        <FilterName>{filter.name}</FilterName>
                      </FilterItem>
                    ))}
                  </FilterList>
                </FilterSection>

                <AddMoreMediaButton {...getRootProps()}>
                  <input {...getInputProps()} />
                  <FaImage />
                  <span>Add More</span>
                </AddMoreMediaButton>
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

const FilterPreview = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-color: #333333;
  background-image: url("https://via.placeholder.com/60");
  margin-bottom: 0.5rem;

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

const FilterName = styled.span`
  font-size: 0.875rem;
  color: #bbbbbb;
`;

const AddMoreMediaButton = styled.button`
  align-self: center;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #333333;
  color: #cccccc;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    background-color: #444444;
    color: #ffffff;
  }
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

const UseCameraButton = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: #333;
    color: #fff;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: #444;
    }

    svg {
      font-size: 1.25rem;
    }
  }
`;

const CameraSelect = styled.select`
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
`;

export default CreatePostWorkflow;
