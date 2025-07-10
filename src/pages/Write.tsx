import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Eye, EyeOff, Sparkles, Clock } from 'lucide-react';
import RichTextEditor from '../components/Editor/RichTextEditor';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import toast from 'react-hot-toast';

const Write: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { createPost } = usePosts();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'peaceful', label: 'Peaceful', emoji: '😌' },
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
    { value: 'excited', label: 'Excited', emoji: '🤩' },
    { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
  ];

  // Auto-save draft
  useEffect(() => {
    const draft = {
      title,
      content,
      isAnonymous,
      mood,
      tags
    };
    
    if (title || content) {
      localStorage.setItem('current_draft', JSON.stringify(draft));
      setLastSaved(new Date());
    }
  }, [title, content, isAnonymous, mood, tags]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('current_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setIsAnonymous(draft.isAnonymous || false);
        setMood(draft.mood || '');
        setTags(draft.tags || '');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Update word count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData: any = {
        title: title.trim(),
        content: content.trim(),
        isAnonymous,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      // Only add mood if it's provided and not empty
      if (mood && mood.trim() !== '') {
        postData.mood = mood;
      }

      console.log('Submitting post data:', postData);

      await createPost(postData);

      // Update user stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastWrite = user.lastWriteDate ? new Date(user.lastWriteDate) : null;
      
      if (!lastWrite || lastWrite < today) {
        const newStreak = user.streak + 1;
        const newPoints = user.points + 10;
        const newLevel = Math.floor(newPoints / 100) + 1;
        
        updateUser({
          streak: newStreak,
          points: newPoints,
          level: newLevel,
          totalPosts: user.totalPosts + 1,
          lastWriteDate: new Date()
        });
      }

      // Clear draft
      localStorage.removeItem('current_draft');
      
      toast.success('Post published successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Post creation error:', error);
      const message = error.response?.data?.message || 'Failed to publish post. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    setTitle('');
    setContent('');
    setIsAnonymous(false);
    setMood('');
    setTags('');
    localStorage.removeItem('current_draft');
    toast.success('Draft cleared');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Please Login</h1>
          <p className="text-neutral-600 mb-6">You need to be logged in to write a post.</p>
          <button
            onClick={() => navigate('/landing')}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Write Your Story</h1>
              <p className="text-neutral-600">Share your thoughts with the world</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-500">
                <Clock className="w-4 h-4" />
                <span>
                  {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                {wordCount} words
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a compelling title..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Content
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your thoughts..."
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                How are you feeling? (Optional)
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select your mood (optional)</option>
                {moods.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="writing, motivation, life (comma-separated)"
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div className="flex items-center space-x-2">
                {isAnonymous ? (
                  <EyeOff className="w-5 h-5 text-neutral-600" />
                ) : (
                  <Eye className="w-5 h-5 text-neutral-600" />
                )}
                <span className="font-medium text-neutral-700">
                  {isAnonymous ? 'Post anonymously' : 'Post publicly'}
                </span>
              </div>
            </label>
            <span className="text-sm text-neutral-500">
              {isAnonymous ? 'Your identity will be hidden' : 'Your name will be visible'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              type="button"
              onClick={clearDraft}
              className="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors"
            >
              Clear Draft
            </button>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || isSubmitting}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Write;