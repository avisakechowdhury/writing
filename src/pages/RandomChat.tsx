import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  MessageCircle,
  Send,
  X,
  Shuffle,
  Eye,
  EyeOff,
  Clock,
  UserX,
  Heart,
  Smile,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRandomChat } from '../hooks/useRandomChat';
import ReportModal from '../components/ReportModal';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  isSystem?: boolean;
}

const RandomChat: React.FC = () => {
  const { user } = useAuth();
  const { currentSession, isSearching, startSearch, sendMessage, endChat, skipPartner } = useRandomChat();
  const [newMessage, setNewMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(currentSession);
  useEffect(() => {
    // This keeps the ref updated with the latest value of currentSession on every render
    sessionRef.current = currentSession;
  }, [currentSession]);

  const topics = [
    { value: 'general', label: 'General Chat', emoji: '💬' },
    { value: 'books', label: 'Books & Literature', emoji: '📚' },
    { value: 'movies', label: 'Movies & TV', emoji: '🎬' },
    { value: 'music', label: 'Music', emoji: '🎵' },
    { value: 'technology', label: 'Technology', emoji: '💻' },
    { value: 'travel', label: 'Travel', emoji: '✈️' },
    { value: 'food', label: 'Food & Cooking', emoji: '🍳' },
    { value: 'sports', label: 'Sports', emoji: '⚽' },
    { value: 'art', label: 'Art & Creativity', emoji: '🎨' },
    { value: 'philosophy', label: 'Philosophy & Life', emoji: '🤔' }
  ];

  useEffect(() => {
    // This effect runs only once when the component mounts
    return () => {
      // This cleanup function now runs only when the component unmounts
      const latestSession = sessionRef.current;
      if (latestSession && latestSession.status !== 'ended') {
        console.log('Component unmounting, ending chat session:', latestSession.sessionId);
        endChat();
      }
    };
  }, [endChat]); // Depend only on endChat, which should be stable from your hook

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleStartSearch = () => {
    if (!user) {
      toast.error('Please login to use Random Chat');
      return;
    }
    startSearch(selectedTopic, isAnonymous);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentSession || currentSession.status !== 'active') return;

    sendMessage(newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Random Chat for writers — Meet people, share ideas | WriteAnon</title>
        <meta name="description" content="Connect with people around the world via anonymous random chat. Discuss books, life, technology, and more while staying safe." />
        <link rel="canonical" href="https://writeanon.in/random-chat" />
      </Helmet>
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Random Chat</h1>
              <p className="text-primary-100">Connect with fellow writers and share your thoughts</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentSession?.status === 'active' ? 'bg-green-400' :
                  currentSession?.status === 'searching' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
              <span className="text-white text-sm">
                {currentSession?.status === 'active' ? 'Connected' :
                  currentSession?.status === 'searching' ? 'Searching...' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {!currentSession && (
          <div className="p-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Start a Random Chat</h2>
              <p className="text-neutral-600">Choose a topic and connect with someone who shares your interests</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Choose a topic of interest:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topics.map(topic => (
                    <button
                      key={topic.value}
                      onClick={() => setSelectedTopic(topic.value)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${selectedTopic === topic.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{topic.emoji}</span>
                        <span className="font-medium">{topic.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {isAnonymous ? (
                    <EyeOff className="w-5 h-5 text-neutral-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-neutral-600" />
                  )}
                  <div>
                    <div className="font-medium text-neutral-900">Anonymous Chat</div>
                    <div className="text-sm text-neutral-600">Chat history will be deleted after the session</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div> */}

              <button
                onClick={handleStartSearch}
                disabled={!user || isSearching}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Shuffle className="w-5 h-5" />
                <span>{isSearching ? 'Searching...' : 'Start Random Chat'}</span>
              </button>

              {!user && (
                <p className="text-center text-sm text-neutral-500">
                  Please login to use Random Chat feature
                </p>
              )}
            </div>
          </div>
        )}

        {currentSession && (
          <div className="flex flex-col h-96">
            {/* Chat Header */}
            {currentSession.status === 'active' && (
              <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">Anonymous</h3>
                      <p className="text-xs text-neutral-500">
                        Topic: {topics.find(t => t.value === currentSession.topic)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {currentSession.status === 'active' && (
                      <button
                        onClick={skipPartner}
                        className="p-2 text-neutral-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                        title="Skip to next person"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={endChat}
                      className="p-2 text-neutral-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      title="End chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* More menu dropdown */}
                {showMoreMenu && (
                  <div className="absolute right-4 top-16 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report chat</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentSession.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.isSystem ? 'justify-center' : message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${message.isSystem
                        ? 'bg-neutral-100 text-neutral-600 text-sm italic'
                        : message.isOwn
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                          : 'bg-neutral-100 text-neutral-900'
                      }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {!message.isSystem && (
                      <p className={`text-xs mt-1 ${message.isOwn ? 'text-white opacity-75' : 'text-neutral-500'
                        }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {currentSession.status === 'active' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedItemType="chat_message"
        reportedItemId={currentSession?.sessionId || ''}
        reportedItemTitle="Random Chat Session"
      />
    </div>
  );
};

export default RandomChat;