import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { 
  MessageSquare, Phone, Mail, FileText, HelpCircle, Search,
  ChevronRight, Clock, CheckCircle, AlertCircle, User,
  Star, Mic, Camera, Paperclip, Send, ThumbsUp, ThumbsDown
} from 'lucide-react';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
  notHelpful: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  lastUpdated: string;
  messages: {
    id: string;
    sender: 'driver' | 'support';
    message: string;
    timestamp: string;
    attachments?: string[];
  }[];
}

const DriverSupport: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'help' | 'contact' | 'tickets'>('help');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Mock FAQ data
  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'earnings',
      question: 'How is my fare calculated?',
      answer: 'Your fare is calculated based on base fare + distance rate + time rate + any surge pricing. You keep 75% of the total fare, and RideWithUs takes 25% as platform fee.',
      helpful: 45,
      notHelpful: 3
    },
    {
      id: '2',
      category: 'rides',
      question: 'What should I do if a passenger cancels?',
      answer: 'If a passenger cancels after you\'ve arrived at the pickup location and waited for more than 5 minutes, you may be eligible for a cancellation fee. The fee will be automatically added to your earnings.',
      helpful: 38,
      notHelpful: 2
    },
    {
      id: '3',
      category: 'app',
      question: 'Why am I not receiving ride requests?',
      answer: 'Make sure you\'re online, in an area with ride demand, and your documents are verified. Also check if your vehicle is set as active in the vehicle management section.',
      helpful: 52,
      notHelpful: 5
    },
    {
      id: '4',
      category: 'payments',
      question: 'When will I receive my earnings?',
      answer: 'Cash payments are instant. Digital payments are transferred to your bank account within 24-48 hours after trip completion.',
      helpful: 67,
      notHelpful: 1
    },
    {
      id: '5',
      category: 'documents',
      question: 'How do I update my vehicle documents?',
      answer: 'Go to Vehicle Management > Documents section. Upload clear photos of your updated documents. Verification usually takes 24-48 hours.',
      helpful: 29,
      notHelpful: 2
    }
  ];

  // Mock support tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-001',
      subject: 'Payment not received for trip #12345',
      category: 'payments',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15T10:30:00Z',
      lastUpdated: '2024-01-15T14:45:00Z',
      messages: [
        {
          id: '1',
          sender: 'driver',
          message: 'I completed a trip yesterday but haven\'t received payment for trip #12345. The amount was ₹285.',
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          sender: 'support',
          message: 'Hi! I\'ve located your trip and can see the payment was processed. It should appear in your account within 24-48 hours. I\'ll follow up if it doesn\'t arrive by tomorrow.',
          timestamp: '2024-01-15T14:45:00Z'
        }
      ]
    },
    {
      id: 'TKT-002',
      subject: 'Account verification issue',
      category: 'account',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2024-01-12T09:15:00Z',
      lastUpdated: '2024-01-13T16:20:00Z',
      messages: [
        {
          id: '3',
          sender: 'driver',
          message: 'My driving license document was rejected. I uploaded a clear photo, not sure why it was rejected.',
          timestamp: '2024-01-12T09:15:00Z'
        },
        {
          id: '4',
          sender: 'support',
          message: 'I\'ve reviewed your document. The issue was that the corners were slightly cut off. Please ensure the entire document is visible in the photo and reupload.',
          timestamp: '2024-01-12T11:30:00Z'
        },
        {
          id: '5',
          sender: 'driver',
          message: 'Thanks! I\'ve uploaded a new photo.',
          timestamp: '2024-01-12T12:45:00Z'
        },
        {
          id: '6',
          sender: 'support',
          message: 'Perfect! Your license has been verified successfully. You\'re all set to drive.',
          timestamp: '2024-01-13T16:20:00Z'
        }
      ]
    }
  ]);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'earnings', label: 'Earnings & Payments' },
    { id: 'rides', label: 'Rides & Bookings' },
    { id: 'app', label: 'App Issues' },
    { id: 'account', label: 'Account & Verification' },
    { id: 'documents', label: 'Documents' },
    { id: 'vehicle', label: 'Vehicle Issues' },
    { id: 'safety', label: 'Safety & Emergency' }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const FAQCard: React.FC<{ faq: FAQ }> = ({ faq }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [voted, setVoted] = useState<'helpful' | 'not-helpful' | null>(null);

    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{faq.question}</h3>
            <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <p className="text-gray-700 mb-4">{faq.answer}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Was this helpful?</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setVoted('helpful')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                      voted === 'helpful' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{faq.helpful + (voted === 'helpful' ? 1 : 0)}</span>
                  </button>
                  
                  <button
                    onClick={() => setVoted('not-helpful')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                      voted === 'not-helpful' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>{faq.notHelpful + (voted === 'not-helpful' ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
              
              <span className="text-xs text-gray-500 capitalize">{faq.category}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              Help & Support
            </h1>
            <p className="text-slate-600 text-lg">We're here to help you drive with confidence</p>
          </div>

          {/* Quick Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Call Support</div>
                <div className="text-sm text-gray-600">+91 1800-123-4567</div>
                <div className="text-xs text-green-600">24/7 Available</div>
              </div>
            </button>

            <button className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Live Chat</div>
                <div className="text-sm text-gray-600">Instant messaging</div>
                <div className="text-xs text-blue-600">Response in 2-5 min</div>
              </div>
            </button>

            <button className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Email Support</div>
                <div className="text-sm text-gray-600">support@ridewithus.com</div>
                <div className="text-xs text-purple-600">Response in 24h</div>
              </div>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'help', label: 'Help Center', icon: HelpCircle },
                { id: 'contact', label: 'Contact Us', icon: MessageSquare },
                { id: 'tickets', label: 'My Tickets', icon: FileText }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`
                    flex items-center space-x-2 pb-4 border-b-2 transition-colors
                    ${activeTab === id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
          {activeTab === 'help' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for help..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FAQs */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Frequently Asked Questions
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'})
                  </span>
                </h3>
                
                {filteredFAQs.length > 0 ? (
                  <div className="space-y-3">
                    {filteredFAQs.map(faq => (
                      <FAQCard key={faq.id} faq={faq} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try different keywords or contact support directly.</p>
                  </div>
                )}
              </div>

              {/* Still Need Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h4 className="font-semibold text-blue-900 mb-2">Still need help?</h4>
                <p className="text-blue-700 mb-4">Can't find what you're looking for? Contact our support team.</p>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Contact Support</h3>
                <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select category</option>
                      <option value="earnings">Earnings & Payments</option>
                      <option value="rides">Rides & Bookings</option>
                      <option value="app">App Issues</option>
                      <option value="account">Account & Verification</option>
                      <option value="documents">Documents</option>
                      <option value="vehicle">Vehicle Issues</option>
                      <option value="safety">Safety & Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={6}
                    placeholder="Please provide detailed information about your issue..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input type="file" multiple className="hidden" id="attachments" />
                    <label htmlFor="attachments" className="cursor-pointer">
                      <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload files or drag and drop</p>
                      <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                    <span>Submit Ticket</span>
                  </button>
                  
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Save Draft
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Support Tickets</h3>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Ticket</span>
                </button>
              </div>

              {tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{ticket.subject}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>#{ticket.id}</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span className="capitalize">{ticket.category}</span>
                          </div>
                        </div>
                        
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${selectedTicket === ticket.id ? 'rotate-90' : ''}`} />
                      </div>

                      {selectedTicket === ticket.id && (
                        <div className="border-t border-gray-100 pt-4">
                          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                            {ticket.messages.map(message => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.sender === 'driver' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  <p className="text-sm">{message.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.sender === 'driver' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => {
                                  if (newMessage.trim()) {
                                    // Add message to ticket
                                    setNewMessage('');
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                  <p className="text-gray-600 mb-4">You haven't created any support tickets yet.</p>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverSupport;
