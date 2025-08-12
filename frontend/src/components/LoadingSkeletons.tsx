import React from 'react';

// Base skeleton component with shimmer animation
const SkeletonBase: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}>
    {children}
  </div>
);

// Card skeleton for dashboard cards, ride cards, etc.
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBase className="h-6 w-32" />
        <SkeletonBase className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonBase className="h-8 w-24 mb-2" />
      <SkeletonBase className="h-4 w-40" />
    </div>
  </div>
);

// Table row skeleton for admin tables, ride history, etc.
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-100">
    {Array.from({ length: 5 }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <SkeletonBase className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// List item skeleton for rides, drivers, customers lists
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
    <SkeletonBase className="h-12 w-12 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <SkeletonBase className="h-4 w-3/4" />
      <SkeletonBase className="h-3 w-1/2" />
    </div>
    <SkeletonBase className="h-6 w-16" />
  </div>
);

// Stats card skeleton for dashboard metrics
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <SkeletonBase className="h-4 w-20" />
          <SkeletonBase className="h-8 w-16" />
          <SkeletonBase className="h-3 w-24" />
        </div>
        <SkeletonBase className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  </div>
);

// Chart skeleton for analytics
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <SkeletonBase className="h-6 w-32" />
        <SkeletonBase className="h-8 w-20" />
      </div>
      <div className={`${height} bg-gradient-to-t from-gray-100 to-gray-50 rounded-xl flex items-end justify-center space-x-2 p-4`}>
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBase 
            key={index} 
            className="w-8 rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// Map skeleton for booking and tracking pages
export const MapSkeleton: React.FC<{ height?: string }> = ({ height = 'h-96' }) => (
  <div className={`bg-gray-100 rounded-2xl ${height} flex items-center justify-center relative overflow-hidden`}>
    <div className="animate-pulse absolute inset-0">
      <div className="h-full w-full bg-gradient-to-br from-blue-100 via-green-100 to-blue-100 relative">
        {/* Simulated map elements */}
        <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md">
          <SkeletonBase className="h-4 w-24" />
        </div>
        <div className="absolute bottom-4 right-4 bg-white rounded-lg p-2 shadow-md">
          <SkeletonBase className="h-4 w-16" />
        </div>
        {/* Simulated route line */}
        <div className="absolute top-1/4 left-1/4 w-1/2 h-0.5 bg-blue-300 transform rotate-12"></div>
      </div>
    </div>
    <div className="text-center z-10">
      <SkeletonBase className="h-6 w-32 mx-auto mb-2" />
      <SkeletonBase className="h-4 w-24 mx-auto" />
    </div>
  </div>
);

// Profile skeleton for user profiles
export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <SkeletonBase className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <SkeletonBase className="h-6 w-32" />
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-4 w-20" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex justify-between">
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Form skeleton for booking forms, settings, etc.
export const FormSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
    <div className="animate-pulse space-y-6">
      <SkeletonBase className="h-8 w-48" />
      
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
        </div>
      ))}
      
      <div className="flex space-x-4 pt-4">
        <SkeletonBase className="h-12 w-32 rounded-xl" />
        <SkeletonBase className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  </div>
);

// Navigation skeleton
export const NavigationSkeleton: React.FC = () => (
  <div className="bg-white shadow-lg border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <SkeletonBase className="h-8 w-32" />
        </div>
        <div className="hidden md:flex items-center space-x-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBase key={index} className="h-6 w-20" />
          ))}
          <SkeletonBase className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// Page skeleton for full page loading
export const PageSkeleton: React.FC<{ showNavigation?: boolean }> = ({ showNavigation = true }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
    {showNavigation && <NavigationSkeleton />}
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <SkeletonBase className="h-10 w-64 mb-4" />
        <SkeletonBase className="h-6 w-96" />
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton className="h-32" />
          <ChartSkeleton />
        </div>
        <div className="space-y-6">
          <StatsCardSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    </div>
  </div>
);

// Shimmer keyframes for CSS-in-JS or can be added to global CSS
export const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
`;
