import { apiFetch } from '../lib/api';

export interface FinancialDashboardData {
  totalRevenue: number;
  totalCommission: number;
  totalDriverEarnings: number;
  totalRides: number;
  avgFare: number;
  chartData: {
    date: string;
    revenue: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface FinancialReport {
  reportId: string;
  reportType: string;
  status: 'generating' | 'completed' | 'failed' | 'expired';
  period: {
    startDate: string;
    endDate: string;
  };
  generatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  downloadUrls?: {
    pdf?: string;
    excel?: string;
    csv?: string;
  };
}

export interface ReportData {
  totalRevenue: number;
  totalCommission: number;
  totalDriverEarnings: number;
  totalRides: number;
  totalRefunds: number;
  paymentBreakdown: {
    cash: { amount: number; count: number };
    card: { amount: number; count: number };
    wallet: { amount: number; count: number };
    upi: { amount: number; count: number };
  };
  vehicleTypeBreakdown: {
    vehicleType: string;
    revenue: number;
    rideCount: number;
    commission: number;
  }[];
  timeSeriesData: {
    date: string;
    revenue: number;
    rideCount: number;
    commission: number;
    driverEarnings: number;
  }[];
  topDrivers: {
    driverId: string;
    driverName: string;
    totalEarnings: number;
    totalRides: number;
    rating: number;
  }[];
  taxBreakdown: {
    gst: { rate: number; amount: number };
    serviceTax: { rate: number; amount: number };
    totalTaxCollected: number;
  };
}

export interface GenerateReportRequest {
  reportType: string;
  startDate: string;
  endDate: string;
  includeCharts?: boolean;
  includeDetailedBreakdown?: boolean;
  exportFormats?: ('pdf' | 'excel' | 'csv')[];
}

export interface ReportStatusResponse {
  reportId: string;
  status: string;
  progress: number;
  data?: ReportData;
  downloadUrls?: {
    pdf?: string;
    excel?: string;
    csv?: string;
  };
  createdAt: string;
  processingInfo?: {
    startTime: string;
    endTime?: string;
    processingDuration?: number;
    recordsProcessed?: number;
    errors?: string[];
  };
}

class FinancialService {
  // Get financial dashboard data
  async getDashboardData(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    success: boolean;
    data?: FinancialDashboardData;
    message?: string;
  }> {
    try {
      const response = await api.get(`/financial/dashboard?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch dashboard data'
      };
    }
  }

  // Generate a new financial report
  async generateReport(reportData: GenerateReportRequest): Promise<{
    success: boolean;
    data?: { reportId: string; status: string };
    message?: string;
  }> {
    try {
      const response = await api.post('/financial/reports/generate', reportData);
      return response.data;
    } catch (error: any) {
      console.error('Error generating report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate report'
      };
    }
  }

  // Get report status
  async getReportStatus(reportId: string): Promise<{
    success: boolean;
    data?: ReportStatusResponse;
    message?: string;
  }> {
    try {
      const response = await api.get(`/financial/reports/${reportId}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching report status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report status'
      };
    }
  }

  // List all reports
  async listReports(params: {
    page?: number;
    limit?: number;
    status?: string;
    reportType?: string;
  } = {}): Promise<{
    success: boolean;
    data?: {
      reports: FinancialReport[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await api.get(`/financial/reports?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch reports'
      };
    }
  }

  // Download report file
  async downloadReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<void> {
    try {
      const response = await api.get(`/financial/reports/${reportId}/download/${format}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `financial_report_${reportId}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading report:', error);
      throw new Error(error.response?.data?.message || 'Failed to download report');
    }
  }

  // Poll report status until completion
  async pollReportStatus(reportId: string, onProgress?: (status: ReportStatusResponse) => void): Promise<ReportStatusResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await this.getReportStatus(reportId);
          
          if (!response.success || !response.data) {
            reject(new Error(response.message || 'Failed to get report status'));
            return;
          }

          const status = response.data;
          
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error('Report generation failed'));
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Get quick financial metrics
  async getQuickMetrics(): Promise<{
    success: boolean;
    data?: {
      todayRevenue: number;
      monthlyRevenue: number;
      totalRevenue: number;
      activeDrivers: number;
      completedRides: number;
      avgRating: number;
    };
    message?: string;
  }> {
    try {
      // This would typically be a separate endpoint, but for now use dashboard data
      const response = await this.getDashboardData('30d');
      
      if (!response.success || !response.data) {
        return response;
      }

      // Calculate metrics from dashboard data
      const data = response.data;
      const todayRevenue = data.chartData.length > 0 ? data.chartData[data.chartData.length - 1].revenue : 0;
      
      return {
        success: true,
        data: {
          todayRevenue,
          monthlyRevenue: data.totalRevenue,
          totalRevenue: data.totalRevenue,
          activeDrivers: 0, // Would need separate endpoint
          completedRides: data.totalRides,
          avgRating: 4.8 // Would need separate endpoint
        }
      };
    } catch (error: any) {
      console.error('Error fetching quick metrics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch metrics'
      };
    }
  }
}

export const financialService = new FinancialService();
