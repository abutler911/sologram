// src/components/posts/PostCreator/media/UploadSection.jsx
import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import MediaGridSortable from "../../MediaGridSortable";
import MediaItem from "./MediaItem";
import { FaPlus, FaImage, FaVideo } from "react-icons/fa";
import {
  DropArea,
  UploadIcon,
  DropText,
  UploadButton,
  MediaGrid,
  AddMoreButton,
} from "../../PostCreator.styles";

function UploadSection({
  media,
  onDrop,
  onReorder,
  onRemove,
  onFilter,
  inputFileRef,
}) {
  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    onDrop,
    maxSize: 25 * 1024 * 1024,
    noClick: media.length > 0,
  });

  const addMore = () => {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = "image/*,video/*";
    el.multiple = true;
    el.style.display = "none";
    el.onchange = (e) => {
      if (e.target.files?.length) onDrop(Array.from(e.target.files));
      document.body.removeChild(el);
    };
    document.body.appendChild(el);
    el.click();
  };

  const fileInputChange = (e) => {
    if (e.target.files?.length) onDrop(Array.from(e.target.files));
    e.target.value = "";
  };

  return media.length === 0 ? (
    <DropArea {...getRootProps()} isDragActive={isDragActive}>
      <input {...getInputProps()} />
      <UploadIcon className="upload-icon">
        <FaImage />
        <FaVideo />
      </UploadIcon>
      <DropText>
        <h3>Add photos and videos</h3>
        <p>Drag and drop or click to upload</p>
      </DropText>
      <UploadButton
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (inputFileRef.current) inputFileRef.current.click();
        }}
      >
        <FaPlus /> Select from device
      </UploadButton>
      <input
        type="file"
        ref={inputFileRef}
        onChange={fileInputChange}
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
      />
    </DropArea>
  ) : (
    <MediaGrid>
      <MediaGridSortable
        items={media}
        onReorder={onReorder}
        renderItem={(item, index) => (
          <MediaItem
            key={item.id}
            mediaItem={item}
            index={index}
            onRemove={onRemove}
            onFilter={onFilter}
            isDragging={false}
          />
        )}
        AddMoreButton={
          <AddMoreButton onClick={addMore}>
            <FaPlus />
            <span>Add more</span>
          </AddMoreButton>
        }
      />
      <input
        type="file"
        ref={inputFileRef}
        onChange={fileInputChange}
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
      />
    </MediaGrid>
  );
}

export default UploadSection;
