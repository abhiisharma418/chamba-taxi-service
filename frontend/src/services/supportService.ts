import { apiFetch } from '../lib/api';

export interface SupportTicket {
  _id: string;
  ticketId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    userType: 'customer' | 'driver';
  };
  category: 'ride_issue' | 'payment_issue' | 'account_issue' | 'driver_behavior' | 'app_issue' | 'vehicle_issue' | 'safety_concern' | 'feature_request' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_user' | 'resolved' | 'closed';
  subject: string;
  description: string;
  rideId?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  messages: TicketMessage[];
  metadata?: {
    source?: string;
    deviceInfo?: {
      platform?: string;
      version?: string;
      model?: string;
    };
    appVersion?: string;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  resolution?: string;
  feedback?: {
    rating: number;
    comment?: string;
    submittedAt: string;
  };
  tags: string[];
  escalated: boolean;
  escalatedAt?: string;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  firstResponseTime?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  sender: {
    id: string;
    name: string;
    type: 'user' | 'admin';
  };
  message: string;
  attachments: {
    filename: string;
    url: string;
    type: 'image' | 'document' | 'video';
  }[];
  timestamp: string;
  isInternal: boolean;
}

export interface CreateTicketData {
  category: string;
  priority?: string;
  subject: string;
  description: string;
  rideId?: string;
  metadata?: {
    deviceInfo?: {
      platform?: string;
      version?: string;
      model?: string;
    };
    appVersion?: string;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
}

export interface TicketResponse {
  success: boolean;
  data?: SupportTicket;
  message?: string;
}

export interface TicketsResponse {
  success: boolean;
  data?: {
    tickets: SupportTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  ticketsByCategory: { _id: string; count: number }[];
  ticketsByPriority: { _id: string; count: number }[];
  averageResolutionTime: number;
  slaBreaches: number;
  resolutionRate: string;
}

class SupportService {
  // Create a new support ticket
  async createTicket(ticketData: CreateTicketData): Promise<TicketResponse> {
    try {
      const response = await apiFetch('/support/create', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create ticket'
      };
    }
  }

  // Get user's tickets
  async getUserTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  } = {}): Promise<TicketsResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await apiFetch(`/support/my-tickets?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user tickets:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch tickets'
      };
    }
  }

  // Get single ticket by ID
  async getTicketById(ticketId: string): Promise<TicketResponse> {
    try {
      const response = await apiFetch(`/support/ticket/${ticketId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching ticket:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch ticket'
      };
    }
  }

  // Add message to ticket
  async addMessage(ticketId: string, message: string, attachments: any[] = []): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiFetch(`/support/ticket/${ticketId}/message`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          attachments
        })
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding message:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add message'
      };
    }
  }

  // Submit feedback for resolved ticket
  async submitFeedback(ticketId: string, rating: number, comment?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiFetch(`/support/ticket/${ticketId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment
        })
      });
      return response.data;
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit feedback'
      };
    }
  }

  // Admin methods
  async getAllTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  } = {}): Promise<TicketsResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await apiFetch(`/support/admin/all?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all tickets:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch tickets'
      };
    }
  }

  async updateTicketStatus(ticketId: string, status: string, resolution?: string, assignedTo?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiFetch(`/support/admin/ticket/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          resolution,
          assignedTo
        })
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update ticket status'
      };
    }
  }

  async getSupportStats(period: string = '30d'): Promise<{ success: boolean; data?: SupportStats; message?: string }> {
    try {
      const response = await api.get(`/support/admin/stats?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching support stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch support statistics'
      };
    }
  }
}

export const supportService = new SupportService();
