import axios, { AxiosRequestConfig } from 'axios';
import socketService from './socket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://anonwriter.onrender.com/api';

// Create axios instances
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const plainApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const clearSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

const redirectToLanding = () => {
  if (typeof window !== 'undefined' && window.location.pathname !== '/landing') {
    window.location.href = '/landing';
  }
};

const forceLogout = () => {
  clearSession();
  socketService.disconnect();
  redirectToLanding();
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error.config || {}) as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (!token) {
                reject(error);
                return;
              }
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await plainApi.post('/auth/refresh-token', { refreshToken });
        const { token, refreshToken: newRefreshToken, user } = response.data;

        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', newRefreshToken);
        if (user) {
          localStorage.setItem('user_data', JSON.stringify(user));
        }
        socketService.updateAuthToken(token);

        processQueue(null, token);

        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email: string, password: string, username: string, displayName: string) => {
    const data = { email, password, username, displayName };
    console.log('Sending registration data:', { ...data, password: '[HIDDEN]' });
    
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  
  sendVerificationOTP: async (email: string) => {
    const response = await api.post('/auth/send-verification-otp', { email });
    return response.data;
  },
  
  verifyEmail: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response.data;
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  logout: async (refreshToken?: string | null) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },
  
  refreshToken: async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await plainApi.post('/auth/refresh-token', { refreshToken: storedRefreshToken });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  requestEmailChange: async (newEmail: string) => {
    const response = await api.post('/auth/request-email-change', { newEmail });
    return response.data;
  },

  verifyEmailChange: async (otp: string) => {
    const response = await api.post('/auth/verify-email-change', { otp });
    return response.data;
  }
};

// Posts API
export const postsAPI = {
  getPosts: async (params?: any) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },
  
  getPost: async (postId: string) => {
    // Validate postId format before making request
    if (!postId || !/^[0-9a-fA-F]{24}$/.test(postId)) {
      throw new Error('Invalid post ID format');
    }
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },
  
  createPost: async (postData: any) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  
  likePost: async (postId: string) => {
    // Validate postId format before making request
    if (!postId || !/^[0-9a-fA-F]{24}$/.test(postId)) {
      throw new Error('Invalid post ID format');
    }
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },
  
  addComment: async (postId: string, content: string) => {
    // Validate postId format before making request
    if (!postId || !/^[0-9a-fA-F]{24}$/.test(postId)) {
      throw new Error('Invalid post ID format');
    }
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  likeComment: async (postId: string, commentId: string) => {
    if (!postId || !/^[0-9a-fA-F]{24}$/.test(postId)) {
      throw new Error('Invalid post ID format');
    }
    if (!commentId || !/^[0-9a-fA-F]{24}$/.test(commentId)) {
      throw new Error('Invalid comment ID format');
    }
    const response = await api.post(`/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },
  
  getMyPosts: async (params?: any) => {
    const response = await api.get('/posts/my-posts', { params });
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
  
  getAchievements: async () => {
    const response = await api.get('/users/achievements');
    return response.data;
  },

  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  followUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  }
};

// Chat API
export const chatAPI = {
  getMessages: async (params?: any) => {
    const response = await api.get('/chat/messages', { params });
    return response.data;
  }
};

// Messages API
export const messagesAPI = {
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  getMessages: async (userId: string, params?: any) => {
    const response = await api.get(`/messages/conversation/${userId}`, { params });
    return response.data;
  },

  sendMessage: async (receiverId: string, content: string) => {
    const response = await api.post('/messages/send', { receiverId, content });
    return response.data;
  },

  markAsRead: async (conversationId: string) => {
    const response = await api.put(`/messages/read/${conversationId}`);
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  subscribe: async (subscription: any) => {
    const response = await api.post('/notifications/subscribe', { subscription });
    return response.data;
  },
  
  unsubscribe: async () => {
    const response = await api.post('/notifications/unsubscribe');
    return response.data;
  },
  
  sendTest: async () => {
    const response = await api.post('/notifications/test');
    return response.data;
  }
};

export default api;