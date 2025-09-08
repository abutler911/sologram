// src/components/posts/PostCreator/PostCreator.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { COLORS } from "../../theme";
import { useUploadManager } from "../../hooks/useUploadManager";
import { filterToClass, fileToMediaType, FILTERS } from "../../lib/media";

import {
  Container,
  Header,
  HeaderContent,
  ContentSection,
  MediaSection,
  ActionBar,
  PostButton,
} from "../PostCreator.styles";

import UploadSection from "./media/UploadSection";
import AIContentModal from "./modals/AIContentModal";
import FilterModal from "./modals/FilterModal";
import PostDetailsForm from "./form/PostDetailsForm";

import {
  createSafeBlobUrl,
  getSafeImageSrc,
  isMobileDevice,
} from "./utils/preview";

function PostCreator({ initialData = null, isEditing = false }) {
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState(initialData?.title || "");
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags || []);
  const [location, setLocation] = useState(initialData?.location || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState(() => {
    const rawDate = initialData?.date || new Date().toISOString();
    return rawDate.split("T")[0];
  });

  const [showAIModal, setShowAIModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMediaForFilter, setSelectedMediaForFilter] = useState(null);

  const navigate = useNavigate();
  const inputFileRef = useRef(null);
  const { startUpload, mountedRef } = useUploadManager(setMedia);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      media.forEach((item) => {
        if (
          item.previewUrl &&
          !item.isExisting &&
          item.previewUrl.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
      });
    };
  }, [media, mountedRef]);

  // load existing media when editing
  useEffect(() => {
    if (isEditing && initialData?.media?.length > 0) {
      const existingMedia = initialData.media.map((item) => {
        const filter = item.filter || "none";
        return {
          id:
            item._id ||
            `existing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          _id: item._id,
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          mediaType: item.mediaType,
          filter,
          filterClass: filterToClass(filter),
          isExisting: true,
          uploading: false,
          error: false,
        };
      });
      setMedia(existingMedia);
    }
  }, [isEditing, initialData]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const unique = acceptedFiles.filter((file) => {
        const dup = media.some(
          (m) =>
            m.file?.name === file.name &&
            m.file?.size === file.size &&
            m.file?.lastModified === file.lastModified
        );
        if (dup) toast.error(`File "${file.name}" is already added.`);
        return !dup;
      });
      if (unique.length === 0) return;

      const newItems = await Promise.all(
        unique.map(async (file) => {
          const id = `media_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          const isVideo = fileToMediaType(file) === "video";
          const previewUrl = await createSafeBlobUrl(file);
          return {
            id,
            file,
            previewUrl,
            mediaType: isVideo ? "video" : "image",
            filter: "none",
            filterClass: "",
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

  const openFilterModal = useCallback((mediaItem, index) => {
    setSelectedMediaForFilter({ ...mediaItem, index });
    setShowFilterModal(true);
  }, []);

  const applyFilter = useCallback(
    (filterId) => {
      setMedia((curr) =>
        curr.map((item, idx) =>
          idx === selectedMediaForFilter.index
            ? {
                ...item,
                filter: filterId,
                filterClass: filterToClass(filterId),
              }
            : item
        )
      );
    },
    [selectedMediaForFilter]
  );

  const reorderMedia = useCallback((from, to) => {
    setMedia((curr) => {
      const next = [...curr];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const removeMedia = useCallback((index) => {
    setMedia((curr) => {
      const item = curr[index];
      if (
        item?.previewUrl &&
        !item.isExisting &&
        item.previewUrl.startsWith("blob:")
      ) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      }
      return curr.filter((_, i) => i !== index);
    });
  }, []);

  const handleAIContentApply = useCallback(
    (gen) => {
      if (gen.title) setTitle(gen.title);
      if (gen.caption) setCaption(gen.caption);
      if (Array.isArray(gen.tags) && gen.tags.length > 0) {
        const available = Math.max(0, 5 - tags.length);
        const toAdd = gen.tags.slice(0, available);
        setTags((prev) => [...prev, ...toAdd]);
        toast.success(`Content applied with ${toAdd.length} tags!`);
      } else {
        toast.success("Content applied!");
      }
    },
    [tags.length]
  );

  const handleSubmit = useCallback(async () => {
    if (media.length === 0)
      return toast.error("Please add at least one photo or video");
    if (!title.trim()) return toast.error("Please add a title");
    if (!caption.trim()) return toast.error("Please add a caption");
    if (media.some((m) => m.uploading))
      return toast.error("Please wait for uploads to complete");

    const failed = media.filter((m) => m.error);
    if (failed.length)
      return toast.error(`Please remove ${failed.length} failed upload(s)`);

    const incomplete = media.filter((m) => !m.mediaUrl || !m.cloudinaryId);
    if (incomplete.length)
      return toast.error(
        `${incomplete.length} media item(s) failed to upload properly`
      );

    setIsSubmitting(true);
    try {
      const mediaItems = media.map((item, index) => ({
        mediaUrl: item.mediaUrl,
        cloudinaryId: item.cloudinaryId,
        mediaType: item.mediaType || item.type,
        filter: item.filter || "none",
        order: index,
        ...(item.isExisting && item._id && { _id: item._id }),
      }));

      const base = {
        title: title ?? "",
        caption: caption ?? "",
        content: content ?? "",
        tags: tags.join(","),
        location: location ?? "",
        date: eventDate,
      };

      let res;
      if (isEditing) {
        res = await axios.put(`/api/posts/${initialData._id}`, {
          ...base,
          media: mediaItems,
        });
        toast.success("Post updated successfully!");
      } else {
        const newOnly = mediaItems.filter((m) => !m._id);
        res = await axios.post("/api/posts", { ...base, media: newOnly });
        toast.success("Post created successfully!");
      }

      navigate(`/post/${res.data.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Please try again";
      toast.error(`Failed to ${isEditing ? "update" : "create"} post: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    caption,
    content,
    eventDate,
    initialData,
    isEditing,
    location,
    media,
    navigate,
    tags,
    title,
  ]);

  const isFormValid = useMemo(
    () =>
      media.length > 0 &&
      title.trim() &&
      caption.trim() &&
      !media.some((m) => m.uploading || m.error),
    [media, title, caption]
  );

  return (
    <Container>
      <Header>
        <HeaderContent>
          <h1>{isEditing ? "Edit Post" : "Create New Post"}</h1>
          <p>Share your moments with the world</p>
        </HeaderContent>
      </Header>

      <ContentSection>
        <MediaSection>
          <UploadSection
            media={media}
            onDrop={onDrop}
            onReorder={reorderMedia}
            onRemove={removeMedia}
            onFilter={openFilterModal}
            inputFileRef={inputFileRef}
          />
        </MediaSection>

        <PostDetailsForm
          title={title}
          setTitle={setTitle}
          caption={caption}
          setCaption={setCaption}
          content={content}
          setContent={setContent}
          tags={tags}
          setTags={setTags}
          eventDate={eventDate}
          setEventDate={setEventDate}
          location={location}
          setLocation={setLocation}
          onOpenAI={() => setShowAIModal(true)}
        />
      </ContentSection>

      <ActionBar>
        <PostButton
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Publishing..."
            : isEditing
            ? "Update Post"
            : "Publish Post"}
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
