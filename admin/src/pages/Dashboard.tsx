import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../lib/api';
import { 
  Car, 
  Users, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Clock,
  Star,
  Activity
} from 'lucide-react';

interface Stats {
  totalRides: number;
  activeDrivers: number;
  totalCustomers: number;
  todayRevenue: number;
  completedRides: number;
  cancelledRides: number;
  averageRating: number;
  onlineDrivers: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await AdminAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    bgColor, 
    change 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string; 
    bgColor: string;
    change?: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {change && (
            <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {change}
            </p>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-xl`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-blue-100 text-lg">Monitor your RideWithUs operations in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Rides"
          value={stats?.totalRides || 0}
          icon={Car}
          color="text-blue-600"
          bgColor="bg-blue-100"
          change="+12% from last month"
        />
        <StatCard
          title="Active Drivers"
          value={stats?.activeDrivers || 0}
          icon={Users}
          color="text-green-600"
          bgColor="bg-green-100"
          change="+5 new this week"
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100"
          change="+8% growth"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats?.todayRevenue || 0}`}
          icon={DollarSign}
          color="text-amber-600"
          bgColor="bg-amber-100"
          change="+15% vs yesterday"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ride Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Ride Statistics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-700">Completed Rides</span>
              </div>
              <span className="font-semibold text-slate-900">{stats?.completedRides || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-700">Cancelled Rides</span>
              </div>
              <span className="font-semibold text-slate-900">{stats?.cancelledRides || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-slate-700">Average Rating</span>
              </div>
              <span className="font-semibold text-slate-900">{stats?.averageRating || 0}/5</span>
            </div>
          </div>
        </div>

        {/* Driver Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-green-600" />
            Driver Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-700">Online Drivers</span>
              </div>
              <span className="font-semibold text-green-600">{stats?.onlineDrivers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-slate-700">Offline Drivers</span>
              </div>
              <span className="font-semibold text-slate-900">
                {(stats?.activeDrivers || 0) - (stats?.onlineDrivers || 0)}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Online Rate</span>
                <span className="font-semibold text-blue-600">
                  {stats?.activeDrivers ? Math.round(((stats?.onlineDrivers || 0) / stats.activeDrivers) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-300 text-left">
            <Car className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-slate-900">Manage Rides</h3>
            <p className="text-sm text-slate-600">View and manage all ride requests</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-300 text-left">
            <Users className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-slate-900">Driver Management</h3>
            <p className="text-sm text-slate-600">Approve and manage drivers</p>
          </button>
          <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors duration-300 text-left">
            <DollarSign className="h-6 w-6 text-amber-600 mb-2" />
            <h3 className="font-semibold text-slate-900">Pricing Settings</h3>
            <p className="text-sm text-slate-600">Configure fare and pricing</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
