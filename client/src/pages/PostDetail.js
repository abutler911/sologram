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
  FaUser,
  FaExpandAlt,
  FaCompressAlt,
  FaPrint,
  FaComments,
  FaRegComment,
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
  const [relatedPosts, setRelatedPosts] = useState([]);
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

        // Fetch related posts if there are tags
        if (response.data.data.tags && response.data.data.tags.length > 0) {
          fetchRelatedPosts(response.data.data.tags, response.data.data._id);
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

  // Fetch related posts based on tags
  const fetchRelatedPosts = async (tags, currentPostId) => {
    try {
      const response = await axios.get("/api/posts", {
        params: { tags: tags.join(","), limit: 3 },
      });

      // Filter out the current post
      const filteredPosts = response.data.data
        .filter((post) => post._id !== currentPostId)
        .slice(0, 3);

      setRelatedPosts(filteredPosts);
    } catch (err) {
      console.error("Error fetching related posts:", err);
    }
  };

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

  // Handle like/unlike
  const handleLike = () => {
    setIsLiked(!isLiked);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 500);

    // API call would go here
    // Example:
    // axios.post(`/api/posts/${id}/like`);
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

  // Print post
  const handlePrint = () => {
    window.print();
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

          <ContentContainer>
            {/* Author Section */}
            <AuthorSection>
              <AuthorAvatar src="/default-avatar.png" alt="Author" />
              <AuthorInfo>
                <AuthorName>Post Author</AuthorName>
                <ReadingTime>
                  <FaClock />
                  <span>{readingTime}</span>
                </ReadingTime>
              </AuthorInfo>
              <PrintButton onClick={handlePrint}>
                <FaPrint />
                <span>Print</span>
              </PrintButton>
            </AuthorSection>

            <PostHeader>
              <PostTitle>{post.caption}</PostTitle>

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

            {/* Content and Table of Contents for long posts */}
            {post.content && post.content.length > 500 && (
              <TableOfContents>
                <TOCTitle>Table of Contents</TOCTitle>
                <TOCItem href="#post-content" level={0}>
                  Introduction
                </TOCItem>
                <TOCItem href="#post-tags" level={0}>
                  Tags
                </TOCItem>
                {relatedPosts.length > 0 && (
                  <TOCItem href="#related-posts" level={0}>
                    Related Posts
                  </TOCItem>
                )}
              </TableOfContents>
            )}

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

            {/* Related Posts Section */}
            {relatedPosts.length > 0 && (
              <RelatedPostsSection id="related-posts">
                <SectionTitle>Related Posts</SectionTitle>
                <RelatedPostsGrid>
                  {relatedPosts.map((relatedPost) => (
                    <RelatedPostCard
                      to={`/post/${relatedPost._id}`}
                      key={relatedPost._id}
                    >
                      {relatedPost.media && relatedPost.media.length > 0 && (
                        <RelatedPostImage
                          src={relatedPost.media[0].mediaUrl}
                          alt={relatedPost.caption}
                        />
                      )}
                      <RelatedPostInfo>
                        <RelatedPostTitle>
                          {relatedPost.caption}
                        </RelatedPostTitle>
                        <RelatedPostMeta>
                          <FaCalendarAlt />
                          <span>
                            {format(
                              new Date(relatedPost.createdAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </RelatedPostMeta>
                      </RelatedPostInfo>
                    </RelatedPostCard>
                  ))}
                </RelatedPostsGrid>
              </RelatedPostsSection>
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

// Light theme wrapper (changed from dark)
const PageWrapper = styled.div`
  background-color: ${COLORS.background};
  min-height: 100vh;
  padding: 1rem 0;

  @media print {
    background-color: white;
    padding: 0;
  }

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
  background-color: ${COLORS.border};
  z-index: 100;

  @media print {
    display: none;
  }
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(
    90deg,
    ${COLORS.primaryBlue},
    ${COLORS.primaryTeal}
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

  @media print {
    padding: 0;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primaryTeal};
  }

  svg {
    margin-right: 0.5rem;
  }

  @media print {
    display: none;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: ${COLORS.textSecondary};
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: rgba(211, 47, 47, 0.1);
  color: ${COLORS.error};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

// Updated post container with new colors
const PostContainer = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  overflow: hidden;

  @media (max-width: 768px) {
    margin: 0 -1rem;
    border-radius: 0;
  }

  @media print {
    box-shadow: none;
    border: none;
  }
`;

const MediaSection = styled.div`
  position: relative;
  background-color: #f5f5f5;
  width: 100%;

  @media print {
    max-height: 300px;
    overflow: hidden;
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
  background: linear-gradient(transparent, rgba(26, 95, 122, 0.7));
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

  @media print {
    display: none;
  }
`;

const ZoomButton = styled.button`
  background-color: ${COLORS.primaryBlue};
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
    background-color: ${COLORS.accentBlue};
    transform: scale(1.1);
  }
`;

// Navigation buttons with new theme
const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: ${COLORS.primaryBlue};
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s;
  z-index: 10;

  &:hover {
    background-color: ${THEME.button.primary.hoverBackground};
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

  @media print {
    display: none;
  }
`;

const MediaCounter = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: ${COLORS.primaryBlue};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  z-index: 10;

  @media print {
    display: none;
  }
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

  @media print {
    display: none;
  }
`;

const Thumbnail = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active ? COLORS.primaryTeal : "rgba(255, 255, 255, 0.5)"};
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.primaryTeal};
  }
`;

const ContentContainer = styled.div`
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media print {
    padding: 0;
  }
`;

// Author Section
const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;

  @media print {
    background-color: transparent;
    border-bottom: 1px solid ${COLORS.border};
    border-radius: 0;
    padding: 0.5rem 0;
  }
`;

const AuthorAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
  border: 2px solid ${COLORS.primaryBlue};
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  margin-bottom: 0.25rem;
`;

const ReadingTime = styled.span`
  color: ${COLORS.textTertiary};
  display: flex;
  align-items: center;
  font-size: 0.875rem;

  svg {
    margin-right: 0.25rem;
    color: ${COLORS.primaryTeal};
  }
`;

const PrintButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textPrimary};
  padding: 0.5rem 1rem;
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 0.875rem;

  &:hover {
    background-color: ${COLORS.buttonHover};
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.primaryBlue};
  }

  @media print {
    display: none;
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
  font-size: 1.75rem;
  color: ${COLORS.textPrimary};
  margin: 0;

  @media (max-width: 640px) {
    margin-bottom: 1rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: flex-end;
  }

  @media print {
    display: none;
  }
`;

const EditLink = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${COLORS.primaryBlue};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${THEME.button.primary.hoverBackground};
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
  transition: background-color 0.3s;

  &:hover {
    background-color: #b71c1c;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const MetaData = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
`;

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textTertiary};
  font-size: 0.875rem;
  margin-right: 1.5rem;

  svg {
    margin-right: 0.5rem;
    color: ${COLORS.primaryBlue};
  }
`;

const LikesCount = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.primaryTeal};
  font-size: 0.875rem;

  svg {
    margin-right: 0.5rem;
  }
`;

// Table of Contents
const TableOfContents = styled.div`
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  @media print {
    background-color: transparent;
    border: 1px solid ${COLORS.border};
  }
`;

const TOCTitle = styled.h4`
  color: ${COLORS.textPrimary};
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
`;

const TOCItem = styled.a`
  display: block;
  color: ${COLORS.textSecondary};
  padding: 0.5rem 0;
  text-decoration: none;
  transition: color 0.2s;
  border-left: 2px solid ${COLORS.border};
  padding-left: 1rem;
  margin-left: ${(props) => props.level * 0.5}rem;

  &:hover {
    color: ${COLORS.primaryTeal};
    border-left-color: ${COLORS.primaryTeal};
  }
`;

// Updated post content
const PostContent = styled.div`
  font-size: 1.125rem;
  line-height: 1.6;
  color: ${COLORS.textSecondary};
  margin-bottom: 2rem;
  white-space: pre-line;
`;

// Engagement Bar
const EngagementBar = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: ${COLORS.elevatedBackground};
  padding: 1rem;
  border-radius: 8px;
  margin: 2rem 0;

  @media print {
    display: none;
  }
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${COLORS.textTertiary};
  transition: color 0.3s, transform 0.2s;
  gap: 0.25rem;

  &:hover {
    color: ${COLORS.primaryTeal};
    transform: translateY(-2px);
  }

  &.active {
    color: ${COLORS.primaryBlue};
  }

  svg {
    font-size: 1.25rem;
  }

  span {
    font-size: 0.75rem;
  }
`;

const LikeAnimation = styled.div`
  position: relative;
  display: inline-block;

  &.animate svg {
    animation: likeEffect 0.5s ease-in-out;
    color: ${COLORS.primaryTeal};
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
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.textTertiary};
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  margin-right: 0.75rem;
  margin-bottom: 0.75rem;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.primaryTeal};
  }

  svg {
    font-size: 0.75rem;
    color: ${COLORS.primaryBlue};
  }
`;

// Related Posts Section
const RelatedPostsSection = styled.div`
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${COLORS.divider};

  @media print {
    display: none;
  }
`;

const SectionTitle = styled.h3`
  color: ${COLORS.textPrimary};
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  padding-left: 1rem;

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(
      to bottom,
      ${COLORS.primaryBlue},
      ${COLORS.primaryTeal}
    );
    border-radius: 4px;
  }
`;

const RelatedPostsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const RelatedPostCard = styled(Link)`
  display: block;
  text-decoration: none;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px ${COLORS.shadow};
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px ${COLORS.shadow};
  }
`;

const RelatedPostImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
`;

const RelatedPostInfo = styled.div`
  padding: 1rem;
`;

const RelatedPostTitle = styled.h4`
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RelatedPostMeta = styled.div`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.25rem;
    font-size: 0.75rem;
    color: ${COLORS.primaryBlue};
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
  background-color: ${COLORS.primaryBlue};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px ${COLORS.shadow};
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  z-index: 90;
  border: none;

  &:hover {
    background-color: ${COLORS.primaryTeal};
    transform: translateY(-5px);
  }

  svg {
    font-size: 1.5rem;
  }

  @media print {
    display: none;
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
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  z-index: 1001;
  box-shadow: 0 4px 12px ${COLORS.shadow};

  h3 {
    color: ${COLORS.textPrimary};
    margin-top: 0;
    margin-bottom: 1rem;
  }

  p {
    color: ${COLORS.textSecondary};
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
  color: ${COLORS.textPrimary};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.buttonHover};
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
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #b71c1c;
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
  background-color: rgba(0, 0, 0, 0.5);
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
`;

const FullscreenVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const FullscreenNavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: ${COLORS.primaryBlue};
  color: white;
  border: none;
  border-radius: 50%;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  z-index: 1102;

  &:hover {
    background-color: ${THEME.button.primary.hoverBackground};
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
  transition: background-color 0.3s;
  z-index: 1102;

  &:hover {
    background-color: #b71c1c;
  }
`;

export default PostDetail;
