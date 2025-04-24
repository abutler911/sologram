import React from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FaHeart,
  FaTrash,
  FaEdit,
  FaClock,
  FaComment,
  FaRetweet,
  FaShare,
} from "react-icons/fa";
import { moodColors, moodEmojis } from "../../utils/themeConstants"; // Import from shared utility file
import { COLORS, THEME } from "../../theme"; // Import the theme

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
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

const Card = styled.div`
  position: relative;
  background: ${COLORS.cardBackground};
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 10px 30px ${COLORS.shadow};
  animation: ${fadeIn} 0.4s ease-out;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 98%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: ${(props) =>
      props.mood
        ? `linear-gradient(to right, ${COLORS.primaryBlue}, ${COLORS.primaryTeal}, ${COLORS.primaryGreen})`
        : `linear-gradient(to right, ${COLORS.primaryBlue}, ${COLORS.primaryTeal})`};
    opacity: ${(props) => (props.pinned ? 1 : 0.7)};
  }

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 24px;
    background: ${(props) =>
      props.mood
        ? `linear-gradient(45deg, ${COLORS.primaryBlue}05, transparent 40%)`
        : `linear-gradient(45deg, ${COLORS.primaryBlue}05, transparent 40%)`};
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    transform: translateY(-5px) scale(1.02);
    background-color: ${COLORS.elevatedBackground};
    box-shadow: 0 15px 35px ${COLORS.shadow};
    border-color: ${(props) =>
      props.mood ? `${COLORS.primaryBlue}40` : `${COLORS.primaryBlue}40`};
  }

  ${(props) =>
    props.pinned &&
    `
    border-color: ${COLORS.primaryBlue}80;
    box-shadow: 0 10px 35px ${COLORS.primaryBlue}30;
  `}
`;

const MoodDecoration = styled.div`
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  font-size: 3rem;
  opacity: 0.15;
  transform: rotate(10deg);
  z-index: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 2;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  position: relative;
  z-index: 2;

  /* Adjust for mobile */
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 2px ${COLORS.primaryBlue};
  position: relative;

  /* Adjust for mobile */
  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
  }

  /* Inner glow effect */
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 15px ${COLORS.primaryBlue};
    opacity: 0.3;
    transition: opacity 0.3s;
  }

  &:hover:after {
    opacity: 0.6;
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
    45deg,
    ${COLORS.primaryBlue},
    ${COLORS.primaryTeal}
  );
  color: #ffffff;
  font-size: 1.8rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  font-family: "Pacifico", "Brush Script MT", cursive;
  position: relative;

  /* Add a subtle glow effect */
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 70%
    );
    z-index: 1;
    pointer-events: none;
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

  /* Adjust for mobile */
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  margin-top: 0.15rem;
`;

const Username = styled.div`
  font-family: "Autography", cursive;
  font-weight: normal;
  font-size: 1.9rem;
  color: ${COLORS.accentBlue};
  text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  transition: all 0.3s;

  &:hover {
    text-decoration: none;
    transform: scale(1.05);
    text-shadow: 0 3px 5px rgba(0, 0, 0, 0.7);
  }
`;

const UserHandle = styled.div`
  font-family: "Space Grotesk", sans-serif;
  background-color: rgba(66, 191, 221, 0.1);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  color: ${COLORS.accentBlue};
  font-size: 0.75rem;
  display: inline-block;
  margin-top: 2px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(66, 191, 221, 0.1);
`;

const UserDivider = styled.div`
  width: 80px;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent,
    ${COLORS.primaryBlue},
    ${COLORS.primaryTeal}
  );
  opacity: 0.7;
  margin: 2px 0 4px;
  border-radius: 1px;
  transform: scaleX(1.2);
`;

const ThoughtActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.textPrimary};
    transform: scale(1.1);
  }

  &.delete:hover {
    color: #ff6b6b;
  }

  &.pinned {
    color: ${COLORS.accentTeal};
  }
`;

const Content = styled.p`
  font-family: "Lora", serif;
  color: ${COLORS.textPrimary};
  font-size: 0.7rem;
  line-height: 1.3;
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 16px;
  border-left: 3px solid ${COLORS.primaryBlue};
  font-style: normal;
  white-space: pre-wrap;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 2;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

  &:first-letter {
    font-size: 1.2em;
    font-weight: 500;
    color: ${COLORS.primaryBlue};
  }
`;

const Media = styled.div`
  margin: 1rem 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px ${COLORS.shadow};
  position: relative;
  z-index: 2;
  width: 100%;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    border-radius: 16px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }

  img {
    width: 100%;
    max-height: 350px;
    object-fit: cover;
    transform-origin: center;
    transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1), filter 0.6s ease;
    vertical-align: middle;
  }

  &:hover img {
    transform: scale(1.05);
    filter: brightness(1.1) saturate(1.1);
  }
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1.25rem 0;
  position: relative;
  z-index: 2;
