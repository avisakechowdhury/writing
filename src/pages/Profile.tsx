import React from 'react';
import { 
  User, 
  Flame, 
  Trophy, 
  Camera,
  MessageCircle,
  Heart,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/Post/PostCard';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { posts, likePost, addComment, likeComment } = usePosts();

  if (!user) return null;

  const userPosts = posts.filter(post => post.authorId === user.id);
  
  // Calculate total likes received on user's posts
  const totalLikesReceived = userPosts.reduce((sum, post) => sum + post.likes, 0);
  
  // Calculate total comments received on user's posts
  const totalCommentsReceived = userPosts.reduce((sum, post) => sum + post.comments.length, 0);

  const handleLike = (postId: string) => {
    likePost(postId, user.id);
  };

  const handleComment = (postId: string, content: string) => {
    addComment(postId, {
      postId,
      authorId: user.id,
      authorName: user.displayName,
      content,
      likes: 0,
      likedBy: [],
      reactions: []
    });
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    if (!user) return;
    likeComment(postId, commentId, user.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-8">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-12 h-12 text-primary-600" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white hover:bg-accent-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-center sm:text-left text-white">
                <h1 className="text-3xl font-bold mb-2">{user.displayName}</h1>
                <p className="text-primary-100 mb-4">
                  Writing since {user.joinedDate.toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-accent-300" />
                    <span className="font-semibold">{user.streak} day streak</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-accent-300" />
                    <span className="font-semibold">Level {user.level}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">{user.totalPosts}</div>
                <div className="text-sm text-neutral-600">Posts</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-error-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">{totalLikesReceived}</div>
                <div className="text-sm text-neutral-600">Likes Received</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <MessageCircle className="w-5 h-5 text-secondary-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">{totalCommentsReceived}</div>
                <div className="text-sm text-neutral-600">Comments Received</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">{user.points}</div>
                <div className="text-sm text-neutral-600">Points</div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <Link
                to="/settings"
                className="inline-flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Manage Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User Posts */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Your Posts</h2>
          
          {userPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No posts yet</h3>
              <p className="text-neutral-600">Start writing to see your posts here!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onLikeComment={handleLikeComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;