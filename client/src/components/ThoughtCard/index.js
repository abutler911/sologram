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

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(176, 75, 223, 0.4); }
  50% { box-shadow: 0 0 20px rgba(176, 75, 223, 0.7); }
  100% { box-shadow: 0 0 5px rgba(176, 75, 223, 0.4); }
`;

const rotateGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Card container with enhanced styling
const Card = styled.div`
  position: relative;
  background: ${COLORS.cardBackground};
  backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 1.75rem;
  margin-bottom: 2rem;
  border: 1px solid
    ${(props) => (props.pinned ? COLORS.primaryPurple : COLORS.border)};
  box-shadow: 0 10px 40px
    ${(props) => (props.pinned ? `rgba(176, 75, 223, 0.25)` : COLORS.shadow)};
  animation: ${fadeIn} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
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
    height: 6px;
    background: ${(props) =>
      props.mood
        ? `linear-gradient(90deg, ${COLORS.primaryPink}, ${COLORS.primaryPurple}, ${COLORS.primaryBlue})`
        : `linear-gradient(90deg, ${COLORS.primaryPink}, ${COLORS.primaryPurple})`};
    opacity: ${(props) => (props.pinned ? 1 : 0.8)};
    background-size: 200% 200%;
    animation: ${rotateGradient} 5s ease infinite;
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
        ? `linear-gradient(135deg, ${COLORS.primaryPurple}08, transparent 50%)`
        : `linear-gradient(135deg, ${COLORS.primaryPurple}08, transparent 50%)`};
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 50px
      ${(props) =>
        props.pinned ? `rgba(176, 75, 223, 0.35)` : `rgba(0, 0, 0, 0.2)`};
    border-color: ${(props) =>
      props.mood ? `${COLORS.primaryPurple}70` : `${COLORS.primaryPurple}70`};
  }

  ${(props) =>
    props.pinned &&
    css`
      border-color: ${COLORS.primaryPurple};
      box-shadow: 0 15px 40px rgba(176, 75, 223, 0.3);

      &:hover {
        box-shadow: 0 20px 50px rgba(176, 75, 223, 0.4);
      }
    `}
`;

// Animated mood decoration
const MoodDecoration = styled.div`
  position: absolute;
  right: 1.75rem;
  top: 1.75rem;
  font-size: 3.5rem;
  opacity: 0.12;
  transform: rotate(10deg);
  z-index: 0;
  animation: ${float} 6s ease infinite;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
  transition: all 0.5s ease;

  ${Card}:hover & {
    transform: rotate(15deg) scale(1.1);
    opacity: 0.18;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;
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

// Enhanced avatar styling
const Avatar = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 3px ${COLORS.primaryPurple}, 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.4s ease;

  @media (max-width: 480px) {
    width: 46px;
    height: 46px;
  }

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 20px ${COLORS.primaryPurple};
    opacity: 0.35;
    transition: opacity 0.4s;
  }

  ${Card}:hover & {
    transform: scale(1.05);
    box-shadow: 0 0 0 3px ${COLORS.primaryPink}, 0 8px 20px rgba(0, 0, 0, 0.3);

    &:after {
      opacity: 0.5;
    }
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

// Enhanced default avatar
const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    ${COLORS.primaryPink},
    ${COLORS.primaryPurple}
  );
  background-size: 200% 200%;
  animation: ${rotateGradient} 5s ease infinite;
  color: #ffffff;
  font-size: 1.8rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
  font-family: "Pacifico", "Brush Script MT", cursive;
  position: relative;
  transition: all 0.3s ease;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.4) 0%,
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

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }

  ${Avatar}:hover & {
    text-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  margin-top: 0.2rem;
`;

// Enhanced username styling
const Username = styled.div`
  font-family: "Autography", cursive;
  font-weight: normal;
  font-size: 2rem;
  color: ${COLORS.accentPurple};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  transition: all 0.4s;

  &:hover {
    text-decoration: none;
    transform: scale(1.05);
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.7), 0 0 10px rgba(199, 118, 255, 0.3);
    color: ${COLORS.accentPink};
  }
