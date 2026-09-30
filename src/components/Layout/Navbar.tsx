import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  PenTool,
  User,
  TrendingUp,
  Settings,
  LogOut,
  MessageCircle,
  Users,
  Menu,
  X,
  Heart,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../services/api';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const isActive = (path: string) => location.pathname === path;
  const desktopNavItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: PenTool, label: 'Write', path: '/write' },
    { icon: TrendingUp, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Users, label: 'Random Chat', path: '/random-chat' },
    { icon: Heart, label: 'Connect', path: '/connect' },
  ];

  const mobileBottomNavItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: PenTool, label: 'Write', path: '/write' },
    { icon: TrendingUp, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Users, label: 'Random Chat', path: '/random-chat' }
  ];

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let mounted = true;
    const loadUnread = async () => {
      try {
        const response = await notificationsAPI.getList(1, 1);
        if (mounted) {
          setUnreadCount(response.unreadCount || 0);
        }
      } catch {
        // Ignore polling errors silently in navbar.
      }
    };

    void loadUnread();
    const intervalId = window.setInterval(() => {
      void loadUnread();
    }, 30000);
    const handleUpdated = () => {
      void loadUnread();
    };
    window.addEventListener('notifications:updated', handleUpdated as EventListener);
    window.addEventListener('focus', handleUpdated);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('notifications:updated', handleUpdated as EventListener);
      window.removeEventListener('focus', handleUpdated);
    };
  }, [user, location.pathname]);

  // Escape to close — must stay above any early return so hook order is stable
  React.useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMobileMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  // Prevent body scroll when menu open
  React.useEffect(() => {
    if (!user) return;
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu, user]);

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
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    WriteAnon
                  </span>
                  <p className="text-xs text-neutral-500 italic -mt-1">Your story. Your secret.</p>
                </div>
              </Link>

              <div className="flex space-x-1">
                {desktopNavItems.map(({ icon: Icon, label, path }) => (
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

                {/* Profile link visible on desktop */}
                <Link
                  to="/profile"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/profile')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Desktop Notifications, Settings and Logout */}
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Notifications">
                  <Bell className="w-5 h-5 text-neutral-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error-500 text-white text-[10px] font-semibold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/settings" className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Settings">
                  <Settings className="w-5 h-5 text-neutral-600" />
                </Link>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header (kept small) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b border-neutral-200 z-50">
        <div className="flex items-center justify-between h-14 px-3">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm truncate">WriteAnon</span>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-error-500 text-white text-[9px] font-semibold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Always show hamburger */}
            <button
              onClick={() => setShowMobileMenu((s) => !s)}
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              aria-expanded={showMobileMenu}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5 text-neutral-600" /> : <Menu className="w-5 h-5 text-neutral-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop (click outside to close) */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowMobileMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Dropdown Menu (hamburger) */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed top-14 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-40"
          role="dialog"
          aria-modal="true"
        >
          <div className="px-4 py-2 space-y-1">
            <Link
              to="/profile"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <User className="w-5 h-5 text-neutral-600" />
              <span className="font-medium text-neutral-700">Profile</span>
            </Link>

            <Link
              to="/notifications"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="font-medium text-neutral-700">
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
              </span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-neutral-600" />
              <span className="font-medium text-neutral-700">Settings</span>
            </Link>
            <Link
              to="/connect"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Heart className="w-5 h-5 text-neutral-600" />
              <span className="font-medium text-neutral-700">Connect</span>
            </Link>

            <button
              onClick={() => {
                void logout();
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-neutral-600" />
              <span className="font-medium text-neutral-700">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Feed, Write, Dashboard, Messages, Random Chat) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileBottomNavItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive(path) ? 'text-primary-600' : 'text-neutral-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(path) ? 'text-primary-600' : 'text-neutral-500'}`} />
              <span className={`text-xs font-medium truncate ${isActive(path) ? 'text-primary-600' : 'text-neutral-500'}`}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
