import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Heart, 
  MessageCircle, 
  Trophy, 
  UserPlus, 
  UserMinus,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import PostCard from '../components/Post/PostCard';
import toast from 'react-hot-toast';

interface UserProfileData {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    streak: number;
    level: number;
    totalPosts: number;
    joinedDate: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    totalLikes: number;
  };
  posts: any[];
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getProfile(userId!);
      setProfileData(response);
      setIsFollowing(response.user.isFollowing);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileData) return;

    try {
      const response = await usersAPI.followUser(profileData.user.id);
      setIsFollowing(response.isFollowing);
      
      // Update followers count
      setProfileData(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          followersCount: response.followersCount
        }
      } : null);

      toast.success(response.message);
    } catch (error: any) {
      console.error('Error following user:', error);
      toast.error('Failed to follow/unfollow user');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="bg-white rounded-2xl p-8 shadow-soft">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-24 h-24 bg-neutral-200 rounded-full"></div>
              <div className="space-y-3">
                <div className="h-6 bg-neutral-200 rounded w-32"></div>
                <div className="h-4 bg-neutral-200 rounded w-24"></div>
                <div className="h-4 bg-neutral-200 rounded w-40"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-neutral-200 rounded mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">User Not Found</h1>
          <p className="text-neutral-600 mb-6">The user you're looking for doesn't exist.</p>
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

  const { user: profileUser, posts } = profileData;
  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Feed</span>
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <User className="w-12 h-12 text-primary-600" />
            </div>
            
            <div className="text-center sm:text-left text-white flex-1">
              <h1 className="text-3xl font-bold mb-2">{profileUser.displayName}</h1>
              <p className="text-primary-100 mb-4">
                @{profileUser.username} • Joined {new Date(profileUser.joinedDate).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-accent-300" />
                  <span className="font-semibold">Level {profileUser.level}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-accent-300" />
                  <span className="font-semibold">{profileUser.streak} day streak</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && currentUser && (
              <div className="flex space-x-3">
                <Link
                  to={`/messages/${profileUser.id}`}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </Link>
                
                <button
                  onClick={handleFollow}
                  className={`flex items-center space-x-2 px-4 py-2 font-medium rounded-lg transition-colors ${
                    isFollowing
                      ? 'bg-neutral-600 text-white hover:bg-neutral-700'
                      : 'bg-accent-500 text-white hover:bg-accent-600'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{profileUser.totalPosts}</div>
              <div className="text-sm text-neutral-600">Public Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{profileUser.totalLikes}</div>
              <div className="text-sm text-neutral-600">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{profileUser.followersCount}</div>
              <div className="text-sm text-neutral-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{profileUser.followingCount}</div>
              <div className="text-sm text-neutral-600">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          {isOwnProfile ? 'Your Public Posts' : `${profileUser.displayName}'s Posts`}
        </h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No public posts yet</h3>
            <p className="text-neutral-600">
              {isOwnProfile 
                ? 'Start writing to see your public posts here!' 
                : `${profileUser.displayName} hasn't shared any public posts yet.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <div key={post.id} className="border border-neutral-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{post.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>{post.wordCount} words</span>
                      {post.mood && (
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs">
                          {post.mood}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount}</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="prose prose-sm max-w-none text-neutral-700 mb-4"
                  dangerouslySetInnerHTML={{ __html: post.content.substring(0, 200) + '...' }}
                />
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;