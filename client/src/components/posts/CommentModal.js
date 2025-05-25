import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
} from "react";
import styled, { keyframes, css } from "styled-components";
import {
  FaTimes,
  FaComment,
  FaHeart,
  FaRegHeart,
  FaPaperPlane,
  FaReply,
  FaEllipsisH,
  FaTrash,
  FaFlag,
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../theme";
import authorImg from "../../assets/andy.jpg";

const AUTHOR_IMAGE = authorImg;
const AUTHOR_NAME = "Andrew";

// Animation keyframes
const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const slideUp = keyframes`
  0% { 
    transform: translateY(100%);
    opacity: 0;
  }
  100% { 
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideDown = keyframes`
  0% { 
    transform: translateY(0);
    opacity: 1;
  }
  100% { 
    transform: translateY(100%);
    opacity: 0;
  }
`;

const scaleIn = keyframes`
  0% { 
    transform: scale(0.8) translateY(20px); 
    opacity: 0; 
  }
  100% { 
    transform: scale(1) translateY(0); 
    opacity: 1; 
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Comment Modal Component
export const CommentModal = ({
  isOpen,
  onClose,
  post,
  comments = [],
  onAddComment,
  onLikeComment,
  onDeleteComment,
  isLoading = false,
}) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActions, setShowActions] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);
  const actionsRef = useRef(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [newComment, adjustTextareaHeight]);

  // Handle clicks outside actions menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle modal open/close with body scroll prevention
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;

      // Prevent body scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      // Focus on textarea when modal opens
      setTimeout(() => textareaRef.current?.focus(), 300);

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };
      document.addEventListener("keydown", handleEscape);

      return () => {
        // Restore body scroll to exact position
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        text: newComment.trim(),
        parentId: replyingTo?.id || null,
        postId: post._id,
      });

      setNewComment("");
      setReplyingTo(null);
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Comment submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.author.username || comment.author.name} `);
    textareaRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <ModalOverlay onClick={handleBackdropClick} isClosing={isClosing}>
      <ModalContainer
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        isClosing={isClosing}
      >
        {/* Drag Handle */}
        <DragHandle />

        {/* Header */}
        <ModalHeader>
          <HeaderTitle>Comments</HeaderTitle>
          <CloseButton onClick={handleClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          {/* Post Preview */}
          <PostPreview>
            <PostAuthor>
              <AuthorAvatar src={AUTHOR_IMAGE} alt={AUTHOR_NAME} />
              <PostInfo>
                <AuthorName>{AUTHOR_NAME}</AuthorName>
                <PostDate>
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </PostDate>
              </PostInfo>
            </PostAuthor>
            {post.title && <PostTitle>{post.title}</PostTitle>}
            {post.caption && <PostCaption>{post.caption}</PostCaption>}
          </PostPreview>

          {/* Comments List */}
          <CommentsContainer>
            {isLoading ? (
              <LoadingState>
                <LoadingSpinner />
                <LoadingText>Loading comments...</LoadingText>
              </LoadingState>
            ) : comments.length === 0 ? (
              <EmptyState>
                <EmptyIcon>💬</EmptyIcon>
                <EmptyTitle>No comments yet</EmptyTitle>
                <EmptySubtitle>
                  Be the first to share your thoughts!
                </EmptySubtitle>
              </EmptyState>
            ) : (
              <CommentsList>
                {comments.map((comment) => (
                  <CommentItem key={comment._id}>
                    <CommentAvatar
                      src={comment.author.avatar || AUTHOR_IMAGE}
                      alt={comment.author.name}
                    />
                    <CommentContent>
                      <CommentHeader>
                        <CommentAuthorInfo>
                          <CommentAuthor>{comment.author.name}</CommentAuthor>
                          {comment.author.username && (
                            <CommentUsername>
                              @{comment.author.username}
                            </CommentUsername>
                          )}
                        </CommentAuthorInfo>
                        <CommentTime>
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </CommentTime>
                        {isAuthenticated && (
                          <CommentActions ref={actionsRef}>
                            <ActionsButton
                              onClick={() =>
                                setShowActions(
                                  showActions === comment._id
                                    ? null
                                    : comment._id
                                )
                              }
                            >
                              <FaEllipsisH />
                            </ActionsButton>
                            {showActions === comment._id && (
                              <ActionsMenu>
                                <ActionItem
                                  onClick={() => handleReply(comment)}
                                >
                                  <FaReply /> Reply
                                </ActionItem>
                                {(user?.id === comment.author._id ||
                                  user?.id === post.authorId) && (
                                  <ActionItem
                                    onClick={() => onDeleteComment(comment._id)}
                                    destructive
                                  >
                                    <FaTrash /> Delete
                                  </ActionItem>
                                )}
                                <ActionItem>
                                  <FaFlag /> Report
                                </ActionItem>
                              </ActionsMenu>
                            )}
                          </CommentActions>
                        )}
                      </CommentHeader>
                      <CommentText>{comment.text}</CommentText>
                      <CommentFooter>
                        <LikeButton
                          onClick={() => onLikeComment(comment._id)}
                          liked={comment.hasLiked}
                          disabled={!isAuthenticated}
                        >
                          {comment.hasLiked ? <FaHeart /> : <FaRegHeart />}
                          {comment.likes > 0 && (
                            <LikeCount>{comment.likes}</LikeCount>
                          )}
                        </LikeButton>
                        <ReplyButton onClick={() => handleReply(comment)}>
                          Reply
                        </ReplyButton>
                      </CommentFooter>
                    </CommentContent>
                  </CommentItem>
                ))}
              </CommentsList>
            )}
          </CommentsContainer>
        </ModalContent>

        {/* Comment Input */}
        {isAuthenticated ? (
          <CommentInputContainer>
            {replyingTo && (
              <ReplyIndicator>
                <ReplyText>
                  Replying to @
                  {replyingTo.author.username || replyingTo.author.name}
                </ReplyText>
                <CancelReply onClick={cancelReply}>
                  <FaTimes />
                </CancelReply>
              </ReplyIndicator>
            )}
            <CommentForm onSubmit={handleSubmit}>
              <UserAvatar
                src={user?.avatar || AUTHOR_IMAGE}
                alt="Your avatar"
              />
              <InputWrapper>
                <CommentTextarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a comment..."
                  rows={1}
                  disabled={isSubmitting}
                />
                <SubmitButton
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  isSubmitting={isSubmitting}
                >
                  {isSubmitting ? <SubmittingSpinner /> : <FaPaperPlane />}
                </SubmitButton>
              </InputWrapper>
            </CommentForm>
          </CommentInputContainer>
        ) : (
          <AuthPrompt>
            <AuthPromptText>
              <a href="/login">Sign in</a> to join the conversation
            </AuthPromptText>
          </AuthPrompt>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

// Updated Comment Button for PostCard
export const CommentButton = ({ postId, commentCount = 0, onClick }) => {
  return (
    <CommentButtonWrapper onClick={onClick}>
      <CommentIcon />
      {commentCount > 0 && <CommentCount>{commentCount}</CommentCount>}
    </CommentButtonWrapper>
  );
};

// Styled Components - TikTok Style Bottom Sheet
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.3s ease-out;

  ${(props) =>
    props.isClosing &&
    css`
      animation: ${fadeIn} 0.3s ease-out reverse;
    `}

  @supports (-webkit-touch-callout: none) {
    min-height: -webkit-fill-available;
  }
`;

const ModalContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${COLORS.cardBackground};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  height: 60vh;
  max-height: 600px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 10000;
  animation: ${slideUp} 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  ${(props) =>
    props.isClosing &&
    css`
      animation: ${slideDown} 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `}

  /* Ensure proper flex behavior for scrolling */
  min-height: 0;

  @media (max-width: 768px) {
    height: 65vh;
    max-height: 80vh;
  }

  @media (max-height: 600px) {
    height: 70vh;
  }

  @media (max-height: 500px) {
    height: 80vh;
  }
`;

const DragHandle = styled.div`
  width: 40px;
  height: 4px;
  background-color: ${COLORS.textTertiary};
  border-radius: 2px;
  margin: 8px auto 0;
  opacity: 0.5;
  flex-shrink: 0;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 16px;
  border-bottom: 1px solid ${COLORS.divider}40;
  position: sticky;
  top: 0;
  background-color: ${COLORS.cardBackground};
  z-index: 1;
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
    transform: scale(1.1);
  }
`;

const PostPreview = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${COLORS.divider}30;
  background-color: ${COLORS.background}20;
  flex-shrink: 0;
`;

const PostAuthor = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const AuthorAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
`;

const PostInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: ${COLORS.textPrimary};
  font-size: 14px;
`;

const PostDate = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 12px;
`;

const PostTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 8px 0;
  line-height: 1.3;
`;

