import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set axios default headers
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get("/api/auth/me");
          setUser(res.data.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post("/api/auth/register", formData);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success("Registration successful!");
      return true;
    } catch (err) {
      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Registration failed";

      toast.error(errorMessage);
      return false;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return true;
    } catch (err) {
      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Login failed";

      toast.error(errorMessage);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  // Update profile
  const updateProfile = async (formData) => {
    try {
      const res = await axios.put("/api/auth/update-profile", formData);

      setUser(res.data.data);
      toast.success("Profile updated successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err.response && err.response.data.message
          ? err.response.data.message
          : "Profile update failed";

      toast.error(errorMessage);
      return false;
    }
  };

  // Update bio only
  const updateBio = async (bio) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.put("/api/auth/update-bio", { bio }, config);

      setUser(res.data.data);
      return true;
    } catch (err) {
      console.error("Bio update error:", err);

      // If endpoint doesn't exist yet (404), fall back to the profile endpoint
      if (err.response && err.response.status === 404) {
        try {
          const formData = new FormData();
          formData.append("bio", bio);

          const res = await axios.put("/api/auth/update-profile", formData);

          setUser(res.data.data);
          return true;
        } catch (fallbackErr) {
          console.error("Fallback update error:", fallbackErr);

          const errorMessage =
            fallbackErr.response && fallbackErr.response.data.message
              ? fallbackErr.response.data.message
              : "Bio update failed";

          toast.error(errorMessage);
          return false;
        }
      } else {
        const errorMessage =
          err.response && err.response.data.message
            ? err.response.data.message
            : "Bio update failed";

        toast.error(errorMessage);
        return false;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        updateProfile,
        updateBio,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
