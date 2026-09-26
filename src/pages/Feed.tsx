import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Plus, PenTool, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PostCard from '../components/Post/PostCard';
import PushPromptBanner from '../components/PushPromptBanner';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import { showAuthRequiredToastSimple, redirectToLanding } from '../utils/toastUtils';
import { MOOD_FILTER_OPTIONS, MOODS } from '../constants/moods';
import { pingHealth } from '../services/api';

const Feed: React.FC = () => {
  const { posts, isLoading, isLoadingMore, hasMore, loadError, likePost, addComment, likeComment, loadMore, refresh, retry } = usePosts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const skipFilterRefresh = useRef(true);

  useEffect(() => {
    void pingHealth();
  }, []);

  useEffect(() => {
    if (skipFilterRefresh.current) {
      skipFilterRefresh.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      refresh({ search: searchTerm || undefined, mood: selectedMood });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedMood]);

  const handleLike = (postId: string) => {
    if (!user) {
      showAuthRequiredToastSimple('like posts');
      return;
    }
    likePost(postId, user.id);
  };

  const handleComment = (postId: string, content: string, parentId?: string | null) => {
    if (!user) {
      redirectToLanding();
      return;
    }
    addComment(postId, content, parentId);
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    if (!user) {
      redirectToLanding();
      return;
    }
    likeComment(postId, commentId, user.id);
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
      if (hasMore && !isLoadingMore && !isLoading && !loadError) {
        loadMore();
      }
    }
  }, [hasMore, isLoadingMore, isLoading, loadError, loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const moodLabel = (mood: string) => {
    if (mood === 'all') return 'All Moods';
    const found = MOODS.find((m) => m.value === mood);
    return found ? `${found.emoji} ${found.label}` : mood.charAt(0).toUpperCase() + mood.slice(1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>WriteAnon — Read & Write Anonymous Stories, Journal Entries & Mental Health Posts</title>
        <meta name="description" content="Explore anonymous stories, mental health journal entries, and thoughtful posts on WriteAnon. Write anonymously, publish your own stories, and join a supportive anonymous writing community. Free and private." />
        <meta name="keywords" content="anonymous writing, anonymous writer, anonymous stories, anon writer, anon stories, write anonymously, publish anonymously online, anonymous journal, mental health stories, anonymous posting site, write your thoughts online, daily mental health journal, anonymous writing website" />
        <link rel="canonical" href="https://writeanon.in/" />
        <meta property="og:title" content="WriteAnon — Anonymous Stories & Mental Health Writing" />
        <meta property="og:description" content="Read and write anonymous stories, journal entries, and mental health posts. Free and private." />
        <meta property="og:url" content="https://writeanon.in/" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      </Helmet>
      <PushPromptBanner />
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                WriteAnon
              </h1>
            </div>
            <p className="text-base sm:text-lg text-neutral-600 italic mb-2">Your story. Your secret.</p>
            <p className="text-sm sm:text-base text-neutral-500">Discover inspiring stories from writers around the world</p>
          </div>
          <Link
            to="/write"
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Write</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="pl-10 pr-8 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
            >
              {MOOD_FILTER_OPTIONS.map(mood => (
                <option key={mood} value={mood}>
                  {moodLabel(mood)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {loadError && !isLoading && posts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">Having trouble loading</h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200 animate-pulse">
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
              <div className="flex space-x-4">
                <div className="h-8 bg-neutral-200 rounded w-16"></div>
                <div className="h-8 bg-neutral-200 rounded w-16"></div>
                <div className="h-8 bg-neutral-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !loadError && posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No posts found</h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm || selectedMood !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Be the first to share your thoughts!'
            }
          </p>
          <Link
            to="/write"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Write Your First Post</span>
          </Link>
        </div>
      ) : !loadError ? (
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onLikeComment={handleLikeComment}
            />
          ))}
          
          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2 text-neutral-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more posts...</span>
              </div>
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">You've reached the end!</h3>
              <p className="text-neutral-600 mb-6">
                You've seen all the posts. Check back later for more inspiring stories!
              </p>
              <Link
                to="/write"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Write Your Own Story</span>
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Feed;
