import React, { useEffect, useState, memo } from 'react';
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
} from '../../PostCreator.styles';
import { FaFilter, FaTimes, FaGripVertical } from 'react-icons/fa';
import { FILTERS } from '../../../../lib/media';

const getSafeSrc = (item) => item?.mediaUrl || item?.previewUrl || '';

// Memoized — only re-renders when its specific props change, not when
// sibling items update. Combined with the separated progress state in
// useUploadManager, this means a progress tick on item A won't
// re-render items B, C, D.
const MediaItem = memo(function MediaItem({
  mediaItem,
  index,
  progress, // number (0-100) | null — from uploadProgress[item.id]
  onRemove, // () => void — closure already binds the ID
  onFilter, // () => void — closure already binds the item
  isDragging,
  ...dragProps
}) {
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

  const handleImageError = () => setHasError(true);
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const pct = progress ?? 0;

  // ── No-preview state (file selected but blob URL not ready yet) ────────
  if (!imageSrc && !mediaItem.mediaUrl) {
    return (
      <MediaItemContainer isDragging={isDragging} {...dragProps}>
        <MediaContent className='processing-state'>
          <ProcessingOverlay>
            <ProcessingText>
              {mediaItem.uploading ? `Uploading... ${pct}%` : 'Processing...'}
            </ProcessingText>
            {mediaItem.uploading && (
              <UploadProgress>
                <UploadProgressInner width={pct} />
              </UploadProgress>
            )}
          </ProcessingOverlay>
        </MediaContent>
        <MediaActions className='media-actions'>
          <ActionButton
            onClick={onRemove}
            className='remove'
            title='Remove media'
          >
            <FaTimes />
          </ActionButton>
        </MediaActions>
      </MediaItemContainer>
    );
  }

  // ── Normal state ───────────────────────────────────────────────────────
  return (
    <MediaItemContainer isDragging={isDragging} {...dragProps}>
      <DragHandle className='drag-handle'>
        <FaGripVertical />
      </DragHandle>

      <MediaContent>
        {mediaItem.mediaType === 'video' ? (
          <StoryStyleVideo
            src={imageSrc}
            className={mediaItem.filterClass || ''}
            onError={handleImageError}
            onLoadedData={handleImageLoad}
            playsInline
            muted
            preload='metadata'
          />
        ) : (
          <StoryStyleImage
            src={imageSrc}
            className={mediaItem.filterClass || ''}
            alt='Media preview'
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading='lazy'
          />
        )}

        {mediaItem.uploading && (
          <UploadOverlay>
            <UploadProgress>
              <UploadProgressInner width={pct} />
            </UploadProgress>
            <UploadText>Uploading... {pct}%</UploadText>
          </UploadOverlay>
        )}

        {mediaItem.error && (
          <ErrorOverlay>
            <ErrorText>Upload failed</ErrorText>
            <RetryButton onClick={onRemove}>Remove</RetryButton>
          </ErrorOverlay>
        )}
      </MediaContent>

      <MediaActions className='media-actions'>
        <ActionButton
          onClick={onFilter}
          disabled={mediaItem.uploading || mediaItem.error || hasError}
          title='Apply filter'
        >
          <FaFilter />
        </ActionButton>
        <ActionButton
          onClick={onRemove}
          className='remove'
          title='Remove media'
        >
          <FaTimes />
        </ActionButton>
      </MediaActions>

      {mediaItem.filter && mediaItem.filter !== 'none' && (
        <FilterBadge>
          {FILTERS.find((f) => f.id === mediaItem.filter)?.name}
        </FilterBadge>
      )}

      <DragIndicator className='drag-indicator'>{index + 1}</DragIndicator>
    </MediaItemContainer>
  );
});

export default MediaItem;
