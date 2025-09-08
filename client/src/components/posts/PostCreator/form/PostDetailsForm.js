import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  SectionHeader,
  AIButton,
  FormGroup,
  TwoColumnGroup,
  Label,
  FormInput,
  FormTextarea,
  IconInput,
  TagInput,
  TagInputField,
  TagsContainer,
  Tag,
  TagRemoveButton,
  CharCount,
} from "../../PostCreator.styles";
import {
  FaRobot,
  FaCalendarDay,
  FaLocationArrow,
  FaTag,
  FaPencilAlt,
} from "react-icons/fa";

const MAX_TAGS = 5;

export default function PostDetailsForm({
  title,
  setTitle,
  caption,
  setCaption,
  content,
  setContent,
  tags,
  setTags,
  eventDate,
  setEventDate,
  location,
  setLocation,
  onOpenAI,
}) {
  const [currentTag, setCurrentTag] = useState("");

  const addTag = useCallback(
    (raw = null) => {
      const val = (raw ?? currentTag).trim();
      if (!val) return;
      if (tags.includes(val)) return;
      if (tags.length >= MAX_TAGS) {
        toast.error(`Maximum ${MAX_TAGS} tags allowed`);
        return;
      }
      setTags([...tags, val]);
      setCurrentTag("");
    },
    [currentTag, setTags, tags]
  );

  const handleTagInputKeyDown = useCallback(
    (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (currentTag.trim()) addTag();
      } else if (e.key === "Backspace" && !currentTag && tags.length > 0) {
        setTags(tags.slice(0, -1));
      }
    },
    [addTag, currentTag, setTags, tags]
  );

  const handleTagInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      if (value.includes(" ")) {
        const first = value.split(" ")[0].trim();
        if (first) addTag(first);
      } else {
        setCurrentTag(value);
      }
    },
    [addTag]
  );

  const removeTag = useCallback(
    (t) => {
      setTags(tags.filter((x) => x !== t));
    },
    [setTags, tags]
  );

  const titleCount = useMemo(() => `${title.length}/100`, [title]);
  const captionCount = useMemo(() => `${caption.length}/2200`, [caption]);

  return (
    <>
      <SectionHeader>
        <h3>Post Details</h3>
        <AIButton onClick={onOpenAI}>
          <FaRobot />
          <span>AI Assist</span>
        </AIButton>
      </SectionHeader>

      <FormGroup>
        <Label>Title *</Label>
        <FormInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a catchy title..."
          maxLength={100}
        />
        <CharCount>{titleCount}</CharCount>
      </FormGroup>

      <FormGroup>
        <Label>Caption *</Label>
        <FormTextarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption that tells your story..."
          rows={4}
          maxLength={2200}
        />
        <CharCount>{captionCount}</CharCount>
      </FormGroup>

      <TwoColumnGroup>
        <FormGroup>
          <Label>Event Date</Label>
          <IconInput>
            <FaCalendarDay />
            <FormInput
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </IconInput>
        </FormGroup>

        <FormGroup>
          <Label>Location</Label>
          <IconInput>
            <FaLocationArrow />
            <FormInput
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
            />
          </IconInput>
        </FormGroup>
      </TwoColumnGroup>

      <FormGroup>
        <Label>Tags</Label>
        <TagInput>
          <FaTag />
          <TagInputField
            value={currentTag}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Type tags and press space to add..."
            maxLength={30}
          />
        </TagInput>

        {tags.length > 0 && (
          <TagsContainer>
            {tags.map((t, i) => (
              <Tag key={`${t}-${i}`}>
                #{t}
                <TagRemoveButton onClick={() => removeTag(t)}>
                  ✕
                </TagRemoveButton>
              </Tag>
            ))}
          </TagsContainer>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Additional Content</Label>
        <IconInput>
          <FaPencilAlt />
          <FormInput
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add any additional details (optional)"
          />
        </IconInput>
      </FormGroup>
    </>
  );
}
