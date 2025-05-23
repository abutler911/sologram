// Amazing ThoughtCard Redesign with Modern Glass Morphism & Dynamic Elements
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled, { css, keyframes } from "styled-components";
import {
  FaHeart,
  FaTrash,
  FaEdit,
  FaClock,
  FaRetweet,
  FaShare,
  FaRegHeart,
  FaRegComment,
  FaStar,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import { moodEmojis } from "../../utils/themeConstants";
import twilightTheme from "../../twilightTheme";
import { toast } from "react-hot-toast";

const { colors, animations, mixins } = twilightTheme;

// Advanced animations
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(148, 111, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(148, 111, 246, 0.6); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-3px) rotate(1deg); }
  66% { transform: translateY(1px) rotate(-1deg); }
`;

const ripple = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
`;

// Main card with glassmorphism effect
const Card = styled.div`
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  width: 95%;
  max-width: 600px;
  margin: 1.5rem auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${animations.fadeIn} 0.6s ease-out;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
      0 0 40px rgba(148, 111, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(148, 111, 246, 0.3);
  }

  ${(props) =>
    props.pinned &&
    css`
      background: linear-gradient(
        135deg,
        rgba(148, 111, 246, 0.15) 0%,
        rgba(42, 250, 223, 0.1) 100%
      );
      border: 2px solid ${colors.secondaryAccent};
      animation: ${glow} 2s ease-in-out infinite;
    `}
`;

// Floating mood decoration with enhanced animation
const MoodDecoration = styled.div`
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  font-size: 4rem;
  opacity: 0.15;
  z-index: 1;
  pointer-events: none;
  animation: ${float} 4s ease-in-out infinite;
  filter: drop-shadow(0 0 20px ${colors.secondaryAccent});
  transition: all 0.5s ease;

  ${Card}:hover & {
    opacity: 0.25;
    transform: scale(1.2) rotate(15deg);
    filter: drop-shadow(0 0 30px ${colors.primaryAccent});
  }

  @media (max-width: 768px) {
    font-size: 3rem;
    right: 1rem;
    top: 1rem;
  }
`;

// Enhanced header with better spacing
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  position: relative;
  z-index: 3;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

// Premium avatar with gradient ring
const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(
    45deg,
    ${colors.primaryAccent},
    ${colors.secondaryAccent}
  );
  padding: 3px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 25px rgba(148, 111, 246, 0.5);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    ${colors.primaryAccent},
    ${colors.secondaryAccent}
  );
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: bold;
  border-radius: 50%;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UsernameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
`;

const Username = styled.div`
  font-weight: 700;
  font-size: 1.2rem;
  color: ${colors.textPrimary};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(
    45deg,
    ${colors.textPrimary},
    ${colors.primaryAccent}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const UserHandle = styled.div`
  color: ${colors.textSecondary};
  font-size: 0.9rem;
  opacity: 0.8;
`;

// Enhanced action buttons with ripple effect
const ActionButton = styled.button`
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${colors.textTertiary};
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    transform: translate(-50%, -50%);
  }

  &:hover {
    color: ${colors.primaryAccent};
    background: rgba(148, 111, 246, 0.2);
    border-color: ${colors.primaryAccent};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(148, 111, 246, 0.3);

    &::before {
      width: 100%;
      height: 100%;
    }
  }

  &:active {
    transform: translateY(0px);
  }

  &.delete:hover {
    color: ${colors.error};
    background: rgba(255, 77, 77, 0.2);
    border-color: ${colors.error};
  }

  &.pinned {
    color: ${colors.secondaryAccent};
    background: rgba(42, 250, 223, 0.2);
    border-color: ${colors.secondaryAccent};
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: 0.75rem;
  z-index: 3;
  position: relative;
`;

// Enhanced content with better typography
const Content = styled.p`
  color: ${colors.textPrimary};
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 1.25rem 0;
  position: relative;
  z-index: 2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  font-weight: 400;
  letter-spacing: 0.3px;

  &::first-letter {
    font-size: 1.2em;
    font-weight: 600;
    color: ${colors.primaryAccent};
  }
`;

// Premium media container
const Media = styled.div`
  margin: 1.5rem 0;
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  background: rgba(0, 0, 0, 0.1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    pointer-events: none;
    z-index: 1;
  }

  img {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    vertical-align: middle;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.05);
    }
  }
`;

// Redesigned tags with gradient backgrounds
const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.5rem 0;
  position: relative;
  z-index: 2;
`;

const Tag = styled.span`
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(148, 111, 246, 0.2),
    rgba(42, 250, 223, 0.1)
  );
  color: ${colors.primaryAccent};
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid rgba(148, 111, 246, 0.3);
  backdrop-filter: blur(10px);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(148, 111, 246, 0.4),
      rgba(42, 250, 223, 0.2)
    );
    color: ${colors.highlightAccent};
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(148, 111, 246, 0.4);
    border-color: ${colors.primaryAccent};

    &::before {
      left: 100%;
    }
  }
