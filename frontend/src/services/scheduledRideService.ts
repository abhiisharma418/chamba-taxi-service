import { apiFetch } from '../lib/api';

export interface Location {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
}

export interface FareEstimate {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalEstimate: number;
  distance: number;
  duration: number;
  surgeFactor: number;
  currency: string;
}

export interface Recurrence {
  type: 'none' | 'daily' | 'weekly' | 'monthly';
  endDate?: string;
  daysOfWeek?: number[];
  frequency?: number;
}

export interface SpecialRequest {
  type: 'child_seat' | 'wheelchair_accessible' | 'pet_friendly' | 'extra_luggage' | 'quiet_ride' | 'music_preference';
  description?: string;
  fulfilled?: boolean;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'wallet' | 'cod';
  cardId?: string;
}

export interface ScheduledRideRequest {
  vehicleType: 'car' | 'bike' | 'premium' | 'xl';
  pickupLocation: Location;
  destinationLocation: Location;
  scheduledDateTime: string;
  recurrence?: Recurrence;
  paymentMethod: PaymentMethod;
  promoCode?: {
    code: string;
    discountAmount?: number;
    discountType?: 'percentage' | 'fixed';
  };
  specialRequests?: SpecialRequest[];
  passengerCount?: number;
  customerNotes?: string;
  priority?: 'normal' | 'high' | 'urgent';
  autoAssignment?: {
    enabled: boolean;
    preferredDrivers?: string[];
    exclusions?: string[];
  };
}

export interface ScheduledRide {
  _id: string;
  rideId: string;
  customerId: string;
  driverId?: {
    _id: string;
    name: string;
    phoneNumber: string;
    rating: number;
    profilePicture?: string;
  };
  vehicleType: 'car' | 'bike' | 'premium' | 'xl';
  pickupLocation: Location;
  destinationLocation: Location;
  scheduledDateTime: string;
  recurrence: Recurrence;
  fareEstimate: FareEstimate;
  paymentMethod: PaymentMethod;
  promoCode?: {
    code: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
  };
  status: 'scheduled' | 'confirmed' | 'driver_assigned' | 'started' | 'completed' | 'cancelled' | 'failed';
  priority: 'normal' | 'high' | 'urgent';
  notifications: {
    reminderSent: boolean;
    confirmationSent: boolean;
    driverAssignedNotified: boolean;
    reminderTime?: string;
  };
  specialRequests: SpecialRequest[];
  passengerCount: number;
  actualRideId?: string;
  executionAttempts: Array<{
    attemptTime: string;
    status: 'pending' | 'driver_assigned' | 'failed' | 'completed';
    failureReason?: string;
    driverId?: string;
  }>;
  customerNotes?: string;
  adminNotes?: string;
  cancellationPolicy: {
    freeUntil?: string;
    cancellationFee: number;
  };
  estimatedDistance: number;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
  // Additional computed properties from backend
  nextExecutions?: string[];
  canCancel?: boolean;
  cancellationFee?: number;
  isExecutionTime?: boolean;
}

