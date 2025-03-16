import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatDistance } from 'date-fns';
import { 
  FaHeart, 
  FaEdit, 
  FaTrash, 
  FaClock, 
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Navigate to previous media
  const prevMedia = () => {
    if (post.media && post.media.length > 0) {
      setActiveMediaIndex(prev => 
        prev === 0 ? post.media.length - 1 : prev - 1
      );
    }
  };
  
  // Navigate to next media
  const nextMedia = () => {
    if (post.media && post.media.length > 0) {
      setActiveMediaIndex(prev => 
        prev === post.media.length - 1 ? 0 : prev + 1
      );
    }
  };
  
  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`/api/posts/${id}`);
        setPost(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. It may have been deleted or does not exist.');
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);
  
  // Handle post deletion
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/posts/${id}`);
      toast.success('Post deleted successfully');
      navigate('/');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading post...</LoadingMessage>
      </Container>
    );
  }
  
  if (error || !post) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorMessage>{error || 'Post not found'}</ErrorMessage>
          <BackButton to="/">
            <FaArrowLeft />
            <span>Back to Home</span>
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }
  
  // Format date
  const formattedDate = formatDistance(
    new Date(post.createdAt),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <Container>
      <BackButton to="/">
        <FaArrowLeft />
        <span>Back to Home</span>
      </BackButton>
      
      <PostContainer>
        {post.media && post.media.length > 0 && (
          <MediaContainer>
            {/* Display the active media */}
            {post.media[activeMediaIndex].mediaType === 'image' ? (
              <PostImage src={post.media[activeMediaIndex].mediaUrl} alt={post.caption} />
            ) : (
              <PostVideo src={post.media[activeMediaIndex].mediaUrl} controls />
            )}
            
            {/* Navigation arrows - only show if there are multiple media files */}
            {post.media.length > 1 && (
              <>
                <NavButton className="prev" onClick={prevMedia}>
                  <FaChevronLeft />
                </NavButton>
                <NavButton className="next" onClick={nextMedia}>
                  <FaChevronRight />
                </NavButton>
                
                {/* Media counter indicator */}
                <MediaCounter>
                  {activeMediaIndex + 1} / {post.media.length}
                </MediaCounter>
                
                {/* Thumbnail indicators */}
                <ThumbnailContainer>
                  {post.media.map((media, index) => (
                    <Thumbnail 
                      key={index}
                      active={index === activeMediaIndex}
                      onClick={() => setActiveMediaIndex(index)}
                    />
                  ))}
                </ThumbnailContainer>
              </>
            )}
          </MediaContainer>
        )}
        
        <ContentContainer>
          <PostHeader>
            <PostTitle>{post.caption}</PostTitle>
            
            {isAuthenticated && (
              <ActionsContainer>
                <EditLink to={`/edit/${post._id}`}>
                  <FaEdit />
                  <span>Edit</span>
                </EditLink>
                
                <DeleteButton onClick={handleDeletePost}>
                  <FaTrash />
                  <span>Delete</span>
                </DeleteButton>
              </ActionsContainer>
            )}
          </PostHeader>
          
          <MetaData>
            <TimeStamp>
              <FaClock />
              <span>{formattedDate}</span>
            </TimeStamp>
            
            <LikesCount>
              <FaHeart />
              <span>{post.likes} likes</span>
            </LikesCount>
          </MetaData>
          
          {post.content && (
            <PostContent>{post.content}</PostContent>
          )}
          
          {post.tags && post.tags.length > 0 && (
            <TagsContainer>
              {post.tags.map((tag, index) => (
                <Tag key={index}>#{tag}</Tag>
              ))}
            </TagsContainer>
          )}
        </ContentContainer>
      </PostContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #666666;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.3s;
  
  &:hover {
    color: #ff7e5f;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 0;
  font-size: 1.125rem;
  color: #666666;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const PostContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const MediaContainer = styled.div`
  width: 100%;
  background-color: #f9f9f9;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const PostImage = styled.img`
  max-width: 100%;
  max-height: 600px;
  display: block;
`;

const PostVideo = styled.video`
  max-width: 100%;
  max-height: 600px;
  display: block;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  z-index: 10;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  &.prev {
    left: 1rem;
  }
  
  &.next {
    right: 1rem;
  }
  
  @media (max-width: 768px) {
    width: 2rem;
    height: 2rem;
  }
`;

const MediaCounter = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  z-index: 10;
`;

const ThumbnailContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
`;

const Thumbnail = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.5)'};
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: white;
  }
`;

const ContentContainer = styled.div`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PostTitle = styled.h1`
  font-size: 1.75rem;
  color: #333333;
  margin: 0;
  
  @media (max-width: 640px) {
    margin-bottom: 1rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const EditLink = styled(Link)`
  display: flex;
  align-items: center;
  background-color: #4a90e2;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #3a70b2;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #e74c3c;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #c0392b;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const MetaData = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
`;

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 0.875rem;
  margin-right: 1.5rem;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const LikesCount = styled.div`
  display: flex;
  align-items: center;
  color: #ff7e5f;
  font-size: 0.875rem;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const PostContent = styled.div`
  font-size: 1.125rem;
  line-height: 1.6;
  color: #333333;
  margin-bottom: 2rem;
  white-space: pre-line;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;

const Tag = styled.span`
  background-color: #f2f2f2;
  color: #666666;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  margin-right: 0.75rem;
  margin-bottom: 0.75rem;
`;

export default PostDetail;