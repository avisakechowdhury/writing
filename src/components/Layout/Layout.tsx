import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import AuthModal from '../Auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { syncPushSubscriptionToServer } from '../../utils/pushSubscription';
import { isWebPushClientConfigured } from '../../config/push';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => {
    if (!user?.id || !isWebPushClientConfigured()) return;
    const timer = window.setTimeout(() => {
      void syncPushSubscriptionToServer().catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  // Handle global auth modal function
  useEffect(() => {
    const handleGlobalAuthModal = (mode?: 'login' | 'signup') => {
      setAuthMode(mode || 'signup');
      setShowAuthModal(true);
    };

    // Set up the global function
    (window as any).showAuthModalGlobal = handleGlobalAuthModal;

    return () => {
      delete (window as any).showAuthModalGlobal;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Navbar />
      <main className="pt-16 md:pt-20 pb-20 md:pb-8 min-h-screen">
        <Outlet />
      </main>
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
    </div>
  );
};

export default Layout;