import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
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
import { COLORS } from "../../theme";

// Enhanced animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Updated Card component to ensure consistent width
const Card = styled.div`
  position: relative;
  background: ${COLORS.cardBackground};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 1px 3px ${COLORS.shadow};
  transition: all 0.3s ease;
  width: 95%;
  max-width: 95%;
  margin-left: auto;
  margin-right: auto;

  &:hover {
    box-shadow: 0 2px 8px ${COLORS.shadow};
  }

  ${(props) =>
    props.pinned &&
    css`
      border-color: ${COLORS.primarySalmon};

      &:after {
        content: "📌";
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        font-size: 0.9rem;
      }
    `}

  @media (min-width: 768px) {
    max-width: 95%;
  }
`;

// Mood decoration
const MoodDecoration = styled.div`
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  font-size: 3rem;
  opacity: 0.12;
  transform: rotate(10deg);
  z-index: 0;
  animation: ${float} 6s ease infinite;
  transition: all 0.5s ease;

  ${Card}:hover & {
    transform: rotate(15deg) scale(1.1);
    opacity: 0.18;
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
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

// Avatar styling simplified
const Avatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid ${COLORS.border};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Default avatar
const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.primarySalmon};
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
  color: ${COLORS.textPrimary};
`;

const UserHandle = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.85rem;
`;

// Action buttons
const ThoughtActions = styled.div`
  display: flex;
  gap: 0.6rem;

  @media (max-width: 480px) {
    gap: 0.4rem;
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    color: ${COLORS.primarySalmon};
    background-color: ${COLORS.elevatedBackground};
  }

  &.delete:hover {
    color: ${COLORS.error};
  }

  &.pinned {
    color: ${COLORS.accentSalmon};
  }
`;

const Content = styled.p`
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-wrap;
  margin: 0.75rem 0;
`;

const Media = styled.div`
  margin: 0.75rem 0;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;

  img {
    width: 100%;
    max-height: 350px;
    object-fit: cover;
    vertical-align: middle;
  }
`;

// Tags
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
  background-color: ${COLORS.elevatedBackground};
  color: ${COLORS.primarySalmon};
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid ${COLORS.border};

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.accentSalmon};
  }

  @media (max-width: 768px) {
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
  }
`;

// Meta section
const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${COLORS.divider};
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

// Mood indicator
const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${COLORS.primarySalmon};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const TimeDisplay = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.85rem;
  margin: 0.5rem 0;
`;

// Simplified Action bar
const ActionBar = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 3rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${COLORS.divider};

  @media (max-width: 480px) {
    gap: 2rem;
  }
`;

// Action Icon styling
const ActionIcon = styled.div`
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  transition: all 0.2s ease;
  font-size: 1rem;
`;

const ActionCount = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.85rem;
  font-weight: 500;
`;

// Action items
const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;

  &:hover {
    ${ActionIcon} {
      color: ${COLORS.primarySalmon};
    }

    ${ActionCount} {
      color: ${COLORS.primarySalmon};
    }
  }
`;

// Pinned badge
const PinnedBadge = styled.div`
  position: absolute;
  top: 0;
  right: 1.5rem;
  background-color: ${COLORS.primarySalmon};
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 12px ${COLORS.shadow};
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

// ThoughtCard component with like animation
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

            {/* Just show mood as an emoji if present */}
            {thought.mood && <span>{moodEmojis[thought.mood]}</span>}
          </UserDetails>
        </UserInfo>

        {/* Admin actions menu */}
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

      {/* Content with quotes */}
      <Content>"{thought.content}"</Content>

      {thought.media?.mediaUrl && (
        <Media>
          <img src={thought.media.mediaUrl} alt="Thought media" />
        </Media>
      )}

      {/* Timestamp more similar to the example */}
      <TimeDisplay>{formatDate(thought.createdAt)}</TimeDisplay>

      {/* Simplified action bar */}
      <ActionBar>
        <ActionItem onClick={() => onLikeClick(thought._id)}>
          <ActionIcon active={thought.userHasLiked}>
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

        <ActionItem>
          <ActionIcon>
            <FaShare />
          </ActionIcon>
        </ActionItem>
      </ActionBar>
    </Card>
  );
};

export default ThoughtCard;
