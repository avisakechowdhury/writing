import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';
import randomChatApi from '../services/randomChatApi';
import { RandomChatSession, RandomChatMessage } from '../types';
import toast from 'react-hot-toast';

export const useRandomChat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [currentSession, setCurrentSession] = useState<RandomChatSession | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const sessionRef = useRef(currentSession);
  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);
  
  // FIX: Define handlePartnerFound in the hook's main scope
const handlePartnerFound = useCallback(async (data: { sessionId: string; }) => {
    if (sessionRef.current?.sessionId === data.sessionId) {
      try {
        const sessionDetails = await randomChatApi.getSession(data.sessionId);
        
        // Add the client-side `isOwn` flag to messages from the server
        const messagesWithOwnership = sessionDetails.messages.map((msg: any) => ({
          ...msg,
          id: msg._id || `${msg.senderId}-${new Date(msg.timestamp).getTime()}`,
          isOwn: msg.senderId ? msg.senderId.toString() === user?._id.toString() : false
        }));
        
        setCurrentSession({
          ...sessionDetails,
          messages: messagesWithOwnership,
          status: 'active'
        });

        setIsSearching(false);
        toast.success('Partner found! Start chatting!');
      } catch (error) {
        console.error("Failed to fetch session details after finding partner", error);
        toast.error("Could not connect to chat.");
        setCurrentSession(null);
        setIsSearching(false);
      }
    }
  }, [user]);


  useEffect(() => {
    if (!socket) return;

    // ... (message and ended handlers are the same)
    const handleRandomChatMessage = (data: { sessionId: string; message: RandomChatMessage; }) => {
      if (sessionRef.current?.sessionId === data.sessionId) {
        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, { ...data.message, id: Date.now().toString(), isOwn: false }]
        } : null);
      }
    };

    const handleRandomChatEnded = (data: { sessionId: string; message: string; }) => {
      if (sessionRef.current?.sessionId === data.sessionId) {
        // FIX: Reset the session to null to return the user to the start screen.
        toast.error('Your chat partner has left the conversation.', {
          duration: 4000
        });
        setCurrentSession(null);
        setIsSearching(false);
      }
    };

    // Socket now calls the correctly scoped function
    socket.on('random_chat_message', handleRandomChatMessage);
    socket.on('random_chat_ended', handleRandomChatEnded);
    socket.on('partner_found', handlePartnerFound);

    return () => {
      socket.off('random_chat_message', handleRandomChatMessage);
      socket.off('random_chat_ended', handleRandomChatEnded);
      socket.off('partner_found', handlePartnerFound);
    };
  }, [socket, handlePartnerFound]);

  const startSearch = useCallback(async (topic: string, isAnonymous: boolean = true) => {
    if (isSearching || sessionRef.current) return;
    if (!user) {
      toast.error('Please login to use Random Chat');
      return;
    }
    try {
      setIsSearching(true);
      const response = await randomChatApi.startSearch(topic, isAnonymous);

      const messages: RandomChatMessage[] = [{
        id: Date.now().toString(),
        content: response.status === 'active'
          ? 'Partner found! Say hello! 👋'
          : `Looking for someone interested in ${topic}...`,
        timestamp: new Date(),
        isSystem: true,
        isOwn: false
      }];

      const session: RandomChatSession = {
        sessionId: response.sessionId,
        status: response.status,
        topic,
        isAnonymous,
        messages,
        startedAt: new Date(),
        partner: response.partner ? {
          id: response.partner.id,
          name: 'Anonymous',
          isAnonymous: response.partner.isAnonymous
        } : undefined
      };

      setCurrentSession(session);

      if (response.status === 'active') {
        toast.success('Partner found! Start chatting!');
        setIsSearching(false);
      }
    } catch (error: any) {
      console.error('Start search error:', error);
      toast.error(error.response?.data?.message || 'Failed to start search');
      setIsSearching(false);
    }
  }, [user, isSearching]);

  // ... (sendMessage, endChat, and skipPartner are unchanged from the previous version)
  const sendMessage = useCallback(async (content: string) => {
    const session = sessionRef.current;
    if (!session || session.status !== 'active') return;

    try {
      const message: RandomChatMessage = { id: Date.now().toString(), content, timestamp: new Date(), isOwn: true };
      setCurrentSession(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
      await randomChatApi.sendMessage(session.sessionId, content);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  }, []);

  const endChat = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    
    setCurrentSession(null);
    setIsSearching(false);
    
    if (session.status !== 'ended') {
        try {
            await randomChatApi.endChat(session.sessionId);
            toast.success('Chat ended');
        } catch (error) {
            console.error('End chat error (suppressed):', error);
        }
    }
  }, []);

  const skipPartner = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || session.status !== 'active') return;

    try {
      toast.loading('Finding new partner...');
      const response = await randomChatApi.skipPartner(session.sessionId);
      setCurrentSession({
        sessionId: response.sessionId,
        status: 'searching',
        topic: session.topic,
        isAnonymous: session.isAnonymous,
        messages: [{
          id: Date.now().toString(),
          content: `Looking for a new partner interested in ${session.topic}...`,
          timestamp: new Date(),
          isSystem: true,
          isOwn: false
        }],
        startedAt: new Date()
      });
      setIsSearching(true);
      toast.dismiss();
      toast.success('Searching for a new partner...');
    } catch (error) {
      toast.dismiss();
      console.error('Skip partner error:', error);
      toast.error('Failed to skip partner');
    }
  }, []);

  return { currentSession, isSearching, startSearch, sendMessage, endChat, skipPartner };
};