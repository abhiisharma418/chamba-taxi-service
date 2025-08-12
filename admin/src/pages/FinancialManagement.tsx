import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, CreditCard, RefreshCw, Download, 
  Eye, MoreHorizontal, CheckCircle, XCircle, Clock,
  ArrowUpRight, ArrowDownRight, Users, Car, Wallet
} from 'lucide-react';

interface Payment {
  _id: string;
  type: 'ride_payment' | 'refund' | 'driver_payout';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: 'cash' | 'card' | 'upi' | 'wallet';
  customer?: {
    name: string;
    email: string;
  };
  driver?: {
    name: string;
    email: string;
  };
  ride?: {
    pickup: string;
    destination: string;
  };
  createdAt: string;
  transactionId: string;
}

interface FinancialOverview {
  totalRevenue: number;
  totalCommission: number;
  totalDriverPayouts: number;
  completedRides: number;
  pendingPayments: number;
  refundsProcessed: number;
  netProfit: number;
  commissionRate: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  rides: number;
}

const FinancialManagement: React.FC = () => {
  const [overview, setOverview] = useState<FinancialOverview>({
    totalRevenue: 0,
    totalCommission: 0,
    totalDriverPayouts: 0,
    completedRides: 0,
    pendingPayments: 0,
    refundsProcessed: 0,
    netProfit: 0,
    commissionRate: 0
  });

  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [period, setPeriod] = useState('30d');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadFinancialData();
  }, [period, statusFilter, typeFilter]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Mock financial overview data
      setOverview({
        totalRevenue: 2547800,
        totalCommission: 636950, // 25% of revenue
        totalDriverPayouts: 1910850, // 75% of revenue
        completedRides: 1568,
        pendingPayments: 23,
        refundsProcessed: 45,
        netProfit: 636950,
        commissionRate: 25
      });

      // Mock revenue trend data
      const mockRevenueData: RevenueData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 50000) + 30000,
        rides: Math.floor(Math.random() * 50) + 30
      }));
      setRevenueData(mockRevenueData);

      // Mock payments data
      const mockPayments: Payment[] = [
        {
          _id: '1',
          type: 'ride_payment',
          amount: 285,
          status: 'completed',
          method: 'upi',
          customer: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          ride: {
            pickup: 'Connaught Place',
            destination: 'India Gate'
          },
          createdAt: '2024-01-15T10:30:00Z',
          transactionId: 'TXN_001234567890'
        },
        {
          _id: '2',
          type: 'driver_payout',
          amount: 15000,
          status: 'completed',
          method: 'card',
          driver: {
            name: 'Rajesh Kumar',
            email: 'rajesh@example.com'
          },
          createdAt: '2024-01-15T09:15:00Z',
          transactionId: 'PAY_987654321098'
        },
        {
          _id: '3',
          type: 'refund',
          amount: 180,
          status: 'pending',
          method: 'upi',
          customer: {
            name: 'Priya Sharma',
            email: 'priya@example.com'
          },
          ride: {
            pickup: 'Karol Bagh',
            destination: 'Rajouri Garden'
          },
          createdAt: '2024-01-15T08:45:00Z',
          transactionId: 'REF_555666777888'
        }
      ];
      setPayments(mockPayments);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (paymentId: string, amount: number, reason: string) => {
    try {
      console.log('Processing refund:', paymentId, amount, reason);
      
      setPayments(prev => prev.map(payment => 
        payment._id === paymentId 
          ? { ...payment, status: 'completed' }
          : payment
      ));
      
      setShowRefundModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const handleDriverPayout = async (driverId: string, amount: number) => {
    try {
      console.log('Processing driver payout:', driverId, amount);
      
      // Mock payout processing
      const newPayout: Payment = {
        _id: Date.now().toString(),
        type: 'driver_payout',
        amount,
        status: 'completed',
        method: 'card',
        driver: {
          name: 'Driver Name',
          email: 'driver@example.com'
        },
        createdAt: new Date().toISOString(),
        transactionId: `PAY_${Date.now()}`
      };
      
      setPayments(prev => [newPayout, ...prev]);
    } catch (error) {
      console.error('Failed to process driver payout:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ride_payment': return <Car className="h-4 w-4 text-blue-600" />;
      case 'driver_payout': return <Users className="h-4 w-4 text-green-600" />;
      case 'refund': return <RefreshCw className="h-4 w-4 text-red-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const RefundModal: React.FC<{ payment: Payment; onClose: () => void; onRefund: (amount: number, reason: string) => void }> = ({ payment, onClose, onRefund }) => {
    const [refundAmount, setRefundAmount] = useState(payment.amount);
    const [reason, setReason] = useState('');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Process Refund</h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Amount</label>
              <div className="text-lg font-semibold text-gray-900">₹{payment.amount}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                max={payment.amount}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter refund reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => reason.trim() && onRefund(refundAmount, reason)}
              disabled={!reason.trim() || refundAmount <= 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Process Refund
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PaymentDetailsModal: React.FC<{ payment: Payment; onClose: () => void }> = ({ payment, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <div className="mt-1 text-sm text-gray-900 font-mono">{payment.transactionId}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <div className="mt-1 text-lg font-semibold text-gray-900">₹{payment.amount}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="mt-1 flex items-center space-x-1">
                {getTypeIcon(payment.type)}
                <span className="text-sm text-gray-900 capitalize">{payment.type.replace('_', ' ')}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Method</label>
              <div className="mt-1 text-sm text-gray-900 uppercase">{payment.method}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                  <span>{payment.status}</span>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <div className="mt-1 text-sm text-gray-900">{new Date(payment.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {payment.customer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <div className="mt-1">
                <div className="text-sm text-gray-900">{payment.customer.name}</div>
                <div className="text-xs text-gray-500">{payment.customer.email}</div>
              </div>
            </div>
          )}

          {payment.driver && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver</label>
              <div className="mt-1">
                <div className="text-sm text-gray-900">{payment.driver.name}</div>
                <div className="text-xs text-gray-500">{payment.driver.email}</div>
              </div>
            </div>
          )}

          {payment.ride && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Ride Details</label>
              <div className="mt-1 text-sm text-gray-900">
                <div>From: {payment.ride.pickup}</div>
                <div>To: {payment.ride.destination}</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
          {payment.type === 'ride_payment' && payment.status === 'completed' && (
            <button
              onClick={() => {
                setSelectedPayment(payment);
                setShowRefundModal(true);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Process Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
              <p className="text-gray-600">Monitor revenue, payments, and financial performance</p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">₹{overview.totalRevenue.toLocaleString()}</div>
                <div className="text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+12.5% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">₹{overview.totalCommission.toLocaleString()}</div>
                <div className="text-gray-600">Platform Commission</div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {overview.commissionRate}% commission rate
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">₹{overview.totalDriverPayouts.toLocaleString()}</div>
                <div className="text-gray-600">Driver Payouts</div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              75% of total revenue
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{overview.pendingPayments}</div>
                <div className="text-gray-600">Pending Payments</div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Requires attention
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Rides</span>
              </div>
            </div>
          </div>
          
          {/* Simple chart representation */}
          <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-center">
            <div className="flex items-end space-x-1 h-full py-4">
              {revenueData.slice(-14).map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 rounded-t w-6"
                    style={{ height: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                    {new Date(data.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              
              <div className="flex items-center space-x-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="ride_payment">Ride Payments</option>
                  <option value="driver_payout">Driver Payouts</option>
                  <option value="refund">Refunds</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading transactions...</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{payment.transactionId}</div>
                          {payment.customer && (
                            <div className="text-sm text-gray-500">{payment.customer.name}</div>
                          )}
                          {payment.driver && (
                            <div className="text-sm text-gray-500">{payment.driver.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(payment.type)}
                          <span className="text-sm text-gray-900 capitalize">{payment.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{payment.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span>{payment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {payment.type === 'ride_payment' && payment.status === 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRefundModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Process Refund"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedPayment && !showRefundModal && (
        <PaymentDetailsModal 
          payment={selectedPayment} 
          onClose={() => setSelectedPayment(null)} 
        />
      )}

      {showRefundModal && selectedPayment && (
        <RefundModal
          payment={selectedPayment}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedPayment(null);
          }}
          onRefund={(amount, reason) => handleProcessRefund(selectedPayment._id, amount, reason)}
        />
      )}
    </div>
  );
};

export default FinancialManagement;
