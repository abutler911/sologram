import React, { useState, useRef, useCallback, useEffect } from "react";
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
} from "react-icons/fa";
import { COLORS, THEME } from "../../theme"; // Import your theme

// Default placeholder image
const PLACEHOLDER_IMG =
  "https://via.placeholder.com/300x300?text=Image+Not+Available";

// Simple file uploader function
const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_post_upload");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.cloudinary.com/v1_1/ds5rxplmr/auto/upload");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    });

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            mediaUrl: response.secure_url,
            cloudinaryId: response.public_id,
            mediaType: file.type.startsWith("video") ? "video" : "image",
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      } catch (err) {
        reject(new Error("Failed to parse upload response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
};

// Main component
function PostCreator({ initialData = null, isEditing = false }) {
  // Component state
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(
    initialData?.tags ? initialData.tags.join(", ") : ""
  );
  const [activeFilter, setActiveFilter] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = Media, 2 = Details

  const navigate = useNavigate();
  const inputFileRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mountedRef = useRef(true);

  // Available filters
  const filters = [
    { id: "none", name: "None", className: "" },
    { id: "warm", name: "Warm", className: "filter-warm" },
    { id: "cool", name: "Cool", className: "filter-cool" },
    { id: "bw", name: "B&W", className: "filter-grayscale" },
    { id: "vintage", name: "Vintage", className: "filter-vintage" },
  ];

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

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    // Process each file
    const newMedia = [];

    for (const file of acceptedFiles) {
      const id = `media_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const isVideo = file.type.startsWith("video/");
      let objectUrl = "";

      try {
        objectUrl = URL.createObjectURL(file);

        // Add to media immediately with uploading status
        const mediaItem = {
          id,
          file,
          previewUrl: objectUrl,
          type: isVideo ? "video" : "image",
          filter: "none",
          filterClass: "", // Initialize with empty filter class
          uploading: true,
          progress: 0,
          error: false,
        };

        newMedia.push(mediaItem);

        // Start upload in background
        uploadFile(file, (progress) => {
          setMedia((currentMedia) =>
            currentMedia.map((item) =>
              item.id === id ? { ...item, progress } : item
            )
          );
        })
          .then((result) => {
            setMedia((currentMedia) =>
              currentMedia.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      mediaUrl: result.mediaUrl,
                      cloudinaryId: result.cloudinaryId,
                      mediaType: result.mediaType,
                      uploading: false,
                    }
                  : item
              )
            );
            toast.success("Upload complete");
          })
          .catch((error) => {
            console.error("Upload failed:", error);
            setMedia((currentMedia) =>
              currentMedia.map((item) =>
                item.id === id
                  ? { ...item, uploading: false, error: true }
                  : item
              )
            );
            toast.error("Upload failed");
          });
      } catch (error) {
        console.error("Error creating preview:", error);
        toast.error("Could not create preview");
      }
    }

    // Add all new media to state at once
    setMedia((current) => [...current, ...newMedia]);
  }, []);

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
    if (file) {
      const id = `camera_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const isVideo = file.type.startsWith("video/");

      try {
        const objectUrl = URL.createObjectURL(file);

        // Add to media with uploading status
        setMedia((current) => [
          ...current,
          {
            id,
            file,
            previewUrl: objectUrl,
            type: isVideo ? "video" : "image",
            filter: "none",
            filterClass: "",
            uploading: true,
            progress: 0,
            error: false,
          },
        ]);

        // Start upload
        const onProgress = (percent) => {
          if (!mountedRef.current) return;
          setMedia((prev) =>
            prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
          );
        };

        const result = await uploadFile(file, onProgress);

        if (!mountedRef.current) return;

        // Update state with success
        setMedia((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  uploading: false,
                  mediaUrl: result.mediaUrl,
                  cloudinaryId: result.cloudinaryId,
                  mediaType: result.mediaType,
                }
              : p
          )
        );

        toast.success("Upload complete");
      } catch (error) {
        console.error("Camera upload error:", error);

        if (mountedRef.current) {
          setMedia((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, uploading: false, error: true } : p
            )
          );
          toast.error("Upload failed");
        }
      } finally {
        // Reset input so camera can be triggered again
        if (event.target) event.target.value = "";
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

  // Submit the post
  const handleSubmit = async () => {
    if (media.length === 0) {
      toast.error("Please add at least one photo or video");
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

    setIsSubmitting(true);

    try {
      // Prepare the media items for submission
      const mediaItems = media
        .filter((item) => !item.error && !item.isExisting)
        .map((item) => ({
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.type || item.mediaType,
          filter: item.filter || "none", // Ensure filter is always set
        }));

      // Create the payload
      const payload = {
        caption,
        content, // Add content field from state
        tags: tags, // Send as string to let server handle splitting
        media: mediaItems,
      };

      let response;

      if (isEditing) {
        // Add existing media IDs to keep
        const existingMediaIds = media
          .filter((item) => item.isExisting)
          .map((item) => item.id)
          .join(",");

        if (existingMediaIds) {
          payload.keepMedia = existingMediaIds;
        }

        // Update existing post
        response = await axios.put(`/api/posts/${initialData._id}`, payload);
        toast.success("Post updated successfully!");
      } else {
        // Create new post
        response = await axios.post("/api/posts", payload);
        toast.success("Post created successfully!");
      }

      navigate(`/post/${response.data.data._id}`);
    } catch (error) {
      console.error("Error creating/updating post:", error);
      toast.error(
        `Failed to ${isEditing ? "update" : "create"} post. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render
  return (
    <Container>
      <Header>
        <h1>{isEditing ? "Edit Post" : "Create Post"}</h1>
        <StepIndicator>
          <Step active={step === 1} onClick={() => step !== 1 && setStep(1)}>
            1. Add Media
          </Step>
          <StepConnector />
          <Step
            active={step === 2}
            disabled={media.length === 0}
            onClick={() => media.length > 0 && step !== 2 && setStep(2)}
          >
            2. Add Details
          </Step>
        </StepIndicator>
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
              <p>Drag photos or videos here, or click to browse</p>
              <ButtonGroup>
                <CameraButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  <FaCamera />
                  <span>Take Photo</span>
                </CameraButton>
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

                    // Clean up
                    setTimeout(() => {
                      document.body.removeChild(galleryInput);
                    }, 1000);
                  }}
                >
                  <FaImage />
                  <span>Choose from Gallery</span>
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
            </DropArea>
          ) : (
            <MediaPreview>
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
                    onError={(e) => {
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

              <FilterOptions>
                <h3>Filters</h3>
                <FiltersGrid>
                  {filters.map((filter) => (
                    <FilterItem
                      key={filter.id}
                      active={media[currentIndex].filter === filter.id}
                      onClick={() => applyFilter(filter.id)}
                    >
                      <FilterPreview
                        src={
                          media[currentIndex].mediaUrl ||
                          media[currentIndex].previewUrl
                        }
                        className={filter.className}
                        alt={filter.name}
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMG;
                        }}
                      />
                      <span>{filter.name}</span>
                    </FilterItem>
                  ))}
                </FiltersGrid>
              </FilterOptions>

              <AddMoreSection>
                <AddMoreButton
                  as="div"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Create a file input that doesn't use the capture attribute
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

                    // Clean up
                    setTimeout(() => {
                      document.body.removeChild(galleryInput);
                    }, 1000);
                  }}
                >
                  <FaImage /> Add from Gallery
                </AddMoreButton>
                <AddMoreButton
                  as="div"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <FaCamera /> Take Photo
                </AddMoreButton>
              </AddMoreSection>
            </MediaPreview>
          )}

          <ButtonRow>
            <CancelButton onClick={() => navigate("/")}>Cancel</CancelButton>
            {media.length > 0 && (
              <NextButton
                onClick={() => setStep(2)}
                disabled={media.some((item) => item.uploading)}
              >
                Next <FaArrowRight />
              </NextButton>
            )}
          </ButtonRow>
        </MediaSection>
      ) : (
        <DetailsSection>
          <FormGroup>
            <Label htmlFor="caption-input">Caption</Label>
            <Input
              id="caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              required
            />
            <CharCount>{caption.length}/100</CharCount>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="content-input">Content (optional)</Label>
            <Textarea
              id="content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add more details about your post..."
              rows={4}
            />
            <CharCount>{content.length}/2000</CharCount>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="tags-input">Tags (comma separated)</Label>
            <Input
              id="tags-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="travel, nature, food..."
            />
          </FormGroup>

          <MediaPreview small>
            <h3>Preview</h3>
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
                  onError={(e) => {
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
                    e.target.src = PLACEHOLDER_IMG;
                  }}
                />
              )}

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

            <PostPreviewContent>
              <PostPreviewCaption>
                {caption || "Your caption will appear here"}
              </PostPreviewCaption>

              {content && (
                <PostPreviewContentText>
                  {content || "Your additional content will appear here"}
                </PostPreviewContentText>
              )}

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
          </MediaPreview>

          <ButtonRow>
            <BackButton onClick={() => setStep(1)}>
              <FaArrowLeft /> Back
            </BackButton>
            <PublishButton
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !caption.trim() ||
                media.length === 0 ||
                media.some((item) => item.uploading)
              }
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Publishing..."
                : isEditing
                ? "Update"
                : "Publish"}
            </PublishButton>
          </ButtonRow>
        </DetailsSection>
      )}
    </Container>
  );
}

// Styled components - Now updated with Modern Twilight theme
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 2px 10px ${COLORS.shadow};
  color: ${COLORS.textPrimary};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;

  h1 {
    margin-bottom: 20px;
    font-size: 24px;
    color: ${COLORS.textPrimary};
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Step = styled.div`
  padding: 8px 16px;
  background-color: ${(props) =>
    props.active ? COLORS.primaryPurple : COLORS.elevatedBackground};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  color: ${COLORS.textPrimary};
`;

const StepConnector = styled.div`
  width: 60px;
  height: 2px;
  background-color: ${COLORS.divider};
  margin: 0 10px;
`;

const MediaSection = styled.div`
  margin-top: 20px;
`;

const DropArea = styled.div`
  border: 2px dashed ${COLORS.border};
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${COLORS.primaryPurple};
    background-color: rgba(94, 53, 177, 0.05);
  }

  p {
    margin: 15px 0;
    color: ${COLORS.textSecondary};
  }
`;

const UploadIcon = styled.div`
  display: flex;
  gap: 20px;
  font-size: 40px;
  color: ${COLORS.textTertiary};

  svg {
    transition: color 0.2s;
  }

  ${DropArea}:hover & svg {
    color: ${COLORS.primaryPurple};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 500px;
`;

const CameraButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryGreen};
  }

  &:hover {
    border-color: ${COLORS.primaryGreen};
    box-shadow: 0 4px 12px ${COLORS.primaryGreen}40;
  }
`;

const GalleryButton = styled(MediaButton)`
  svg {
    color: ${COLORS.primaryBlue};
  }

  &:hover {
    border-color: ${COLORS.primaryBlue};
    box-shadow: 0 4px 12px ${COLORS.primaryBlue}40;
  }
`;

const MediaPreview = styled.div`
  margin-bottom: ${(props) => (props.small ? "20px" : "30px")};

  h3 {
    color: ${COLORS.textSecondary};
    margin-bottom: 10px;
    font-size: 16px;
  }
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  height: 350px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  height: 8px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const UploadProgressInner = styled.div`
  height: 100%;
  width: ${(props) => props.width}%;
  background-color: ${COLORS.primaryPurple};
  transition: width 0.3s;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(244, 67, 54, 0.7); /* Using error color with opacity */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;

  button {
    background: ${COLORS.elevatedBackground};
    color: ${COLORS.textPrimary};
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  z-index: 3;

  &:hover {
    background: ${COLORS.error};
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${COLORS.primaryPurple};
  }
`;

const MediaButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: ${COLORS.cardBackground};
  color: ${COLORS.textPrimary};
  border: 2px solid ${COLORS.border};
  border-radius: 8px;
  padding: 15px 25px;
  width: 220px;
  height: 60px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background: linear-gradient(
      to bottom,
      ${COLORS.primaryPurple}10,
      transparent
    );
    transition: height 0.25s ease;
    z-index: 0;
    opacity: 0.5;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: ${COLORS.primaryPurple};
    box-shadow: 0 4px 12px ${COLORS.primaryPurple}40;

    &::before {
      height: 100%;
    }

    svg {
      transform: scale(1.2);
    }
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px ${COLORS.shadow};
  }

  svg {
    font-size: 22px;
    transition: transform 0.2s ease;
    z-index: 1;
  }

  span {
    z-index: 1;
  }
`;

const MediaCounter = styled.div`
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 12px;
`;

const FilterOptions = styled.div`
  margin-top: 20px;

  h3 {
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: 600;
    color: ${COLORS.textSecondary};
  }
`;

const FiltersGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 15px;
  padding-bottom: 10px;

  &::-webkit-scrollbar {
    height: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${COLORS.divider};
    border-radius: 5px;
  }
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: ${(props) => (props.active ? 1 : 0.7)};

  span {
    margin-top: 8px;
    font-size: 12px;
    color: ${(props) =>
      props.active ? COLORS.primaryPurple : COLORS.textTertiary};
  }

  &:hover {
    opacity: 1;
  }
`;

const FilterPreview = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 4px;
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

const AddMoreSection = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
  flex-wrap: wrap;
  justify-content: center;
`;

const AddMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: ${COLORS.cardBackground};
  color: ${COLORS.textPrimary};
  border: 2px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px 20px;
  min-width: 180px;
  height: 48px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px ${COLORS.shadow};

  &:hover {
    transform: translateY(-2px);
    border-color: ${COLORS.accentPurple};
    box-shadow: 0 4px 12px ${COLORS.accentPurple}40;

    svg {
      transform: scale(1.2);
    }
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px ${COLORS.shadow};
  }

  svg {
    font-size: 18px;
    color: ${COLORS.accentPurple};
    transition: transform 0.2s ease;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  background: transparent;
  color: ${COLORS.textTertiary};
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

const NextButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${THEME.button.primary.background};
  color: ${THEME.button.primary.text};
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    background-color: ${COLORS.elevatedBackground};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${THEME.button.primary.hoverBackground};
  }
`;

const DetailsSection = styled.div`
  margin-top: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 16px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryPurple};
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
  color: ${COLORS.textTertiary};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${THEME.button.secondary.background};
  color: ${THEME.button.secondary.text};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${THEME.button.secondary.hoverBackground};
    color: ${COLORS.textPrimary};
  }
`;

const PublishButton = styled.button`
  background-color: ${THEME.button.action.background};
  color: ${THEME.button.action.text};
  border: none;
  border-radius: 4px;
  padding: 10px 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    background-color: ${COLORS.elevatedBackground};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${THEME.button.action.hoverBackground};
  }
`;

const PostPreviewContent = styled.div`
  padding: 1rem;
  background-color: ${COLORS.elevatedBackground};
`;

const PostPreviewCaption = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: ${COLORS.textPrimary};
`;

const PostPreviewContentText = styled.p`
  font-size: 0.85rem;
  color: ${COLORS.textSecondary};
  margin: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const PostPreviewTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

const PostPreviewTag = styled.span`
  color: ${COLORS.primaryBlue};
  font-size: 0.75rem;
  margin-right: 5px;
`;

export default PostCreator;
