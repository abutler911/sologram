import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`
  }
});

export const storiesApi = {
  getStories: async () => {
    try {
      const response = await axios.get('/api/stories');
      return response.data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  getStory: async (storyId) => {
    try {
      const response = await axios.get(`/api/stories/${storyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching story ${storyId}:`, error);
      throw error;
    }
  },

  createStory: async (formData) => {
    try {
      const response = await axios.post('/api/stories', formData, authHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

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

  getArchivedStories: async () => {
    try {
      const response = await axios.get(
        '/api/archived-stories', 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching archived stories:', error);
      throw error;
    }
  },

  getArchivedStory: async (storyId) => {
    try {
      const response = await axios.get(
        `/api/archived-stories/${storyId}`, 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching archived story ${storyId}:`, error);
      throw error;
    }
  },

  deleteArchivedStory: async (storyId) => {
    try {
      const response = await axios.delete(
        `/api/archived-stories/${storyId}`, 
        authHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting archived story ${storyId}:`, error);
      throw error;
    }
  }
};
