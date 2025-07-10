import { useState, useEffect } from 'react';
import { Post, Comment } from '../types';
import { postsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadPosts = async (pageNum: number = 1, filters?: any) => {
    try {
      setIsLoading(pageNum === 1);
      
      const response = await postsAPI.getPosts({
        page: pageNum,
        limit: 10,
        ...filters
      });
      
      const transformedPosts = response.posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        comments: post.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }))
      }));
      
      if (pageNum === 1) {
        setPosts(transformedPosts);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
      }
      
      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await postsAPI.createPost(postData);
      
      const newPost = {
        ...response.post,
        createdAt: new Date(response.post.createdAt),
        updatedAt: new Date(response.post.updatedAt),
        comments: []
      };
      
      setPosts(prev => [newPost, ...prev]);
      toast.success('Post published successfully!');
      
      return newPost;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create post';
      toast.error(message);
      throw error;
    }
  };

  const likePost = async (postId: string, userId: string) => {
    try {
      // Optimistic update
      setPosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            const isLiked = post.likedBy.includes(userId);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked 
                ? post.likedBy.filter(id => id !== userId)
                : [...post.likedBy, userId]
            };
          }
          return post;
        })
      );
      
      await postsAPI.likePost(postId);
    } catch (error: any) {
      // Revert optimistic update on error
      setPosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            const isLiked = !post.likedBy.includes(userId);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked 
                ? post.likedBy.filter(id => id !== userId)
                : [...post.likedBy, userId]
            };
          }
          return post;
        })
      );
      
      toast.error('Failed to update like');
    }
  };

  const addComment = async (postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>) => {
    try {
      const response = await postsAPI.addComment(postId, commentData.content);
      
      const newComment = {
        ...response.comment,
        createdAt: new Date(response.comment.createdAt)
      };
      
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, comments: [...post.comments, newComment] }
            : post
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

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const refresh = (filters?: any) => {
    setPage(1);
    loadPosts(1, filters);
  };

  return {
    posts,
    isLoading,
    hasMore,
    createPost,
    likePost,
    addComment,
    loadMore,
    refresh
  };
};