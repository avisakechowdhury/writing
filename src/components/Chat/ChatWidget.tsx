import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { messages, isConnected, sendMessage } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatHistory]);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getMessages({ limit: 50 });
      setChatHistory(response.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const allMessages = [...chatHistory, ...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (!user) return null;

  return (
    <>
      {/* Community Chat Toggle Button - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-50 ${
            isOpen 
              ? 'bg-neutral-600 hover:bg-neutral-700' 
              : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white mx-auto" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white mx-auto" />
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-strong border border-neutral-200 flex flex-col z-40 max-w-[calc(100vw-3rem)] md:max-w-80">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">General Chat</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-white opacity-75">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-xs text-primary-100 mt-1">Chat with the community in real-time</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 mobile-scroll">
            {allMessages.length === 0 ? (
              <div className="text-center text-neutral-500 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              allMessages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.userId === user.id
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                        : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {message.userId !== user.id && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.username}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.userId === user.id ? 'text-white opacity-75' : 'text-neutral-500'
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
          <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-target"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;