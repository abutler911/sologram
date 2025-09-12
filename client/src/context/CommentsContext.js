// context/CommentsContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { toast } from "react-hot-toast";

const CommentsContext = createContext();

const A = {
  SET_LOADING: "SET_LOADING",
  SET_COMMENTS: "SET_COMMENTS",
  ADD_COMMENT: "ADD_COMMENT",
  UPDATE_COMMENT: "UPDATE_COMMENT",
  DELETE_COMMENT: "DELETE_COMMENT",
  SET_ERROR: "SET_ERROR",
  SET_MODAL_STATE: "SET_MODAL_STATE",
};

const initialState = {
  commentsByPost: {}, // { [postId]: { comments, loading, error } }
  modalState: { isOpen: false, postId: null, post: null },
};

const reducer = (state, action) => {
  switch (action.type) {
    case A.SET_LOADING:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...(state.commentsByPost[action.postId] || {}),
            loading: action.loading,
            error: null,
          },
        },
      };
    case A.SET_COMMENTS:
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
    case A.ADD_COMMENT: {
      const cur = state.commentsByPost[action.postId]?.comments || [];
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...(state.commentsByPost[action.postId] || {}),
            comments: [action.comment, ...cur],
            loading: false,
            error: null,
          },
        },
      };
    }
    case A.UPDATE_COMMENT:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...(state.commentsByPost[action.postId] || {}),
            comments: (state.commentsByPost[action.postId]?.comments || []).map(
              (c) =>
                c._id === action.comment._id ? { ...c, ...action.comment } : c
            ),
          },
        },
      };
    case A.DELETE_COMMENT:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...(state.commentsByPost[action.postId] || {}),
            comments: (
              state.commentsByPost[action.postId]?.comments || []
            ).filter((c) => c._id !== action.commentId),
          },
        },
      };
    case A.SET_ERROR:
      return {
        ...state,
        commentsByPost: {
          ...state.commentsByPost,
          [action.postId]: {
            ...(state.commentsByPost[action.postId] || {}),
            error: action.error,
            loading: false,
          },
        },
      };
    case A.SET_MODAL_STATE:
      return {
        ...state,
        modalState: { ...state.modalState, ...action.modalState },
      };
    default:
      return state;
  }
};

export const CommentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getApiUrl = useCallback((endpoint) => {
    const baseURL = process.env.REACT_APP_API_URL || "";
    return baseURL ? `${baseURL}${endpoint}` : endpoint;
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, []);

  // LOAD
  const fetchComments = useCallback(
    async (postId) => {
      dispatch({ type: A.SET_LOADING, postId, loading: true });
      try {
        const r = await fetch(getApiUrl(`/api/posts/${postId}/comments`), {
          headers: getAuthHeaders(),
        });
        if (!r.ok) throw new Error("Failed to fetch comments");
        const data = await r.json();
        dispatch({
          type: A.SET_COMMENTS,
          postId,
          comments: data.comments || [],
        });
        return data.comments || [];
      } catch (e) {
        console.error("fetchComments:", e);
        dispatch({ type: A.SET_ERROR, postId, error: e.message || "Error" });
        toast.error("Failed to load comments");
        return [];
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // CREATE
  const addComment = useCallback(
    async (postId, { text, parentId = null }) => {
      try {
        const r = await fetch(getApiUrl(`/api/posts/${postId}/comments`), {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ text, parentId }),
        });
        const data = await r.json();
        if (!r.ok || !data?.success)
          throw new Error(data?.message || "Failed to add");
        const comment = data.comment;
        dispatch({ type: A.ADD_COMMENT, postId, comment });
        return comment;
      } catch (e) {
        console.error("addComment:", e);
        toast.error(e.message || "Failed to add comment");
        throw e;
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // LIKE/UNLIKE
  const likeComment = useCallback(
    async (postId, commentId) => {
      try {
        const r = await fetch(getApiUrl(`/api/comments/${commentId}/like`), {
          method: "POST",
          headers: getAuthHeaders(),
        });
        const data = await r.json();
        if (!r.ok || !data?.success)
          throw new Error(data?.message || "Failed to like");
        const comment = data.comment;
        dispatch({ type: A.UPDATE_COMMENT, postId, comment });
        return comment;
      } catch (e) {
        console.error("likeComment:", e);
        toast.error(e.message || "Failed to like comment");
        throw e;
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // DELETE
  const deleteComment = useCallback(
    async (postId, commentId) => {
      try {
        const r = await fetch(getApiUrl(`/api/comments/${commentId}`), {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const data = await r.json();
        if (!r.ok || !data?.success)
          throw new Error(data?.message || "Failed to delete");
        dispatch({ type: A.DELETE_COMMENT, postId, commentId });
        toast.success("Comment deleted");
        return true;
      } catch (e) {
        console.error("deleteComment:", e);
        toast.error(e.message || "Failed to delete");
        throw e;
      }
    },
    [getApiUrl, getAuthHeaders]
  );

  // MODAL
  const openCommentModal = useCallback(
    (post) => {
      dispatch({
        type: A.SET_MODAL_STATE,
        modalState: { isOpen: true, postId: post._id, post },
      });
      if (!state.commentsByPost[post._id]) {
        fetchComments(post._id);
      }
    },
    [state.commentsByPost, fetchComments]
  );

  const closeCommentModal = useCallback(() => {
    dispatch({
      type: A.SET_MODAL_STATE,
      modalState: { isOpen: false, postId: null, post: null },
    });
  }, []);

  const getCommentsForPost = useCallback(
    (postId) =>
      state.commentsByPost[postId] || {
        comments: [],
        loading: false,
        error: null,
      },
    [state.commentsByPost]
  );

  const value = {
    commentsByPost: state.commentsByPost,
    modalState: state.modalState,
    fetchComments,
    addComment,
    likeComment,
    deleteComment,
    openCommentModal,
    closeCommentModal,
    getCommentsForPost,
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const ctx = useContext(CommentsContext);
  if (!ctx)
    throw new Error("useComments must be used within a CommentsProvider");
  return ctx;
};

export default CommentsContext;