`;

// Enhanced mood indicator
const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${colors.secondaryAccent};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(42, 250, 223, 0.15),
    rgba(148, 111, 246, 0.1)
  );
  border: 1px solid rgba(42, 250, 223, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(42, 250, 223, 0.3);
  }
`;

// Enhanced time display
const TimeDisplay = styled.div`
  color: ${colors.textSecondary};
  font-size: 0.8rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.8;

  svg {
    font-size: 0.85rem;
    opacity: 0.7;
  }
`;

// Premium action bar
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  margin-top: 1rem;
  backdrop-filter: blur(10px);

  @media (max-width: 480px) {
    justify-content: space-around;
    gap: 0.5rem;
  }
`;

// Enhanced action icons with better animations
const ActionIcon = styled.div`
  color: ${(props) =>
    props.active ? colors.primaryAccent : colors.textTertiary};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.1rem;
  position: relative;

  ${(props) =>
    props.animating &&
    css`
      animation: ${ripple} 0.6s ease-out;
      color: ${colors.primaryAccent};
    `}

  ${(props) =>
    props.active &&
    css`
      color: ${colors.primaryAccent};
      filter: drop-shadow(0 0 8px ${colors.primaryAccent});
      animation: ${float} 2s ease-in-out infinite;
    `}
`;

const ActionCount = styled.span`
  color: ${colors.textTertiary};
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.3s ease;
`;

// Premium action items with hover effects
const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 70px;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(148, 111, 246, 0.1),
      rgba(42, 250, 223, 0.05)
    );
    border-radius: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background: rgba(148, 111, 246, 0.1);
    border-color: rgba(148, 111, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(148, 111, 246, 0.2);

    &::before {
      opacity: 1;
    }

    ${ActionIcon} {
      color: ${colors.primaryAccent};
      transform: scale(1.1);
    }

    ${ActionCount} {
      color: ${colors.textPrimary};
    }
  }

  &:active {
    transform: translateY(0px);
  }
`;

// Enhanced pinned badge
const PinnedBadge = styled.div`
  position: absolute;
  top: -2px;
  right: 2rem;
  background: linear-gradient(
    135deg,
    ${colors.primaryAccent},
    ${colors.secondaryAccent}
  );
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 1.5rem;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 25px rgba(148, 111, 246, 0.4);
  z-index: 10;
  animation: ${glow} 3s ease-in-out infinite;

  &:before {
    content: "📌";
    margin-right: 0.5rem;
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    right: 1rem;
    padding: 0.4rem 1rem;
    font-size: 0.75rem;
  }
`;

// Enhanced share function
const handleShare = (thought) => {
  const shareText = `"${thought.content}" - via SoloThoughts`;
  const shareUrl = window.location.origin + `/thoughts/${thought._id}`;

  if (navigator.share) {
    navigator
      .share({
        title: "SoloThought",
        text: shareText,
        url: shareUrl,
      })
      .then(() => {
        toast.success("Shared successfully! ✨");
      })
      .catch((err) => {
        console.error("Error sharing:", err);
        toast.error("Failed to share");
      });
  } else {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success("Link copied to clipboard! 📋");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  }
};

