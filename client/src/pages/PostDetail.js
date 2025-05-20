import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  FaHeart,
  FaRegHeart,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaTag,
  FaEye,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaClock,
  FaSearch,
  FaTimes,
  FaExpandAlt,
  FaCompressAlt,
  FaComments,
  FaRegComment,
  FaLocationArrow,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useSwipeable } from "react-swipeable";
import { AuthContext } from "../context/AuthContext";
import { COLORS, THEME } from "../theme";
import ReactGA from "react-ga4";

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showFullscreenMedia, setShowFullscreenMedia] = useState(false);
  const [mediaHovering, setMediaHovering] = useState(false);
  const [readingTime, setReadingTime] = useState("< 1 min read");
  const contentRef = useRef(null);

  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Add scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate reading time
  const calculateReadingTime = (content) => {
    if (!content) return "< 1 min read";
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Navigate to previous media
  const prevMedia = () => {
    if (post?.media && post.media.length > 0) {
      setActiveMediaIndex((prev) =>
        prev === 0 ? post.media.length - 1 : prev - 1
      );
    }
  };

  // Navigate to next media
  const nextMedia = () => {
    if (post?.media && post.media.length > 0) {
      setActiveMediaIndex((prev) =>
        prev === post.media.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Configure swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextMedia,
    onSwipedRight: prevMedia,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    trackTouch: true,
  });

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/posts/${id}`);
        setPost(response.data.data);

        // Calculate reading time
        if (response.data.data.content) {
          const time = calculateReadingTime(response.data.data.content);
          setReadingTime(time);
        }

        setError(null);
        ReactGA.event("view_post", {
          post_id: response.data.data._id,
          post_title: response.data.data.caption,
        });
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(
          "Failed to load post. It may have been deleted or does not exist."
        );
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Open delete confirmation modal
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    try {
      await axios.delete(`/api/posts/${id}`);
      toast.success("Post deleted successfully");
      navigate("/");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post");
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !post) {
      toast.error("You must be logged in to like posts.");
      return;
    }

    try {
      await axios.post(`/api/posts/${id}/like`);

      setIsLiked(true);
      setPost((prevPost) => ({
        ...prevPost,
        likes: (prevPost.likes || 0) + 1,
      }));

      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 500);
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error("Failed to like post.");
    }
  };

  // Handle bookmark
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);

    // API call would go here
    // Example:
    // axios.post(`/api/posts/${id}/bookmark`);

    toast.success(
      isBookmarked ? "Removed from bookmarks" : "Added to bookmarks"
    );
  };

  // Toggle fullscreen media
  const toggleFullscreen = () => {
    setShowFullscreenMedia(!showFullscreenMedia);
  };

  // Share post
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.caption,
          text: post.content?.substring(0, 100) + "...",
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  // Open location in Google Maps
  const openInMaps = (location) => {
    if (!location) return;

    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
      location
    )}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  // Key press handler for left/right navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (post?.media?.length > 1) {
        if (e.key === "ArrowLeft") {
          prevMedia();
        } else if (e.key === "ArrowRight") {
          nextMedia();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [post]);

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingMessage>Loading post...</LoadingMessage>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <PageWrapper>
        <Container>
          <ErrorContainer>
            <ErrorMessage>{error || "Post not found"}</ErrorMessage>
            <BackButton to="/">
              <FaArrowLeft />
              <span>Back to Home</span>
            </BackButton>
          </ErrorContainer>
        </Container>
      </PageWrapper>
    );
  }

  // Format date to calendar date format: MMMM d, yyyy (e.g., March 18, 2025)
  const formattedDate = format(new Date(post.createdAt), "MMMM d, yyyy");

  return (
    <PageWrapper>
      {/* Reading Progress Bar */}
      <ProgressBarContainer>
        <ProgressBar width={`${scrollProgress}%`} />
      </ProgressBarContainer>

      <Container>
        <BackButton to="/">
          <FaArrowLeft />
          <span>Back to Home</span>
        </BackButton>

        <PostContainer>
          {post.media && post.media.length > 0 && (
            <MediaSection>
              <MediaContainer
                {...swipeHandlers}
                onMouseEnter={() => setMediaHovering(true)}
                onMouseLeave={() => setMediaHovering(false)}
              >
                <MediaTrack
                  style={{
                    transform: `translateX(-${activeMediaIndex * 100}%)`,
                  }}
                >
                  {post.media.map((media, index) => (
                    <MediaItem key={index}>
                      {media.mediaType === "image" ? (
                        <PostImage
                          src={media.mediaUrl}
                          alt={post.caption}
                          className={media.filter}
                        />
                      ) : (
                        <PostVideo
                          src={media.mediaUrl}
                          controls
                          className={media.filter}
                        />
                      )}
                    </MediaItem>
                  ))}
                </MediaTrack>

                {/* Media Controls */}
                <MediaControls>
                  <ZoomButton onClick={toggleFullscreen}>
                    {showFullscreenMedia ? <FaCompressAlt /> : <FaExpandAlt />}
                  </ZoomButton>
                </MediaControls>

                {/* Navigation arrows - only show if there are multiple media files */}
                {post.media.length > 1 && (
                  <>
                    <NavButton
                      className="prev"
                      onClick={prevMedia}
                      style={{ opacity: mediaHovering ? 1 : 0 }}
                    >
                      <FaChevronLeft />
                    </NavButton>
                    <NavButton
                      className="next"
                      onClick={nextMedia}
                      style={{ opacity: mediaHovering ? 1 : 0 }}
                    >
                      <FaChevronRight />
                    </NavButton>
                  </>
                )}
              </MediaContainer>

              {/* Media counter and thumbnails - only show if there are multiple media files */}
              {post.media.length > 1 && (
                <>
                  <MediaCounter>
                    {activeMediaIndex + 1} / {post.media.length}
                  </MediaCounter>

                  <ThumbnailContainer>
                    {post.media.map((media, index) => (
                      <Thumbnail
                        key={index}
                        active={index === activeMediaIndex}
                        onClick={() => setActiveMediaIndex(index)}
                      />
                    ))}
                  </ThumbnailContainer>
                </>
              )}
            </MediaSection>
          )}

          {/* Location banner - displayed if location exists */}
          {post.location && (
            <LocationBanner onClick={() => openInMaps(post.location)}>
              <LocationIcon>
                <FaMapMarkerAlt />
              </LocationIcon>
              <LocationText>{post.location}</LocationText>
              <LocationArrow>
                <FaLocationArrow />
              </LocationArrow>
            </LocationBanner>
          )}

          <ContentContainer>
            {/* Author Section with Andrew's avatar */}
            <AuthorSection>
              <AuthorCircle>A</AuthorCircle>
              <AuthorInfo>
                <AuthorName>Andrew</AuthorName>
                <ReadingTime>
                  <FaClock />
                  <span>{readingTime}</span>
                </ReadingTime>
              </AuthorInfo>
            </AuthorSection>

            <PostHeader>
              <PostTitle>{post.title || post.caption}</PostTitle>

              {isAuthenticated && (
                <ActionsContainer>
                  <EditLink to={`/edit/${post._id}`}>
                    <FaEdit />
                    <span>Edit</span>
                  </EditLink>

                  <DeleteButton onClick={openDeleteModal}>
                    <FaTrash />
                    <span>Delete</span>
                  </DeleteButton>
                </ActionsContainer>
              )}
            </PostHeader>

            <MetaData>
              <TimeStamp>
                <FaCalendarAlt />
                <span>{formattedDate}</span>
              </TimeStamp>

              <LikesCount>
                <FaHeart />
                <span>{post.likes} likes</span>
              </LikesCount>
            </MetaData>

            <PostCaption>{post.caption}</PostCaption>

            {post.content && (
              <PostContent id="post-content" ref={contentRef}>
                {post.content}
              </PostContent>
            )}

            {/* Engagement Bar */}
            <EngagementBar>
              <ActionButton
                onClick={handleLike}
                className={isLiked ? "active" : ""}
              >
                <LikeAnimation className={isLikeAnimating ? "animate" : ""}>
                  {isLiked ? <FaHeart /> : <FaRegHeart />}
                </LikeAnimation>
                <span>Like</span>
              </ActionButton>

              <ActionButton>
                <FaRegComment />
                <span>Comment</span>
              </ActionButton>

              <ActionButton onClick={handleShare}>
                <FaShare />
                <span>Share</span>
              </ActionButton>

              <ActionButton
                onClick={handleBookmark}
                className={isBookmarked ? "active" : ""}
              >
                {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                <span>Save</span>
              </ActionButton>
            </EngagementBar>

            {post.tags && post.tags.length > 0 && (
              <TagsContainer id="post-tags">
                {post.tags.map((tag, index) => (
                  <Tag key={index}>
                    <FaTag />
                    <span>{tag}</span>
                  </Tag>
                ))}
              </TagsContainer>
            )}
          </ContentContainer>
        </PostContainer>

        {/* Floating Share Button */}
        <FloatingShareButton onClick={handleShare}>
          <FaShare />
        </FloatingShareButton>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <DeleteModal>
            <DeleteModalContent>
              <h3>Delete Post</h3>
              <p>
                Are you sure you want to delete this post? This action cannot be
                undone.
              </p>
              <DeleteModalButtons>
                <CancelButton onClick={closeDeleteModal}>Cancel</CancelButton>
                <ConfirmDeleteButton onClick={handleDeletePost}>
                  Delete Post
                </ConfirmDeleteButton>
              </DeleteModalButtons>
            </DeleteModalContent>
            <Backdrop onClick={closeDeleteModal} />
          </DeleteModal>
        )}

        {/* Fullscreen Media Modal */}
        {showFullscreenMedia && (
          <FullscreenModal>
            <FullscreenMediaContent>
              {post.media &&
              post.media[activeMediaIndex].mediaType === "image" ? (
                <FullscreenImage
                  src={post.media[activeMediaIndex].mediaUrl}
                  alt={post.caption}
                  className={post.media[activeMediaIndex].filter}
                />
              ) : (
                <FullscreenVideo
                  src={post.media[activeMediaIndex].mediaUrl}
                  controls
                  autoPlay
                  className={post.media[activeMediaIndex].filter}
                />
              )}

              {post.media && post.media.length > 1 && (
                <>
                  <FullscreenNavButton className="prev" onClick={prevMedia}>
                    <FaChevronLeft />
                  </FullscreenNavButton>
                  <FullscreenNavButton className="next" onClick={nextMedia}>
                    <FaChevronRight />
                  </FullscreenNavButton>
                </>
              )}

              <CloseFullscreenButton onClick={toggleFullscreen}>
                <FaTimes />
              </CloseFullscreenButton>
            </FullscreenMediaContent>
            <Backdrop onClick={toggleFullscreen} />
          </FullscreenModal>
        )}
      </Container>
    </PageWrapper>
  );
};

// Dark theme wrapper with deep blue background
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

// Progress Bar
const ProgressBarContainer = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  z-index: 100;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(
    90deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  width: ${(props) => props.width || "0%"};
  transition: width 0.1s;
`;

// Basic container
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${COLORS.textPrimary};
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;
  font-weight: 500;

  &:hover {
    color: ${COLORS.primarySalmon};
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: ${COLORS.textPrimary};
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(233, 137, 115, 0.1);
  color: ${COLORS.error};
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid rgba(233, 137, 115, 0.3);
`;

// Updated post container with white background and black text
const PostContainer = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 8px 24px ${COLORS.shadow};
  overflow: hidden;
  border: 1px solid ${COLORS.border};

  @media (max-width: 768px) {
    margin: 0 -1rem;
    border-radius: 0;
  }
`;

const MediaSection = styled.div`
  position: relative;
  background-color: #f5f5f5;
  width: 100%;
`;

// New Location Banner component
const LocationBanner = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: ${COLORS.primaryKhaki}20;
  border-bottom: 1px solid ${COLORS.divider};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${COLORS.primaryKhaki}30;
  }
`;

const LocationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: ${COLORS.primarySalmon};
  font-size: 16px;
`;

const LocationText = styled.div`
  flex: 1;
  font-size: 14px;
  color: ${COLORS.textPrimary};
  font-weight: 500;
`;

const LocationArrow = styled.div`
  color: ${COLORS.primaryBlueGray};
  font-size: 12px;
  transition: transform 0.2s ease;

  ${LocationBanner}:hover & {
    transform: translateX(3px);
    color: ${COLORS.primarySalmon};
  }
`;

const MediaContainer = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
  aspect-ratio: 16 / 9;
  max-height: 70vh;

  @media (max-width: 768px) {
    aspect-ratio: auto;
    height: auto;
    max-height: none;
  }
`;

const MediaTrack = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease-out;
`;

const MediaItem = styled.div`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #f5f5f5;
`;

const PostImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${MediaItem}:hover & {
    transform: scale(1.05);
  }

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

const PostVideo = styled.video`
  width: 100%;
  height: 100%;
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

const MediaControls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 2rem 1rem 1rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s;

  ${MediaContainer}:hover & {
    opacity: 1;
  }
`;

const ZoomButton = styled.button`
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: ${COLORS.accentBlueGray};
    transform: scale(1.1);
  }
`;

// Navigation buttons with blue theme
const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s, transform 0.2s;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: ${COLORS.accentBlueGray};
    transform: translateY(-50%) scale(1.1);
  }

  &.prev {
    left: 1rem;
  }

  &.next {
    right: 1rem;
  }

  @media (max-width: 768px) {
    width: 2.5rem;
    height: 2.5rem;
    opacity: 1 !important;
  }
`;

const MediaCounter = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  z-index: 10;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`;

const ThumbnailContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
`;

const Thumbnail = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : "rgba(255, 255, 255, 0.5)"};
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: ${COLORS.primarySalmon};
    transform: scale(1.2);
  }
`;

const ContentContainer = styled.div`
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

// Author Section with custom circle avatar for Andrew
const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const AuthorCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 1rem;
  border: 2px solid ${COLORS.accentSalmon};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #000000;
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
`;

const ReadingTime = styled.span`
  color: #666666;
  display: flex;
  align-items: center;
  font-size: 0.875rem;

  svg {
    margin-right: 0.25rem;
    color: ${COLORS.primaryBlueGray};
  }
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PostTitle = styled.h1`
  font-size: 2rem;
  color: #000000;
  margin: 0;
  font-weight: 700;
  line-height: 1.2;

  @media (max-width: 640px) {
    margin-bottom: 1rem;
    font-size: 1.75rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const EditLink = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s, transform 0.2s;
  font-weight: 500;

  &:hover {
    background-color: ${COLORS.accentBlueGray};
    transform: translateY(-2px);
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: ${COLORS.error};
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  font-weight: 500;

  &:hover {
    background-color: #b71c1c;
    transform: translateY(-2px);
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const MetaData = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eaeaea;
`;

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  color: #666666;
  font-size: 0.875rem;
  margin-right: 1.5rem;

  svg {
    margin-right: 0.5rem;
    color: ${COLORS.primaryBlueGray};
  }
`;

const LikesCount = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.primarySalmon};
  font-size: 0.875rem;
  font-weight: 500;

  svg {
    margin-right: 0.5rem;
  }
`;

// Post caption that appears before content
const PostCaption = styled.div`
  font-size: 1.25rem;
  line-height: 1.6;
  color: #000000;
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

// Updated post content with black text
const PostContent = styled.div`
  font-size: 1.125rem;
  line-height: 1.8;
  color: #000000;
  margin-bottom: 2rem;
  white-space: pre-line;

  @media (max-width: 640px) {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

// Engagement Bar
const EngagementBar = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  margin: 2rem 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #666666;
  transition: color 0.3s, transform 0.2s;
  gap: 0.25rem;

  &:hover {
    color: ${COLORS.primarySalmon};
    transform: translateY(-2px);
  }

  &.active {
    color: ${COLORS.primarySalmon};
  }

  svg {
    font-size: 1.25rem;
  }

  span {
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const LikeAnimation = styled.div`
  position: relative;
  display: inline-block;

  &.animate svg {
    animation: likeEffect 0.5s ease-in-out;
    color: ${COLORS.primarySalmon};
  }

  @keyframes likeEffect {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.4);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;

// Updated tag styling
const Tag = styled.span`
  background-color: #f0f0f0;
  color: #666666;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  margin-right: 0.75rem;
  margin-bottom: 0.75rem;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: #e0e0e0;
    color: ${COLORS.primarySalmon};
    transform: translateY(-2px);
  }

  svg {
    font-size: 0.75rem;
    color: ${COLORS.primarySalmon};
  }
`;

// Floating Action Button
const FloatingShareButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(233, 137, 115, 0.3);
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  z-index: 90;
  border: none;

  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-5px);
  }

  svg {
    font-size: 1.5rem;
  }

  @media (max-width: 768px) {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 3rem;
    height: 3rem;
  }
`;

// Modal Components
const DeleteModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DeleteModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

  h3 {
    color: ${COLORS.primarySalmon};
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    color: #333333;
    margin-bottom: 1.5rem;
  }
`;

const DeleteModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  background-color: ${COLORS.elevatedBackground};
  color: #333333;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  font-weight: 500;

  &:hover {
    background-color: ${COLORS.buttonHover};
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: ${COLORS.error};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  font-weight: 500;

  &:hover {
    background-color: #b71c1c;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    order: 1;
    margin-bottom: 0.5rem;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
`;

// Fullscreen Media Components
const FullscreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const FullscreenMediaContent = styled.div`
  position: relative;
  width: 90%;
  height: 90%;
  z-index: 1101;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FullscreenImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
`;

const FullscreenVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
`;

const FullscreenNavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  border-radius: 50%;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  z-index: 1102;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: translateY(-50%) scale(1.1);
  }

  &.prev {
    left: 1rem;
  }

  &.next {
    right: 1rem;
  }

  @media (max-width: 768px) {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const CloseFullscreenButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: ${COLORS.error};
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  z-index: 1102;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #b71c1c;
    transform: scale(1.1);
  }
`;

export default PostDetail;
