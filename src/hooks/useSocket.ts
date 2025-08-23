import { useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  room: string;
}

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  conversationId: string;
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
}

export const useSocket = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const socket = socketService.getSocket();
      
      if (socket) {
        setIsConnected(socket.connected);
        
        socket.on('connect', () => {
          setIsConnected(true);
        });
        
        socket.on('disconnect', () => {
          setIsConnected(false);
        });
        
        socketService.onMessage((message: any) => {
          setMessages(prev => [...prev, {
            ...message,
            timestamp: new Date(message.timestamp)
          }]);
        });
        
        return () => {
          socketService.offMessage();
        };
      }
    }
  }, [user]);

  const sendMessage = (content: string, room: string = 'general') => {
    socketService.sendMessage(content, room);
  };

  const sendDirectMessage = (receiverId: string, content: string) => {
    socketService.sendDirectMessage(receiverId, content);
  };

  const onDirectMessage = (callback: (message: DirectMessage) => void) => {
    socketService.onDirectMessage(callback);
  };

  const offDirectMessage = () => {
    socketService.offDirectMessage();
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isConnected,
    socket: socketService.getSocket(),
    sendMessage,
    sendDirectMessage,
    onDirectMessage,
    offDirectMessage,
    clearMessages
  };
};