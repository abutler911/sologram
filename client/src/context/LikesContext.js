// src/context/LikesContext.js

import React, { createContext, useState, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast";

export const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [likedPosts, setLikedPosts] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if a post is liked by the current user
  const checkLikeStatus = useCallback(
    async (postId) => {
      if (!isAuthenticated || !user?._id) return false;

      try {
        // First check our local state
        if (likedPosts[postId] !== undefined) {
          return likedPosts[postId];
        }

        // If not in local state, check with the server
        const response = await fetch(`/api/posts/${postId}/likes/check`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const { hasLiked } = await response.json();

          // Update local state
          setLikedPosts((prev) => ({
            ...prev,
            [postId]: hasLiked,
          }));

          return hasLiked;
        }

        return false;
      } catch (error) {
        console.error("Error checking like status:", error);
        return false;
      }
    },
    [isAuthenticated, user, likedPosts]
  );

  // Like a post
  const likePost = useCallback(
    async (postId, onSuccess) => {
      if (!isAuthenticated) {
        toast.error("Please log in to like posts");
        return false;
      }

      if (isProcessing || likedPosts[postId]) return false;

      setIsProcessing(true);

      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          // Update local state
          setLikedPosts((prev) => ({
            ...prev,
            [postId]: true,
          }));

          if (typeof onSuccess === "function") {
            onSuccess();
          }

          return true;
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to like post");
          return false;
        }
      } catch (error) {
        console.error("Error liking post:", error);
        toast.error("Failed to like post");
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [isAuthenticated, isProcessing, likedPosts]
  );

  // Clear likes data (useful for logout)
  const clearLikesData = useCallback(() => {
    setLikedPosts({});
  }, []);

  return (
    <LikesContext.Provider
      value={{
        likedPosts,
        isProcessing,
        checkLikeStatus,
        likePost,
        clearLikesData,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
};

// Custom hook for easier context usage
export const useLikes = () => useContext(LikesContext);

export default LikesContext;
