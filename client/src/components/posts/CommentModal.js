import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaPaperPlane,
  FaTrash,
  FaChevronDown,
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { COLORS } from '../../theme';
import authorImg from '../../assets/andy.jpg';

const AVATAR_FALLBACK = authorImg;

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{transform:translateY(100%)}to{transform:translateY(0)}`;
const slideDown = keyframes`from{transform:translateY(0)}to{transform:translateY(100%)}`;
const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;

// ─── CommentRow ──────────────────────────────────────────────────────────────
const CommentRow = ({
  comment,
  user,
  onLike,
  onDelete,
  onReply,
  isReply = false,
}) => {
  const a = comment.author || {};
  const isOwner = user?.id && a?._id && user.id.toString() === a._id.toString();
  const isAuthor = a.username === 'andy' || a.name === 'Andrew Butler';

  return (
    <CommentItem $isReply={isReply}>
      <CommentAvatarWrap $isAuthor={isAuthor && !isReply}>
        <CommentAvatar
          src={a.avatar || AVATAR_FALLBACK}
          alt={a.name || 'User'}
        />
      </CommentAvatarWrap>
      <CommentBody>
        <CommentHead>
          <AuthorName>{a.name || 'User'}</AuthorName>
          <TimeText>
            {comment.createdAt
              ? formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })
              : ''}
          </TimeText>
        </CommentHead>
        <CommentText>{comment.text}</CommentText>
        <CommentFooter>
          <LikeBtn
            onClick={() => onLike(comment._id)}
            $liked={comment.hasLiked}
          >
            {comment.hasLiked ? <FaHeart /> : <FaRegHeart />}
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </LikeBtn>
          {!isReply && (
            <ReplyBtn onClick={() => onReply(comment)}>Reply</ReplyBtn>
          )}
          {isOwner && (
            <DeleteBtn onClick={() => onDelete(comment._id)}>
              <FaTrash />
            </DeleteBtn>
          )}
        </CommentFooter>
      </CommentBody>
    </CommentItem>
  );
};

// ─── RepliesSection ──────────────────────────────────────────────────────────
const RepliesSection = ({ comment, user, onLike, onDelete }) => {
  const [replies, setReplies] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const count = comment.replyCount || 0;
  if (count === 0) return null;

  const handleExpand = async () => {
    if (!loaded) {
      setLoading(true);
      try {
        const data = await api.getReplies(comment._id);
        setReplies(data.replies || []);
        setLoaded(true);
      } catch {
        toast.error('Could not load replies');
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  const handleLikeReply = async (replyId) => {
    try {
      const data = await api.likeComment(replyId);
      setReplies((prev) =>
        prev.map((r) => (r._id === replyId ? data.comment : r))
      );
    } catch (err) {
      console.error('[likeReply]', err);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await api.deleteComment(replyId);
      setReplies((prev) => prev.filter((r) => r._id !== replyId));
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  return (
    <RepliesWrap>
      <ViewRepliesBtn onClick={handleExpand}>
        {loading ? (
          <MiniSpinner />
        ) : (
          <>
            <FaChevronDown
              style={{
                transition: '0.2s',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            />
            {expanded ? 'Hide' : `View ${count}`}{' '}
            {count === 1 ? 'reply' : 'replies'}
          </>
        )}
      </ViewRepliesBtn>
      {expanded &&
        replies.map((r) => (
          <CommentRow
            key={r._id}
            comment={r}
            user={user}
            onLike={handleLikeReply}
            onDelete={handleDeleteReply}
            onReply={() => {}}
            isReply
          />
        ))}
    </RepliesWrap>
  );
};

// ─── CommentModal ─────────────────────────────────────────────────────────────
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
  const inputRef = useRef(null);

  // Lock scroll, focus input, Escape key
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    const onEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    if (!isAuthenticated) {
      toast.error('You must be logged in to comment');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        text,
        parentId: replyingTo?.id || null,
      });
      setNewComment('');
      setReplyingTo(null);
    } catch {
      // toast already fired in PostCard's handleAddComment
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = useCallback((comment) => {
    const a = comment?.author || {};
    setReplyingTo({ id: comment._id, author: a });
    setNewComment(`@${a.name || 'user'} `);
    inputRef.current?.focus();
  }, []);

  const clearReply = useCallback(() => {
    setReplyingTo(null);
    setNewComment('');
  }, []);

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <Overlay onClick={handleClose} $closing={isClosing}>
      <Container onClick={(e) => e.stopPropagation()} $closing={isClosing}>
        <DragHandle />

        <Header>
          <HeaderLeft>
            <HeaderTitle>Conversation</HeaderTitle>
            <HeaderSub>{post?.title || 'Sologram Log'}</HeaderSub>
          </HeaderLeft>
          <CloseBtn onClick={handleClose} aria-label='Close'>
            <FaTimes />
          </CloseBtn>
        </Header>

        <ScrollArea>
          {isLoading ? (
            <CenterBox>
              <Spinner />
            </CenterBox>
          ) : comments.length === 0 ? (
            <EmptyBox>
              <EmptyIcon>🖋️</EmptyIcon>
              <EmptyTitle>No thoughts yet</EmptyTitle>
              <EmptySub>Begin the discussion below.</EmptySub>
            </EmptyBox>
          ) : (
            <List>
              {comments.map((c) => (
                <Group key={c._id}>
                  <CommentRow
                    comment={c}
                    user={user}
                    onLike={onLikeComment}
                    onDelete={onDeleteComment}
                    onReply={handleReply}
                  />
                  <RepliesSection
                    comment={c}
                    user={user}
                    onLike={onLikeComment}
                    onDelete={onDeleteComment}
                  />
                </Group>
              ))}
            </List>
          )}
        </ScrollArea>

        <InputArea>
          {replyingTo && (
            <ReplyBanner>
              <span>Replying to @{replyingTo.author?.name || 'user'}</span>
              <button onClick={clearReply}>
                <FaTimes />
              </button>
            </ReplyBanner>
          )}
          <Form onSubmit={handleSubmit}>
            <UserAvatar src={user?.avatar || AVATAR_FALLBACK} alt='You' />
            <InputWrap>
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
                }}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.author?.name || 'user'}…`
                    : 'Write a thought…'
                }
              />
              <SendBtn
                type='submit'
                disabled={!newComment.trim() || isSubmitting}
                aria-label='Post comment'
              >
                {isSubmitting ? <SmallSpinner /> : <FaPaperPlane />}
              </SendBtn>
            </InputWrap>
          </Form>
        </InputArea>
      </Container>
    </Overlay>,
    document.body
  );
};

