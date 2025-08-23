import api from './api';
import { RandomChatSession, RandomChatMessage } from '../types';

export const randomChatApi = {
  // Start searching for a random chat partner
  startSearch: async (topic: string, isAnonymous: boolean = true): Promise<{
    message: string;
    sessionId: string;
    status: 'searching' | 'active';
    partner?: { id: string; isAnonymous: boolean };
  }> => {
    const response = await api.post('/random-chat/search', {
      topic,
      isAnonymous
    });
    return response.data;
  },

  // Get chat session details
  getSession: async (sessionId: string): Promise<RandomChatSession> => {
    const response = await api.get(`/random-chat/session/${sessionId}`);
    return response.data;
  },

  // Send a message in random chat
  sendMessage: async (sessionId: string, content: string): Promise<{ message: string }> => {
    const response = await api.post('/random-chat/message', {
      sessionId,
      content
    });
    return response.data;
  },

  // End chat session
  endChat: async (sessionId: string): Promise<{ message: string }> => {
    const response = await api.post('/random-chat/end', {
      sessionId
    });
    return response.data;
  },

  // Skip current partner and find new one
  skipPartner: async (sessionId: string): Promise<{
    message: string;
    sessionId: string;
    status: 'searching';
  }> => {
    const response = await api.post('/random-chat/skip', {
      sessionId
    });
    return response.data;
  },

  // Get user's active chat sessions
  getActiveSessions: async (): Promise<{
    sessionId: string;
    status: 'searching' | 'active';
    topic: string;
    isAnonymous: boolean;
    startedAt: Date;
    participantCount: number;
  }[]> => {
    const response = await api.get('/random-chat/active');
    return response.data;
  }
};

export default randomChatApi;
