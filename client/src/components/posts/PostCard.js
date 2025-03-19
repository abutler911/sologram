import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  FaHeart,
  FaEdit,
  FaTrash,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import { AuthContext } from "../../context/AuthContext";

const PostCard = ({ post: initialPost, onDelete }) => {
  const [post, setPost] = useState(initialPost);
  const { isAuthenticated } = useContext(AuthContext);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const hasMultipleMedia = post.media && post.media.length > 1;

  const formattedDate = format(new Date(post.createdAt), "MMMM d, yyyy");

  const handleLike = async () => {
    try {
      const response = await axios.put(`/api/posts/${post._id}/like`);
      if (response.data.success) {
        setPost({ ...post, likes: post.likes + 1 });
      }
    } catch (err) {
      console.error("Error liking post:", err);
      toast.error("Failed to like post");
    }
  };

  const handleNext = (e) => {
    if (e) e.preventDefault(); // Prevent navigation to post detail
    if (currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handlePrev = (e) => {
    if (e) e.preventDefault(); // Prevent navigation to post detail
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Configure swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    trackTouch: true,
  });

  const handleMediaClick = (e) => {
    // Only prevent default if we have multiple media
    // Otherwise, allow navigation to post detail
    if (hasMultipleMedia) {
      e.preventDefault();
    }
  };

  return (
    <Card>
      {post.media && post.media.length > 0 && (
        <MediaContainer to={`/post/${post._id}`} onClick={handleMediaClick}>
          <MediaCarousel {...swipeHandlers}>
            <MediaTrack
              style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
            >
              {post.media.map((media, index) => (
                <MediaItem key={index}>
                  {media.mediaType === "image" ? (
                    <PostImage src={media.mediaUrl} alt={post.caption} />
                  ) : (
                    <PostVideo src={media.mediaUrl} controls />
                  )}
                </MediaItem>
              ))}
            </MediaTrack>
          </MediaCarousel>

          {hasMultipleMedia && (
            <>
              <NavigationArrow
                className="prev"
                onClick={handlePrev}
                disabled={currentMediaIndex === 0}
              >
                <FaChevronLeft />
              </NavigationArrow>
              <NavigationArrow
                className="next"
                onClick={handleNext}
                disabled={currentMediaIndex === post.media.length - 1}
              >
                <FaChevronRight />
              </NavigationArrow>
              <IndicatorDots>
                {post.media.map((_, index) => (
                  <Dot
                    key={index}
                    active={index === currentMediaIndex}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentMediaIndex(index);
                    }}
                  />
                ))}
              </IndicatorDots>
            </>
          )}
        </MediaContainer>
      )}

      <CardContent>
        <Caption to={`/post/${post._id}`}>{post.caption}</Caption>

        {post.content && (
          <Content>
            {post.content.length > 150
              ? `${post.content.substring(0, 150)}...`
              : post.content}
          </Content>
        )}

        {post.tags && post.tags.length > 0 && (
          <TagsContainer>
            {post.tags.map((tag, index) => (
              <Tag key={index}>#{tag}</Tag>
            ))}
          </TagsContainer>
        )}

        <CardFooter>
          <MetaData>
            <TimeStamp>
              <FaClock />
              <span>{formattedDate}</span>
            </TimeStamp>

            <LikesCount onClick={handleLike}>
              <FaHeart />
              <span>{post.likes}</span>
            </LikesCount>
          </MetaData>

          {isAuthenticated && (
            <Actions>
              <EditButton to={`/edit/${post._id}`}>
                <FaEdit />
              </EditButton>

              <DeleteButton onClick={() => onDelete(post._id)}>
                <FaTrash />
              </DeleteButton>
            </Actions>
          )}
        </CardFooter>
      </CardContent>
    </Card>
  );
};

// Styled Components
const Card = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%; /* Take full height of grid cell */

  /* Fixed card width for desktop and tablet */
  @media (min-width: 768px) {
    width: 100%;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const MediaContainer = styled(Link)`
  display: block;
  width: 100%;
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1; /* Square aspect ratio like Instagram */
  flex-shrink: 0; /* Prevent the media container from shrinking */
`;

// Carousel Components
const MediaCarousel = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const MediaTrack = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  transition: transform 0.3s ease-out;
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
`;

const NavigationArrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;

  ${Card}:hover & {
    opacity: 0.8;
  }

  &:hover {
    opacity: 1 !important;
  }

  &.prev {
    left: 10px;
  }

  &.next {
    right: 10px;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

const IndicatorDots = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
  z-index: 2;
`;

const Dot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? "#ff7e5f" : "rgba(255, 255, 255, 0.7)"};
  border: none;
  cursor: pointer;
  padding: 0;
`;

const PostImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover; /* This crops the image to fill the container */
  position: absolute;
  top: 0;
  left: 0;
`;

const PostVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover; /* This crops the video to fill the container */
  position: absolute;
  top: 0;
  left: 0;
`;

const CardContent = styled.div`
  padding: 1.25rem;
  flex-grow: 1; /* Allow content to grow but maintain consistent card heights */
  display: flex;
  flex-direction: column;
`;

const Caption = styled(Link)`
  display: block;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #333333;
  text-decoration: none;

  &:hover {
    color: #ff7e5f;
  }

  /* Set max-height and handle overflow for consistent height */
  max-height: 3.75rem; /* Approximately 2 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const Content = styled.p`
  color: #666666;
  margin-bottom: 1rem;
  line-height: 1.5;

  /* Set max-height and handle overflow for consistent height */
  max-height: 4.5rem; /* Approximately 3 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  overflow: hidden;
  max-height: 2.5rem; /* Limit the visible tags */
`;

const Tag = styled.span`
  background-color: #f2f2f2;
  color: #666666;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eeeeee;
  padding-top: 1rem;
  margin-top: auto; /* Push the footer to the bottom of the card */
`;

const MetaData = styled.div`
  display: flex;
  align-items: center;
`;

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 0.875rem;
  margin-right: 1rem;

  svg {
    margin-right: 0.25rem;
  }
`;

const LikesCount = styled.div`
  display: flex;
  align-items: center;
  color: #ff7e5f;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #ff5e3a;
  }

  svg {
    margin-right: 0.25rem;
  }
`;

const Actions = styled.div`
  display: flex;
`;

const EditButton = styled(Link)`
  color: #4a90e2;
  margin-right: 0.75rem;
  transition: color 0.3s ease;

  &:hover {
    color: #3a70b2;
  }
`;

const DeleteButton = styled.button`
  color: #e74c3c;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.3s ease;

  &:hover {
    color: #c0392b;
  }
`;

export default PostCard;
