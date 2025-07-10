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
      
      // Connect to socket with token only if not already connected
      if (!socketService.getSocket()?.connected) {
        socketService.connect(token);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      toast.error('Session expired. Please login again.');
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
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      const userData = {
        ...response.user,
        joinedDate: new Date(response.user.joinedDate)
      };
      
      setUser(userData);
      
      // Connect to socket only if not already connected
      if (!socketService.getSocket()?.connected) {
        socketService.connect(response.token);
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
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      const userData = {
        ...response.user,
        joinedDate: new Date(response.user.joinedDate)
      };
      
      setUser(userData);
      
      // Connect to socket only if not already connected
      if (!socketService.getSocket()?.connected) {
        socketService.connect(response.token);
      }
      
      toast.success(`Welcome to DailyWrite, ${userData.displayName}!`);
      
      // Redirect to feed immediately
      window.location.href = '/';
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

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('current_draft');
    
    // Disconnect socket
    socketService.disconnect();
    
    setUser(null);
    toast.success('Logged out successfully');
    
    // Redirect to landing page
    setTimeout(() => {
      window.location.href = '/landing';
    }, 500);
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