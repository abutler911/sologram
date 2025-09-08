import React, { useEffect, useState } from "react";
import {
  MediaItemContainer,
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
  DragHandle,
  DragIndicator,
  ProcessingOverlay,
  ProcessingText,
} from "../../PostCreator.styles";
import { FaFilter, FaTimes, FaGripVertical } from "react-icons/fa";
import { FILTERS } from "../../../lib/media";

const getSafeSrc = (item) => item?.mediaUrl || item?.previewUrl || "";

const MediaItem = ({
  mediaItem,
  index,
  onRemove,
  onFilter,
  onReorder,
  isDragging,
  ...dragProps
}) => {
  const [imageSrc, setImageSrc] = useState(getSafeSrc(mediaItem));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(
    !mediaItem.mediaUrl && !mediaItem.previewUrl
  );

  useEffect(() => {
    const newSrc = getSafeSrc(mediaItem);
    setImageSrc(newSrc);
    setHasError(false);
    setIsLoading(!mediaItem.mediaUrl && !mediaItem.previewUrl);
  }, [mediaItem.mediaUrl, mediaItem.previewUrl]);

  const handleImageError = () => {
    setHasError(true);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (!imageSrc && !mediaItem.mediaUrl) {
    return (
      <MediaItemContainer isDragging={isDragging} {...dragProps}>
        <MediaContent className="processing-state">
          <ProcessingOverlay>
            <ProcessingText>
              {mediaItem.uploading
                ? `Uploading... ${mediaItem.progress || 0}%`
                : "Processing..."}
            </ProcessingText>
            {mediaItem.uploading && (
              <UploadProgress>
                <UploadProgressInner width={mediaItem.progress || 0} />
              </UploadProgress>
            )}
          </ProcessingOverlay>
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
};

export default MediaItem;