const PostCaption = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
`;

const ModalContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const CommentsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-height: 0;
  max-height: 100%;

  /* Smooth scrolling */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${COLORS.background}30;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${COLORS.textTertiary}60;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${COLORS.textSecondary}80;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: ${COLORS.textSecondary};
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid ${COLORS.divider};
  border-top: 2px solid ${COLORS.accentMint};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 12px;
`;

const LoadingText = styled.span`
  font-size: 14px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${COLORS.textSecondary};
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  margin: 0 0 8px 0;
`;

const EmptySubtitle = styled.p`
  font-size: 14px;
  color: ${COLORS.textSecondary};
  margin: 0;
`;

const CommentsList = styled.div`
  padding: 0;
  height: 100%;
`;

const CommentItem = styled.div`
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid ${COLORS.divider}20;
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: ${COLORS.background}20;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
`;

const CommentAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  flex-shrink: 0;
`;

const CommentContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  position: relative;
  gap: 8px;
`;

const CommentAuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  color: ${COLORS.textPrimary};
  font-size: 14px;
  white-space: nowrap;
`;

const CommentUsername = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0.8;
`;

const CommentTime = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 12px;
  white-space: nowrap;
  margin-left: auto;
`;

const CommentActions = styled.div`
  position: relative;
  margin-left: auto;
`;

const ActionsButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.9);

  ${CommentItem}:hover & {
    opacity: 1;
    transform: scale(1);
  }

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textSecondary};
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 10;
  overflow: hidden;
  min-width: 140px;
  border: 1px solid ${COLORS.divider};
  animation: ${scaleIn} 0.2s ease-out;
`;

const ActionItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: ${(props) =>
    props.destructive ? COLORS.heartRed : COLORS.textPrimary};
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;

  svg {
    margin-right: 8px;
    font-size: 12px;
  }

  &:hover {
    background-color: ${(props) =>
      props.destructive ? COLORS.heartRed + "15" : COLORS.buttonHover};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.divider};
  }
`;

const CommentText = styled.p`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 8px 0;
  word-break: break-word;
`;

const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => (props.liked ? COLORS.heartRed : COLORS.textTertiary)};
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  padding: 4px 0;

  &:hover:not(:disabled) {
    color: ${COLORS.heartRed};
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const LikeCount = styled.span`
  font-size: 12px;
  font-weight: 500;
`;

const ReplyButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 0;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.textSecondary};
  }
`;

const CommentInputContainer = styled.div`
  border-top: 1px solid ${COLORS.divider}30;
  background-color: ${COLORS.cardBackground};
  position: sticky;
  bottom: 0;
  flex-shrink: 0;
`;

const ReplyIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background-color: ${COLORS.accentMint}15;
  border-bottom: 1px solid ${COLORS.divider}20;
`;

const ReplyText = styled.span`
  color: ${COLORS.accentMint};
  font-size: 12px;
  font-weight: 500;
`;

const CancelReply = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
  }
`;

const CommentForm = styled.form`
  display: flex;
  align-items: flex-end;
  padding: 16px 20px;
  gap: 12px;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 12px;
`;

const CommentTextarea = styled.textarea`
  flex: 1;
  border: 1px solid ${COLORS.divider};
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 14px;
  color: ${COLORS.textPrimary};
  background-color: ${COLORS.background};
  resize: none;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  min-height: 40px;
  max-height: 120px;

  &:focus {
    border-color: ${COLORS.accentMint};
    box-shadow: 0 0 0 3px ${COLORS.accentMint}20;
  }

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  background-color: ${(props) =>
    props.disabled ? COLORS.buttonHover : COLORS.accentMint};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  color: white;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: ${COLORS.primaryMint};
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const SubmittingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const AuthPrompt = styled.div`
  padding: 16px 20px;
  text-align: center;
  border-top: 1px solid ${COLORS.divider}30;
  background-color: ${COLORS.background}20;
  flex-shrink: 0;
`;

const AuthPromptText = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  margin: 0;

  a {
    color: ${COLORS.accentMint};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const CommentButtonWrapper = styled.button`
  color: ${COLORS.textTertiary};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  text-decoration: none;

  &:hover {
    transform: scale(1.15);
    color: ${COLORS.textSecondary};
  }
`;

const CommentIcon = styled(FaComment)``;

const CommentCount = styled.span`
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
  font-weight: 500;
`;