// Main component with enhanced interactions
const ThoughtCard = ({
  thought,
  defaultUser,
  formatDate,
  handleLike,
  handleRetweet,
  handlePin,
  canCreateThought,
  onDelete,
}) => {
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const onLikeClick = (id) => {
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 600);
    handleLike(id);
  };

  const onBookmarkClick = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(
      isBookmarked ? "Removed from bookmarks" : "Added to bookmarks"
    );
  };

  return (
    <Card pinned={thought.pinned}>
      {thought.pinned && <PinnedBadge>Pinned</PinnedBadge>}

      <Header>
        <UserInfo>
          <Avatar>
            {defaultUser.avatar ? (
              <img src={defaultUser.avatar} alt="User avatar" />
            ) : (
              <DefaultAvatar>
                <span>{defaultUser.username.charAt(0).toUpperCase()}</span>
              </DefaultAvatar>
            )}
          </Avatar>
          <UserDetails>
            <UsernameRow>
              <Username>{defaultUser.username}</Username>
              <UserHandle>
                @{defaultUser.username.toLowerCase().replace(/\s+/g, "")}
              </UserHandle>
            </UsernameRow>

            {thought.mood && (
              <MoodIndicator>
                {moodEmojis[thought.mood]} {thought.mood}
              </MoodIndicator>
            )}
          </UserDetails>
        </UserInfo>

        {canCreateThought && (
          <AdminActions>
            <ActionButton
              onClick={() => handlePin(thought._id)}
              title={thought.pinned ? "Unpin" : "Pin"}
              className={thought.pinned ? "pinned" : ""}
            >
              {thought.pinned ? <FaStar /> : "📌"}
            </ActionButton>
            <ActionButton
              as={Link}
              to={`/thoughts/edit/${thought._id}`}
              title="Edit"
            >
              <FaEdit />
            </ActionButton>
            <ActionButton
              onClick={() => onDelete(thought._id)}
              title="Delete"
              className="delete"
            >
              <FaTrash />
            </ActionButton>
          </AdminActions>
        )}
      </Header>

      {thought.mood && (
        <MoodDecoration>{moodEmojis[thought.mood]}</MoodDecoration>
      )}

      <Content>{thought.content}</Content>

      {thought.media?.mediaUrl && (
        <Media>
          <img src={thought.media.mediaUrl} alt="Thought media" />
        </Media>
      )}

      {thought.tags && thought.tags.length > 0 && (
        <Tags>
          {thought.tags.map((tag, index) => (
            <Tag key={index}>#{tag}</Tag>
          ))}
        </Tags>
      )}

      <TimeDisplay>
        <FaClock /> {formatDate(thought.createdAt)}
      </TimeDisplay>

      <ActionBar>
        <ActionItem onClick={() => onLikeClick(thought._id)}>
          <ActionIcon active={thought.userHasLiked} animating={isLikeAnimating}>
            {thought.userHasLiked ? <FaHeart /> : <FaRegHeart />}
          </ActionIcon>
          <ActionCount>{thought.likes}</ActionCount>
        </ActionItem>

        <ActionItem>
          <ActionIcon>
            <FaRegComment />
          </ActionIcon>
          <ActionCount>{thought.comments?.length || 0}</ActionCount>
        </ActionItem>

        <ActionItem onClick={() => handleRetweet(thought._id)}>
          <ActionIcon>
            <FaRetweet />
          </ActionIcon>
          <ActionCount>{thought.shares || 0}</ActionCount>
        </ActionItem>

        <ActionItem onClick={onBookmarkClick}>
          <ActionIcon active={isBookmarked}>
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </ActionIcon>
        </ActionItem>

        <ActionItem onClick={() => handleShare(thought)}>
          <ActionIcon>
            <FaShare />
          </ActionIcon>
        </ActionItem>
      </ActionBar>
    </Card>
  );
};

export default ThoughtCard;
