import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FinancialData {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalRides: number;
  completedRides: number;
  avgEarningsPerRide: number;
  pendingPayouts: number;
}

interface FinancialWidgetProps {
  userType: 'customer' | 'driver';
  className?: string;
}

const FinancialWidget: React.FC<FinancialWidgetProps> = ({ userType, className = '' }) => {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockData: FinancialData = userType === 'driver' 
        ? {
            totalEarnings: 45000,
            todayEarnings: 850,
            weeklyEarnings: 6200,
            monthlyEarnings: 22500,
            totalRides: 180,
            completedRides: 175,
            avgEarningsPerRide: 257,
            pendingPayouts: 1200
          }
        : {
            totalEarnings: 8500, // Total spent
            todayEarnings: 0,
            weeklyEarnings: 420,
            monthlyEarnings: 1800,
            totalRides: 45,
            completedRides: 42,
            avgEarningsPerRide: 189, // Avg fare paid
            pendingPayouts: 0
          };
      
      setFinancialData(mockData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTitle = () => {
    return userType === 'driver' ? 'Earnings Overview' : 'Spending Overview';
  };

  const getMainLabel = () => {
    return userType === 'driver' ? 'Total Earnings' : 'Total Spent';
  };

  const getTodayLabel = () => {
    return userType === 'driver' ? "Today's Earnings" : "Today's Spending";
  };

  const downloadStatement = () => {
    // Mock download functionality
    const element = document.createElement('a');
    const content = `Financial Statement for ${user?.name}\n\nTotal: ${formatCurrency(financialData?.totalEarnings || 0)}\nGenerated: ${new Date().toLocaleDateString()}`;
    element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    element.download = `financial_statement_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Unable to load financial data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={balanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={downloadStatement}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Download statement"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Balance */}
      <div className="p-6">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">{getMainLabel()}</p>
          <p className="text-3xl font-bold text-gray-900">
            {balanceVisible ? formatCurrency(financialData.totalEarnings) : '••••••'}
          </p>
          {userType === 'driver' && financialData.pendingPayouts > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {formatCurrency(financialData.pendingPayouts)} pending
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{getTodayLabel()}</p>
            <p className="text-lg font-semibold text-blue-600">
              {balanceVisible ? formatCurrency(financialData.todayEarnings) : '••••'}
            </p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">This Week</p>
            <p className="text-lg font-semibold text-green-600">
              {balanceVisible ? formatCurrency(financialData.weeklyEarnings) : '••••'}
            </p>
          </div>
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          <TrendingUp className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly {userType === 'driver' ? 'Earnings' : 'Spending'}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {balanceVisible ? formatCurrency(financialData.monthlyEarnings) : '••••'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Rides</span>
                <span className="text-sm font-semibold text-gray-900">{financialData.totalRides}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Rides</span>
                <span className="text-sm font-semibold text-gray-900">{financialData.completedRides}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Avg {userType === 'driver' ? 'Earnings' : 'Fare'} per Ride
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {balanceVisible ? formatCurrency(financialData.avgEarningsPerRide) : '••••'}
                </span>
              </div>

              {userType === 'driver' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Next Payout</p>
                      <p className="text-xs text-gray-500">Every Monday</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {balanceVisible ? formatCurrency(financialData.pendingPayouts) : '••••'}
                      </p>
                      <p className="text-xs text-green-600">Available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
        <div className="flex space-x-3">
          <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Calendar className="h-4 w-4" />
            <span>View History</span>
          </button>
          
          {userType === 'driver' && (
            <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Download className="h-4 w-4" />
              <span>Withdraw</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialWidget;
