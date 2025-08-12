import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Show loading state for at least 200ms to prevent flashing
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Show optimistic updates for better UX
      onError: (error, variables, context) => {
        console.error('Mutation failed:', error);
      },
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Auth
  user: ['user'] as const,
  
  // Rides
  rides: ['rides'] as const,
  ride: (id: string) => ['rides', id] as const,
  rideHistory: (userId: string) => ['rides', 'history', userId] as const,
  rideEstimate: (pickup: any, destination: any, vehicleType: string) => 
    ['rides', 'estimate', pickup, destination, vehicleType] as const,
  
  // Driver
  driverEarnings: (period?: string) => ['driver', 'earnings', period] as const,
  driverEarningsBreakdown: () => ['driver', 'earnings', 'breakdown'] as const,
  driverEarningsHistory: (page: number, limit: number) => 
    ['driver', 'earnings', 'history', page, limit] as const,
  
  // Admin
  adminStats: () => ['admin', 'stats'] as const,
  adminRides: () => ['admin', 'rides'] as const,
  adminDrivers: () => ['admin', 'drivers'] as const,
  adminCustomers: () => ['admin', 'customers'] as const,
  adminPricing: () => ['admin', 'pricing'] as const,
  
  // Tracking
  trackingStatus: (rideId: string) => ['tracking', 'status', rideId] as const,
  trackingHistory: (rideId: string) => ['tracking', 'history', rideId] as const,
  
  // Live data
  liveDrivers: () => ['live', 'drivers'] as const,
  liveRides: () => ['live', 'rides'] as const,
  
  // Notifications
  notifications: (userId: string) => ['notifications', userId] as const,
} as const;

// Error handler for queries
export const handleQueryError = (error: any) => {
  console.error('Query error:', error);
  
  // Show user-friendly error messages
  if (error?.response?.status === 401) {
    // Handle unauthorized - redirect to login
    window.location.href = '/login';
  } else if (error?.response?.status >= 500) {
    // Server error - show generic message
    console.error('Server error occurred');
  }
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Update ride status optimistically
  updateRideStatus: (rideId: string, newStatus: string) => {
    queryClient.setQueryData(queryKeys.ride(rideId), (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, status: newStatus };
    });
  },
  
  // Add new ride optimistically
  addRide: (newRide: any) => {
    queryClient.setQueryData(queryKeys.rides, (oldData: any) => {
      if (!oldData) return [newRide];
      return [newRide, ...oldData];
    });
  },
  
  // Update user data optimistically
  updateUser: (updates: any) => {
    queryClient.setQueryData(queryKeys.user, (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updates };
    });
  },
};

// Prefetch utilities
export const prefetchQueries = {
  // Prefetch ride history when user logs in
  rideHistory: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.rideHistory(userId),
      queryFn: () => import('../lib/api').then(api => api.RidesAPI.history()),
      staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    });
  },
  
  // Prefetch driver earnings when accessing dashboard
  driverEarnings: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.driverEarnings(),
      queryFn: () => import('../lib/api').then(api => api.DriverAPI.getEarnings()),
      staleTime: 60 * 1000, // Consider fresh for 1 minute
    });
  },
  
  // Prefetch admin stats
  adminStats: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.adminStats(),
      queryFn: () => import('../lib/api').then(api => api.AdminAPI.getStats()),
      staleTime: 30 * 1000, // Consider fresh for 30 seconds
    });
  },
};

// Background sync utilities
export const backgroundSync = {
  // Sync data when app comes back online
  syncOnReconnect: () => {
    queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  },
  
  // Invalidate and refetch critical data
  invalidateCriticalData: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rides });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminStats() });
    queryClient.invalidateQueries({ queryKey: queryKeys.liveRides() });
  },
};

export default queryClient;