`;

const UserHandle = styled.div`
  font-family: "Space Grotesk", sans-serif;
  background-color: rgba(199, 118, 255, 0.15);
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  color: ${COLORS.accentPurple};
  font-size: 0.75rem;
  display: inline-block;
  margin-top: 3px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(199, 118, 255, 0.2);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(199, 118, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

// Enhanced divider
const UserDivider = styled.div`
  width: 85px;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent,
    ${COLORS.primaryPink},
    ${COLORS.primaryPurple},
    ${COLORS.primaryBlue},
    transparent
  );
  opacity: 0.8;
  margin: 3px 0 5px;
  border-radius: 1px;
  transform: scaleX(1.2);
  transition: all 0.4s ease;

  ${UserDetails}:hover & {
    width: 100px;
    transform: scaleX(1.4);
    opacity: 1;
  }
`;

// Enhanced action buttons
const ThoughtActions = styled.div`
  display: flex;
  gap: 0.6rem;
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
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    color: ${COLORS.primaryPink};
    transform: translateY(-3px) scale(1.15);

    &:before {
      transform: scale(1);
    }
  }

  &.delete:hover {
    color: ${COLORS.error};
  }

  &.pinned {
    color: ${COLORS.accentPink};
    animation: ${pulse} 2s infinite;
  }

  ${(props) =>
    props.pinned &&
    css`
      background-color: rgba(255, 77, 148, 0.1);
    `}
`;

// Enhanced content area
const Content = styled.p`
  font-family: "Lora", serif;
  color: #000000;
  font-size: 1rem;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.5);
  padding: 1.75rem;
  border-radius: 18px;
  border-left: 4px solid ${COLORS.primaryPurple};
  font-style: normal;
  white-space: pre-wrap;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 2;
  margin: 0.5rem 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.4s ease;

  &:first-letter {
    font-size: 1.5em;
    font-weight: 500;
    color: ${COLORS.primaryPurple};
    float: left;
    line-height: 1;
    margin-right: 8px;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
  }

  ${Card}:hover & {
    border-left-color: ${COLORS.primaryPink};
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08),
      inset 0 1px 5px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
`;

// Enhanced media container
const Media = styled.div`
  margin: 1.5rem 0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 25px ${COLORS.shadow};
  position: relative;
  z-index: 2;
  width: 100%;
  transform: translateY(0);
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    border-radius: 18px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    pointer-events: none;
  }

  img {
    width: 100%;
    max-height: 380px;
    object-fit: cover;
    transform-origin: center;
    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
      filter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
    vertical-align: middle;
  }

  ${Card}:hover & {
    transform: translateY(-4px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);

    img {
      transform: scale(1.05);
      filter: brightness(1.1) contrast(1.05) saturate(1.15);
    }
  }
`;

// Enhanced tags
const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin: 1.5rem 0;
  position: relative;
  z-index: 2;
`;

const Tag = styled.span`
  font-family: "Space Grotesk", sans-serif;
  background: linear-gradient(
    120deg,
    ${COLORS.primaryPurple}20,
    ${COLORS.primaryPurple}10
  );
  color: ${COLORS.primaryPurple};
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
  border: 1px solid ${COLORS.primaryPurple}30;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

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
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 5px 15px ${COLORS.primaryPurple}40;
    background: linear-gradient(
      120deg,
      ${COLORS.primaryPurple}30,
      ${COLORS.primaryPurple}20
    );

    &:before {
      animation: ${shimmer} 1.5s infinite;
    }
  }
`;

// Enhanced meta section
const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(84, 110, 122, 0.15);
  position: relative;
  z-index: 2;
`;

// Enhanced mood indicator
const MoodIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${COLORS.primaryPink};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: linear-gradient(
    120deg,
    ${COLORS.primaryPink}20,
    ${COLORS.primaryPink}05
  );
  box-shadow: 0 2px 10px ${COLORS.primaryPink}20;
  backdrop-filter: blur(4px);
  border: 1px solid ${COLORS.primaryPink}25;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(
      120deg,
      ${COLORS.primaryPink}30,
      ${COLORS.primaryPink}15
    );
    box-shadow: 0 5px 15px ${COLORS.primaryPink}30,
      0 0 20px ${COLORS.primaryPink}15;
  }
`;

// Enhanced time display
const TimeDisplay = styled.div`
  font-family: "Space Grotesk", sans-serif;
  color: ${COLORS.textSecondary};
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;

  svg {
    font-size: 0.7rem;
    color: ${COLORS.primaryPurple};
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const Footer = styled.div`
  margin-top: 0.75rem;
`;

// Enhanced action bar
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(84, 110, 122, 0.15);
  position: relative;
  z-index: 2;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    justify-content: space-around;
    gap: 0.5rem;
  }

  &:before {
    content: "";
    position: absolute;
    top: -1px;
    left: 0;
    width: 50px;
    height: 1px;
    background: linear-gradient(
      to right,
      ${COLORS.primaryPink},
      ${COLORS.primaryPurple}
    );
    transition: width 0.4s ease;
  }

  ${Card}:hover &:before {
    width: 100px;
  }
`;

// Enhanced action icons
const ActionIcon = styled.div`
  color: ${(props) => (props.liked ? COLORS.primaryPink : COLORS.textTertiary)};
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  font-size: 1rem;

  ${(props) =>
    props.liked &&
    css`
      transform: scale(1.2);
    `}
`;

const ActionCount = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 600;
  transition: color 0.3s;
`;

// Enhanced action items
const ActionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 0.4rem 0.6rem;
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
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
      background 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    z-index: -1;
  }

  &:nth-child(1):hover {
    transform: translateY(-3px);

    &:before {
      background-color: ${COLORS.primaryPink}15;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.primaryPink};
      transform: scale(1.3);
    }

    ${ActionCount} {
      color: ${COLORS.primaryPink};
    }
  }

  &:nth-child(2):hover {
    transform: translateY(-3px);

    &:before {
      background-color: ${COLORS.primaryPurple}15;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.primaryPurple};
      transform: scale(1.3);
    }

    ${ActionCount} {
      color: ${COLORS.primaryPurple};
    }
  }

  &:nth-child(3):hover {
    transform: translateY(-3px);

    &:before {
      background-color: ${COLORS.primaryBlue}15;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.primaryBlue};
      transform: scale(1.3);
    }

    ${ActionCount} {
      color: ${COLORS.primaryBlue};
    }
  }

  &:nth-child(4):hover {
    transform: translateY(-3px);

    &:before {
      background-color: ${COLORS.accentPurple}15;
      transform: scale(1);
    }

    ${ActionIcon} {
      color: ${COLORS.accentPurple};
      transform: scale(1.3);
    }
  }
`;

// Enhanced pinned badge
const PinnedBadge = styled.div`
  position: absolute;
  top: 0px;
  right: 1.5rem;
  background: linear-gradient(
    45deg,
    ${COLORS.primaryPink},
    ${COLORS.primaryPurple}
  );
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  z-index: 10;
  letter-spacing: 0.5px;
  animation: ${pulse} 3s infinite;

  &:before {
    content: "📌";
    margin-right: 5px;
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
            <UserDivider mood={thought.mood} />
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
                animation: isLikeAnimating
                  ? `${pulse} 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)`
                  : "none",
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
