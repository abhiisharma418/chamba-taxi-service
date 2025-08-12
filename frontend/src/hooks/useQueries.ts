import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RidesAPI, DriverAPI, AdminAPI, TrackingAPI } from '../lib/api';
import { queryKeys, optimisticUpdates } from '../lib/queryClient';

// Ride-related hooks
export const useRides = () => {
  return useQuery({
    queryKey: queryKeys.rides,
    queryFn: RidesAPI.history,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRide = (rideId: string) => {
  return useQuery({
    queryKey: queryKeys.ride(rideId),
    queryFn: () => RidesAPI.get(rideId),
    enabled: !!rideId,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
};

export const useRideEstimate = (pickup: any, destination: any, vehicleType: string) => {
  return useQuery({
    queryKey: queryKeys.rideEstimate(pickup, destination, vehicleType),
    queryFn: () => RidesAPI.estimate({ pickup, destination, vehicleType, regionType: 'city' }),
    enabled: !!(pickup?.address && destination?.address && vehicleType),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: RidesAPI.create,
    onMutate: async (newRide) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.rides });
      
      // Snapshot previous value
      const previousRides = queryClient.getQueryData(queryKeys.rides);
      
      // Optimistically update
      optimisticUpdates.addRide({ ...newRide, id: Date.now().toString(), status: 'requested' });
      
      return { previousRides };
    },
    onError: (err, newRide, context) => {
      // Rollback on error
      if (context?.previousRides) {
        queryClient.setQueryData(queryKeys.rides, context.previousRides);
      }
    },
    onSettled: () => {
      // Refetch rides
      queryClient.invalidateQueries({ queryKey: queryKeys.rides });
    },
  });
};

export const useUpdateRideStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ rideId, status }: { rideId: string; status: string }) =>
      RidesAPI.updateStatus(rideId, status),
    onMutate: async ({ rideId, status }) => {
      // Optimistic update
      optimisticUpdates.updateRideStatus(rideId, status);
    },
    onSettled: (data, error, { rideId }) => {
      // Refetch the specific ride and rides list
      queryClient.invalidateQueries({ queryKey: queryKeys.ride(rideId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rides });
    },
  });
};

// Driver earnings hooks
export const useDriverEarnings = (period?: 'daily' | 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.driverEarnings(period),
    queryFn: () => DriverAPI.getEarnings(period),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useDriverEarningsBreakdown = () => {
  return useQuery({
    queryKey: queryKeys.driverEarningsBreakdown(),
    queryFn: DriverAPI.getEarningsBreakdown,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDriverEarningsHistory = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: queryKeys.driverEarningsHistory(page, limit),
    queryFn: () => DriverAPI.getEarningsHistory(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

// Admin hooks
export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.adminStats(),
    queryFn: AdminAPI.getStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
};

export const useAdminRides = () => {
  return useQuery({
    queryKey: queryKeys.adminRides(),
    queryFn: AdminAPI.getRides,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useAdminDrivers = () => {
  return useQuery({
    queryKey: queryKeys.adminDrivers(),
    queryFn: AdminAPI.getDrivers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAdminCustomers = () => {
  return useQuery({
    queryKey: queryKeys.adminCustomers(),
    queryFn: AdminAPI.getCustomers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateDriverStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ driverId, action }: { driverId: string; action: 'approve' | 'suspend' }) => {
      return action === 'approve' 
        ? AdminAPI.approveDriver(driverId)
        : AdminAPI.suspendDriver(driverId);
    },
    onSuccess: () => {
      // Invalidate drivers list
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDrivers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats() });
    },
  });
};

// Tracking hooks
export const useTrackingStatus = (rideId: string) => {
  return useQuery({
    queryKey: queryKeys.trackingStatus(rideId),
    queryFn: () => TrackingAPI.getTrackingStatus(rideId),
    enabled: !!rideId,
    refetchInterval: 5000, // Refetch every 5 seconds for live tracking
    staleTime: 0, // Always consider stale for real-time data
  });
};

export const useTrackingHistory = (rideId: string) => {
  return useQuery({
    queryKey: queryKeys.trackingHistory(rideId),
    queryFn: () => TrackingAPI.getLocationHistory(rideId),
    enabled: !!rideId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useTriggerEmergency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: TrackingAPI.triggerEmergency,
    onSuccess: (data, variables) => {
      // Invalidate tracking status
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.trackingStatus(variables.rideId) 
      });
    },
  });
};

// Prefetch hooks for performance
export const usePrefetchRideHistory = () => {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.rideHistory(userId),
      queryFn: RidesAPI.history,
      staleTime: 2 * 60 * 1000,
    });
  };
};

export const usePrefetchDriverEarnings = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.driverEarnings(),
      queryFn: () => DriverAPI.getEarnings(),
      staleTime: 60 * 1000,
    });
  };
};

// Background sync hook
export const useBackgroundSync = () => {
  const queryClient = useQueryClient();
  
  const syncAll = () => {
    queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  };
  
  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };
  
  return { syncAll, invalidateAll };
};

// Real-time updates hook
export const useRealTimeUpdates = (enabled: boolean = true) => {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (!enabled) return;
    
    // Set up intervals for real-time data
    const intervals = [
      // Refresh rides every 30 seconds
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rides });
      }, 30000),
      
      // Refresh admin stats every minute
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminStats() });
      }, 60000),
    ];
    
    return () => {
      intervals.forEach(clearInterval);
    };
  }, [enabled, queryClient]);
};
