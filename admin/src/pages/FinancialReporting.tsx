import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Calendar, TrendingUp, DollarSign, Users, Clock, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';

interface DashboardData {
  totalRevenue: number;
  totalCommission: number;
  totalDriverEarnings: number;
  totalRides: number;
  avgFare: number;
  chartData: { date: string; revenue: number }[];
}

interface FinancialReport {
  reportId: string;
  reportType: string;
  status: 'generating' | 'completed' | 'failed';
  period: { startDate: string; endDate: string };
  createdAt: string;
  downloadUrls?: { pdf?: string; excel?: string; csv?: string };
}

const FinancialReporting: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Generate report form state
  const [reportForm, setReportForm] = useState({
    reportType: 'monthly_summary',
    startDate: '',
    endDate: '',
    exportFormats: ['pdf', 'excel'] as string[]
  });

  const reportTypes = [
    { value: 'daily_summary', label: 'Daily Summary' },
    { value: 'weekly_summary', label: 'Weekly Summary' },
    { value: 'monthly_summary', label: 'Monthly Summary' },
    { value: 'quarterly_summary', label: 'Quarterly Summary' },
    { value: 'driver_earnings', label: 'Driver Earnings Report' },
    { value: 'commission_report', label: 'Commission Report' },
    { value: 'payment_breakdown', label: 'Payment Breakdown' },
    { value: 'custom_range', label: 'Custom Date Range' }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    loadDashboardData();
    loadReports();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual service
      const mockData: DashboardData = {
        totalRevenue: 125000,
        totalCommission: 31250,
        totalDriverEarnings: 93750,
        totalRides: 450,
        avgFare: 278,
        chartData: generateMockChartData(selectedPeriod)
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
  };

  const loadReports = async () => {
    try {
      // Mock API call - replace with actual service
      const mockReports: FinancialReport[] = [
        {
          reportId: 'FIN-20241201-0001',
          reportType: 'monthly_summary',
          status: 'completed',
          period: { startDate: '2024-11-01', endDate: '2024-11-30' },
          createdAt: '2024-12-01T10:00:00Z',
          downloadUrls: { pdf: '/api/reports/download/pdf', excel: '/api/reports/download/excel' }
        },
        {
          reportId: 'FIN-20241201-0002',
          reportType: 'driver_earnings',
          status: 'generating',
          period: { startDate: '2024-11-15', endDate: '2024-11-30' },
          createdAt: '2024-12-01T11:00:00Z'
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const generateMockChartData = (period: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 2000
      });
    }
    
    return data;
  };

  const handleGenerateReport = async () => {
    if (!reportForm.startDate || !reportForm.endDate) {
      alert('Please select start and end dates');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Mock API call - replace with actual service
      console.log('Generating report:', reportForm);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowGenerateModal(false);
      setReportForm({
        reportType: 'monthly_summary',
        startDate: '',
        endDate: '',
        exportFormats: ['pdf', 'excel']
      });
      
      // Reload reports
      await loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
    }
    setIsGeneratingReport(false);
  };

  const handleDownload = async (reportId: string, format: string) => {
    try {
      // Mock download - replace with actual service
      console.log(`Downloading ${reportId} in ${format} format`);
      
      // Create mock download
      const element = document.createElement('a');
      element.href = `data:text/plain;charset=utf-8,Mock ${format.toUpperCase()} Report for ${reportId}`;
      element.download = `financial_report_${reportId}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'text-green-600 bg-green-50 border-green-200',
      generating: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      failed: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Payment method data for pie chart
  const paymentData = [
    { name: 'UPI', value: 45, amount: 56250 },
    { name: 'Cash', value: 30, amount: 37500 },
    { name: 'Card', value: 20, amount: 25000 },
    { name: 'Wallet', value: 5, amount: 6250 }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reporting</h1>
            <p className="text-gray-600">Generate and manage financial reports</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalCommission)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Driver Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalDriverEarnings)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rides</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalRides.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value}% (${formatCurrency(props.payload.amount)})`,
                  name
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No reports generated yet
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.reportId} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {report.reportId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {report.reportType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {report.status === 'completed' && report.downloadUrls ? (
                          <div className="flex space-x-2">
                            {report.downloadUrls.pdf && (
                              <button
                                onClick={() => handleDownload(report.reportId, 'pdf')}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {report.downloadUrls.excel && (
                              <button
                                onClick={() => handleDownload(report.reportId, 'excel')}
                                className="text-green-600 hover:text-green-800 transition-colors"
                                title="Download Excel"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ) : report.status === 'generating' ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Generate Financial Report</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={reportForm.reportType}
                    onChange={(e) => setReportForm(prev => ({ ...prev, reportType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={reportForm.startDate}
                      onChange={(e) => setReportForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={reportForm.endDate}
                      onChange={(e) => setReportForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Export Formats</label>
                  <div className="flex space-x-4">
                    {['pdf', 'excel', 'csv'].map(format => (
                      <label key={format} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reportForm.exportFormats.includes(format)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportForm(prev => ({
                                ...prev,
                                exportFormats: [...prev.exportFormats, format]
                              }));
                            } else {
                              setReportForm(prev => ({
                                ...prev,
                                exportFormats: prev.exportFormats.filter(f => f !== format)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 capitalize">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t flex space-x-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FinancialReporting;
