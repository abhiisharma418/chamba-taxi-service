import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { 
  DollarSign, TrendingUp, Calendar, Download, Eye, 
  BarChart3, PieChart, Clock, Target, Award, ArrowUp, ArrowDown
} from 'lucide-react';

interface EarningsData {
  daily: { date: string; amount: number; rides: number }[];
  weekly: { week: string; amount: number; rides: number }[];
  monthly: { month: string; amount: number; rides: number }[];
  summary: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    totalEarnings: number;
    totalRides: number;
    avgPerRide: number;
    peakHours: string[];
    topEarningDay: string;
  };
  breakdown: {
    rideFare: number;
    tips: number;
    incentives: number;
    surge: number;
    cancellationFee: number;
  };
}

const DriverEarnings: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real app, this would fetch from backend
      const mockData: EarningsData = {
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 2000) + 500,
          rides: Math.floor(Math.random() * 15) + 3
        })).reverse(),
        weekly: Array.from({ length: 12 }, (_, i) => ({
          week: `Week ${i + 1}`,
          amount: Math.floor(Math.random() * 12000) + 8000,
          rides: Math.floor(Math.random() * 80) + 50
        })),
        monthly: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i).toLocaleString('default', { month: 'long' }),
          amount: Math.floor(Math.random() * 45000) + 25000,
          rides: Math.floor(Math.random() * 300) + 200
        })),
        summary: {
          today: 1250,
          yesterday: 980,
          thisWeek: 8750,
          lastWeek: 7200,
          thisMonth: 35000,
          lastMonth: 32000,
          totalEarnings: 125000,
          totalRides: 850,
          avgPerRide: 147,
          peakHours: ['9:00 AM', '6:00 PM', '10:00 PM'],
          topEarningDay: 'Saturday'
        },
        breakdown: {
          rideFare: 28000,
          tips: 3500,
          incentives: 2000,
          surge: 1200,
          cancellationFee: 300
        }
      };
      
      setEarningsData(mockData);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadReport = () => {
    // Simulate download functionality
    const blob = new Blob(['Earnings Report Data'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-report-${selectedPeriod}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading earnings data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600">Failed to load earnings data</p>
          </div>
        </div>
      </div>
    );
  }

  const currentData = earningsData[selectedPeriod];
  const summary = earningsData.summary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Earnings Dashboard
              </h1>
              <p className="text-slate-600 text-lg">Track your income and performance</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Breakdown</span>
              </button>
              
              <button
                onClick={downloadReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(summary.today)}</div>
                <div className="text-green-100">Today's Earnings</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {getPercentageChange(summary.today, summary.yesterday) >= 0 ? (
                <ArrowUp className="h-4 w-4 text-green-200" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-200" />
              )}
              <span className="text-sm text-green-100">
                {Math.abs(getPercentageChange(summary.today, summary.yesterday)).toFixed(1)}% vs yesterday
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(summary.thisWeek)}</div>
                <div className="text-blue-100">This Week</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {getPercentageChange(summary.thisWeek, summary.lastWeek) >= 0 ? (
                <ArrowUp className="h-4 w-4 text-blue-200" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-200" />
              )}
              <span className="text-sm text-blue-100">
                {Math.abs(getPercentageChange(summary.thisWeek, summary.lastWeek)).toFixed(1)}% vs last week
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(summary.thisMonth)}</div>
                <div className="text-purple-100">This Month</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {getPercentageChange(summary.thisMonth, summary.lastMonth) >= 0 ? (
                <ArrowUp className="h-4 w-4 text-purple-200" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-200" />
              )}
              <span className="text-sm text-purple-100">
                {Math.abs(getPercentageChange(summary.thisMonth, summary.lastMonth)).toFixed(1)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(summary.avgPerRide)}</div>
                <div className="text-orange-100">Avg per Ride</div>
              </div>
            </div>
            <div className="text-sm text-orange-100">
              {summary.totalRides} total rides
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Earnings Trend</h3>
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>

              {/* Chart Placeholder */}
              <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600">Earnings chart would appear here</p>
                  <p className="text-sm text-gray-500">Showing {selectedPeriod} data</p>
                </div>
              </div>

              {/* Data Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">Total Earnings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentData.reduce((sum, item) => sum + item.rides, 0)}
                  </div>
                  <div className="text-gray-600 text-sm">Total Rides</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.max(...currentData.map(item => item.amount)).toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">Highest Day</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(currentData.reduce((sum, item) => sum + item.amount, 0) / currentData.length).toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">Daily Average</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Earnings Breakdown */}
            {showBreakdown && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Earnings Breakdown</h3>
                </div>

                <div className="space-y-3">
                  {Object.entries(earningsData.breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-semibold">{formatCurrency(value)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(Object.values(earningsData.breakdown).reduce((a, b) => a + b, 0))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Insights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 font-medium">Peak Hours</p>
                  <p className="text-yellow-700 text-sm">
                    {summary.peakHours.join(', ')}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 font-medium">Best Earning Day</p>
                  <p className="text-green-700 text-sm">{summary.topEarningDay}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 font-medium">Monthly Goal</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-700">Progress</span>
                      <span className="text-blue-700">{formatCurrency(summary.thisMonth)}/₹50,000</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((summary.thisMonth / 50000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Set Availability</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Set Daily Goal</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Download className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Export Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
