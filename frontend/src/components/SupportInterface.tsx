import React, { useState, useEffect } from 'react';
import { X, Plus, Send, Star, Clock, AlertCircle, CheckCircle, MessageCircle, FileText, Phone, Mail } from 'lucide-react';
import { supportService, SupportTicket, CreateTicketData } from '../services/supportService';
import { useAuth } from '../contexts/AuthContext';

interface SupportInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  rideId?: string;
}

const SupportInterface: React.FC<SupportInterfaceProps> = ({
  isOpen,
  onClose,
  rideId
}) => {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Create ticket form state
  const [createForm, setCreateForm] = useState<CreateTicketData>({
    category: 'ride_issue',
    priority: 'medium',
    subject: '',
    description: '',
    rideId: rideId
  });

  const categories = [
    { value: 'ride_issue', label: 'Ride Issue', icon: '🚗' },
    { value: 'payment_issue', label: 'Payment Issue', icon: '💳' },
    { value: 'account_issue', label: 'Account Issue', icon: '👤' },
    { value: 'driver_behavior', label: 'Driver Behavior', icon: '🚨' },
    { value: 'app_issue', label: 'App Issue', icon: '📱' },
    { value: 'vehicle_issue', label: 'Vehicle Issue', icon: '🔧' },
    { value: 'safety_concern', label: 'Safety Concern', icon: '⚠️' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-50' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen]);

  const loadTickets = async () => {
    setIsLoading(true);
    const response = await supportService.getUserTickets();
    if (response.success && response.data) {
      setTickets(response.data.tickets);
    }
    setIsLoading(false);
  };

  const handleCreateTicket = async () => {
    if (!createForm.subject.trim() || !createForm.description.trim()) {
      return;
    }

    setIsLoading(true);
    const response = await supportService.createTicket(createForm);
    
    if (response.success) {
      setView('list');
      setCreateForm({
        category: 'ride_issue',
        priority: 'medium',
        subject: '',
        description: '',
        rideId: rideId
      });
      await loadTickets();
    }
    setIsLoading(false);
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setIsLoading(true);
    const response = await supportService.addMessage(selectedTicket.ticketId, newMessage);
    
    if (response.success) {
      setNewMessage('');
      // Reload ticket details
      const ticketResponse = await supportService.getTicketById(selectedTicket.ticketId);
      if (ticketResponse.success && ticketResponse.data) {
        setSelectedTicket(ticketResponse.data);
      }
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50',
      in_progress: 'text-purple-600 bg-purple-50',
      pending_user: 'text-yellow-600 bg-yellow-50',
      resolved: 'text-green-600 bg-green-50',
      closed: 'text-gray-600 bg-gray-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      open: AlertCircle,
      in_progress: Clock,
      pending_user: MessageCircle,
      resolved: CheckCircle,
      closed: CheckCircle
    };
    return icons[status as keyof typeof icons] || AlertCircle;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-4 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Support Center</h2>
              <p className="text-sm text-gray-500">Get help with your RideWithUs experience</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {view === 'list' && (
              <button
                onClick={() => setView('create')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Ticket</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'list' && (
            <div className="h-full flex flex-col">
              {/* Quick Contact */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Need immediate help?</h3>
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>Call Support</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>Email Us</span>
                  </button>
                </div>
              </div>

              {/* Tickets List */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets yet</h3>
                    <p className="text-gray-500 mb-6">Create your first ticket to get help from our support team</p>
                    <button
                      onClick={() => setView('create')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      Create Ticket
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => {
                      const StatusIcon = getStatusIcon(ticket.status);
                      const categoryInfo = categories.find(c => c.value === ticket.category);
                      
                      return (
                        <div
                          key={ticket._id}
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setView('details');
                          }}
                          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-lg">{categoryInfo?.icon}</span>
                                <span className="text-sm font-medium text-gray-900">#{ticket.ticketId}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                <span>{formatTimeAgo(ticket.lastActivityAt)}</span>
                                <span>{categoryInfo?.label}</span>
                                <span className="capitalize">{ticket.priority} priority</span>
                              </div>
                            </div>
                            <StatusIcon className={`h-5 w-5 ${getStatusColor(ticket.status).split(' ')[0]}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'create' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Support Ticket</h3>
                
                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                    <div className="grid grid-cols-3 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setCreateForm(prev => ({ ...prev, category: category.value }))}
                          className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                            createForm.category === category.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-lg mb-1">{category.icon}</div>
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Priority</label>
                    <div className="grid grid-cols-4 gap-3">
                      {priorities.map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => setCreateForm(prev => ({ ...prev, priority: priority.value }))}
                          className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                            createForm.priority === priority.value
                              ? priority.color + ' border-current'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={createForm.subject}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of the issue"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide detailed information about your issue..."
                      rows={5}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setView('list')}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTicket}
                      disabled={!createForm.subject.trim() || !createForm.description.trim() || isLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating...' : 'Create Ticket'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'details' && selectedTicket && (
            <div className="h-full flex flex-col">
              {/* Ticket Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setView('list')}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ← Back to tickets
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">#{selectedTicket.ticketId}</h3>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h4>
                <p className="text-gray-600">{selectedTicket.description}</p>
                
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                  <span>Created {formatTimeAgo(selectedTicket.createdAt)}</span>
                  <span className="capitalize">{selectedTicket.priority} priority</span>
                  <span>{categories.find(c => c.value === selectedTicket.category)?.label}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender.type === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.sender.type === 'admin'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{message.sender.name}</span>
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={2}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <button
                      onClick={handleAddMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportInterface;
