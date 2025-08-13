import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Plus, Edit, Trash2,
  Shield, AlertCircle, CheckCircle, Clock,
  Eye, MoreHorizontal, Download, Ban, UserCheck, FileText
} from 'lucide-react';
import DriverDocumentVerification from '../components/DriverDocumentVerification';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'driver' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  verified: boolean;
  createdAt: string;
  isSuspended: boolean;
  suspensionReason?: string;
  verificationStatus: 'verified' | 'pending';
  recentActivityCount: number;
}

interface UserFilters {
  role: string;
  status: string;
  verified: string;
  search: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    verified: 'all',
    search: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    verifiedUsers: 0
  });

  // Load users data
  useEffect(() => {
    loadUsers();
  }, [filters, pagination.page]);

  // Load user statistics
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with real API
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      // Mock data for now
      const mockUsers: User[] = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+91 9876543210',
          role: 'customer',
          status: 'active',
          verified: true,
          createdAt: '2024-01-15T10:30:00Z',
          isSuspended: false,
          verificationStatus: 'verified',
          recentActivityCount: 15
        },
        {
          _id: '2',
          name: 'Sarah Driver',
          email: 'sarah@example.com',
          phone: '+91 9876543211',
          role: 'driver',
          status: 'active',
          verified: true,
          createdAt: '2024-01-10T08:15:00Z',
          isSuspended: false,
          verificationStatus: 'verified',
          recentActivityCount: 45
        },
        {
          _id: '3',
          name: 'Mike Customer',
          email: 'mike@example.com',
          phone: '+91 9876543212',
          role: 'customer',
          status: 'suspended',
          verified: false,
          createdAt: '2024-01-05T14:20:00Z',
          isSuspended: true,
          suspensionReason: 'Multiple payment failures',
          verificationStatus: 'pending',
          recentActivityCount: 2
        }
      ];

      setUsers(mockUsers);
      setPagination(prev => ({ ...prev, total: mockUsers.length, pages: 1 }));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Mock stats data
      setStats({
        totalUsers: 1250,
        activeUsers: 1100,
        newUsersThisMonth: 89,
        verifiedUsers: 945
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      // Mock API call
      console.log('Suspending user:', userId, 'Reason:', reason);
      
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, status: 'suspended', isSuspended: true, suspensionReason: reason }
          : user
      ));
      
      setShowSuspendModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      // Mock API call
      console.log('Unsuspending user:', userId);
      
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, status: 'active', isSuspended: false, suspensionReason: undefined }
          : user
      ));
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      // Mock API call
      console.log('Verifying user:', userId);
      
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, verified: true, verificationStatus: 'verified' }
          : user
      ));
    } catch (error) {
      console.error('Failed to verify user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Mock API call
      console.log('Deleting user:', userId);
      
      setUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'driver': return 'text-blue-600 bg-blue-100';
      case 'customer': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const UserDetailsModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{user.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 font-medium">{user.phone}</span>
              </div>
              <div>
                <span className="text-gray-500">Role:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Verified:</span>
                <span className="ml-2">
                  {user.verified ? (
                    <CheckCircle className="inline h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="inline h-4 w-4 text-yellow-600" />
                  )}
                  <span className="ml-1">{user.verified ? 'Yes' : 'Pending'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Recent Activity:</span>
                <span className="font-medium">{user.recentActivityCount} actions (30 days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member Since:</span>
                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Suspension Info */}
          {user.isSuspended && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Suspension Details</h3>
              <p className="text-red-700 text-sm">{user.suspensionReason}</p>
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
          
          {!user.verified && (
            <button
              onClick={() => handleVerifyUser(user._id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Verify User
            </button>
          )}
          
          {user.isSuspended ? (
            <button
              onClick={() => handleUnsuspendUser(user._id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Unsuspend
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowSuspendModal(true);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Suspend
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const SuspendModal: React.FC<{ user: User; onClose: () => void; onSuspend: (reason: string) => void }> = ({ user, onClose, onSuspend }) => {
    const [reason, setReason] = useState('');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Suspend User</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-4">
              You are about to suspend <strong>{user.name}</strong>. Please provide a reason:
            </p>
            
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter suspension reason..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => reason.trim() && onSuspend(reason)}
              disabled={!reason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Suspend User
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, verify accounts, and monitor activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-gray-600">Total Users</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</div>
                <div className="text-gray-600">Active Users</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.verifiedUsers.toLocaleString()}</div>
                <div className="text-gray-600">Verified Users</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Plus className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</div>
                <div className="text-gray-600">New This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
                <select
                  value={filters.verified}
                  onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
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
                      <p className="text-gray-500 mt-2">Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                        {user.isSuspended && (
                          <div className="text-xs text-red-500 mt-1">{user.suspensionReason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.verified ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.recentActivityCount} actions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {!user.verified && (
                            <button
                              onClick={() => handleVerifyUser(user._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Verify User"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          
                          {user.isSuspended ? (
                            <button
                              onClick={() => handleUnsuspendUser(user._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Unsuspend User"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowSuspendModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Suspend User"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                  {pagination.page}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }} 
        />
      )}

      {showSuspendModal && selectedUser && (
        <SuspendModal
          user={selectedUser}
          onClose={() => {
            setShowSuspendModal(false);
            setSelectedUser(null);
          }}
          onSuspend={(reason) => handleSuspendUser(selectedUser._id, reason)}
        />
      )}
    </div>
  );
};

export default UserManagement;
