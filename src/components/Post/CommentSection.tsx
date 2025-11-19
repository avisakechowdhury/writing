import React, { useState } from 'react';
import { Send, Heart, User, Clock, MessageCircle, Eye, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { redirectToLanding } from '../../utils/toastUtils';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (postId: string, content: string) => Promise<void> | void;
  onLikeComment: (commentId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  comments, 
  onAddComment,
  onLikeComment
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (!user) {
      redirectToLanding();
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment(postId, newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) {
      redirectToLanding();
      return;
    }

    onLikeComment(commentId);
  };

  return (
    <div className="border-t border-neutral-200 bg-white">
      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-neutral-100">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-500">Supports Markdown formatting</span>
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden text-sm">
                  <button
                    type="button"
                    className={`px-3 py-1 flex items-center space-x-1 ${!isPreviewMode ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setIsPreviewMode(false)}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 flex items-center space-x-1 ${isPreviewMode ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => setIsPreviewMode(true)}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
              {isPreviewMode ? (
                <div className="w-full px-3 py-2 border border-neutral-300 rounded-lg min-h-[120px] bg-neutral-50 prose prose-sm max-w-none text-neutral-700">
                  {newComment.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {newComment}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-neutral-400">Nothing to preview yet.</p>
                  )}
                </div>
              ) : (
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a thoughtful comment..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              )}
              <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
                <span>
                  Use **bold**, _italic_, `code`, -, 1. for lists
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-neutral-900 text-sm">
                      {comment.authorName}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {comment.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center space-x-1 text-xs transition-colors ${
                        user && comment.likedBy.includes(user.id)
                          ? 'text-error-600'
                          : 'text-neutral-500 hover:text-error-600'
                      }`}
                    >
                      <Heart className="w-3 h-3" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;