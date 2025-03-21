// src/services/api/storiesApi.js
import axios from 'axios';

// Helper function to retrieve auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to attach auth header
const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`
  }
});

// API functions for stories
export const storiesApi = {
  // Get all active stories
  getStories: async () => {
    try {
      const response = await axios.get('/api/stories');
      return response.data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  // Get a single active story by ID
  getStory: async (storyId) => {
    try {
      const response = await axios.get(`/api/stories/${storyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching story ${storyId}:`, error);
      throw error;
    }
  },

  // Create a new story
  createStory: async (formData) => {
    try {
      const response = await axios.post('/api/stories', formData, authHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  // Manually archive a story
  archiveStory: async (storyId) => {
    try {
      const response = await axios.put(
        `/api/stories/${storyId}/archive`, 
        {}, 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error archiving story ${storyId}:`, error);
      throw error;
    }
  },

  // Delete a story (active)
  deleteStory: async (storyId) => {
    try {
      const response = await axios.delete(
        `/api/stories/${storyId}`, 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting story ${storyId}:`, error);
      throw error;
    }
  },

  // Get all archived stories - Using original endpoint
  getArchivedStories: async () => {
    try {
      const response = await axios.get(
        '/api/stories/archived', 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching archived stories:', error);
      throw error;
    }
  },

  // Get a single archived story - Using original endpoint
  getArchivedStory: async (storyId) => {
    try {
      const response = await axios.get(
        `/api/stories/archived/${storyId}`, 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching archived story ${storyId}:`, error);
      throw error;
    }
  },

  // Delete an archived story - Using original endpoint
  deleteArchivedStory: async (storyId) => {
    try {
      const response = await axios.delete(
        `/api/stories/archived/${storyId}`, 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting archived story ${storyId}:`, error);
      throw error;
    }
  }
};