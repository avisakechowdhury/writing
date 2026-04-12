import React, { useState } from 'react';
import { Send, Heart, User, Clock, MessageCircle, Eye, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { redirectToLanding } from '../../utils/toastUtils';
import toast from 'react-hot-toast';

function commentLooksLikeHtml(s: string) {
  return /<[a-z][\s\S]*>/i.test(s.trim());
}

const CommentBody: React.FC<{ content: string }> = ({ content }) => {
  const onContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      const href = (target as HTMLAnchorElement).href;
      if (href && !href.includes(window.location.origin)) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (commentLooksLikeHtml(content)) {
    return (
      <div
        className="post-html-content prose prose-sm max-w-none text-neutral-700 leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5 prose-a:text-blue-600"
        dangerouslySetInnerHTML={{ __html: content }}
        onClick={onContentClick}
      />
    );
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content}</ReactMarkdown>
  );
};

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
    const text = newComment.trim();
    if (!text) {
      toast.error('Write a comment first');
      return;
    }

    if (!user) {
      redirectToLanding();
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment(postId, text);
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
      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-neutral-100">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm text-neutral-500">Supports Markdown formatting</span>
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden text-sm shrink-0">
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
                    <CommentBody content={newComment.trim()} />
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
                  rows={4}
                />
              )}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 mt-3">
                <span className="text-xs text-neutral-500">
                  Use **bold**, _italic_, `code`, - or 1. for lists
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end sm:self-auto"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-neutral-900 text-sm">
                      {comment.authorName}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(
                          comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                    <CommentBody content={comment.content} />
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <button
                      type="button"
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
