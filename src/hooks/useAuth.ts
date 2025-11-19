import { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

export const useAuthService = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedUser && !user) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            joinedDate: new Date(parsedUser.joinedDate)
          });
        } catch (err) {
          console.error('Failed to parse stored user data:', err);
        }
      }

      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await authAPI.getMe();
      const userData = {
        ...response.user,
        joinedDate: new Date(response.user.joinedDate)
      };
      
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      // Connect or update socket token
      if (!socketService.getSocket()?.connected) {
        socketService.connect(token);
      } else {
        socketService.updateAuthToken(token);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        socketService.disconnect();
        toast.error('Session expired. Please login again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      const userData = {
        ...response.user,
        joinedDate: new Date(response.user.joinedDate)
      };
      
      setUser(userData);
      
      // Connect to socket only if not already connected
      if (!socketService.getSocket()?.connected) {
        socketService.connect(response.token);
      } else {
        socketService.updateAuthToken(response.token);
      }
      
      toast.success(`Welcome back, ${userData.displayName}!`);
      
      // Redirect to feed immediately
      window.location.href = '/';
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      throw error;
    }
    finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string, displayName: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(email, password, username, displayName);
      
      // Check if email verification is required
      if (response.requiresVerification) {
        // Don't set user or redirect, just return the response
        return response;
      }
      
      // Store token and user data (for immediate verification)
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      const userData = {
        ...response.user,
        joinedDate: new Date(response.user.joinedDate)
      };
      
      setUser(userData);
      
      // Connect to socket only if not already connected
      if (!socketService.getSocket()?.connected) {
        socketService.connect(response.token);
      } else {
        socketService.updateAuthToken(response.token);
      }
      
      toast.success(`Welcome to WriteAnon, ${userData.displayName}!`);
      
      // Redirect to feed immediately
      window.location.href = '/';
      
      return response;
    } catch (error: any) {
      console.error('Signup error details:', error.response?.data);
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map((err: any) => err.message).join(', ');
        toast.error(errorMessages);
      } else {
        const message = error.response?.data?.message || 'Signup failed. Please try again.';
        toast.error(message);
      }
      throw error;
    }
    finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      } else {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('current_draft');
      
      socketService.disconnect();
      setUser(null);
      toast.success('Logged out successfully');
      
      setTimeout(() => {
        window.location.href = '/landing';
      }, 500);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  return {
    user,
    login,
    signup,
    logout,
    updateUser,
    isLoading
  };
};