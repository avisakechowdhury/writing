import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/landing';
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
  }
};

// Posts API
export const postsAPI = {
  getPosts: async (params?: any) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },
  
  getPost: async (postId: string) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },
  
  createPost: async (postData: any) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  
  likePost: async (postId: string) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },
  
  addComment: async (postId: string, content: string) => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
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