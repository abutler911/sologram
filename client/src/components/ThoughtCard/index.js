// Beautiful ThoughtCard aligned with your salmon/khaki/mint/blue-gray theme
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
import { COLORS } from "../../theme";
import { toast } from "react-hot-toast";

// Gentle animations that complement your theme
const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(1deg); }
`;

const subtleGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 20px ${COLORS.shadow}; }
  50% { box-shadow: 0 8px 30px rgba(232, 137, 115, 0.15); }
`;

const heartPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// Main card with your theme colors
const Card = styled.div`
  position: relative;
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  padding: 1.5rem;
  width: 95%;
  max-width: 600px;
  margin: 1.25rem auto;
  box-shadow: 0 4px 20px ${COLORS.shadow};
  border: 1px solid ${COLORS.border};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      ${COLORS.primarySalmon},
      ${COLORS.accentSalmon},
      ${COLORS.primaryMint},
      ${COLORS.primaryBlueGray}
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    border-color: ${COLORS.primaryMint};

    &::before {
      opacity: 1;
    }
  }

  ${(props) =>
    props.pinned &&
    css`
      border: 2px solid ${COLORS.primaryBlueGray};
      background: linear-gradient(
        135deg,
        ${COLORS.cardBackground} 0%,
        #f9f9f9 100%
      );
      animation: ${subtleGlow} 3s ease-in-out infinite;

      &::before {
        opacity: 1;
        height: 4px;
      }
    `}
`;

// Mood decoration with theme colors
const MoodDecoration = styled.div`
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  font-size: 3.5rem;
  opacity: 0.08;
  z-index: 1;
  pointer-events: none;
  animation: ${gentleFloat} 6s ease-in-out infinite;
  transition: all 0.5s ease;
  color: ${COLORS.primaryBlueGray};

  ${Card}:hover & {
    opacity: 0.12;
    transform: scale(1.1) rotate(10deg);
    color: ${COLORS.primarySalmon};
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
    right: 1rem;
    top: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  position: relative;
  z-index: 3;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

// Avatar with your theme's accent colors
const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${COLORS.primaryMint};
  background: ${COLORS.elevatedBackground};
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 20px rgba(232, 137, 115, 0.3);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}
  );
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
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

// Clean, readable username with your text colors
const Username = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${COLORS.textPrimary};
`;

const UserHandle = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.85rem;
`;

// Action buttons with your theme colors
const ActionButton = styled.button`
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textSecondary};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover {
    color: ${COLORS.textPrimary};
    background: ${COLORS.buttonHover};
    border-color: ${COLORS.primaryMint};
    transform: translateY(-2px);
  }

  &.delete:hover {
    color: ${COLORS.error};
    background: rgba(217, 83, 79, 0.1);
    border-color: ${COLORS.error};
  }

  &.pinned {
    color: ${COLORS.primaryBlueGray};
    background: rgba(101, 142, 169, 0.1);
    border-color: ${COLORS.primaryBlueGray};
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: 0.4rem;
  z-index: 3;
  position: relative;
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

// Highly readable content with proper contrast
const Content = styled.p`
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 1.25rem 0;
  position: relative;
  z-index: 2;
  font-weight: 400;
  letter-spacing: 0.2px;
`;

// Media container with theme styling
const Media = styled.div`
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  box-shadow: 0 4px 20px ${COLORS.shadow};
  border: 1px solid ${COLORS.border};

  img {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    vertical-align: middle;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }
`;

// Tags with your beautiful theme colors
const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.5rem 0;
  position: relative;
  z-index: 2;
`;

const Tag = styled.span`
  background: ${COLORS.primaryKhaki};
  color: ${COLORS.textPrimary};
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid ${COLORS.border};

  &:hover {
    background: ${COLORS.primaryMint};
    color: ${COLORS.textPrimary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(136, 178, 204, 0.3);
    border-color: ${COLORS.primaryBlueGray};
  }
`;

// Mood indicator with theme colors
const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${COLORS.primaryBlueGray};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
  background: ${COLORS.accentMint};
  border: 1px solid ${COLORS.primaryMint};
  transition: all 0.3s ease;

  &:hover {
    background: ${COLORS.primaryMint};
    transform: scale(1.02);
  }
`;

const TimeDisplay = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.8rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 0.8rem;
    color: ${COLORS.textTertiary};
  }
`;

// Action bar with clean theme styling
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid ${COLORS.divider};
  padding-top: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    justify-content: space-around;
    gap: 0.5rem;
  }
`;

const ActionIcon = styled.div`
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  transition: all 0.3s ease;
  font-size: 1rem;

  ${(props) =>
    props.animating &&
    css`
      animation: ${heartPulse} 0.6s ease;
      color: ${COLORS.heartRed};
    `}

  ${(props) =>
    props.active &&
    css`
      color: ${COLORS.primarySalmon};
    `}
`;

const ActionCount = styled.span`
  color: ${COLORS.textSecondary};
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.3s ease;
`;

// Clean action items with theme colors
const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;

  &:hover {
    background: ${COLORS.elevatedBackground};

    ${ActionIcon} {
      color: ${COLORS.primarySalmon};
    }

    ${ActionCount} {
      color: ${COLORS.textPrimary};
    }
  }

  &.bookmark:hover ${ActionIcon} {
    color: ${COLORS.primaryBlueGray};
  }

  &.retweet:hover ${ActionIcon} {
    color: ${COLORS.primaryMint};
  }

  &.share:hover ${ActionIcon} {
    color: ${COLORS.primaryBlueGray};
  }
`;

// Pinned badge with your theme
const PinnedBadge = styled.div`
  position: absolute;
  top: -1px;
  right: 2rem;
  background: ${COLORS.primaryBlueGray};
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(101, 142, 169, 0.3);
  z-index: 10;

  &:before {
    content: "📌";
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    right: 1rem;
    padding: 0.3rem 0.8rem;
    font-size: 0.7rem;
  }
`;

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
        toast.success("Shared successfully!");
      })
      .catch((err) => {
        console.error("Error sharing:", err);
        toast.error("Failed to share");
      });
  } else {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  }
};

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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  window.confirm(
                    "Are you sure you want to delete this thought?"
                  )
                ) {
                  onDelete(thought._id);
                }
              }}
              title="Delete"
              className="delete"
              type="button"
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

        <ActionItem
          className="retweet"
          onClick={() => handleRetweet(thought._id)}
        >
          <ActionIcon>
            <FaRetweet />
          </ActionIcon>
          <ActionCount>{thought.shares || 0}</ActionCount>
        </ActionItem>

        <ActionItem className="bookmark" onClick={onBookmarkClick}>
          <ActionIcon active={isBookmarked}>
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </ActionIcon>
        </ActionItem>

        <ActionItem className="share" onClick={() => handleShare(thought)}>
          <ActionIcon>
            <FaShare />
          </ActionIcon>
        </ActionItem>
      </ActionBar>
    </Card>
  );
};

export default ThoughtCard;
