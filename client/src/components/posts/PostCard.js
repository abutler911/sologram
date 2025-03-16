import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaHeart, FaEdit, FaTrash, FaClock } from 'react-icons/fa';
import { formatDistance } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';

const PostCard = ({ post, onDelete }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  const formattedDate = formatDistance(
    new Date(post.createdAt),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <Card>
      {post.media && post.media.length > 0 && (
        <MediaContainer to={`/post/${post._id}`}>
          {/* Show only the first image/video in the card */}
          {post.media[0].mediaType === 'image' ? (
            <PostImage src={post.media[0].mediaUrl} alt={post.caption} />
          ) : (
            <PostVideo src={post.media[0].mediaUrl} controls />
          )}
          
          {/* If there are multiple media files, show a count indicator */}
          {post.media.length > 1 && (
            <MediaCounter>+{post.media.length - 1} more</MediaCounter>
          )}
        </MediaContainer>
      )}
      
      <CardContent>
        <Caption to={`/post/${post._id}`}>{post.caption}</Caption>
        
        {post.content && (
          <Content>
            {post.content.length > 150
              ? `${post.content.substring(0, 150)}...`
              : post.content}
          </Content>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <TagsContainer>
            {post.tags.map((tag, index) => (
              <Tag key={index}>#{tag}</Tag>
            ))}
          </TagsContainer>
        )}
        
        <CardFooter>
          <MetaData>
            <TimeStamp>
              <FaClock />
              <span>{formattedDate}</span>
            </TimeStamp>
            
            <LikesCount>
              <FaHeart />
              <span>{post.likes}</span>
            </LikesCount>
          </MetaData>
          
          {isAuthenticated && (
            <Actions>
              <EditButton to={`/edit/${post._id}`}>
                <FaEdit />
              </EditButton>
              
              <DeleteButton onClick={() => onDelete(post._id)}>
                <FaTrash />
              </DeleteButton>
            </Actions>
          )}
        </CardFooter>
      </CardContent>
    </Card>
  );
};

// Styled Components
const Card = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const MediaContainer = styled(Link)`
  display: block;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
  position: relative;
  overflow: hidden;
`;

const PostImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PostVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MediaCounter = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const CardContent = styled.div`
  padding: 1.25rem;
`;

const Caption = styled(Link)`
  display: block;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #333333;
  text-decoration: none;
  
  &:hover {
    color: #ff7e5f;
  }
`;

const Content = styled.p`
  color: #666666;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background-color: #f2f2f2;
  color: #666666;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eeeeee;
  padding-top: 1rem;
`;

const MetaData = styled.div`
  display: flex;
  align-items: center;
`;

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 0.875rem;
  margin-right: 1rem;
  
  svg {
    margin-right: 0.25rem;
  }
`;

const LikesCount = styled.div`
  display: flex;
  align-items: center;
  color: #ff7e5f;
  font-size: 0.875rem;
  
  svg {
    margin-right: 0.25rem;
  }
`;

const Actions = styled.div`
  display: flex;
`;

const EditButton = styled(Link)`
  color: #4a90e2;
  margin-right: 0.75rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: #3a70b2;
  }
`;

const DeleteButton = styled.button`
  color: #e74c3c;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.3s ease;
  
  &:hover {
    color: #c0392b;
  }
`;

export default PostCard;