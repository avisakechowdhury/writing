import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import PostCard from '../components/Post/PostCard';
import { Post } from '../types';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import toast from 'react-hot-toast';

const PostView: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { likePost, addComment } = usePosts();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canInteract, setCanInteract] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);
  
  useEffect(() => {
    setCanInteract(!!user);
  }, [user]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      const response = await postsAPI.getPost(postId!);
      setPost({
        ...response.post,
        createdAt: new Date(response.post.createdAt),
        updatedAt: new Date(response.post.updatedAt),
        comments: response.post.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }))
      });
    } catch (error: any) {
      console.error('Error loading post:', error);
      toast.error('Post not found or no longer available');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (postId: string) => {
    if (canInteract) {
      likePost(postId, user.id);
      // Update local state
      setPost(prev => {
        if (!prev) return null;
        const isLiked = prev.likedBy.includes(user.id);
        return {
          ...prev,
          likes: isLiked ? prev.likes - 1 : prev.likes + 1,
          likedBy: isLiked 
            ? prev.likedBy.filter(id => id !== user.id)
            : [...prev.likedBy, user.id]
        };
      });
    } else {
      toast.error('Please login to like posts');
    }
  };

  const handleComment = (postId: string, content: string) => {
    if (canInteract) {
      addComment(postId, {
        postId,
        authorId: user.id,
        authorName: user.displayName,
        content,
        likes: 0,
        likedBy: [],
        reactions: []
      });
    } else {
      toast.error('Please login to comment on posts');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-24"></div>
                <div className="h-3 bg-neutral-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
              <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Post Not Found</h1>
          <p className="text-neutral-600 mb-6">
            The post you're looking for doesn't exist or is no longer available.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Feed</span>
        </Link>
        
        <button
          onClick={() => {
            const shareUrl = `${window.location.origin}/post/${post.id}`;
            if (navigator.share) {
              navigator.share({
                title: post.title,
                text: `Check out this post: ${post.title}`,
                url: shareUrl
              });
            } else {
              navigator.clipboard.writeText(shareUrl);
              toast.success('Link copied to clipboard!');
            }
          }}
          className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Post */}
      <PostCard
        post={post}
        onLike={handleLike}
        onComment={handleComment}
      />
    </div>
  );
};

export default PostView;