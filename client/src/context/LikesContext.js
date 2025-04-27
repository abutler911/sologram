import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast";

export const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [likedPosts, setLikedPosts] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Define API base URL - use environment variable if available
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://sologram-api.onrender.com";

  // Clear likes data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setLikedPosts({});
    }
  }, [isAuthenticated]);

  // Batch check multiple posts at once
  const batchCheckLikeStatus = useCallback(
    async (postIds) => {
      if (!isAuthenticated || !user?._id || !postIds.length) return;

      // Filter out posts we already know about
      const postsToCheck = postIds.filter((id) => likedPosts[id] === undefined);
      if (!postsToCheck.length) return;

      try {
        // This would require a new backend endpoint to check multiple posts at once
        const response = await fetch(
          `${API_BASE_URL}/api/posts/likes/check-batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ postIds: postsToCheck }),
          }
        );

        if (response.ok) {
          const { results } = await response.json();
          // Update local state with batch results
          const newLikedPosts = { ...likedPosts };
          results.forEach((result) => {
            newLikedPosts[result.postId] = result.hasLiked;
          });
          setLikedPosts(newLikedPosts);
        }
      } catch (error) {
        console.error("Error batch checking like status:", error);
      }
    },
    [isAuthenticated, user, likedPosts, API_BASE_URL]
  );

  // Individual post like status check (keep for backward compatibility)
  const checkLikeStatus = useCallback(
    async (postId) => {
      if (!isAuthenticated || !user?._id) return false;

      try {
        // First check our local state
        if (likedPosts[postId] !== undefined) {
          return likedPosts[postId];
        }

        // If not in local state, check with the server
        const response = await fetch(
          `${API_BASE_URL}/api/posts/${postId}/likes/check`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

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
    [isAuthenticated, user, likedPosts, API_BASE_URL]
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
        const response = await fetch(
          `${API_BASE_URL}/api/posts/${postId}/like`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Get response text first for better error handling
        const responseText = await response.text();
        let responseData;

        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.log("Response was not valid JSON");
        }

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
        } else if (
          responseText.includes("already liked") ||
          (responseData &&
            responseData.message &&
            responseData.message.includes("already liked"))
        ) {
          // Already liked - update UI state without error message
          setLikedPosts((prev) => ({
            ...prev,
            [postId]: true,
          }));

          if (typeof onSuccess === "function") {
            onSuccess();
          }

          return true;
        } else {
          // Other error
          const errorMessage = responseData?.message || "Failed to like post";
          toast.error(errorMessage);
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
    [isAuthenticated, isProcessing, likedPosts, API_BASE_URL]
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
        batchCheckLikeStatus,
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
