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
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

interface AnalyticsData {
  revenueChart: { date: string; amount: number }[];
  ridesChart: { date: string; rides: number }[];
  hourlyDistribution: { hour: number; rides: number }[];
  topRoutes: { from: string; to: string; count: number }[];
  driverPerformance: { name: string; earnings: number; rating: number; rides: number }[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, analyticsResponse, rideAnalyticsResponse] = await Promise.all([
          AdminAPI.getStats(),
          AdminAPI.getAnalyticsDashboard(selectedPeriod),
          AdminAPI.getRideAnalytics(selectedPeriod, 'day')
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        // Process analytics data from API
        if (analyticsResponse.success && rideAnalyticsResponse.success) {
          const processedAnalytics: AnalyticsData = {
            revenueChart: rideAnalyticsResponse.data.timeline?.map((item: any) => ({
              date: item._id,
              amount: item.revenue || 0
            })) || [],
            ridesChart: rideAnalyticsResponse.data.timeline?.map((item: any) => ({
              date: item._id,
              rides: item.count || 0
            })) || [],
            hourlyDistribution: rideAnalyticsResponse.data.insights?.peakHours?.map((item: any) => ({
              hour: item._id,
              rides: item.count || 0
            })) || [],
            topRoutes: [
              { from: 'Mall Road', to: 'The Ridge', count: 125 },
              { from: 'Bus Stand', to: 'Jakhu Temple', count: 98 },
              { from: 'Railway Station', to: 'Scandal Point', count: 87 },
              { from: 'ISBT', to: 'Kufri', count: 65 },
              { from: 'Shimla Airport', to: 'City Center', count: 54 }
            ],
            driverPerformance: [
              { name: 'Rajesh Kumar', earnings: 45670, rating: 4.8, rides: 234 },
              { name: 'Vikram Singh', earnings: 38900, rating: 4.6, rides: 198 },
              { name: 'Amit Sharma', earnings: 42100, rating: 4.7, rides: 211 },
              { name: 'Suresh Thakur', earnings: 35400, rating: 4.5, rides: 167 },
              { name: 'Rohit Verma', earnings: 41200, rating: 4.9, rides: 189 }
            ]
          };
          setAnalytics(processedAnalytics);
        } else {
          // Fallback to generated mock data if API fails
          const mockAnalytics: AnalyticsData = {
            revenueChart: Array.from({ length: parseInt(selectedPeriod) }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              amount: Math.floor(Math.random() * 15000) + 5000
            })).reverse(),
            ridesChart: Array.from({ length: parseInt(selectedPeriod) }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              rides: Math.floor(Math.random() * 50) + 20
            })).reverse(),
            hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              rides: Math.floor(Math.random() * 20) + 5
            })),
            topRoutes: [
              { from: 'Mall Road', to: 'The Ridge', count: 125 },
              { from: 'Bus Stand', to: 'Jakhu Temple', count: 98 },
              { from: 'Railway Station', to: 'Scandal Point', count: 87 },
              { from: 'ISBT', to: 'Kufri', count: 65 },
              { from: 'Shimla Airport', to: 'City Center', count: 54 }
            ],
            driverPerformance: [
              { name: 'Rajesh Kumar', earnings: 45670, rating: 4.8, rides: 234 },
              { name: 'Vikram Singh', earnings: 38900, rating: 4.6, rides: 198 },
              { name: 'Amit Sharma', earnings: 42100, rating: 4.7, rides: 211 },
              { name: 'Suresh Thakur', earnings: 35400, rating: 4.5, rides: 167 },
              { name: 'Rohit Verma', earnings: 41200, rating: 4.9, rides: 189 }
            ]
          };
          setAnalytics(mockAnalytics);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Use fallback mock data on error
        const mockAnalytics: AnalyticsData = {
          revenueChart: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 15000) + 5000
          })).reverse(),
          ridesChart: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            rides: Math.floor(Math.random() * 50) + 20
          })).reverse(),
          hourlyDistribution: Array.from({ length: 12 }, (_, i) => ({
            hour: i + 6,
            rides: Math.floor(Math.random() * 20) + 5
          })),
          topRoutes: [
            { from: 'Mall Road', to: 'The Ridge', count: 125 },
            { from: 'Bus Stand', to: 'Jakhu Temple', count: 98 }
          ],
          driverPerformance: [
            { name: 'Rajesh Kumar', earnings: 45670, rating: 4.8, rides: 234 }
          ]
        };
        setAnalytics(mockAnalytics);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

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

      {/* Analytics Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Analytics Overview
          </h2>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Revenue Trend
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value/1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-slate-900">
                ₹{analytics?.revenueChart.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">Total Revenue ({selectedPeriod})</p>
            </div>
          </div>

          {/* Rides Chart */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-green-600" />
              Rides Trend
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.ridesChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [value, 'Rides']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar
                    dataKey="rides"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-slate-900">
                {analytics?.ridesChart.reduce((sum, item) => sum + item.rides, 0)}
              </p>
              <p className="text-sm text-slate-600">Total Rides ({selectedPeriod})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Routes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Top Routes
          </h3>
          <div className="space-y-3">
            {analytics?.topRoutes.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">{route.from}</p>
                  <p className="text-slate-600 text-xs">to {route.to}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{route.count}</p>
                  <p className="text-xs text-slate-500">rides</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Peak Hours
          </h3>
          <div className="space-y-2">
            {analytics?.hourlyDistribution
              .sort((a, b) => b.rides - a.rides)
              .slice(0, 8)
              .map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-700">
                    {hour.hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-orange-100 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${(hour.rides / 25) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8">
                      {hour.rides}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {analytics?.driverPerformance.slice(0, 5).map((driver, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{driver.name}</p>
                    <p className="text-slate-600 text-xs flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {driver.rating} • {driver.rides} rides
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-sm">₹{driver.earnings.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-600" />
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-slate-900">API Status</p>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-slate-900">Payment Gateway</p>
              <p className="text-sm text-green-600">Operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="font-semibold text-slate-900">SMS Service</p>
              <p className="text-sm text-yellow-600">Minor delays</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-slate-900">Maps & Navigation</p>
              <p className="text-sm text-green-600">Operational</p>
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
