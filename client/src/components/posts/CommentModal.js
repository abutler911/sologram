import React, { useState, useRef, useEffect, useContext } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaPaperPlane,
  FaTrash,
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme';
import authorImg from '../../assets/andy.jpg';
import { createPortal } from 'react-dom';

const AVATAR_FALLBACK = authorImg;
const AUTHOR_IMAGE = authorImg;

// --- ANIMATIONS ---
const fadeIn = keyframes`0%{opacity:0}100%{opacity:1}`;
const slideUp = keyframes`0%{transform:translateY(100%)}100%{transform:translateY(0)}`;
const slideDown = keyframes`0%{transform:translateY(0)}100%{transform:translateY(100%)}`;
const spin = keyframes`0%{transform:rotate(0)}100%{transform:rotate(360deg)}`;

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
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => e.key === 'Escape' && handleClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || isSubmitting || !isAuthenticated) return;
    setIsSubmitting(true);
    try {
      await onAddComment({
        text: newComment.trim(),
        parentId: replyingTo?.id || null,
        postId: post._id,
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <ModalOverlay onClick={handleClose} isClosing={isClosing}>
      <ModalContainer
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        isClosing={isClosing}
      >
        <DragHandle />

        {/* NEW: Minimalist Header with just the Title */}
        <ModalHeader>
          <HeaderTitleArea>
            <HeaderTitle>Conversation</HeaderTitle>
            <HeaderSubtitle>{post.title || 'Sologram'}</HeaderSubtitle>
          </HeaderTitleArea>
          <CloseButton onClick={handleClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          <CommentsArea>
            {isLoading ? (
              <LoadingState>
                <LoadingSpinner />
              </LoadingState>
            ) : comments.length === 0 ? (
              <EmptyState>
                <EmptyIcon>🖋️</EmptyIcon>
                <EmptyTitle>No thoughts yet</EmptyTitle>
                <EmptySubtitle>Begin the discussion below.</EmptySubtitle>
              </EmptyState>
            ) : (
              <CommentsList>
                {comments.map((comment) => {
                  const a = comment.author || {};
                  // Lock author check to your specific name or username
                  const isAuthor =
                    a.username === 'andy' || a.name === 'Andrew Butler';
                  return (
                    <CommentItem key={comment._id}>
                      <CommentAvatarContainer isAuthor={isAuthor}>
                        <CommentAvatar src={a.avatar || AVATAR_FALLBACK} />
                      </CommentAvatarContainer>
                      <CommentBody>
                        <CommentHead>
                          <AuthorName>{a.name || 'User'}</AuthorName>
                          <TimeText>
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </TimeText>
                        </CommentHead>
                        <CommentText>{comment.text}</CommentText>
                        <CommentFooter>
                          <LikeBtn
                            onClick={() => onLikeComment(comment._id)}
                            liked={comment.hasLiked}
                          >
                            {comment.hasLiked ? <FaHeart /> : <FaRegHeart />}
                            {comment.likes > 0 && <span>{comment.likes}</span>}
                          </LikeBtn>
                          <ReplyBtn
                            onClick={() => {
                              setReplyingTo({ id: comment._id, author: a });
                              setNewComment(`@${a.name || 'user'} `);
                            }}
                          >
                            Reply
                          </ReplyBtn>
                          {user?.id === a?._id && (
                            <DeleteBtn
                              onClick={() => onDeleteComment(comment._id)}
                            >
                              <FaTrash />
                            </DeleteBtn>
                          )}
                        </CommentFooter>
                      </CommentBody>
                    </CommentItem>
                  );
                })}
              </CommentsList>
            )}
          </CommentsArea>
        </ModalContent>

        <InputSection>
          {replyingTo && (
            <ReplyIndicator>
              <span>Replying to @{replyingTo.author.name}</span>
              <button onClick={() => setReplyingTo(null)}>
                <FaTimes />
              </button>
            </ReplyIndicator>
          )}
          <CommentForm onSubmit={handleSubmit}>
            <UserAvatar src={user?.avatar || AUTHOR_IMAGE} />
            <InputWrapper>
              <CommentInput
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder='Write a thought...'
              />
              <SubmitBtn
                type='submit'
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size='14px' />
                ) : (
                  <FaPaperPlane />
                )}
              </SubmitBtn>
            </InputWrapper>
          </CommentForm>
        </InputSection>
      </ModalContainer>
    </ModalOverlay>,
    document.body
  );
};

// ─── STYLED COMPONENTS ───

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
  ${(p) =>
    p.isClosing &&
    css`
      animation: ${fadeIn} 0.3s ease-out reverse;
    `}
`;

const ModalContainer = styled.div`
  width: 100%;
  max-width: 600px;
  height: 80vh;
  background: ${COLORS.cardBackground};
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  ${(p) =>
    p.isClosing &&
    css`
      animation: ${slideDown} 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    `}
`;

const DragHandle = styled.div`
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px auto;
  border-radius: 2px;
  flex-shrink: 0;
`;

const ModalHeader = styled.header`
  padding: 0 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
`;

const HeaderTitleArea = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.02em;
`;

const HeaderSubtitle = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.accentMint};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  font-size: 1.2rem;
  cursor: pointer;
`;

const ModalContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

// Removed PostContext to maximize comment space

const CommentsArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const CommentItem = styled.div`
  padding: 20px;
  display: flex;
  align-items: flex-start; /* CRITICAL: Aligns to top, prevents vertical stretching */
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
`;

const CommentAvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 40px; /* Locked width */
  height: 40px; /* Locked height */

  ${(p) =>
    p.isAuthor &&
    css`
      &::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 2px solid ${COLORS.primarySalmon};
        z-index: 1;
      }
    `}
`;

const CommentAvatar = styled.img`
  width: 40px;
  height: 40px; /* Force dimensions here too */
  border-radius: 50%;
  object-fit: cover;
  display: block;
  position: relative;
  z-index: 2;
  background: ${COLORS.cardBackground};
`;

const CommentBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommentHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
`;

const AuthorName = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const TimeText = styled.span`
  font-size: 0.7rem;
  color: ${COLORS.textTertiary};
`;

const CommentText = styled.p`
  font-size: 0.95rem;
  line-height: 1.55;
  color: ${COLORS.textSecondary};
  margin-bottom: 10px;
  word-wrap: break-word;
`;

const CommentFooter = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const LikeBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => (p.liked ? COLORS.primarySalmon : COLORS.textTertiary)};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  span {
    font-size: 0.75rem;
    font-weight: 700;
  }
`;

const ReplyBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  cursor: pointer;
`;

const InputSection = styled.div`
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: ${COLORS.cardBackground};
  flex-shrink: 0;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid ${COLORS.primarySalmon};
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CommentInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  outline: none;
`;

const SubmitBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${COLORS.primaryMint};
  color: #000;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: ${COLORS.textTertiary};
    cursor: default;
  }
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid ${COLORS.primaryMint};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  padding: 60px;
`;

const EmptyState = styled.div`
  padding: 80px 40px;
  text-align: center;
`;
const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 16px;
  opacity: 0.3;
`;
const EmptyTitle = styled.h4`
  color: ${COLORS.textPrimary};
  margin-bottom: 4px;
`;
const EmptySubtitle = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.85rem;
`;

const ReplyIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 14px;
  background: ${COLORS.primaryMint}15;
  border-radius: 12px;
  margin-bottom: 12px;
  span {
    font-size: 0.75rem;
    color: ${COLORS.primaryMint};
    font-weight: 700;
  }
  button {
    background: none;
    border: none;
    color: ${COLORS.textTertiary};
    cursor: pointer;
  }
`;
