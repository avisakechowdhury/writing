import React, { useEffect, useState } from 'react';
import { 
  PenTool, 
  Heart, 
  MessageCircle, 
  Flame, 
  Trophy, 
  Target,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import StatsCard from '../components/Dashboard/StatsCard';
import StreakCalendar from '../components/Dashboard/StreakCalendar';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsResponse, achievementsResponse] = await Promise.all([
        usersAPI.getStats(),
        usersAPI.getAchievements()
      ]);
      
      // Merge stats with writing days
      setStats({
        ...statsResponse.stats,
        writingDays: statsResponse.writingDays || []
      });
      setAchievements(achievementsResponse.achievements);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Convert writing days to Date objects
  const writingDays = stats?.writingDays?.map((day: string) => new Date(day)) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Welcome back, {user.displayName}!
        </h1>
        <p className="text-neutral-600">
          Here's how your writing journey is progressing
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Current Streak"
          value={stats?.currentStreak || 0}
          icon={Flame}
          color="error"
          change={{ value: 12, type: 'increase' }}
        />
        <StatsCard
          title="Total Posts"
          value={stats?.totalPosts || 0}
          icon={PenTool}
          color="primary"
          change={{ value: 8, type: 'increase' }}
        />
        <StatsCard
          title="Likes Received"
          value={stats?.totalLikes || 0}
          icon={Heart}
          color="secondary"
          change={{ value: 25, type: 'increase' }}
        />
        <StatsCard
          title="Comments"
          value={stats?.totalComments || 0}
          icon={MessageCircle}
          color="accent"
          change={{ value: 5, type: 'increase' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <StreakCalendar
            currentDate={new Date()}
            writingDays={writingDays}
          />
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Level Progress</h3>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-accent-500" />
              <span className="text-sm font-medium text-accent-600">Level {user.level}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-700">Points</span>
                <span className="text-sm text-neutral-500">
                  {user.points} / {user.level * 100}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-accent-500 to-accent-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(user.points % 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg">
              <span className="text-2xl">🎯</span>
              <p className="text-sm font-medium text-accent-800 mt-1">
                {100 - (user.points % 100)} points to level {user.level + 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-soft border border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Achievements</h3>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-primary-600">
              {achievements.filter(a => a.earned).length} / {achievements.length}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                achievement.earned
                  ? 'border-success-200 bg-success-50'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`text-2xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    achievement.earned ? 'text-success-800' : 'text-neutral-600'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-sm ${
                    achievement.earned ? 'text-success-600' : 'text-neutral-500'
                  }`}>
                    {achievement.description}
                  </p>
                  {achievement.earned ? (
                    achievement.earnedDate && (
                      <p className="text-xs text-success-500 mt-1">
                        Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                      </p>
                    )
                  ) : achievement.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/100</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1 rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-semibold mb-4">Ready to write?</h3>
        <p className="text-primary-100 mb-6">
          Keep your streak alive! Share your thoughts with the community today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/write"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
          >
            <PenTool className="w-5 h-5" />
            <span>Start Writing</span>
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            <span>View Community</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;