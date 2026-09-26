import { useState, useEffect, useRef, useCallback } from 'react';
import { Post, Comment } from '../types';
import { postsAPI } from '../services/api';
import toast from 'react-hot-toast';

const API_TIMEOUT_MS = 25000;
const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export type PostFilters = {
  search?: string;
  mood?: string;
};

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PostFilters>({});
  const likeCooldownRef = useRef<Map<string, number>>(new Map());

  const loadPosts = useCallback(async (pageNum: number = 1, activeFilters?: PostFilters) => {
    const appliedFilters = activeFilters ?? filters;

    try {
      if (pageNum === 1) {
        setIsLoading(true);
        setLoadError(null);
      } else {
        setIsLoadingMore(true);
      }

      const params: Record<string, unknown> = {
        page: pageNum,
        limit: 10,
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.mood && appliedFilters.mood !== 'all') params.mood = appliedFilters.mood;

      const response = await withRetry(() =>
        postsAPI.getPosts(params, API_TIMEOUT_MS)
      );

      const transformedPosts = response.posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        contentEditedAt: post.contentEditedAt ? new Date(post.contentEditedAt) : null,
        comments: post.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
        })),
      }));

      if (pageNum === 1) {
        setPosts(transformedPosts);
      } else {
        setPosts((prev) => [...prev, ...transformedPosts]);
      }

      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      const isTimeout = error.code === 'ECONNABORTED';
      const message = isTimeout
        ? 'The server is waking up. Please try again in a moment.'
        : 'Failed to load posts. Please check your connection.';
      setLoadError(message);
      if (pageNum === 1) {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPosts(1);
  }, []);

  const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await postsAPI.createPost(postData);

      const newPost = {
        ...response.post,
        createdAt: new Date(response.post.createdAt),
        updatedAt: new Date(response.post.updatedAt),
        contentEditedAt: response.post.contentEditedAt
          ? new Date(response.post.contentEditedAt)
          : null,
        comments: [],
      };

      setPosts((prev) => [newPost, ...prev]);
      toast.success('Post published successfully!');

      return newPost;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create post';
      toast.error(message);
      throw error;
    }
  };

  const likePost = async (postId: string, userId: string) => {
    const now = Date.now();
    const last = likeCooldownRef.current.get(postId) || 0;
    if (now - last < 450) return;
    likeCooldownRef.current.set(postId, now);

    try {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const isLiked = post.likedBy.includes(userId);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked
                ? post.likedBy.filter((id) => id !== userId)
                : [...post.likedBy, userId],
            };
          }
          return post;
        })
      );

      await postsAPI.likePost(postId);
    } catch (error: any) {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const isLiked = !post.likedBy.includes(userId);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked
                ? post.likedBy.filter((id) => id !== userId)
                : [...post.likedBy, userId],
            };
          }
          return post;
        })
      );

      toast.error('Failed to update like');
    }
  };

  const updatePost = async (postId: string, data: { title: string; content: string }) => {
    try {
      const response = await postsAPI.updatePost(postId, data);
      const updated = {
        ...response.post,
        createdAt: new Date(response.post.createdAt),
        updatedAt: new Date(response.post.updatedAt),
        contentEditedAt: response.post.contentEditedAt
          ? new Date(response.post.contentEditedAt)
          : null,
        comments: (response.post.comments || []).map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
        })),
      };

      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...updated } : post)));

      toast.success('Post updated successfully!');
      return updated;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update post';
      toast.error(message);
      throw error;
    }
  };

  const addComment = async (postId: string, content: string, parentId?: string | null) => {
    try {
      const response = await postsAPI.addComment(postId, content, parentId);

      const newComment = {
        ...response.comment,
        createdAt: new Date(response.comment.createdAt),
      };

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
        )
      );

      toast.success('Comment added successfully!');
      return newComment;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add comment';
      toast.error(message);
      throw error;
    }
  };

  const likeComment = async (postId: string, commentId: string, userId: string) => {
    try {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            comments: post.comments.map((comment) => {
              if (comment.id !== commentId) return comment;
              const isLiked = comment.likedBy.includes(userId);
              return {
                ...comment,
                likes: isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                likedBy: isLiked
                  ? comment.likedBy.filter((id) => id !== userId)
                  : [...comment.likedBy, userId],
              };
            }),
          };
        })
      );

      await postsAPI.likeComment(postId, commentId);
    } catch (error: any) {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            comments: post.comments.map((comment) => {
              if (comment.id !== commentId) return comment;
              const isLiked = !comment.likedBy.includes(userId);
              return {
                ...comment,
                likes: isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                likedBy: isLiked
                  ? comment.likedBy.filter((id) => id !== userId)
                  : [...comment.likedBy, userId],
              };
            }),
          };
        })
      );

      toast.error('Failed to update comment like');
    }
  };

  const loadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore && !loadError) {
      loadPosts(page + 1);
    }
  };

  const refresh = (newFilters?: PostFilters) => {
    const nextFilters = newFilters ?? filters;
    setFilters(nextFilters);
    setPage(1);
    setHasMore(true);
    loadPosts(1, nextFilters);
  };

  const retry = () => {
    setLoadError(null);
    loadPosts(1);
  };

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    loadError,
    createPost,
    updatePost,
    likePost,
    addComment,
    likeComment,
    loadMore,
    refresh,
    retry,
  };
};
