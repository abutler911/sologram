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
import { moodColors, moodEmojis } from "../pages/Thoughts"; // Import from main Thoughts component

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

// ThoughtCard styled components
const Card = styled.div`
  position: relative;
  background: rgba(17, 17, 17, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.4s ease-out;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: ${(props) =>
      props.mood
        ? moodColors[props.mood].gradient
        : moodColors.excited.gradient};
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
        ? `linear-gradient(45deg, ${
            moodColors[props.mood].primary
          }05, transparent 40%)`
        : `linear-gradient(45deg, ${moodColors.excited.primary}05, transparent 40%)`};
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    transform: translateY(-5px) scale(1.02);
    background-color: rgba(26, 26, 26, 0.85);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
    border-color: ${(props) =>
      props.mood
        ? moodColors[props.mood].primary + "40"
        : moodColors.excited.primary + "40"};
  }

  ${(props) =>
    props.pinned &&
    `
    border-color: ${
      props.mood
        ? moodColors[props.mood].primary + "80"
        : moodColors.excited.primary + "80"
    };
    box-shadow: 0 10px 35px ${
      props.mood
        ? moodColors[props.mood].primary + "30"
        : moodColors.excited.primary + "30"
    };
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
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 2px
    ${(props) =>
      props.mood ? moodColors[props.mood].primary : moodColors.excited.primary};
  position: relative;

  /* Inner glow effect */
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 15px
      ${(props) =>
        props.mood
          ? moodColors[props.mood].primary
          : moodColors.excited.primary};
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
  background: ${(props) => {
    const color = props.mood
      ? moodColors[props.mood].gradient
      : moodColors.excited.gradient;
    return color;
  }};
  color: #ffffff;
  font-size: 1.6rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  animation: ${float} 6s infinite ease-in-out;
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
  color: #ffcb66;
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
  background-color: rgba(255, 126, 95, 0.1);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  color: #ff7e5f;
  font-size: 0.75rem;
  display: inline-block;
  margin-top: 2px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 126, 95, 0.1);
`;

const UserDivider = styled.div`
  width: 80px;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent,
    ${(props) => (props.mood ? moodColors[props.mood].primary : "#ffcb66")},
    #ff7e5f
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
  color: #aaaaaa;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #333333;
    color: #ffffff;
    transform: scale(1.1);
  }

  &.delete:hover {
    color: #ff6b6b;
  }

  &.pinned {
    color: #ffbb00;
  }
`;

const Content = styled.p`
  font-family: "Lora", serif;
  color: #f5f5f5;
  font-size: 1.125rem;
  line-height: 1.8;
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 16px;
  border-left: 3px solid
    ${(props) =>
      props.mood ? moodColors[props.mood].primary : moodColors.excited.primary};
  font-style: italic;
  white-space: pre-wrap;
  letter-spacing: 0.4px;
  position: relative;
  z-index: 2;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

  &:first-letter {
    font-size: 1.5em;
    font-weight: 500;
    color: ${(props) =>
      props.mood ? moodColors[props.mood].primary : moodColors.excited.primary};
  }
`;

const Media = styled.div`
  margin: 1rem 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 2;

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
    max-height: 400px;
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
  background: ${(props) =>
    props.mood
      ? `linear-gradient(120deg, ${moodColors[props.mood].primary}30, ${
          moodColors[props.mood].primary
        }10)`
      : `linear-gradient(120deg, ${moodColors.excited.primary}30, ${moodColors.excited.primary}10)`};
  color: ${(props) =>
    props.mood ? moodColors[props.mood].primary : moodColors.excited.primary};
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8rem;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
  border: 1px solid
    ${(props) =>
      props.mood
        ? moodColors[props.mood].primary + "30"
        : moodColors.excited.primary + "30"};

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
    box-shadow: 0 3px 10px
      ${(props) =>
        props.mood
          ? moodColors[props.mood].primary + "40"
          : moodColors.excited.primary + "40"};

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
  border-top: 1px solid #333333;
  position: relative;
  z-index: 2;
`;

const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: ${(props) =>
    props.mood ? moodColors[props.mood].primary : moodColors.excited.primary};
  font-size: 0.925rem;
  font-weight: 500;
  text-transform: capitalize;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: ${(props) =>
    props.mood
      ? `linear-gradient(120deg, ${moodColors[props.mood].primary}20, ${
          moodColors[props.mood].primary
        }05)`
      : `linear-gradient(120deg, ${moodColors.excited.primary}20, ${moodColors.excited.primary}05)`};
  box-shadow: 0 0 15px
    ${(props) =>
      props.mood
        ? moodColors[props.mood].primary + "40"
        : moodColors.excited.primary + "40"};
  backdrop-filter: blur(4px);
  border: 1px solid
    ${(props) =>
      props.mood
        ? moodColors[props.mood].primary + "20"
        : moodColors.excited.primary + "20"};
  position: relative;
  overflow: hidden;
`;

const TimeDisplay = styled.div`
  font-family: "Space Grotesk", sans-serif;
  color: #bbbbbb;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  opacity: 0.8;

  svg {
    font-size: 0.7rem;
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
  border-top: 1px solid #2a2a2a;
  position: relative;
  z-index: 2;
`;

const ActionIcon = styled.div`
  color: ${(props) => (props.liked ? "#e0245e" : "#a0a0a0")};
  transition: color 0.3s, transform 0.3s;
  font-size: 1.125rem;

  ${(props) =>
    props.liked &&
    `
    transform: scale(1.2);
  `}
`;

const ActionCount = styled.span`
  color: #a0a0a0;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.3s;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  padding: 0.6rem 0.85rem;
  border-radius: 999px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

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
      background-color: rgba(224, 36, 94, 0.1);
      transform: scale(1);
    }

    ${ActionIcon} {
      color: #e0245e;
      transform: scale(1.2);
    }

    ${ActionCount} {
      color: #e0245e;
    }
  }

  &:nth-child(2):hover {
    &:before {
      background-color: rgba(29, 161, 242, 0.1);
      transform: scale(1);
    }

    ${ActionIcon} {
      color: #1da1f2;
      transform: scale(1.2);
    }

    ${ActionCount} {
      color: #1da1f2;
    }
  }

  &:nth-child(3):hover {
    &:before {
      background-color: rgba(23, 191, 99, 0.1);
      transform: scale(1);
    }

    ${ActionIcon} {
      color: #17bf63;
      transform: scale(1.2);
    }

    ${ActionCount} {
      color: #17bf63;
    }
  }

  &:nth-child(4):hover {
    &:before {
      background-color: rgba(29, 161, 242, 0.1);
      transform: scale(1);
    }

    ${ActionIcon} {
      color: #1da1f2;
      transform: scale(1.2);
    }
  }
`;

const PinnedBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 1.5rem;
  background: ${(props) =>
    props.mood ? moodColors[props.mood].gradient : moodColors.excited.gradient};
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
  animation: ${float} 3s infinite ease-in-out;
  transform-origin: center;
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
                {defaultUser.username.charAt(0)}
              </DefaultAvatar>
            )}
          </Avatar>
          <UserDetails>
            <Username>{defaultUser.username}</Username>
            <UserDivider mood={thought.mood} />
            <UserHandle>@{defaultUser.handle}</UserHandle>
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
