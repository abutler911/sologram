// Create or update client/src/utils/api.js
import axios from "axios";

// Create an axios instance with proper base URL handling
const api = axios.create({
  // In development, baseURL can be empty to use the proxy in package.json
  // In production, use the actual API URL
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://sologram-api.onrender.com"
      : "",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Token expired, clear local storage and redirect to login
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Handle server errors
    if (!error.response) {
      console.error("Network error - please check your connection");
    }

    return Promise.reject(error);
  }
);

export default api;
