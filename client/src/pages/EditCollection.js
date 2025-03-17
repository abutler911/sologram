import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import CollectionForm from '../components/collections/CollectionForm';

const EditCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`/api/collections/${id}`);
        setCollection(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection. It may have been deleted or does not exist.');
        toast.error('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [id]);
  
  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading collection...</LoadingMessage>
      </Container>
    );
  }
  
  if (error || !collection) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorMessage>{error || 'Collection not found'}</ErrorMessage>
          <BackLink to="/collections">
            <FaArrowLeft />
            <span>Back to Collections</span>
          </BackLink>
        </ErrorContainer>
      </Container>
    );
  }
  
  return (
    <Container>
      <BackLink to={`/collections/${id}`}>
        <FaArrowLeft />
        <span>Back to Collection</span>
      </BackLink>
      
      <CollectionForm initialData={collection} isEditing={true} />
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackLink = styled(Link)`
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

export default EditCollection;