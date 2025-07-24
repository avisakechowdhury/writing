import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, signup, isLoading } = useAuth();

  // Update mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent multiple submissions
    
    setErrors({});

    // Validation
    if (!formData.email || !formData.password) {
      setErrors({ general: 'Email and password are required' });
      return;
    }

    if (mode === 'signup') {
      if (!formData.username || !formData.displayName) {
        setErrors({ general: 'Username and display name are required' });
        return;
      }
      
      // Frontend validation for username
      if (formData.username.length < 3) {
        setErrors({ username: 'Username must be at least 3 characters long' });
        return;
      }
      
      if (formData.username.length > 30) {
        setErrors({ username: 'Username must be 30 characters or less' });
        return;
      }
      
      // Check username format
      if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
        setErrors({ username: 'Username can only contain letters, numbers, dots, underscores, and hyphens' });
        return;
      }
      
      // Frontend validation for password
      if (formData.password.length < 6) {
        setErrors({ password: 'Password must be at least 6 characters long' });
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.username, formData.displayName);
      }
      
      // Don't close modal immediately, let the redirect happen
      setTimeout(() => {
        onClose();
        setFormData({
          email: '',
          password: '',
          username: '',
          displayName: ''
        });
      }, 1000);
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Authentication failed. Please try again.';
      
      if (error.response?.status === 429) {
        message = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      setErrors({ general: message });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setFormData({
      email: '',
      password: '',
      username: '',
      displayName: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join WriteAnon'}
          </h2>
          <p className="text-neutral-600">
            {mode === 'login' 
              ? 'Sign in to continue your writing journey' 
              : 'Start your daily writing practice today'
            }
          </p>
          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Requirements:</strong> Username (3-30 chars), Password (6+ chars)
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.username ? 'border-error-300 focus:ring-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="Enter your username (3-30 characters)"
                    required
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-error-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.displayName ? 'border-error-300 focus:ring-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="Enter your display name (1-50 characters)"
                    required
                  />
                </div>
                {errors.displayName && (
                  <p className="mt-1 text-sm text-error-600">{errors.displayName}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-error-300 focus:ring-error-500' : 'border-neutral-300'
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-error-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.password ? 'border-error-300 focus:ring-error-500' : 'border-neutral-300'
                }`}
                placeholder="Enter your password (at least 6 characters)"
                required
                minLength={6}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-error-600">{errors.password}</p>
            )}
          </div>

          {errors.general && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-600">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={switchMode}
              className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;