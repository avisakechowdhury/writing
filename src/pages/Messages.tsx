import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Send, 
  ArrowLeft, 
  User, 
  Search,
  MessageCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

interface Message {
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

interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

const Messages: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendDirectMessage, onDirectMessage, offDirectMessage } = useSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (userId && user) {
      loadConversation(userId);
      loadUserProfile(userId);
    }
  }, [userId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for new direct messages
    const handleDirectMessage = (message: Message) => {
      // Only add message if the current user is the receiver
      if (
        user &&
        userId &&
        message.receiverId === user.id &&
        (message.senderId === userId || message.receiverId === userId)
      ) {
        setMessages(prev => {
          // Prevent duplicates by checking message ID
          const messageId = message.id || (message as any)._id;
          const exists = prev.some(m => (m.id || (m as any)._id) === messageId);
          if (exists) return prev;
          const newMessage = {
            ...message,
            id: messageId,
            timestamp: new Date(message.timestamp)
          };
          return [...prev, newMessage];
        });
      }
      loadConversations();
    };
    
    if (userId) {
      onDirectMessage(handleDirectMessage);
    }

    return () => {
      if (userId) {
        offDirectMessage();
      }
    };
  }, [userId, user]);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (otherUserId: string) => {
    try {
      setIsLoading(true);
      const response = await messagesAPI.getMessages(otherUserId);
      setMessages(response.messages.map((msg: any) => ({
        ...msg,
        id: msg._id || msg.id,
        senderId: typeof msg.senderId === 'object' && msg.senderId !== null ? msg.senderId._id : msg.senderId,
        receiverId: typeof msg.receiverId === 'object' && msg.receiverId !== null ? msg.receiverId._id : msg.receiverId,
        timestamp: new Date(msg.timestamp || msg.createdAt)
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (otherUserId: string) => {
    try {
      const response = await usersAPI.getProfile(otherUserId);
      setSelectedUser(response.user);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !user || isSending) return;

    setIsSending(true);
    try {
      // Send via API (which will trigger socket event)
      await messagesAPI.sendMessage(userId, newMessage.trim());
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Please Login</h1>
          <p className="text-neutral-600">You need to be logged in to access messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden h-[calc(100vh-8rem)] md:h-[600px] flex flex-col md:flex-row">
        {/* Conversations Sidebar */}
        <div className={`${userId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-neutral-200 flex-col`}>
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Messages</h2>
              {userId && (
                <button
                  onClick={() => navigate('/messages')}
                  className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <Link
                  key={conv.conversationId}
                  to={`/messages/${conv.otherUser._id}`}
                  className={`block p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                    userId === conv.otherUser._id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-neutral-900 truncate">
                          {conv.otherUser.displayName}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">
                        {conv.lastMessage.content}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${userId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {userId && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3 md:p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => navigate('/messages')}
                      className="p-2 hover:bg-neutral-200 rounded-lg transition-colors md:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm md:text-base">{selectedUser.displayName}</h3>
                      <p className="text-xs md:text-sm text-neutral-500">@{selectedUser.username}</p>
                    </div>
                  </div>
                  <Link
                    to={`/profile/${selectedUser.id}`}
                    className="text-xs md:text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1 bg-white rounded-lg shadow-sm"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-neutral-50 to-white">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Start a conversation</h3>
                    <p className="text-neutral-600">Send a message to {selectedUser.displayName}</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.id}-${index}`}
                      className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                    >
                      <div
                        className={`max-w-[75%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-sm ${
                          message.senderId === user.id
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-br-md'
                            : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-1 opacity-75 ${
                          message.senderId === user.id ? 'text-white opacity-75' : 'text-neutral-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-neutral-200 bg-white">
                <div className="flex space-x-2 md:space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedUser.displayName}...`}
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Select a conversation</h3>
                <p className="text-neutral-600">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;