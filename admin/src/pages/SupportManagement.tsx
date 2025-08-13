import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, MessageCircle, Clock, CheckCircle, AlertCircle, BarChart3, Users, TrendingUp, Target } from 'lucide-react';
import Layout from '../components/Layout';

interface SupportTicket {
  _id: string;
  ticketId: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: 'customer' | 'driver';
  };
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_user' | 'resolved' | 'closed';
  subject: string;
  description: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  messages: any[];
  createdAt: string;
  lastActivityAt: string;
  firstResponseTime?: string;
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  ticketsByCategory: { _id: string; count: number }[];
  ticketsByPriority: { _id: string; count: number }[];
  averageResolutionTime: number;
  slaBreaches: number;
  resolutionRate: string;
}

const SupportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    period: '30d'
  });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const categories = [
    'ride_issue', 'payment_issue', 'account_issue', 'driver_behavior',
    'app_issue', 'vehicle_issue', 'safety_concern', 'feature_request', 'other'
  ];

  const statuses = ['open', 'in_progress', 'pending_user', 'resolved', 'closed'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      const mockTickets: SupportTicket[] = [
        {
          _id: '1',
          ticketId: 'RWU-000001',
          user: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            userType: 'customer'
          },
          category: 'ride_issue',
          priority: 'high',
          status: 'open',
          subject: 'Driver did not arrive',
          description: 'My driver was supposed to arrive at 2 PM but never showed up. I waited for 30 minutes.',
          messages: [],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          ticketId: 'RWU-000002',
          user: {
            id: 'user2',
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            userType: 'driver'
          },
          category: 'payment_issue',
          priority: 'medium',
          status: 'in_progress',
          subject: 'Payment not received',
          description: 'I completed a ride yesterday but the payment is not showing in my account.',
          assignedTo: {
            _id: 'admin1',
            name: 'Support Admin',
            email: 'admin@ridewithus.com'
          },
          messages: [{ sender: { name: 'Support Admin', type: 'admin' }, message: 'We are investigating this issue.' }],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastActivityAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
    setIsLoading(false);
  };

  const loadStats = async () => {
    try {
      // Mock stats - replace with actual API
      const mockStats: SupportStats = {
        totalTickets: 156,
        openTickets: 23,
        resolvedTickets: 120,
        ticketsByCategory: [
          { _id: 'ride_issue', count: 45 },
          { _id: 'payment_issue', count: 32 },
          { _id: 'app_issue', count: 28 },
          { _id: 'account_issue', count: 21 },
          { _id: 'other', count: 30 }
        ],
        ticketsByPriority: [
          { _id: 'urgent', count: 8 },
          { _id: 'high', count: 25 },
          { _id: 'medium', count: 89 },
          { _id: 'low', count: 34 }
        ],
        averageResolutionTime: 18.5,
        slaBreaches: 5,
        resolutionRate: '76.9'
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50 border-blue-200',
      in_progress: 'text-purple-600 bg-purple-50 border-purple-200',
      pending_user: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      resolved: 'text-green-600 bg-green-50 border-green-200',
      closed: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      // Mock API call - replace with actual API
      console.log(`Updating ticket ${ticketId} to status ${newStatus}`);
      
      // Update local state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.ticketId === ticketId 
            ? { ...ticket, status: newStatus as any }
            : ticket
        )
      );
      
      setShowTicketModal(false);
      loadStats(); // Reload stats
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      // Mock API call - replace with actual API
      console.log(`Adding message to ticket ${selectedTicket.ticketId}: ${newMessage}`);
      
      setNewMessage('');
      setShowTicketModal(false);
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || ticket.status === filters.status;
    const matchesCategory = !filters.category || ticket.category === filters.category;
    const matchesPriority = !filters.priority || ticket.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
            <p className="text-gray-600">Manage customer and driver support tickets</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolutionRate}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageResolutionTime.toFixed(1)}h</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">#{ticket.ticketId}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{ticket.subject}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{ticket.user.name}</div>
                          <div className="text-sm text-gray-500">{ticket.user.userType}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 capitalize">
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTimeAgo(ticket.lastActivityAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Details Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ticket #{selectedTicket.ticketId}
                  </h3>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedTicket.subject}</h4>
                    <p className="text-gray-600 mt-1">{selectedTicket.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">User:</span>
                      <span className="ml-2">{selectedTicket.user.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 capitalize">{selectedTicket.category.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Priority:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {selectedTicket.messages.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Messages</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedTicket.messages.map((message, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-900">{message.sender.name}</div>
                            <div className="text-sm text-gray-600">{message.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Message</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your response..."
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusUpdate(selectedTicket.ticketId, e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowTicketModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupportManagement;
