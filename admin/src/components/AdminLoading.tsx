import React from 'react';
import { AdminPageSkeleton, AdminCardSkeleton, AdminMetricsSkeleton, AdminChartSkeleton } from './LoadingSkeletons';

// Main loading component for admin routes
export const AdminRouteLoading: React.FC = () => (
  <AdminPageSkeleton />
);

// Loading component for admin dashboard sections
export const DashboardLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Metrics Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <AdminMetricsSkeleton key={index} />
      ))}
    </div>
    
    {/* Chart and Tables Row */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2">
        <AdminChartSkeleton />
      </div>
      <div className="space-y-4">
        <AdminCardSkeleton className="h-48" />
        <AdminCardSkeleton className="h-32" />
      </div>
    </div>
  </div>
);

// Loading component for management pages
export const ManagementLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-dark-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-dark-200 rounded"></div>
      </div>
    </div>
    
    {/* Content skeleton */}
    <AdminChartSkeleton height="h-96" />
  </div>
);

// Inline loading spinner for buttons and small areas
export const AdminInlineLoader: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Loading overlay for modal content
export const AdminModalLoading: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <AdminInlineLoader size="lg" className="mb-4 mx-auto" />
      <p className="text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

// Card loading for individual sections
export const AdminCardLoading: React.FC<{ className?: string }> = ({ className = '' }) => (
  <AdminCardSkeleton className={className} />
);

// Button loading state
export const AdminButtonLoading: React.FC<{ children: React.ReactNode; loading?: boolean }> = ({ 
  children, 
  loading = false 
}) => (
  <>
    {loading && <AdminInlineLoader size="sm" className="mr-2" />}
    {children}
  </>
);

export default {
  AdminRouteLoading,
  DashboardLoading,
  ManagementLoading,
  AdminInlineLoader,
  AdminModalLoading,
  AdminCardLoading,
  AdminButtonLoading
};
