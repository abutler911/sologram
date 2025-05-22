// ThoughtCard with Twilight Theme
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
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
} from "react-icons/fa";
import { moodEmojis } from "../../utils/themeConstants";
import twilightTheme from "../../twilightTheme";
import { toast } from "react-hot-toast";

// Destructure theme components for easier access
const { colors, animations, mixins } = twilightTheme;

// Updated Card component with twilight theme
const Card = styled.div`
  position: relative;
  background-color: ${colors.cardBackground};
  border-radius: 12px;
  padding: 1rem;
  width: 95%;
  margin: 1rem auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
  animation: ${animations.fadeIn} 0.5s ease-out;

  ${mixins.hoverLift}

  ${(props) =>
    props.pinned &&
    css`
      border: 2px solid ${colors.secondaryAccent};
      background: linear-gradient(145deg, ${colors.cardBackground}, #222244);

      &:after {
        content: "📌";
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        font-size: 0.9rem;
      }
    `}
`;

const MoodDecoration = styled.div`
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  font-size: 3rem;
  opacity: 0.12;
  transform: rotate(10deg);
  z-index: 1; /* <- changed from -1 */
  pointer-events: none;
  animation: ${animations.float} 6s ease infinite;
  transition: all 0.5s ease;
  text-shadow: 0 0 15px ${colors.secondaryAccent};

  ${Card}:hover & {
    transform: rotate(15deg) scale(1.1);
    opacity: 0.18;
    text-shadow: 0 0 25px ${colors.secondaryAccent};
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
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

// Avatar with twilight glow
const Avatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${colors.secondaryAccent};
  box-shadow: 0 0 10px rgba(148, 111, 246, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Default avatar with twilight gradients
const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  ${mixins.accentGradient}
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UsernameRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const Username = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${colors.textPrimary};
  ${mixins.textGlow}
`;

const UserHandle = styled.div`
  color: ${colors.textSecondary};
  font-size: 0.85rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${colors.textTertiary};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover {
    color: ${colors.primaryAccent};
    background-color: ${colors.elevatedBackground};
    transform: translateY(-2px);
  }

  &.delete:hover {
    color: ${colors.error};
  }

  &.pinned {
    color: ${colors.secondaryAccent};
  }
`;

const AdminActionsRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
  align-items: center;
  flex-wrap: nowrap;

  ${ActionButton} {
    font-size: 1rem;
    padding: 0.3rem;
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  max-width: 100%;
  z-index: 2;
  position: relative;
`;

// Content with improved text styling
const Content = styled.p`
  color: ${colors.textPrimary};
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0.85rem 0;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

  &::first-letter {
    font-size: 1.5rem;
    font-weight: 500;
    color: ${colors.highlightAccent};
  }
`;

// Media with improved styling
const Media = styled.div`
  margin: 0.85rem 0;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  box-shadow: 0 4px 12px ${colors.shadow};
  border: 1px solid ${colors.border};

  img {
    width: 100%;
    max-height: 350px;
    object-fit: cover;
    vertical-align: middle;
    transition: transform 0.5s ease;

    &:hover {
      transform: scale(1.02);
    }
  }
`;

// Tags with twilight styling
const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1.5rem 0;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin: 1.25rem 0;
  }
`;

const Tag = styled.span`
  background-color: ${colors.elevatedBackground};
  color: ${colors.primaryAccent};
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid ${colors.border};

  &:hover {
    background-color: ${colors.buttonHover};
    color: ${colors.highlightAccent};
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(42, 250, 223, 0.2);
  }

  @media (max-width: 768px) {
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
  }
`;

// Mood indicator with twilight styling
const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${colors.secondaryAccent};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  background-color: ${colors.elevatedBackground};
  border: 1px solid ${colors.border};
  position: relative;
  transition: all 0.3s ease;
  ${mixins.subtleInteractive}
`;

// Stylized time display
const TimeDisplay = styled.div`
  color: ${colors.textSecondary};
  font-size: 0.85rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  svg {
    font-size: 0.75rem;
    opacity: 0.7;
  }
`;

// Action bar with twilight styling
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 1rem;
  border-top: 1px solid ${colors.divider};
  padding-top: 0.5rem;
  margin-top: 0.5rem;

  @media (max-width: 480px) {
    justify-content: space-around;
    gap: 0.5rem;
  }
`;

// Action Icon styling with twilight animation
const ActionIcon = styled.div`
  color: ${(props) =>
    props.active ? colors.primaryAccent : colors.textTertiary};
  transition: all 0.2s ease;
  font-size: 1.05rem;

  ${(props) =>
    props.animating &&
    css`
      animation: ${animations.pulse} 0.5s ease;
      color: ${colors.primaryAccent};
    `}

  ${(props) =>
    props.active &&
    css`
      filter: drop-shadow(0 0 5px ${colors.primaryAccent});
    `}
`;

const ActionCount = styled.span`
  color: ${colors.textTertiary};
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.2s ease;
`;

// Action items with improved hover effect
const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 60px;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  ${mixins.subtleInteractive}

  &:hover {
    ${ActionIcon} {
      color: ${colors.primaryAccent};
    }

    ${ActionCount} {
      color: ${colors.textPrimary};
    }
  }
`;

// Pinned badge with twilight styling
const PinnedBadge = styled.div`
  position: absolute;
  top: 0;
  right: 1.5rem;
  ${mixins.accentGradient}
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 12px ${colors.shadow};
  z-index: 10;

  &:before {
    content: "📌";
    margin-right: 5px;
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

// ThoughtCard component with twilight theme
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

  const onLikeClick = (id) => {
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 800);
    handleLike(id);
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

      {/* Show mood decoration in background if present */}
      {thought.mood && (
        <MoodDecoration>{moodEmojis[thought.mood]}</MoodDecoration>
      )}

      {/* Content with quotes */}
      <Content>"{thought.content}"</Content>

      {thought.media?.mediaUrl && (
        <Media>
          <img src={thought.media.mediaUrl} alt="Thought media" />
        </Media>
      )}

      {/* Tags if present */}
      {thought.tags && thought.tags.length > 0 && (
        <Tags>
          {thought.tags.map((tag, index) => (
            <Tag key={index}>#{tag}</Tag>
          ))}
        </Tags>
      )}

      {/* Timestamp */}
      <TimeDisplay>
        <FaClock /> {formatDate(thought.createdAt)}
      </TimeDisplay>

      {/* Action bar */}
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
