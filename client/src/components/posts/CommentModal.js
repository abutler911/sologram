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

// ─── NOIR tokens ──────────────────────────────────────────────────────────────
const NOIR = {
  ink: '#0a0a0b',
  paper: '#141413', // slightly lighter than ink — card bg
  lifted: '#1c1b19', // elevated surface
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  border: 'rgba(250,249,247,0.06)',
  salmon: '#e87c5a',
  sage: '#7aab8c',
};

// ─── Animations ───────────────────────────────────────────────────────────────
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
          <AuthorName $isAuthor={isAuthor}>{a.name || 'User'}</AuthorName>
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
            {expanded ? 'Hide' : `${count}`} {count === 1 ? 'reply' : 'replies'}
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
      await onAddComment({ text, parentId: replyingTo?.id || null });
      setNewComment('');
      setReplyingTo(null);
    } catch {
      // toast already fired upstream
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
      <Sheet onClick={(e) => e.stopPropagation()} $closing={isClosing}>
        {/* Salmon + sage accent line at very top of sheet */}
        <SheetAccent />

        {/* Drag handle */}
        <Handle />

        <Header>
          <HeaderLeft>
            <HeaderTitle>Conversation</HeaderTitle>
            {post?.title && <HeaderSub>{post.title}</HeaderSub>}
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
              <EmptyRule />
              <EmptyTitle>No thoughts yet.</EmptyTitle>
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
              <span>Replying to {replyingTo.author?.name || 'user'}</span>
              <button onClick={clearReply}>
                <FaTimes />
              </button>
            </ReplyBanner>
          )}
          <Form onSubmit={handleSubmit}>
            <UserAvatar src={user?.avatar || AVATAR_FALLBACK} alt='You' />
            <InputWrap $focused={false}>
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
                }}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.author?.name || 'user'}...`
                    : 'Write a thought...'
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
      </Sheet>
    </Overlay>,
    document.body
  );
};

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 11, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.25s ease-out;
`;

const Sheet = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 80vh;
  background: ${NOIR.paper};
  border-top: 1px solid ${NOIR.border};
  display: flex;
  flex-direction: column;
  /* Sharp top corners — no rounding, matches NOIR aesthetic */
  border-radius: 0;
  animation: ${(p) => (p.$closing ? slideDown : slideUp)} 0.35s
    cubic-bezier(0.19, 1, 0.22, 1) ${(p) => (p.$closing ? 'forwards' : '')};
  /* Bottom drop shadow in salmon like PostCard */
  box-shadow: 0 -1px 0 0 ${NOIR.salmon}, 0 -24px 60px rgba(10, 10, 11, 0.5);
`;

/* Salmon → sage gradient rule at top of sheet */
const SheetAccent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, ${NOIR.salmon} 0%, ${NOIR.sage} 100%);
  pointer-events: none;
`;

const Handle = styled.div`
  width: 32px;
  height: 2px;
  background: ${NOIR.border};
  margin: 14px auto 0;
  flex-shrink: 0;
`;

const Header = styled.header`
  padding: 14px 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid ${NOIR.border};
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const HeaderTitle = styled.h2`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 600;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  color: ${NOIR.warmWhite};
  margin: 0;
  line-height: 1.1;
`;

const HeaderSub = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  opacity: 0.7;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${NOIR.ash};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
  line-height: 1;

  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: ${NOIR.border} transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${NOIR.border};
    border-radius: 2px;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Group = styled.div`
  border-bottom: 1px solid ${NOIR.border};
`;

const CommentItem = styled.div`
  padding: ${(p) => (p.$isReply ? '10px 20px 10px 52px' : '18px 20px')};
  display: flex;
  align-items: flex-start;
  gap: 12px;

  ${(p) =>
    p.$isReply &&
    css`
      background: rgba(250, 249, 247, 0.01);
      border-left: 1px solid ${NOIR.border};
      margin-left: 20px;
    `}
`;

const CommentAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 34px;

  /* Salmon ring for Andrew's comments */
  ${(p) =>
    p.$isAuthor &&
    css`
      &::after {
        content: '';
        position: absolute;
        inset: -2px;
        border: 1.5px solid ${NOIR.salmon};
        z-index: 1;
      }
    `}
`;

const CommentAvatar = styled.img`
  width: 34px;
  height: 34px;
  object-fit: cover;
  display: block;
  position: relative;
  z-index: 2;
  background: ${NOIR.lifted};
`;

const CommentBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommentHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
`;

const AuthorName = styled.span`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => (p.$isAuthor ? NOIR.salmon : NOIR.warmWhite)};
  letter-spacing: 0.01em;
`;

const TimeText = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 300;
  color: ${NOIR.ash};
  opacity: 0.6;
  letter-spacing: 0.04em;
`;

const CommentText = styled.p`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.88rem;
  line-height: 1.6;
  color: rgba(250, 249, 247, 0.72);
  margin-bottom: 10px;
  word-wrap: break-word;
`;

const CommentFooter = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
`;

const LikeBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${(p) => (p.$liked ? NOIR.salmon : NOIR.ash)};
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s, transform 0.15s;
  opacity: ${(p) => (p.$liked ? 1 : 0.5)};

  &:hover {
    color: ${NOIR.salmon};
    opacity: 1;
    transform: scale(1.05);
  }

  span {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    font-weight: 400;
  }
`;

const ReplyBtn = styled.button`
  background: none;
  border: none;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s, color 0.15s;

  &:hover {
    opacity: 1;
    color: ${NOIR.warmWhite};
  }
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${NOIR.ash};
  font-size: 0.7rem;
  cursor: pointer;
  opacity: 0.2;
  transition: opacity 0.2s, color 0.2s;

  &:hover {
    opacity: 1;
    color: ${NOIR.salmon};
  }
`;

const RepliesWrap = styled.div`
  padding: 0 20px 8px 52px;
`;

const ViewRepliesBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  opacity: 0.5;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0 10px;
  transition: opacity 0.15s, color 0.15s;

  &:hover {
    opacity: 1;
    color: ${NOIR.sage};
  }
`;

const MiniSpinner = styled.div`
  width: 10px;
  height: 10px;
  border: 1.5px solid ${NOIR.border};
  border-top-color: ${NOIR.sage};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

// ─── Input area ───────────────────────────────────────────────────────────────

const InputArea = styled.div`
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid ${NOIR.border};
  background: ${NOIR.paper};
  flex-shrink: 0;
`;

const ReplyBanner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  background: rgba(122, 171, 140, 0.08);
  border-left: 2px solid ${NOIR.sage};
  margin-bottom: 12px;

  span {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${NOIR.sage};
  }

  button {
    background: none;
    border: none;
    color: ${NOIR.ash};
    cursor: pointer;
    opacity: 0.5;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    transition: opacity 0.15s;
    &:hover {
      opacity: 1;
    }
  }
`;

const Form = styled.form`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const UserAvatar = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  flex-shrink: 0;
  /* Square with salmon border — matches PostCard author treatment */
  border: 1px solid ${NOIR.salmon};
`;

const InputWrap = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: ${NOIR.lifted};
  border: 1px solid ${NOIR.border};
  padding: 0 0 0 14px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: rgba(122, 171, 140, 0.3);
  }
`;

const Input = styled.input`
  flex: 1;
  background: none;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.875rem;
  color: ${NOIR.warmWhite};
  outline: none;
  padding: 10px 0;

  &::placeholder {
    color: ${NOIR.ash};
    opacity: 0.4;
  }
`;

const SendBtn = styled.button`
  width: 38px;
  height: 38px;
  background: ${NOIR.salmon};
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.15s;

  &:hover:not(:disabled) {
    background: #d4694a;
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${NOIR.lifted};
    color: ${NOIR.ash};
    opacity: 0.4;
    cursor: default;
    transform: none;
  }
`;

// ─── States ───────────────────────────────────────────────────────────────────

const Spinner = styled.div`
  width: 22px;
  height: 22px;
  border: 1.5px solid ${NOIR.border};
  border-top-color: ${NOIR.sage};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const SmallSpinner = styled(Spinner)`
  width: 12px;
  height: 12px;
`;

const CenterBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
`;

const EmptyBox = styled.div`
  padding: 60px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

/* Short horizontal rule in place of emoji */
const EmptyRule = styled.div`
  width: 32px;
  height: 1px;
  background: linear-gradient(90deg, ${NOIR.salmon}, ${NOIR.sage});
  margin-bottom: 4px;
`;

const EmptyTitle = styled.h4`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 500;
  font-size: 1.2rem;
  color: ${NOIR.warmWhite};
  margin: 0;
  opacity: 0.5;
`;

const EmptySub = styled.p`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${NOIR.ash};
  margin: 0;
  opacity: 0.4;
`;
