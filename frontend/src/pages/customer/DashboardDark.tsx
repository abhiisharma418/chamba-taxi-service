import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { animations, cardVariants, getStaggerDelay } from '../../utils/animations';
import { responsive } from '../../utils/responsive';
import { 
  Car, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Star, 
  Calendar,
  ChevronRight,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { RidesAPI } from '../../lib/api';

interface DashboardStats {
  totalRides: number;
  totalSpent: number;
  averageRating: number;
  recentRides: any[];
  monthlyStats: any[];
}

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRides: 0,
    totalSpent: 0,
    averageRating: 0,
    recentRides: [],
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulated API calls - replace with actual API
      const mockStats = {
        totalRides: 24,
        totalSpent: 486.50,
        averageRating: 4.8,
        recentRides: [
          {
            id: '1',
            date: '2024-01-15',
            from: 'Downtown Mall',
            to: 'Airport Terminal 1',
            amount: 45.00,
            status: 'completed'
          },
          {
            id: '2',
            date: '2024-01-14',
            from: 'Home',
            to: 'Office District',
            amount: 28.50,
            status: 'completed'
          }
        ],
        monthlyStats: [
          { month: 'Jan', rides: 8, amount: 180.50 },
          { month: 'Feb', rides: 12, amount: 235.00 },
          { month: 'Mar', rides: 4, amount: 71.00 }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Book a Ride',
      description: 'Get a ride in minutes',
      icon: Car,
      color: 'blue',
      action: () => navigate('/customer/book-ride'),
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Ride History',
      description: 'View past trips',
      icon: Clock,
      color: 'purple',
      action: () => navigate('/customer/history'),
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Emergency',
      description: 'Safety center',
      icon: Shield,
      color: 'red',
      action: () => navigate('/customer/emergency'),
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: 'Live Tracking',
      description: 'Track current ride',
      icon: MapPin,
      color: 'green',
      action: () => navigate('/customer/live-tracking'),
      gradient: 'from-green-500 to-green-600'
    }
  ];

  const statCards = [
    {
      title: 'Total Rides',
      value: stats.totalRides,
      icon: Car,
      color: 'blue',
      trend: '+12%',
      subtitle: 'This month'
    },
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: 'green',
      trend: '+8%',
      subtitle: 'All time'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'yellow',
      trend: '+0.2',
      subtitle: 'From drivers'
    },
    {
      title: 'This Month',
      value: stats.monthlyStats[stats.monthlyStats.length - 1]?.rides || 0,
      icon: Calendar,
      color: 'purple',
      trend: '+15%',
      subtitle: 'Rides completed'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-dark-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-dark-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.fadeInDown}`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-dark-800 dark:to-dark-600 bg-clip-text text-transparent mb-2">
                  Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-slate-600 dark:text-dark-500 text-lg">Ready for your next adventure?</p>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse-glow">
                    <Activity className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.title}
                className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${cardVariants.interactive} ${animations.fadeInUp}`}
                {...getStaggerDelay(index)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <IconComponent className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-dark-800">{stat.value}</p>
                  <p className="text-sm text-slate-600 dark:text-dark-500">{stat.title}</p>
                  <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">{stat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`group bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${cardVariants.interactive} ${animations.slideInUp} text-left transition-all duration-300 hover:scale-105`}
                  {...getStaggerDelay(index)}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-800 mb-2">{action.title}</h3>
                  <p className="text-slate-600 dark:text-dark-500 text-sm mb-4">{action.description}</p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Get started <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Rides */}
          <div className="lg:col-span-2">
            <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.fadeInUp}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-dark-800">Recent Rides</h3>
                <button 
                  onClick={() => navigate('/customer/history')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors duration-200"
                >
                  View all
                </button>
              </div>
              
              <div className="space-y-4">
                {stats.recentRides.map((ride, index) => (
                  <div key={ride.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-100/50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-dark-800">{ride.from} → {ride.to}</p>
                        <p className="text-sm text-slate-600 dark:text-dark-500">{ride.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-dark-800">${ride.amount}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        {ride.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Overview */}
          <div className="lg:col-span-1">
            <div className={`bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-dark-lg border border-gray-100 dark:border-dark-border ${animations.fadeInUp}`}>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-dark-800 mb-6">Monthly Overview</h3>
              
              <div className="space-y-6">
                {stats.monthlyStats.map((month, index) => (
                  <div key={month.month}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-dark-500">{month.month}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-dark-800">{month.rides} rides</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(month.rides / Math.max(...stats.monthlyStats.map(m => m.rides))) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">${month.amount}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-dark-500 mb-2">Total this quarter</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-dark-800">
                    ${stats.monthlyStats.reduce((sum, month) => sum + month.amount, 0).toFixed(2)}
                  </p>
                  <div className="flex items-center justify-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">+23% increase</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
