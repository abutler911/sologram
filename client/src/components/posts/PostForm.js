import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaTimes, FaImage, FaVideo } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const PostForm = ({ initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    caption: initialData?.caption || '',
    content: initialData?.content || '',
    tags: initialData?.tags?.join(', ') || ''
  });
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  // Initialize existing media if editing
  useEffect(() => {
    if (isEditing && initialData?.media && initialData.media.length > 0) {
      setExistingMedia(initialData.media.map(media => ({
        id: media._id,
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType,
        isExisting: true
      })));
    }
  }, [isEditing, initialData]);
  
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) return;
    
    // Check if adding these files would exceed the 20 file limit
    const totalFiles = mediaFiles.length + existingMedia.length + acceptedFiles.length;
    if (totalFiles > 20) {
      toast.error('Maximum 20 media files allowed per post');
      return;
    }
    
    // Process each dropped file
    acceptedFiles.forEach(file => {
      // Create preview for the file
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreviews(prev => [
          ...prev, 
          {
            id: Date.now() + Math.random().toString(), // Generate unique id
            preview: reader.result,
            type: file.type.startsWith('image') ? 'image' : 'video'
          }
        ]);
      };
      reader.readAsDataURL(file);
      
      // Add to media files array
      setMediaFiles(prev => [...prev, file]);
    });
  }, [mediaFiles, existingMedia.length]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Remove a preview file
  const removePreviewFile = (id) => {
    const previewIndex = mediaPreviews.findIndex(p => p.id === id);
    if (previewIndex !== -1) {
      // Remove the preview
      setMediaPreviews(prev => prev.filter(p => p.id !== id));
      
      // Remove the corresponding file
      setMediaFiles(prev => prev.filter((_, index) => index !== previewIndex));
    }
  };
  
  // Remove an existing media file
  const removeExistingMedia = (id) => {
    setExistingMedia(prev => prev.filter(m => m.id !== id));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create form data for submission
      const postFormData = new FormData();
      postFormData.append('caption', formData.caption);
      postFormData.append('content', formData.content);
      postFormData.append('tags', formData.tags);
      
      // Add all media files
      if (mediaFiles.length > 0) {
        mediaFiles.forEach(file => {
          postFormData.append('media', file);
        });
      }
      
      // Add IDs of existing media to keep (when editing)
      if (isEditing && existingMedia.length > 0) {
        const mediaIdsToKeep = existingMedia.map(media => media.id).join(',');
        postFormData.append('keepMedia', mediaIdsToKeep);
      }
      
      let response;
      
      if (isEditing) {
        // Update existing post
        response = await axios.put(`/api/posts/${initialData._id}`, postFormData);
        toast.success('Post updated successfully!');
      } else {
        // Create new post
        response = await axios.post('/api/posts', postFormData);
        toast.success('Post created successfully!');
      }
      
      // Redirect to the post detail page
      navigate(`/post/${response.data.data._id}`);
    } catch (err) {
      const errorMessage = 
        err.response && err.response.data.message
          ? err.response.data.message
          : isEditing ? 'Failed to update post' : 'Failed to create post';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormTitle>
        {isEditing ? 'Edit Post' : 'Create New Post'}
      </FormTitle>
      
      <FormGroup>
        <Label htmlFor="caption">Caption</Label>
        <Input
          type="text"
          id="caption"
          name="caption"
          value={formData.caption}
          onChange={handleChange}
          placeholder="Enter a caption for your post"
          required
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="content">Content</Label>
        <TextArea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Write your post content here..."
          rows={5}
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="tags">Tags</Label>
        <Input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Add tags separated by commas (e.g. nature, travel, food)"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Media (Max 20 files)</Label>
        
        {/* Display count of selected media */}
        <MediaCounter>
          {mediaPreviews.length + existingMedia.length} / 20 media files selected
        </MediaCounter>
        
        {/* Display existing media previews */}
        {existingMedia.length > 0 && (
          <ExistingMediaGrid>
            {existingMedia.map(media => (
              <ExistingMediaItem key={media.id}>
                {media.mediaType === 'image' ? (
                  <PreviewImage src={media.mediaUrl} alt="Existing media" />
                ) : (
                  <PreviewVideo src={media.mediaUrl} controls />
                )}
                <RemoveMediaButton type="button" onClick={() => removeExistingMedia(media.id)}>
                  <FaTimes />
                </RemoveMediaButton>
              </ExistingMediaItem>
            ))}
          </ExistingMediaGrid>
        )}
        
        {/* Display new media previews */}
        {mediaPreviews.length > 0 && (
          <MediaPreviewGrid>
            {mediaPreviews.map(preview => (
              <MediaPreviewItem key={preview.id}>
                {preview.type === 'image' ? (
                  <PreviewImage src={preview.preview} alt="Preview" />
                ) : (
                  <PreviewVideo src={preview.preview} controls />
                )}
                <RemoveMediaButton type="button" onClick={() => removePreviewFile(preview.id)}>
                  <FaTimes />
                </RemoveMediaButton>
              </MediaPreviewItem>
            ))}
          </MediaPreviewGrid>
        )}
        
        {/* Only show dropzone if less than 20 total media files */}
        {mediaPreviews.length + existingMedia.length < 20 && (
          <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
            <input {...getInputProps()} />
            <DropzoneIcon>
              <FaCloudUploadAlt />
            </DropzoneIcon>
            <DropzoneText>
              {isDragActive
                ? 'Drop your images or videos here'
                : 'Drag & drop images or videos, or click to select'}
            </DropzoneText>
            <DropzoneSubtext>
              Supports: JPG, PNG, GIF, MP4, MOV (Max: 20MB per file)
            </DropzoneSubtext>
            <MediaTypeIcons>
              <FaImage />
              <FaVideo />
            </MediaTypeIcons>
          </DropzoneContainer>
        )}
      </FormGroup>
      
      <ButtonGroup>
        <CancelButton type="button" onClick={() => navigate(-1)}>
          Cancel
        </CancelButton>
        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
        </SubmitButton>
      </ButtonGroup>
    </FormContainer>
  );
};

// Styled Components
const FormContainer = styled.form`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  color: #333333;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${props => props.isDragActive ? '#ff7e5f' : '#dddddd'};
  background-color: ${props => props.isDragActive ? 'rgba(255, 126, 95, 0.05)' : '#f9f9f9'};
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #ff7e5f;
  }
`;

const DropzoneIcon = styled.div`
  color: #ff7e5f;
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const DropzoneText = styled.p`
  font-size: 1.25rem;
  color: #666666;
  margin-bottom: 0.5rem;
`;

const DropzoneSubtext = styled.p`
  font-size: 0.875rem;
  color: #999999;
  margin-bottom: 1rem;
`;

const MediaTypeIcons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  color: #999999;
  font-size: 1.5rem;
`;

// Styled Components for multiple media
const MediaCounter = styled.div`
  margin-bottom: 1rem;
  color: #666666;
  font-size: 0.875rem;
`;

const MediaPreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const MediaPreviewItem = styled.div`
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ExistingMediaGrid = styled(MediaPreviewGrid)`
  margin-bottom: 1.5rem;
`;

const ExistingMediaItem = styled(MediaPreviewItem)`
  border: 2px solid #e6e6e6;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PreviewVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveMediaButton = styled.button`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 0.75rem;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: #666666;
  border: 1px solid #dddddd;
  
  &:hover {
    background-color: #f2f2f2;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #ff7e5f;
  color: white;
  border: none;
  
  &:hover {
    background-color: #ff6347;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export default PostForm;