// ─── Styled Components ───────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out ${(p) => p.$closing && css`reverse`};
`;
const Container = styled.div`
  width: 100%;
  max-width: 600px;
  height: 80vh;
  background: ${COLORS.cardBackground};
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: ${(p) => (p.$closing ? slideDown : slideUp)} 0.4s
    cubic-bezier(0.19, 1, 0.22, 1) ${(p) => p.$closing && 'forwards'};
`;
const DragHandle = styled.div`
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px auto;
  border-radius: 2px;
  flex-shrink: 0;
`;
const Header = styled.header`
  padding: 0 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
`;
const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;
const HeaderTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.02em;
`;
const HeaderSub = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.accentMint};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  font-size: 1.2rem;
  cursor: pointer;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;
const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;
const List = styled.div`
  display: flex;
  flex-direction: column;
`;
const Group = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
`;
const CommentItem = styled.div`
  padding: ${(p) => (p.$isReply ? '12px 20px 12px 56px' : '20px')};
  display: flex;
  align-items: flex-start;
  gap: 12px;
  ${(p) =>
    p.$isReply &&
    css`
      background: rgba(255, 255, 255, 0.01);
    `}
`;
const CommentAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  ${(p) =>
    p.$isAuthor &&
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
  height: 40px;
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
  cursor: pointer;
  color: ${(p) => (p.$liked ? COLORS.primarySalmon : COLORS.textTertiary)};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.05);
  }
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
  &:hover {
    color: ${COLORS.textPrimary};
  }
`;
const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;
const RepliesWrap = styled.div`
  padding: 0 20px 8px 56px;
`;
const ViewRepliesBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0 10px;
  &:hover {
    color: ${COLORS.primaryMint};
  }
`;
const MiniSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: ${COLORS.primaryMint};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
const InputArea = styled.div`
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: ${COLORS.cardBackground};
  flex-shrink: 0;
`;
const ReplyBanner = styled.div`
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
    display: flex;
    align-items: center;
  }
`;
const Form = styled.form`
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
const InputWrap = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s;
  &:focus-within {
    border-color: ${COLORS.primaryMint}50;
  }
`;
const Input = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  outline: none;
  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;
const SendBtn = styled.button`
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
  transition: all 0.2s;
  &:hover:not(:disabled) {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: ${COLORS.textTertiary};
    cursor: default;
  }
`;
const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: ${COLORS.primaryMint};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
const SmallSpinner = styled(Spinner)`
  width: 14px;
  height: 14px;
`;
const CenterBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
`;
const EmptyBox = styled.div`
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
  font-size: 1.1rem;
`;
const EmptySub = styled.p`
  color: ${COLORS.textTertiary};
  font-size: 0.85rem;
`;
