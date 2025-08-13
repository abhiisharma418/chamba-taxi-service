import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Clock, Phone, Image, X, Smile } from 'lucide-react';
import { chatService, ChatMessage } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

interface ChatInterfaceProps {
  rideId: string;
  isOpen: boolean;
  onClose: () => void;
  otherParty?: {
    id: string;
    name: string;
    type: 'customer' | 'driver';
    avatar?: string;
  };
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  rideId, 
  isOpen, 
  onClose, 
  otherParty 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Quick reply options
  const quickReplies = user?.role === 'driver' ? [
    { type: 'pickup_confirmation', text: "I'm here for pickup", icon: MapPin },
    { type: 'eta_request', text: "ETA: 5 minutes", icon: Clock },
    { type: 'destination_reached', text: "We've reached!", icon: MapPin }
  ] : [
    { type: 'eta_request', text: "What's your ETA?", icon: Clock },
    { type: 'custom', text: "Thank you!", icon: Smile }
  ];

  useEffect(() => {
    if (isOpen && rideId) {
      initializeChat();
    }

    return () => {
      if (rideId) {
        chatService.leaveChat(rideId);
      }
    };
  }, [isOpen, rideId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    setIsLoading(true);
    
    // Initialize socket connection
    if (user) {
      chatService.initializeSocket(user.id, user.role || 'customer');
      chatService.joinChat(rideId);
    }

    // Load existing messages
    const response = await chatService.getChatMessages(rideId);
    if (response.success) {
      setMessages(response.data.messages);
    }

    // Subscribe to new messages
    const unsubscribeMessages = chatService.onNewMessage((message) => {
      setMessages(prev => [...prev, message]);
      // Mark as read if chat is open
      if (isOpen) {
        setTimeout(() => {
          chatService.markAsRead(rideId, [message._id]);
        }, 1000);
      }
    });

    // Subscribe to typing indicators
    const unsubscribeTyping = chatService.onTyping((data) => {
      if (data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    setIsLoading(false);

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    const response = await chatService.sendMessage(rideId, messageText);
    if (!response.success) {
      // Show error toast
      console.error('Failed to send message:', response.message);
    }

    setIsSending(false);
  };

  const handleQuickReply = async (quickReply: any) => {
    setIsSending(true);
    
    const response = await chatService.sendQuickReply(
      rideId, 
      quickReply.type, 
      quickReply.text
    );
    
    if (!response.success) {
      console.error('Failed to send quick reply:', response.message);
    }

    setIsSending(false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!isTyping) {
      setIsTyping(true);
      chatService.sendTypingIndicator(rideId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatService.sendTypingIndicator(rideId, false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-3xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {otherParty?.avatar ? (
                <img 
                  src={otherParty.avatar} 
                  alt={otherParty.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {otherParty?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {otherParty?.name || 'Chat'}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {otherParty?.type || 'user'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open(`tel:${otherParty?.id}`)}
              className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-blue-600" />
              </div>
              <p>Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender.id === user?.id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.message.type === 'location' && message.message.metadata?.location ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>Location shared</span>
                        </div>
                        <p className="text-sm opacity-90">
                          {message.message.metadata.location.address}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm">{message.message.text}</p>
                    )}
                    
                    <div className={`flex items-center justify-between mt-1 text-xs ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwn && (
                        <span className={`ml-2 ${
                          message.status === 'read' ? 'text-blue-200' : 'text-blue-300'
                        }`}>
                          {getMessageStatusIcon(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-2 border-t border-gray-200/50">
          <div className="flex space-x-2 overflow-x-auto">
            {quickReplies.map((reply, index) => {
              const IconComponent = reply.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  disabled={isSending}
                  className="flex-shrink-0 flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{reply.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="w-full p-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSending}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
