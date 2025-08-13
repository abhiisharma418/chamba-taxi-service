import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Copy, BarChart3, Users, Gift, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';

interface PromoCode {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_ride';
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  validFrom: string;
  validUntil: string;
  currentUsageCount: number;
  totalUsageLimit?: number;
  usagePerUserLimit: number;
  analytics: {
    totalUsage: number;
    uniqueUsers: number;
    totalDiscountGiven: number;
  };
  createdAt: string;
}

interface PromoAnalytics {
  overview: {
    totalPromoCodes: number;
    activePromoCodes: number;
    totalUsage: number;
    totalDiscountGiven: number;
  };
  topPromoCodes: any[];
  usageByType: any[];
}

const PromoCodeManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [analytics, setAnalytics] = useState<PromoAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedPromos, setSelectedPromos] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  // Create/Edit promo form state
  const [promoForm, setPromoForm] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_ride',
    value: 0,
    maxDiscountAmount: '',
    minOrderAmount: '',
    validFrom: '',
    validUntil: '',
    totalUsageLimit: '',
    usagePerUserLimit: 1,
    applicableUserTypes: [] as string[],
    applicableVehicleTypes: [] as string[],
    isFirstRideOnly: false,
    campaignName: '',
    campaignType: '',
    isVisible: true
  });

  const promoTypes = [
    { value: 'percentage', label: 'Percentage Discount' },
    { value: 'fixed_amount', label: 'Fixed Amount Discount' },
    { value: 'free_ride', label: 'Free Ride' }
  ];

  const userTypes = ['new_user', 'existing_user', 'premium_user', 'all'];
  const vehicleTypes = ['auto', 'bike', 'car', 'premium'];
  const campaignTypes = ['seasonal', 'launch', 'retention', 'acquisition', 'loyalty', 'partnership'];

  useEffect(() => {
    loadPromoCodes();
    loadAnalytics();
  }, [filters]);

  const loadPromoCodes = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual service
      const mockPromoCodes: PromoCode[] = [
        {
          _id: '1',
          code: 'WELCOME20',
          name: 'Welcome Discount',
          description: '20% off on your first ride',
          type: 'percentage',
          value: 20,
          maxDiscountAmount: 100,
          minOrderAmount: 50,
          status: 'active',
          validFrom: '2024-01-01T00:00:00Z',
          validUntil: '2024-12-31T23:59:59Z',
          currentUsageCount: 45,
          totalUsageLimit: 1000,
          usagePerUserLimit: 1,
          analytics: {
            totalUsage: 45,
            uniqueUsers: 45,
            totalDiscountGiven: 2250
          },
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          _id: '2',
          code: 'SAVE50',
          name: 'Flat 50 Off',
          description: 'Get flat ₹50 off on rides above ₹200',
          type: 'fixed_amount',
          value: 50,
          minOrderAmount: 200,
          status: 'active',
          validFrom: '2024-01-15T00:00:00Z',
          validUntil: '2024-02-15T23:59:59Z',
          currentUsageCount: 128,
          totalUsageLimit: 500,
          usagePerUserLimit: 2,
          analytics: {
            totalUsage: 128,
            uniqueUsers: 89,
            totalDiscountGiven: 6400
          },
          createdAt: '2024-01-15T00:00:00Z'
        }
      ];
      
      setPromoCodes(mockPromoCodes);
    } catch (error) {
      console.error('Error loading promo codes:', error);
    }
    setIsLoading(false);
  };

  const loadAnalytics = async () => {
    try {
      // Mock analytics data
      const mockAnalytics: PromoAnalytics = {
        overview: {
          totalPromoCodes: 15,
          activePromoCodes: 8,
          totalUsage: 1245,
          totalDiscountGiven: 45600
        },
        topPromoCodes: [],
        usageByType: [
          { _id: 'percentage', count: 8, usage: 890 },
          { _id: 'fixed_amount', count: 5, usage: 355 },
          { _id: 'free_ride', count: 2, usage: 0 }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreatePromo = async () => {
    try {
      // Mock API call - replace with actual service
      console.log('Creating promo:', promoForm);
      
      // Reset form and close modal
      setPromoForm({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        maxDiscountAmount: '',
        minOrderAmount: '',
        validFrom: '',
        validUntil: '',
        totalUsageLimit: '',
        usagePerUserLimit: 1,
        applicableUserTypes: [],
        applicableVehicleTypes: [],
        isFirstRideOnly: false,
        campaignName: '',
        campaignType: '',
        isVisible: true
      });
      setShowCreateModal(false);
      
      // Reload promo codes
      await loadPromoCodes();
    } catch (error) {
      console.error('Error creating promo code:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPromos.length === 0) {
      alert('Please select promo codes first');
      return;
    }

    try {
      // Mock API call - replace with actual service
      console.log(`Bulk ${action} for:`, selectedPromos);
      
      setSelectedPromos([]);
      await loadPromoCodes();
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Add toast notification here
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600 bg-green-50 border-green-200',
      inactive: 'text-gray-600 bg-gray-50 border-gray-200',
      expired: 'text-red-600 bg-red-50 border-red-200',
      suspended: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      percentage: 'text-blue-600 bg-blue-50',
      fixed_amount: 'text-green-600 bg-green-50',
      free_ride: 'text-purple-600 bg-purple-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const formatDiscount = (promo: PromoCode) => {
    if (promo.type === 'percentage') {
      return `${promo.value}%${promo.maxDiscountAmount ? ` (max ₹${promo.maxDiscountAmount})` : ''}`;
    } else if (promo.type === 'fixed_amount') {
      return `₹${promo.value}`;
    } else {
      return 'FREE RIDE';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesStatus = !filters.status || promo.status === filters.status;
    const matchesType = !filters.type || promo.type === filters.type;
    const matchesSearch = !filters.search || 
      promo.code.toLowerCase().includes(filters.search.toLowerCase()) ||
      promo.name.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promo Code Management</h1>
            <p className="text-gray-600">Create and manage discount codes and offers</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Promo Code</span>
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        {showAnalytics && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Promo Codes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalPromoCodes}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Codes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.activePromoCodes}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsage.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Discount Given</p>
                  <p className="text-2xl font-bold text-gray-900">₹{analytics.overview.totalDiscountGiven.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search promo codes..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_ride">Free Ride</option>
              </select>
            </div>

            {selectedPromos.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Activate ({selectedPromos.length})
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPromos.length === filteredPromoCodes.length && filteredPromoCodes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPromos(filteredPromoCodes.map(p => p._id));
                        } else {
                          setSelectedPromos([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name & Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPromoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No promo codes found
                    </td>
                  </tr>
                ) : (
                  filteredPromoCodes.map((promo) => (
                    <tr key={promo._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPromos.includes(promo._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPromos(prev => [...prev, promo._id]);
                            } else {
                              setSelectedPromos(prev => prev.filter(id => id !== promo._id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-gray-900">{promo.code}</span>
                          <button
                            onClick={() => copyPromoCode(promo.code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy code"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{promo.name}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(promo.type)}`}>
                            {promo.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{formatDiscount(promo)}</span>
                        {promo.minOrderAmount > 0 && (
                          <div className="text-xs text-gray-500">Min ₹{promo.minOrderAmount}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {promo.currentUsageCount}
                            {promo.totalUsageLimit && ` / ${promo.totalUsageLimit}`}
                          </div>
                          <div className="text-gray-500">
                            {promo.analytics.uniqueUsers} unique users
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(promo.status)}`}>
                          {promo.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(promo.validUntil)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Promo Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Create New Promo Code</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code *</label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., WELCOME20"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                    <input
                      type="text"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Welcome Discount"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={promoForm.description}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the offer"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type *</label>
                    <select
                      value={promoForm.type}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {promoTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {promoForm.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *
                    </label>
                    <input
                      type="number"
                      value={promoForm.value}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      placeholder={promoForm.type === 'percentage' ? '20' : '50'}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      max={promoForm.type === 'percentage' ? 100 : undefined}
                    />
                  </div>

                  {promoForm.type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Discount Amount (₹)</label>
                      <input
                        type="number"
                        value={promoForm.maxDiscountAmount}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                        placeholder="100"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={promoForm.minOrderAmount}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                      placeholder="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid From *</label>
                    <input
                      type="datetime-local"
                      value={promoForm.validFrom}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until *</label>
                    <input
                      type="datetime-local"
                      value={promoForm.validUntil}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Usage Limit</label>
                    <input
                      type="number"
                      value={promoForm.totalUsageLimit}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, totalUsageLimit: e.target.value }))}
                      placeholder="Leave empty for unlimited"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Usage Per User Limit</label>
                    <input
                      type="number"
                      value={promoForm.usagePerUserLimit}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, usagePerUserLimit: parseInt(e.target.value) || 1 }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={promoForm.isFirstRideOnly}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, isFirstRideOnly: e.target.checked }))}
                        className="rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">First ride only</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={promoForm.isVisible}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                        className="rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">Visible to users</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePromo}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
                >
                  Create Promo Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PromoCodeManagement;
