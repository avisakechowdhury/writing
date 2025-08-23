import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import reportsApi from '../services/reportsApi';
import toast from 'react-hot-toast';
import { showAuthRequiredToastSimple } from '../utils/toastUtils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedItemType: 'post' | 'comment' | 'chat_message' | 'user';
  reportedItemId: string;
  reportedItemTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedItemType,
  reportedItemId,
  reportedItemTitle
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam', description: 'Unwanted commercial content or repetitive messages' },
    { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Content that violates community guidelines' },
    { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted abuse' },
    { value: 'hate_speech', label: 'Hate Speech', description: 'Discriminatory or offensive language' },
    { value: 'violence', label: 'Violence', description: 'Promotion of violence or harm' },
    { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
    { value: 'copyright_violation', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
    { value: 'other', label: 'Other', description: 'Other violations not listed above' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showAuthRequiredToastSimple('submit a report');
      return;
    }

    if (!reason || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      await reportsApi.submitReport({
        reportedItemType,
        reportedItemId,
        reason: reason as any,
        description: description.trim()
      });

      toast.success('Report submitted successfully');
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Submit report error:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReason('');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-error-100 rounded-full flex items-center justify-center">
              <Flag className="w-5 h-5 text-error-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Report {reportedItemType}</h2>
              <p className="text-sm text-neutral-600">Help us keep the community safe</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {reportedItemTitle && (
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600 mb-1">Reporting:</p>
              <p className="text-neutral-900 font-medium">{reportedItemTitle}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Reason for report *
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label key={r.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">{r.label}</div>
                    <div className="text-xs text-neutral-600">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional details *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Please provide specific details about why you're reporting this content..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-neutral-500">
                Minimum 10 characters required
              </p>
              <p className="text-xs text-neutral-500">
                {description.length}/500
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-800">
                  False reporting
                </p>
                <p className="text-xs text-warning-700 mt-1">
                  Submitting false reports may result in account restrictions. Please only report content that genuinely violates our community guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason || description.trim().length < 10}
              className="flex-1 px-4 py-3 bg-error-600 text-white font-medium rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
