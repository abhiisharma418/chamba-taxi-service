import { apiFetch } from '../lib/api';

export interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_ride';
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  validUntil: string;
  isFirstRideOnly: boolean;
  discount?: DiscountCalculation;
}

export interface DiscountCalculation {
  valid: boolean;
  discount: number;
  finalAmount: number;
  originalAmount: number;
  savings: number;
  reason?: string;
}

export interface CreatePromoCodeData {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_ride';
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  validFrom: string;
  validUntil: string;
  totalUsageLimit?: number;
  usagePerUserLimit?: number;
  applicableUserTypes?: string[];
  applicableCities?: string[];
  applicableVehicleTypes?: string[];
  isFirstRideOnly?: boolean;
  isReferralCode?: boolean;
  campaignName?: string;
  campaignType?: string;
  isVisible?: boolean;
}

export interface PromoCodeAnalytics {
  overview: {
    totalPromoCodes: number;
    activePromoCodes: number;
    totalUsage: number;
    totalDiscountGiven: number;
  };
  topPromoCodes: {
    code: string;
    name: string;
    analytics: {
      totalUsage: number;
      totalDiscountGiven: number;
    };
  }[];
  usageByType: {
    _id: string;
    count: number;
    usage: number;
  }[];
  usageByDay: {
    _id: string;
    usage: number;
    discount: number;
  }[];
}

class PromoCodeService {
  // Get available promo codes for user
  async getAvailablePromoCodes(params: {
    orderAmount?: number;
    vehicleType?: string;
    city?: string;
  } = {}): Promise<{
    success: boolean;
    data?: {
      promoCodes: PromoCode[];
      userType: string;
      isFirstRide: boolean;
    };
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });

      const response = await api.get(`/promo-codes/available?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available promo codes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch available promo codes'
      };
    }
  }

  // Validate promo code
  async validatePromoCode(data: {
    code: string;
    orderAmount: number;
    vehicleType?: string;
    city?: string;
  }): Promise<{
    success: boolean;
    data?: {
      promoCode: PromoCode;
      discount: DiscountCalculation;
    };
    message?: string;
  }> {
    try {
      const response = await api.post('/promo-codes/validate', data);
      return response.data;
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to validate promo code'
      };
    }
  }

  // Apply promo code to ride
  async applyPromoCode(data: {
    rideId: string;
    promoCodeId: string;
  }): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const response = await api.post('/promo-codes/apply', data);
      return response.data;
    } catch (error: any) {
      console.error('Error applying promo code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to apply promo code'
      };
    }
  }

  // Admin methods
  async createPromoCode(data: CreatePromoCodeData): Promise<{
    success: boolean;
    data?: PromoCode;
    message?: string;
  }> {
    try {
      const response = await api.post('/promo-codes/admin/create', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create promo code'
      };
    }
  }

  async getAllPromoCodes(params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    campaignType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    success: boolean;
    data?: {
      promoCodes: PromoCode[];
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

      const response = await api.get(`/promo-codes/admin/all?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch promo codes'
      };
    }
  }

  async getPromoCodeById(id: string): Promise<{
    success: boolean;
    data?: PromoCode;
    message?: string;
  }> {
    try {
      const response = await api.get(`/promo-codes/admin/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching promo code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch promo code'
      };
    }
  }

  async updatePromoCode(id: string, data: Partial<CreatePromoCodeData>): Promise<{
    success: boolean;
    data?: PromoCode;
    message?: string;
  }> {
    try {
      const response = await api.put(`/promo-codes/admin/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update promo code'
      };
    }
  }

  async deletePromoCode(id: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await api.delete(`/promo-codes/admin/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete promo code'
      };
    }
  }

  async getPromoCodeAnalytics(period: '7d' | '30d' | '90d' = '30d', campaignType?: string): Promise<{
    success: boolean;
    data?: PromoCodeAnalytics;
    message?: string;
  }> {
    try {
      const params = new URLSearchParams({ period });
      if (campaignType) params.append('campaignType', campaignType);

      const response = await api.get(`/promo-codes/admin/analytics/overview?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching promo code analytics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch analytics'
      };
    }
  }

  async bulkUpdatePromoCodes(data: {
    promoCodeIds: string[];
    action: 'activate' | 'deactivate' | 'delete' | 'update';
    data?: any;
  }): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const response = await api.post('/promo-codes/admin/bulk-update', data);
      return response.data;
    } catch (error: any) {
      console.error('Error in bulk operation:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to perform bulk operation'
      };
    }
  }

  // Helper methods
  formatDiscount(promoCode: PromoCode): string {
    if (promoCode.type === 'percentage') {
      return `${promoCode.value}% OFF${promoCode.maxDiscountAmount ? ` (up to ₹${promoCode.maxDiscountAmount})` : ''}`;
    } else if (promoCode.type === 'fixed_amount') {
      return `₹${promoCode.value} OFF`;
    } else if (promoCode.type === 'free_ride') {
      return 'FREE RIDE';
    }
    return 'DISCOUNT';
  }

  getPromoCodeColor(type: string): string {
    const colors = {
      percentage: 'from-blue-500 to-blue-600',
      fixed_amount: 'from-green-500 to-green-600',
      free_ride: 'from-purple-500 to-purple-600'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-gray-600';
  }

  isPromoCodeExpiringSoon(validUntil: string, days: number = 3): boolean {
    const expiryDate = new Date(validUntil);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expiryDate <= warningDate;
  }
}

export const promoCodeService = new PromoCodeService();
