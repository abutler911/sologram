import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaSearch } from 'react-icons/fa';

import PostCard from '../components/posts/PostCard';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);
  
  const observer = useRef();
  
  // Last element callback for infinite scrolling
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  
  // Fetch posts
  useEffect(() => {
    let isMounted = true;
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/posts', {
          params: { page, limit: 6 }
        });
        
        if (isMounted) {
          const { data, currentPage, totalPages } = response.data;
          
          setPosts(prevPosts => {
            // If it's the first page, replace posts
            if (currentPage === 1) {
              return data;
            }
            // Otherwise append new posts
            return [...prevPosts, ...data];
          });
          
          setHasMore(currentPage < totalPages);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching posts:', err);
          setError('Failed to load posts. Please try again.');
          toast.error('Failed to load posts');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchPosts();
    
    return () => {
      isMounted = false;
    };
  }, [page]);
  
  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      // Reset to normal post fetch if search query is empty
      setPage(1);
      return;
    }
    
    try {
      setSearching(true);
      setLoading(true);
      
      const response = await axios.get('/api/posts/search', {
        params: { query: searchQuery }
      });
      
      setPosts(response.data.data);
      setHasMore(false); // No infinite scrolling for search results
      setError(null);
      
      if (response.data.count === 0) {
        toast.info('No posts found matching your search');
      }
    } catch (err) {
      console.error('Error searching posts:', err);
      setError('Failed to search posts. Please try again.');
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearching(false);
    setPage(1);
    setHasMore(true);
  };
  
  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/posts/${postId}`);
      
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };
  
  return (
    <HomeContainer>
      <SearchContainer>
        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">
            <FaSearch />
          </SearchButton>
        </SearchForm>
        
        {searching && (
          <ClearSearchButton onClick={clearSearch}>
            Clear Search
          </ClearSearchButton>
        )}
      </SearchContainer>
      
      {searching && (
        <SearchResults>
          Showing results for "{searchQuery}" ({posts.length} {posts.length === 1 ? 'post' : 'posts'})
        </SearchResults>
      )}
      
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : posts.length > 0 ? (
        <PostGrid>
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              // Add ref to last element for infinite scrolling
              return (
                <div ref={lastPostElementRef} key={post._id}>
                  <PostCard
                    post={post}
                    onDelete={handleDeletePost}
                  />
                </div>
              );
            } else {
              return (
                <div key={post._id}>
                  <PostCard
                    post={post}
                    onDelete={handleDeletePost}
                  />
                </div>
              );
            }
          })}
        </PostGrid>
      ) : loading ? (
        <LoadingMessage>Loading posts...</LoadingMessage>
      ) : (
        <NoPostsMessage>
          No posts available. Start creating your own content!
        </NoPostsMessage>
      )}
      
      {loading && posts.length > 0 && (
        <LoadingMore>Loading more posts...</LoadingMore>
      )}
    </HomeContainer>
  );
};

// Styled Components
const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchForm = styled.form`
  display: flex;
  flex: 1;
  max-width: 600px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #dddddd;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const SearchButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #ff6347;
  }
`;

const ClearSearchButton = styled.button`
  background-color: transparent;
  color: #666666;
  border: 1px solid #dddddd;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: #f2f2f2;
  }
`;

const SearchResults = styled.div`
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #666666;
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin: 2rem 0;
  text-align: center;
`;

const LoadingMessage = styled.div`
  text-align: center;
  margin: 4rem 0;
  color: #666666;
  font-size: 1.125rem;
`;

const NoPostsMessage = styled.div`
  text-align: center;
  margin: 4rem 0;
  color: #666666;
  font-size: 1.125rem;
`;

const LoadingMore = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: #666666;
  font-style: italic;
`;

export default Home;