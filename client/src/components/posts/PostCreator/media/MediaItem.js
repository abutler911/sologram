// src/components/posts/PostCreator/media/MediaItem.jsx
import React, { useEffect, useState } from "react";
import { FaGripVertical, FaFilter, FaTimes } from "react-icons/fa";
import {
  MediaItemContainer,
  DragHandle,
  MediaContent,
  StoryStyleImage,
  StoryStyleVideo,
  UploadOverlay,
  UploadProgress,
  UploadProgressInner,
  UploadText,
  ErrorOverlay,
  ErrorText,
  RetryButton,
  MediaActions,
  ActionButton,
  FilterBadge,
  DragIndicator,
} from "../../PostCreator.styles";
import { FILTERS } from "../../../lib/media";
import { getSafeImageSrc } from "../utils/preview";

function Item({
  mediaItem,
  index,
  onRemove,
  onFilter,
  isDragging,
  ...dragProps
}) {
  const [imageSrc, setImageSrc] = useState(getSafeImageSrc(mediaItem));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(
    !mediaItem.mediaUrl && !mediaItem.previewUrl
  );

  useEffect(() => {
    const newSrc = getSafeImageSrc(mediaItem);
    setImageSrc(newSrc);
    setHasError(false);
    setIsLoading(!mediaItem.mediaUrl && !mediaItem.previewUrl);
  }, [mediaItem.mediaUrl, mediaItem.previewUrl]);

  const handleImageError = (e) => {
    e.target.style.display = "none";
    e.target.parentNode?.classList.add("image-fallback");
    setHasError(true);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // processing fallback
  if (
    (!imageSrc || imageSrc.startsWith("data:image/svg+xml")) &&
    !mediaItem.mediaUrl
  ) {
    return (
      <MediaItemContainer isDragging={isDragging} {...dragProps}>
        <MediaContent className="processing-state">
          <UploadText>
            {mediaItem.uploading
              ? `Uploading... ${mediaItem.progress || 0}%`
              : "Processing..."}
          </UploadText>
          {mediaItem.uploading && (
            <UploadProgress>
              <UploadProgressInner width={mediaItem.progress || 0} />
            </UploadProgress>
          )}
        </MediaContent>
        <MediaActions className="media-actions">
          <ActionButton
            onClick={() => onRemove(index)}
            className="remove"
            title="Remove media"
          >
            <FaTimes />
          </ActionButton>
        </MediaActions>
      </MediaItemContainer>
    );
  }

  return (
    <MediaItemContainer isDragging={isDragging} {...dragProps}>
      <DragHandle className="drag-handle">
        <FaGripVertical />
      </DragHandle>

      <MediaContent>
        {mediaItem.mediaType === "video" ? (
          <StoryStyleVideo
            src={imageSrc}
            className={mediaItem.filterClass || ""}
            onError={handleImageError}
            onLoadedData={handleImageLoad}
            playsInline
            muted
            preload="metadata"
          />
        ) : (
          <StoryStyleImage
            src={imageSrc}
            className={mediaItem.filterClass || ""}
            alt="Media preview"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        )}

        {mediaItem.uploading && (
          <UploadOverlay>
            <UploadProgress>
              <UploadProgressInner width={mediaItem.progress || 0} />
            </UploadProgress>
            <UploadText>Uploading... {mediaItem.progress || 0}%</UploadText>
          </UploadOverlay>
        )}

        {mediaItem.error && (
          <ErrorOverlay>
            <ErrorText>Upload failed</ErrorText>
            <RetryButton onClick={() => onRemove(index)}>Remove</RetryButton>
          </ErrorOverlay>
        )}
      </MediaContent>

      <MediaActions className="media-actions">
        <ActionButton
          onClick={() => onFilter(mediaItem, index)}
          disabled={mediaItem.uploading || mediaItem.error || hasError}
          title="Apply filter"
        >
          <FaFilter />
        </ActionButton>
        <ActionButton
          onClick={() => onRemove(index)}
          className="remove"
          title="Remove media"
        >
          <FaTimes />
        </ActionButton>
      </MediaActions>

      {mediaItem.filter && mediaItem.filter !== "none" && (
        <FilterBadge>
          {FILTERS.find((f) => f.id === mediaItem.filter)?.name}
        </FilterBadge>
      )}

      <DragIndicator className="drag-indicator">{index + 1}</DragIndicator>
    </MediaItemContainer>
  );
}

export default React.memo(Item);
