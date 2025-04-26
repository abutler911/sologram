import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import {
  FaHeart,
  FaTrash,
  FaEdit,
  FaClock,
  FaComment,
  FaRetweet,
  FaShare,
  FaRegHeart,
  FaRegComment,
  FaStar,
  FaBookmark,
} from "react-icons/fa";
import { moodColors, moodEmojis } from "../../utils/themeConstants";
import { COLORS, THEME } from "../../theme";

// Enhanced animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
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

// Card container with enhanced styling
const Card = styled.div`
  position: relative;
  background: ${COLORS.cardBackground};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid
    ${(props) => (props.pinned ? COLORS.primaryTeal : COLORS.border)};
  box-shadow: 0 8px 24px
    ${(props) => (props.pinned ? `rgba(0, 131, 143, 0.25)` : COLORS.shadow)};
  animation: ${fadeIn} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  transition: all 0.4s ease;
  width: calc(100% - 4px);
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${(props) =>
      props.mood ? COLORS.primaryTeal : COLORS.primaryBlue};
    opacity: ${(props) => (props.pinned ? 1 : 0.8)};
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px
      ${(props) => (props.pinned ? `rgba(0, 131, 143, 0.3)` : COLORS.shadow)};
  }

  ${(props) =>
    props.pinned &&
    css`
      border-color: ${COLORS.primaryTeal};

      &:hover {
        box-shadow: 0 12px 30px rgba(0, 131, 143, 0.3);
      }
    `}

  @media (max-width: 768px) {
    padding: 1.25rem;
    margin-bottom: 1rem;
    width: 98%;
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
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 2;

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

// Avatar styling
const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 2px ${COLORS.primaryTeal}, 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.4s ease;

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }

  ${Card}:hover & {
    transform: scale(1.05);
    box-shadow: 0 0 0 2px ${COLORS.accentTeal}, 0 6px 12px rgba(0, 0, 0, 0.3);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

// Default avatar
const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.primaryTeal};
  color: #ffffff;
  font-size: 1.6rem;
  font-weight: bold;
  position: relative;

  @media (max-width: 480px) {
    font-size: 1.3rem;
  }

  span {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  margin-top: 0.2rem;
`;

// Username styling
const Username = styled.div`
  font-weight: 600;
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
  margin-bottom: 4px;
  transition: all 0.3s;

  &:hover {
    color: ${COLORS.primaryTeal};
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const UserHandle = styled.div`
  background-color: ${COLORS.elevatedBackground};
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  color: ${COLORS.textSecondary};
  font-size: 0.75rem;
  display: inline-block;
  margin-top: 3px;
  border: 1px solid ${COLORS.border};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${COLORS.buttonHover};
  }

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.1rem 0.5rem;
  }
`;

// Action buttons
const ThoughtActions = styled.div`
  display: flex;
  gap: 0.6rem;

  @media (max-width: 480px) {
    gap: 0.4rem;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    color: ${COLORS.primaryTeal};
    background-color: ${COLORS.elevatedBackground};
  }

  &.delete:hover {
    color: ${COLORS.error};
  }

  &.pinned {
    color: ${COLORS.accentTeal};
  }

  ${(props) =>
    props.pinned &&
    css`
      background-color: ${COLORS.elevatedBackground};
    `}

  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
  }
`;

// Content area
const Content = styled.p`
  color: ${COLORS.textPrimary};
  font-size: 1rem;
  line-height: 1.6;
  background: ${COLORS.elevatedBackground};
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 3px solid ${COLORS.primaryTeal};
  white-space: pre-wrap;
  position: relative;
  z-index: 2;
  margin: 0.5rem 0;
  transition: all 0.4s ease;

  ${Card}:hover & {
    border-left-color: ${COLORS.accentTeal};
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    font-size: 0.95rem;
  }
`;

// Media container
const Media = styled.div`
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 6px 20px ${COLORS.shadow};
  position: relative;
  z-index: 2;
  width: 100%;
  transition: all 0.4s ease;

  img {
    width: 100%;
    max-height: 350px;
    object-fit: cover;
    transition: transform 0.6s ease;
    vertical-align: middle;
  }

  ${Card}:hover & {
    img {
      transform: scale(1.03);
    }
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
  color: ${COLORS.primaryTeal};
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid ${COLORS.border};

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.accentTeal};
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
  color: ${COLORS.primaryTeal};
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

