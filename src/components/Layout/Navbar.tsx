import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  PenTool, 
  User, 
  TrendingUp, 
  Settings,
  LogOut,
  Flame,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: PenTool, label: 'Write', path: '/write' },
    { icon: TrendingUp, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  if (!user) return null;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  DailyWrite
                </span>
              </Link>
              
              <div className="flex space-x-1">
                {navItems.map(({ icon: Icon, label, path }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive(path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-accent-100 to-accent-200 rounded-full">
                <Flame className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-semibold text-accent-800">{user.streak} day streak</span>
              </div>
              
              <Link to="/settings" className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                <Settings className="w-5 h-5 text-neutral-600" />
              </Link>
              
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive(path)
                  ? 'text-primary-600'
                  : 'text-neutral-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(path) ? 'text-primary-600' : 'text-neutral-500'}`} />
              <span className={`text-xs font-medium truncate ${isActive(path) ? 'text-primary-600' : 'text-neutral-500'}`}>
                {label}
              </span>
            </Link>
          ))}
          
          {/* Settings button for mobile */}
          <Link
            to="/settings"
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
              isActive('/settings')
                ? 'text-primary-600'
                : 'text-neutral-500'
            }`}
          >
            <Settings className={`w-5 h-5 ${isActive('/settings') ? 'text-primary-600' : 'text-neutral-500'}`} />
            <span className={`text-xs font-medium truncate ${isActive('/settings') ? 'text-primary-600' : 'text-neutral-500'}`}>
              Settings
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;