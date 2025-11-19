import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ResetPasswordModal from '../components/Auth/ResetPasswordModal';
import { Loader2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // Redirect to landing page if no token
      navigate('/landing');
    }
    setIsLoading(false);
  }, [searchParams, navigate]);

  const handleSuccess = () => {
    // Redirect to login page after successful password reset
    navigate('/landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Invalid Reset Link</h1>
          <p className="text-neutral-600 mb-6">This password reset link is invalid or has expired.</p>
          <button
            onClick={() => navigate('/landing')}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <ResetPasswordModal
        isOpen={true}
        onClose={() => navigate('/landing')}
        token={token}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ResetPassword;
