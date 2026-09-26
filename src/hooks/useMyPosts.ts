import { useState, useEffect, useCallback } from 'react';
import { Post } from '../types';
import { postsAPI } from '../services/api';
import toast from 'react-hot-toast';

const transformPost = (post: any): Post => ({
  ...post,
  createdAt: new Date(post.createdAt),
  updatedAt: new Date(post.updatedAt),
  contentEditedAt: post.contentEditedAt ? new Date(post.contentEditedAt) : null,
  comments: (post.comments || []).map((comment: any) => ({
    ...comment,
    createdAt: new Date(comment.createdAt),
  })),
});

export const useMyPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const loadPosts = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const response = await postsAPI.getMyPosts({ page: pageNum, limit });
      const transformed = response.posts.map(transformPost);

      setPosts((prev) => (append ? [...prev, ...transformed] : transformed));
      setHasMore(response.pagination.page < response.pagination.pages);
      setTotal(response.pagination.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading my posts:', error);
      toast.error('Failed to load your posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  const loadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  const refresh = () => loadPosts(1, false);

  const updatePostInList = (postId: string, updater: (post: Post) => Post) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
  };

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refresh,
    updatePostInList,
  };
};
