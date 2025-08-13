import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  _id: string;
  rideId: string;
  sender: {
    id: string;
    type: 'customer' | 'driver';
    name: string;
  };
  receiver: {
    id: string;
    type: 'customer' | 'driver';
    name: string;
  };
  message: {
    text: string;
    type: 'text' | 'image' | 'location' | 'quick_reply';
    metadata?: {
      imageUrl?: string;
      location?: {
        latitude: number;
        longitude: number;
        address: string;
      };
      quickReplyType?: 'eta_request' | 'pickup_confirmation' | 'destination_reached' | 'custom';
    };
  };
  status: 'sent' | 'delivered' | 'read';
  isSystemMessage: boolean;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  deliveredAt?: string;
}

export interface ChatPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ChatResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination: ChatPagination;
  };
  message?: string;
}

class ChatService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private typingCallbacks: ((data: { userId: string; userType: string; isTyping: boolean }) => void)[] = [];

  // Initialize socket connection
  initializeSocket(userId: string, userType: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: {
        userId,
        userType
      }
    });

    this.socket.on('connect', () => {
      console.log('Chat socket connected');
      this.socket?.emit('authenticate', { userId, userType });
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('user_typing', (data: { userId: string; userType: string; isTyping: boolean }) => {
      this.typingCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('disconnect', () => {
      console.log('Chat socket disconnected');
    });

    return this.socket;
  }

  // Join a chat room
  joinChat(rideId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', rideId);
    }
  }

  // Leave a chat room
  leaveChat(rideId: string) {
    if (this.socket) {
      this.socket.emit('leave_chat', rideId);
    }
  }

  // Send typing indicator
  sendTypingIndicator(rideId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { rideId, isTyping });
    }
  }

  // Subscribe to new messages
  onNewMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to typing indicators
  onTyping(callback: (data: { userId: string; userType: string; isTyping: boolean }) => void) {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  // Send a text message
  async sendMessage(rideId: string, message: string): Promise<{ success: boolean; data?: ChatMessage; message?: string }> {
    try {
      const response = await api.post('/chat/send', {
        rideId,
        message
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  // Send a quick reply
  async sendQuickReply(rideId: string, quickReplyType: string, customMessage?: string): Promise<{ success: boolean; data?: ChatMessage; message?: string }> {
    try {
      const response = await api.post('/chat/quick-reply', {
        rideId,
        quickReplyType,
        customMessage
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending quick reply:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send quick reply'
      };
    }
  }

  // Send location
  async sendLocation(rideId: string, latitude: number, longitude: number, address?: string): Promise<{ success: boolean; data?: ChatMessage; message?: string }> {
    try {
      const response = await api.post('/chat/send-location', {
        rideId,
        latitude,
        longitude,
        address
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending location:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send location'
      };
    }
  }

  // Get chat messages for a ride
  async getChatMessages(rideId: string, page: number = 1, limit: number = 50): Promise<ChatResponse> {
    try {
      const response = await api.get(`/chat/ride/${rideId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        data: { messages: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } },
        message: error.response?.data?.message || 'Failed to fetch messages'
      };
    }
  }

  // Mark messages as read
  async markAsRead(rideId: string, messageIds?: string[]): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put(`/chat/ride/${rideId}/read`, {
        messageIds
      });
      return response.data;
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark messages as read'
      };
    }
  }

  // Get unread message count
  async getUnreadCount(rideId: string): Promise<{ success: boolean; data?: { unreadCount: number }; message?: string }> {
    try {
      const response = await api.get(`/chat/ride/${rideId}/unread-count`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get unread count'
      };
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks = [];
    this.typingCallbacks = [];
  }
}

export const chatService = new ChatService();
