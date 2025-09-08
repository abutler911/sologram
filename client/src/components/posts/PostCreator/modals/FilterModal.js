import React, { useEffect, useState } from "react";
import {
  ModalOverlay,
  FilterModalContent,
  ModalHeader,
  CloseButton,
  FilterPreviewSection,
  MainPreview,
  FiltersGrid,
  FilterOption,
  FilterThumbnail,
  FilterName,
  FilterActionBar,
  SecondaryButton,
  ApplyButton,
} from "../PostCreator.styles";
import { FaTimes, FaCheck } from "react-icons/fa";
// Adjust the path below if your folder layout differs:
import { FILTERS } from "../../../../lib/media";

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23999999'%3EImage Not Available%3C/text%3E%3C/svg%3E";

const getSafeImageSrc = (m) => m?.mediaUrl || m?.previewUrl || PLACEHOLDER_IMG;

export default function FilterModal({
  isOpen,
  onClose,
  mediaItem,
  onApplyFilter,
}) {
  const [selectedFilter, setSelectedFilter] = useState(
    mediaItem?.filter || "none"
  );

  useEffect(() => {
    if (mediaItem) setSelectedFilter(mediaItem.filter || "none");
  }, [mediaItem]);

  if (!isOpen || !mediaItem) return null;

  const handleApplyFilter = () => {
    onApplyFilter(selectedFilter);
    onClose();
  };

  const previewClass =
    FILTERS.find((f) => f.id === selectedFilter)?.className || "";

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
            {mediaItem.mediaType === "video" ? (
              <video
                src={getSafeImageSrc(mediaItem)}
                className={previewClass}
                style={{ width: "100%", height: 300, objectFit: "cover" }}
                controls
                playsInline
              />
            ) : (
              <img
                src={getSafeImageSrc(mediaItem)}
                className={previewClass}
                style={{ width: "100%", height: 300, objectFit: "cover" }}
                alt="Preview"
              />
            )}
          </MainPreview>

          <FiltersGrid>
            {FILTERS.map((f) => (
              <FilterOption
                key={f.id}
                active={selectedFilter === f.id}
                onClick={() => setSelectedFilter(f.id)}
              >
                <FilterThumbnail
                  className={f.className}
                  active={selectedFilter === f.id}
                >
                  <img
                    src={getSafeImageSrc(mediaItem)}
                    alt={f.name}
                    onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                  />
                </FilterThumbnail>
                <FilterName active={selectedFilter === f.id}>
                  {f.name}
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
}