// Time display
const TimeDisplay = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  background-color: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  transition: all 0.3s ease;

  svg {
    font-size: 0.7rem;
    color: ${COLORS.primaryTeal};
  }

  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const Footer = styled.div`
  margin-top: 0.75rem;
`;

// Action bar
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid ${COLORS.divider};
  position: relative;
  z-index: 2;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

// Action icons
const ActionIcon = styled.div`
  color: ${(props) => (props.liked ? COLORS.primaryTeal : COLORS.textTertiary)};
  transition: all 0.3s ease;
  font-size: 1rem;

  ${(props) =>
    props.liked &&
    css`
      transform: scale(1.1);
    `}
`;

const ActionCount = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 600;
  transition: color 0.3s;
`;

// Action items
const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: relative;

  @media (max-width: 480px) {
    padding: 0.3rem 0.5rem;
    flex: 1;
    justify-content: center;
  }

  &:hover {
    background-color: ${COLORS.elevatedBackground};

    ${ActionIcon} {
      transform: scale(1.1);
    }
  }

  &:nth-child(1):hover {
    ${ActionIcon} {
      color: ${COLORS.primaryTeal};
    }

    ${ActionCount} {
      color: ${COLORS.primaryTeal};
    }
  }

  &:nth-child(2):hover {
    ${ActionIcon} {
      color: ${COLORS.primaryBlue};
    }

    ${ActionCount} {
      color: ${COLORS.primaryBlue};
    }
  }

  &:nth-child(3):hover {
    ${ActionIcon} {
      color: ${COLORS.primaryGreen};
    }

    ${ActionCount} {
      color: ${COLORS.primaryGreen};
    }
  }

  &:nth-child(4):hover {
    ${ActionIcon} {
      color: ${COLORS.accentTeal};
    }
  }
`;

// Pinned badge
const PinnedBadge = styled.div`
  position: absolute;
  top: 0;
  right: 1.5rem;
  background-color: ${COLORS.primaryTeal};
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
  // State for like animation
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Enhanced like handler with animation
  const onLikeClick = (id) => {
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 800);
    handleLike(id);
  };

  return (
    <Card mood={thought.mood} pinned={thought.pinned}>
      {thought.pinned && <PinnedBadge mood={thought.mood}>Pinned</PinnedBadge>}
      <MoodDecoration>{moodEmojis[thought.mood]}</MoodDecoration>

      <Header>
        <UserInfo>
          <Avatar mood={thought.mood}>
            {defaultUser.avatar ? (
              <img src={defaultUser.avatar} alt="User avatar" />
            ) : (
              <DefaultAvatar mood={thought.mood}>
                <span>{defaultUser.username.charAt(0).toUpperCase()}</span>
              </DefaultAvatar>
            )}
          </Avatar>
          <UserDetails>
            <Username>{defaultUser.username}</Username>
            <UserHandle>
              @{defaultUser.username.toLowerCase().replace(/\s+/g, "")}
            </UserHandle>
          </UserDetails>
        </UserInfo>

        {/* Only show thought actions if user has admin or creator role */}
        {canCreateThought && (
          <ThoughtActions>
            <ActionButton
              onClick={() => handlePin(thought._id)}
              title={thought.pinned ? "Unpin" : "Pin"}
              className={thought.pinned ? "pinned" : ""}
              pinned={thought.pinned}
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
          </ThoughtActions>
        )}
      </Header>

      <Content mood={thought.mood}>{thought.content}</Content>

      {thought.media?.mediaUrl && (
        <Media>
          <img src={thought.media.mediaUrl} alt="Thought media" />
        </Media>
      )}

      {thought.tags && thought.tags.length > 0 && (
        <Tags>
          {thought.tags.map((tag, tagIndex) => (
            <Tag key={tagIndex} mood={thought.mood}>
              #{tag}
            </Tag>
          ))}
        </Tags>
      )}

      <Meta>
        <TimeDisplay>
          <FaClock />
          <span>{formatDate(thought.createdAt)}</span>
        </TimeDisplay>
        <MoodIndicator mood={thought.mood}>
          {moodEmojis[thought.mood]} {thought.mood}
        </MoodIndicator>
      </Meta>

      <Footer>
        <ActionBar>
          <ActionItem onClick={() => onLikeClick(thought._id)}>
            <ActionIcon
              liked={thought.userHasLiked}
              className={isLikeAnimating ? "animate" : ""}
              style={{
                animation: isLikeAnimating ? `${pulse} 0.8s ease` : "none",
              }}
            >
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
      </Footer>
    </Card>
  );
};

export default ThoughtCard;
