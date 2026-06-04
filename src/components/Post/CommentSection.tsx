import React, { useState } from 'react';
import { Send, Heart, User, Clock, MessageCircle, Eye, Pencil, Reply, X } from 'lucide-react';
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
  isAnonymous?: boolean;
  postAuthorId?: string;
  onAddComment: (postId: string, content: string, parentId?: string | null) => Promise<void> | void;
  onLikeComment: (commentId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  isAnonymous = false,
  postAuthorId,
  onAddComment,
  onLikeComment
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const isPostAuthor = Boolean(
    user && postAuthorId && user.id === postAuthorId
  );

  const submitLabel = replyingTo
    ? 'Reply'
    : isAnonymous && isPostAuthor
      ? 'Comment as Author'
      : 'Comment';

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
      await onAddComment(postId, text, replyingTo?.id ?? null);
      setNewComment('');
      setReplyingTo(null);
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

  const rootComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, comment) => {
    if (!comment.parentId) return acc;
    if (!acc[comment.parentId]) acc[comment.parentId] = [];
    acc[comment.parentId].push(comment);
    return acc;
  }, {});

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex space-x-3 ${isReply ? 'ml-8 sm:ml-10' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          comment.authorName === 'Author'
            ? 'bg-gradient-to-br from-primary-500 to-violet-600'
            : 'bg-gradient-to-br from-secondary-500 to-accent-500'
        }`}
      >
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
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
          {user && (
            <button
              type="button"
              onClick={() => {
                setReplyingTo(comment);
                setIsPreviewMode(false);
              }}
              className="flex items-center space-x-1 text-xs text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          )}
        </div>
        {(repliesByParent[comment.id] || []).map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="border-t border-neutral-200 bg-white">
      {user && (
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-b border-neutral-100">
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
              <span>
                Replying to <strong>{replyingTo.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded hover:bg-primary-100 text-primary-700"
                aria-label="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isAnonymous && isPostAuthor
                  ? 'bg-gradient-to-br from-primary-500 to-violet-600'
                  : 'bg-gradient-to-br from-primary-500 to-secondary-500'
              }`}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm text-neutral-500">
                  {isAnonymous && isPostAuthor && !replyingTo
                    ? 'You will appear as Author'
                    : 'Supports Markdown formatting'}
                </span>
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
                <div className="w-full px-3 py-3 border border-neutral-300 rounded-lg min-h-[11rem] sm:min-h-[7.5rem] bg-neutral-50 prose prose-sm max-w-none text-neutral-700">
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
                  placeholder={
                    replyingTo
                      ? `Reply to ${replyingTo.authorName}...`
                      : isAnonymous && isPostAuthor
                        ? 'Reply as Author...'
                        : 'Add a thoughtful comment...'
                  }
                  className="w-full px-3 py-3 border border-neutral-300 rounded-lg resize-y min-h-[11rem] sm:min-h-[7.5rem] text-base sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={6}
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
                  <span>{isSubmitting ? 'Posting...' : submitLabel}</span>
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
            {rootComments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
