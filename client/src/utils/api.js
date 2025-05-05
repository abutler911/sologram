import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://sologram-api.onrender.com/api"
      : "/api", // assumes proxy setup in dev
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 + refresh flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${
            process.env.NODE_ENV === "production"
              ? "https://sologram-api.onrender.com/api"
              : "/api"
          }/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest); // Retry original request
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        localStorage.removeItem("accessToken");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    if (!error.response) {
      console.error("Network error - please check your connection");
    }

    return Promise.reject(error);
  }
);

export default api;
