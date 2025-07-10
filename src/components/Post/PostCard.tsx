import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock, 
  User, 
  Eye,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLiked = user ? post.likedBy.includes(user.id) : false;
  const timeAgo = formatDistanceToNow(post.createdAt, { addSuffix: true });

  const handleLike = () => {
    if (user) {
      onLike(post.id);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this post: ${post.title}`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
        toast.error('Failed to copy link');
      }
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'happy': return 'bg-success-100 text-success-700';
      case 'sad': return 'bg-primary-100 text-primary-700';
      case 'anxious': return 'bg-warning-100 text-warning-700';
      case 'grateful': return 'bg-secondary-100 text-secondary-700';
      case 'peaceful': return 'bg-accent-100 text-accent-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getPreview = (content: string, maxLength: number = 200) => {
    const text = stripHtml(content);
    if (text.length <= maxLength) return content;
    return text.substring(0, maxLength) + '...';
  };

  const shouldShowReadMore = stripHtml(post.content).length > 200;

  // Profile link component
  const ProfileLink = ({ children }: { children: React.ReactNode }) => {
    if (post.isAnonymous) {
      return <div className="cursor-default">{children}</div>;
    }
    
    return (
      <Link 
        to={`/profile/${post.authorId}`}
        className="hover:opacity-80 transition-opacity"
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden hover:shadow-medium transition-all duration-300">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ProfileLink>
              <div className={`w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center ${!post.isAnonymous ? 'cursor-pointer' : ''}`}>
                {post.isAnonymous ? (
                  <Eye className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
            </ProfileLink>
            <div>
              <ProfileLink>
                <h3 className={`font-semibold text-neutral-900 ${!post.isAnonymous ? 'hover:text-primary-600 transition-colors' : ''}`}>
                  {post.isAnonymous ? 'Anonymous' : post.authorName}
                </h3>
              </ProfileLink>
              <div className="flex items-center space-x-2 text-sm text-neutral-500">
                <Clock className="w-4 h-4" />
                <span>{timeAgo}</span>
                <span>•</span>
                <span>{post.wordCount} words</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {post.mood && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(post.mood)}`}>
                {post.mood}
              </span>
            )}
            
            {/* Message button for non-anonymous posts */}
            {!post.isAnonymous && user && post.authorId !== user.id && (
              <Link
                to={`/messages/${post.authorId}`}
                className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                title="Send message"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-neutral-900 mb-3 leading-tight">
          {post.title}
        </h2>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <div 
          className="prose prose-sm max-w-none text-neutral-700 leading-relaxed prose-a:text-blue-600 prose-a:underline prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ 
            __html: isExpanded ? post.content : getPreview(post.content) 
          }}
        />
        
        {shouldShowReadMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center space-x-1 transition-colors"
          >
            <span>{isExpanded ? 'Read less' : 'Read more'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isLiked 
                  ? 'text-error-600 bg-error-50 hover:bg-error-100' 
                  : 'text-neutral-600 hover:text-error-600 hover:bg-error-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{post.comments.length}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-secondary-600 hover:bg-secondary-50 transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>

          <div className="text-sm text-neutral-500">
            {format(post.createdAt, 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={post.comments}
          onAddComment={onComment}
        />
      )}
    </div>
  );
};

export default PostCard;