export interface ScheduledRideStats {
  total: number;
  totalRevenue: number;
  avgFare: number;
  byStatus: Record<string, number>;
  byVehicleType: Record<string, number>;
  byPriority: Record<string, number>;
  timeframe: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface DriverSchedule {
  schedule: ScheduledRide[];
  period: {
    startDate: string;
    endDate: string;
  };
  totalRides: number;
}

class ScheduledRideService {
  async createScheduledRide(rideData: ScheduledRideRequest) {
    try {
      const response = await api.post('/scheduled-rides', rideData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to schedule ride');
    }
  }

  async getScheduledRides(params?: {
    status?: string;
    page?: number;
    limit?: number;
    upcoming?: boolean;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.upcoming !== undefined) queryParams.append('upcoming', params.upcoming.toString());

      const response = await api.get(`/scheduled-rides?${queryParams}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch scheduled rides');
    }
  }

  async getScheduledRide(rideId: string): Promise<{ success: boolean; data: ScheduledRide }> {
    try {
      const response = await api.get(`/scheduled-rides/${rideId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch scheduled ride');
    }
  }

  async updateScheduledRide(rideId: string, updates: Partial<ScheduledRideRequest>) {
    try {
      const response = await api.put(`/scheduled-rides/${rideId}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update scheduled ride');
    }
  }

  async cancelScheduledRide(rideId: string, reason?: string) {
    try {
      const response = await api.delete(`/scheduled-rides/${rideId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel scheduled ride');
    }
  }

  async assignDriver(rideId: string, driverId: string) {
    try {
      const response = await api.patch(`/scheduled-rides/${rideId}/assign`, {
        driverId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assign driver');
    }
  }

  async executeScheduledRide(rideId: string) {
    try {
      const response = await api.post(`/scheduled-rides/${rideId}/execute`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to execute scheduled ride');
    }
  }

  async getDriverSchedule(params?: {
    date?: string;
    week?: string;
    month?: string;
  }): Promise<{ success: boolean; data: DriverSchedule }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.week) queryParams.append('week', params.week);
      if (params?.month) queryParams.append('month', params.month);

      const response = await api.get(`/scheduled-rides/driver/schedule?${queryParams}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch driver schedule');
    }
  }

  async getPendingScheduledRides(params?: {
    page?: number;
    limit?: number;
    priority?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.priority) queryParams.append('priority', params.priority);

      const response = await api.get(`/scheduled-rides/admin/pending?${queryParams}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pending scheduled rides');
    }
  }

  async getScheduledRideStats(timeframe: 'today' | 'week' | 'month' | 'quarter' = 'week'): Promise<{ success: boolean; data: ScheduledRideStats }> {
    try {
      const response = await api.get(`/scheduled-rides/admin/stats?timeframe=${timeframe}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch scheduled ride statistics');
    }
  }

  // Helper methods
  isValidScheduleTime(dateTime: Date): boolean {
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    return dateTime >= minScheduleTime;
  }

  calculateMinScheduleTime(): Date {
    return new Date(Date.now() + 30 * 60 * 1000);
  }

  formatScheduleTime(dateTime: string | Date): string {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeUntilScheduled(scheduledDateTime: string): string {
    const now = new Date();
    const scheduled = new Date(scheduledDateTime);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return 'Past due';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getRecurrenceText(recurrence: Recurrence): string {
    if (recurrence.type === 'none') return 'One-time';
    
    const frequency = recurrence.frequency || 1;
    const frequencyText = frequency === 1 ? '' : `Every ${frequency} `;
    
    switch (recurrence.type) {
      case 'daily':
        return `${frequencyText}day(s)`;
      case 'weekly':
        return `${frequencyText}week(s)`;
      case 'monthly':
        return `${frequencyText}month(s)`;
      default:
        return 'One-time';
    }
  }

  getPriorityColor(priority: 'normal' | 'high' | 'urgent'): string {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'normal':
      default:
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    }
  }

  getStatusColor(status: ScheduledRide['status']): string {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'confirmed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'driver_assigned':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'started':
        return 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30';
      case 'completed':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'failed':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  }

  getVehicleTypeIcon(vehicleType: 'car' | 'bike' | 'premium' | 'xl'): string {
    switch (vehicleType) {
      case 'car':
        return '🚗';
      case 'bike':
        return '🏍️';
      case 'premium':
        return '🚙';
      case 'xl':
        return '🚐';
      default:
        return '🚗';
    }
  }

  canCancelRide(ride: ScheduledRide): boolean {
    const now = new Date();
    const scheduled = new Date(ride.scheduledDateTime);
    return ride.status === 'scheduled' || ride.status === 'confirmed';
  }

  getCancellationFeeAmount(ride: ScheduledRide): number {
    if (!ride.cancellationPolicy?.freeUntil) return 0;
    
    const now = new Date();
    const freeUntil = new Date(ride.cancellationPolicy.freeUntil);
    
    if (now < freeUntil) return 0;
    
    return ride.cancellationPolicy.cancellationFee || ride.fareEstimate.totalEstimate * 0.1;
  }
}

export const scheduledRideService = new ScheduledRideService();