`;

const Tag = styled.span`
  font-family: "Space Grotesk", sans-serif;
  background: linear-gradient(
    120deg,
    ${COLORS.primaryBlue}30,
    ${COLORS.primaryBlue}10
  );
  color: ${COLORS.primaryBlue};
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.65rem;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.3px;
  backdrop-filter: blur(4px);
  border: 1px solid ${COLORS.primaryBlue}30;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    z-index: 1;
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 3px 10px ${COLORS.primaryBlue}40;

    &:before {
      animation: ${shimmer} 1.5s infinite;
    }
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  margin-bottom: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${COLORS.divider};
  position: relative;
  z-index: 2;
`;

const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: ${COLORS.primaryTeal};
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: capitalize;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(
    120deg,
    ${COLORS.primaryTeal}20,
    ${COLORS.primaryTeal}05
  );
  box-shadow: 0 0 10px ${COLORS.primaryTeal}30;
  backdrop-filter: blur(4px);
  border: 1px solid ${COLORS.primaryTeal}20;
  position: relative;
  overflow: hidden;
`;

const TimeDisplay = styled.div`
  font-family: "Space Grotesk", sans-serif;
  color: ${COLORS.textSecondary};
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.7;

  svg {
    font-size: 0.6rem;
  }
`;

const Footer = styled.div`
  margin-top: 0.5rem;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid ${COLORS.divider};
  position: relative;
  z-index: 2;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 0.5rem;
  }
`;

const ActionIcon = styled.div`
  color: ${(props) => (props.liked ? COLORS.primaryTeal : COLORS.textTertiary)};
  transition: color 0.3s, transform 0.3s;
  font-size: 0.9rem;

  ${(props) =>
    props.liked &&
    `
    transform: scale(1.2);
  `}
`;

const ActionCount = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 500;
  transition: color 0.3s;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  /* Adjust for mobile */
  @media (max-width: 480px) {
    padding: 0.3rem 0.5rem;
  }

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border-radius: 999px;
    transform: scale(0);
    transition: transform 0.3s, background 0.3s;
    z-index: -1;
  }

  &:nth-child(1):hover {
    &:before {
      background-color: ${COLORS.primaryTeal}10;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.primaryTeal};
      transform: scale(1.2);
    }

    ${ActionCount} {
      color: ${COLORS.primaryTeal};
    }
  }

  &:nth-child(2):hover {
    &:before {
      background-color: ${COLORS.primaryBlue}10;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.primaryBlue};
      transform: scale(1.2);
    }

    ${ActionCount} {
      color: ${COLORS.primaryBlue};
    }
  }

  &:nth-child(3):hover {
    &:before {
      background-color: ${COLORS.primaryGreen}10;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.primaryGreen};
      transform: scale(1.2);
    }

    ${ActionCount} {
      color: ${COLORS.primaryGreen};
    }
  }

  &:nth-child(4):hover {
    &:before {
      background-color: ${COLORS.accentBlue}10;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.accentBlue};
      transform: scale(1.2);
    }
  }
`;

const PinnedBadge = styled.div`
  position: absolute;
  top: 0px;
  right: 1.5rem;
  background: linear-gradient(
    45deg,
    ${COLORS.primaryBlue},
    ${COLORS.primaryTeal}
  );
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 3px 8px ${COLORS.shadow};
  z-index: 10;
  letter-spacing: 0.5px;

  &:before {
    content: "📌";
    margin-right: 5px;
  }
`;

// ThoughtCard component
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
            <UserDivider mood={thought.mood} />
          </UserDetails>
        </UserInfo>

        {/* Only show thought actions if user has admin or creator role */}
        {canCreateThought && (
          <ThoughtActions>
            <ActionButton
              onClick={() => handlePin(thought._id)}
              title={thought.pinned ? "Unpin" : "Pin"}
              className={thought.pinned ? "pinned" : ""}
            >
              📌
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
          <ActionItem onClick={() => handleLike(thought._id)}>
            <ActionIcon liked={thought.userHasLiked}>
              <FaHeart />
            </ActionIcon>
            <ActionCount>{thought.likes}</ActionCount>
          </ActionItem>

          <ActionItem>
            <ActionIcon>
              <FaComment />
            </ActionIcon>
            <ActionCount>{thought.comments?.length || 0}</ActionCount>
          </ActionItem>

          <ActionItem onClick={handleRetweet}>
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
