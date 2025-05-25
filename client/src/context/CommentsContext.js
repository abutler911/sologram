// context/CommentsContext.js - Global comments state management

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { toast } from "react-hot-toast";

const CommentsContext = createContext();

// Action types
const COMMENT_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_COMMENTS: "SET_COMMENTS",
  ADD_COMMENT: "ADD_COMMENT",
  UPDATE_COMMENT: "UPDATE_COMMENT",
  DELETE_COMMENT: "DELETE_COMMENT",
  LIKE_COMMENT: "LIKE_COMMENT",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_MODAL_STATE: "SET_MODAL_STATE",
};

// Initial state
const initialState = {
  commentsByPost: {}, // { postId: { comments: [], loading: false, error: null } }
  isLoading: false,
  error: null,
  modalState: {
    isOpen: false,
    postId: null,
    post: null,
  },
};

// Reducer
const commentsReducer = (state, action) => {
  switch (action.type) {
    case COMMENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...state.commentsByPost[action.postId],
            loading: action.loading,
          },
        },
      };

    case COMMENT_ACTIONS.SET_COMMENTS:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            comments: action.comments,
            loading: false,
            error: null,
          },
        },
      };

    case COMMENT_ACTIONS.ADD_COMMENT:
      const currentComments =
        state.commentsByPost[action.postId]?.comments || [];
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...state.commentsByPost[action.postId],
            comments: [action.comment, ...currentComments],
          },
        },
      };

    case COMMENT_ACTIONS.UPDATE_COMMENT:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...state.commentsByPost[action.postId],
            comments:
              state.commentsByPost[action.postId]?.comments.map((comment) =>
                comment._id === action.commentId
                  ? { ...comment, ...action.updates }
                  : comment
              ) || [],
          },
        },
      };

    case COMMENT_ACTIONS.DELETE_COMMENT:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...state.commentsByPost[action.postId],
            comments:
              state.commentsByPost[action.postId]?.comments.filter(
                (comment) => comment._id !== action.commentId
              ) || [],
          },
        },
      };

    case COMMENT_ACTIONS.LIKE_COMMENT:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...state.commentsByPost[action.postId],
            comments:
              state.commentsByPost[action.postId]?.comments.map((comment) =>
                comment._id === action.commentId
                  ? {
                      ...comment,
                      hasLiked: action.hasLiked,
                      likes: action.hasLiked
                        ? comment.likes + 1
                        : Math.max(0, comment.likes - 1),
                    }
                  : comment
              ) || [],
          },
        },
      };

    case COMMENT_ACTIONS.SET_ERROR:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...state.commentsByPost[action.postId],
            error: action.error,
            loading: false,
          },
        },
      };

    case COMMENT_ACTIONS.SET_MODAL_STATE:
      return {
        ...state,
        modalState: {
          ...state.modalState,
          ...action.modalState,
        },
      };

    default:
      return state;
  }
};

// Provider component
export const CommentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(commentsReducer, initialState);

  const getApiUrl = useCallback((endpoint) => {
    const baseURL = process.env.REACT_APP_API_URL || "";
    return baseURL ? `${baseURL}${endpoint}` : endpoint;
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // Fetch comments for a post
  const fetchComments = useCallback(
    async (postId) => {
      dispatch({ type: COMMENT_ACTIONS.SET_LOADING, postId, loading: true });

      try {
        const response = await fetch(
          getApiUrl(`/api/posts/${postId}/comments`),
          {
            headers: getAuthHeaders(),
          }
        );

        if (response.ok) {
          const data = await response.json();
          dispatch({
            type: COMMENT_ACTIONS.SET_COMMENTS,
            postId,
            comments: data.comments || [],
          });
          return data.comments;
        } else {
          throw new Error("Failed to fetch comments");
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        dispatch({
          type: COMMENT_ACTIONS.SET_ERROR,
          postId,
          error: error.message,
        });
        toast.error("Failed to load comments");
        return [];
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // Add a new comment
  const addComment = useCallback(
    async (postId, commentData) => {
      try {
        const response = await fetch(
          getApiUrl(`/api/posts/${postId}/comments`),
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(commentData),
          }
        );

        if (response.ok) {
          const newComment = await response.json();
          dispatch({
            type: COMMENT_ACTIONS.ADD_COMMENT,
            postId,
            comment: newComment,
          });
          return newComment;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add comment");
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        toast.error(error.message || "Failed to add comment");
        throw error;
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // Like/unlike a comment
  const likeComment = useCallback(
    async (postId, commentId) => {
      try {
        const response = await fetch(
          getApiUrl(`/api/comments/${commentId}/like`),
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );

        if (response.ok) {
          const updatedComment = await response.json();
          dispatch({
            type: COMMENT_ACTIONS.LIKE_COMMENT,
            postId,
            commentId,
            hasLiked: updatedComment.hasLiked,
          });
          return updatedComment;
        } else {
          throw new Error("Failed to like comment");
        }
      } catch (error) {
        console.error("Error liking comment:", error);
        toast.error("Failed to like comment");
        throw error;
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // Delete a comment
  const deleteComment = useCallback(
    async (postId, commentId) => {
      try {
        const response = await fetch(getApiUrl(`/api/comments/${commentId}`), {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          dispatch({
            type: COMMENT_ACTIONS.DELETE_COMMENT,
            postId,
            commentId,
          });
          toast.success("Comment deleted");
          return true;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete comment");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error(error.message || "Failed to delete comment");
        throw error;
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // Open comment modal
  const openCommentModal = useCallback(
    (post) => {
      dispatch({
        type: COMMENT_ACTIONS.SET_MODAL_STATE,
        modalState: {
          isOpen: true,
          postId: post._id,
          post,
        },
      });

      // Fetch comments if not already loaded
      if (!state.commentsByPost[post._id]) {
        fetchComments(post._id);
      }
    },
    [state.commentsByPost, fetchComments]
  );

  // Close comment modal
  const closeCommentModal = useCallback(() => {
    dispatch({
      type: COMMENT_ACTIONS.SET_MODAL_STATE,
      modalState: {
        isOpen: false,
        postId: null,
        post: null,
      },
    });
  }, []);

  // Get comments for a specific post
  const getCommentsForPost = useCallback(
    (postId) => {
      return (
        state.commentsByPost[postId] || {
          comments: [],
          loading: false,
          error: null,
        }
      );
    },
    [state.commentsByPost]
  );

  // Get comment count for a post
  const getCommentCount = useCallback(
    (postId) => {
      const postComments = state.commentsByPost[postId];
      return postComments ? postComments.comments.length : 0;
    },
    [state.commentsByPost]
  );

  const value = {
    // State
    commentsByPost: state.commentsByPost,
    modalState: state.modalState,

    // Actions
    fetchComments,
    addComment,
    likeComment,
    deleteComment,
    openCommentModal,
    closeCommentModal,

    // Helpers
    getCommentsForPost,
    getCommentCount,
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};

// Hook to use comments context
export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error("useComments must be used within a CommentsProvider");
  }
  return context;
};

export default CommentsContext;
