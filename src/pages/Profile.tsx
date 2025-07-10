import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Flame, 
  Trophy, 
  Edit,
  Bell,
  Eye,
  EyeOff,
  Save,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/Post/PostCard';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { posts, likePost, addComment } = usePosts();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    notifications: user?.preferences.notifications || true,
    reminderTime: user?.preferences.reminderTime || '20:00'
  });

  if (!user) return null;

  const userPosts = posts.filter(post => post.authorId === user.id);
  const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
  const totalComments = userPosts.reduce((sum, post) => sum + post.comments.length, 0);

  const handleSave = () => {
    updateUser({
      displayName: editForm.displayName,
      email: editForm.email,
      preferences: {
        ...user.preferences,
        notifications: editForm.notifications,
        reminderTime: editForm.reminderTime
      }
    });
    setIsEditing(false);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">{user.totalPosts}</div>
                <div className="text-sm text-neutral-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">{totalLikes}</div>
                <div className="text-sm text-neutral-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">{totalComments}</div>
                <div className="text-sm text-neutral-600">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">{user.points}</div>
                <div className="text-sm text-neutral-600">Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Settings</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
                />
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-neutral-600" />
                    <div>
                      <div className="font-medium text-neutral-900">Notifications</div>
                      <div className="text-sm text-neutral-600">Receive daily writing reminders</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.notifications}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notifications: e.target.checked }))}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {editForm.notifications && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={editForm.reminderTime}
                      onChange={(e) => setEditForm(prev => ({ ...prev, reminderTime: e.target.value }))}
                      disabled={!isEditing}
                      className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
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