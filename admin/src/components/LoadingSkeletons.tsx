import React from 'react';

// Base skeleton component with shimmer animation for admin portal
const SkeletonBase: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-dark-100 dark:via-dark-75 dark:to-dark-100 bg-[length:200%_100%] animate-shimmer rounded ${className}`}>
    {children}
  </div>
);

// Admin dashboard card skeleton
export const AdminCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 p-6 ${className}`}>
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

// Admin table row skeleton
export const AdminTableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-100 dark:border-dark-75/30">
    {Array.from({ length: 6 }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <SkeletonBase className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Admin metrics card skeleton
export const AdminMetricsSkeleton: React.FC = () => (
  <div className="bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-10 w-20" />
          <div className="flex items-center space-x-2">
            <SkeletonBase className="h-3 w-3 rounded-full" />
            <SkeletonBase className="h-3 w-16" />
          </div>
        </div>
        <SkeletonBase className="h-14 w-14 rounded-xl" />
      </div>
    </div>
  </div>
);

// Admin chart skeleton with glassmorphism
export const AdminChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-80' }) => (
  <div className="bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <SkeletonBase className="h-6 w-36" />
        <div className="flex space-x-2">
          <SkeletonBase className="h-8 w-20 rounded-lg" />
          <SkeletonBase className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className={`${height} bg-gradient-to-t from-gray-50 to-white dark:from-dark-75 dark:to-dark-50 rounded-xl flex items-end justify-center space-x-3 p-4`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBase 
            key={index} 
            className="w-8 rounded-t"
            style={{ height: `${Math.random() * 70 + 15}%` }}
          />
        ))}
      </div>
      <div className="flex justify-center space-x-6 mt-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <SkeletonBase className="h-3 w-3 rounded-full" />
            <SkeletonBase className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Admin table skeleton
export const AdminTableSkeleton: React.FC = () => (
  <div className="bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 overflow-hidden">
    <div className="p-6 border-b border-gray-100 dark:border-dark-75/30">
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-6 w-32" />
        <div className="flex space-x-2">
          <SkeletonBase className="h-10 w-32 rounded-lg" />
          <SkeletonBase className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
    <div className="overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-dark-75/30">
          <tr>
            {Array.from({ length: 6 }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <SkeletonBase className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <AdminTableRowSkeleton key={index} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Admin navigation skeleton
export const AdminNavigationSkeleton: React.FC = () => (
  <div className="bg-white/80 dark:bg-dark-100/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-dark-75/20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center space-x-8">
          <SkeletonBase className="h-8 w-40" />
          <div className="hidden md:flex items-center space-x-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBase key={index} className="h-6 w-20" />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <SkeletonBase className="h-8 w-8 rounded-lg" />
          <SkeletonBase className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// Admin sidebar skeleton
export const AdminSidebarSkeleton: React.FC = () => (
  <div className="w-64 h-screen bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl border-r border-white/20 dark:border-dark-75/20 p-4">
    <div className="animate-pulse">
      <SkeletonBase className="h-8 w-32 mb-8" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-3">
            <SkeletonBase className="h-5 w-5 rounded" />
            <SkeletonBase className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Admin page skeleton for full page loading
export const AdminPageSkeleton: React.FC<{ showSidebar?: boolean }> = ({ showSidebar = false }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-25 dark:via-dark-50/30 dark:to-dark-100/50">
    <AdminNavigationSkeleton />
    
    <div className="flex">
      {showSidebar && <AdminSidebarSkeleton />}
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <SkeletonBase className="h-10 w-64 mb-4" />
          <SkeletonBase className="h-6 w-96" />
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <AdminMetricsSkeleton key={index} />
          ))}
        </div>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <AdminChartSkeleton />
            <AdminTableSkeleton />
          </div>
          <div className="space-y-6">
            <AdminCardSkeleton className="h-40" />
            <AdminCardSkeleton className="h-32" />
            <AdminCardSkeleton className="h-36" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Quick action skeleton for admin
export const AdminQuickActionSkeleton: React.FC = () => (
  <div className="bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 p-4">
    <div className="animate-pulse">
      <div className="flex items-center space-x-3">
        <SkeletonBase className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-3 w-20" />
        </div>
      </div>
    </div>
  </div>
);

// Shimmer keyframes for admin portal
export const adminShimmerKeyframes = `
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

export default {
  AdminCardSkeleton,
  AdminTableRowSkeleton,
  AdminMetricsSkeleton,
  AdminChartSkeleton,
  AdminTableSkeleton,
  AdminNavigationSkeleton,
  AdminSidebarSkeleton,
  AdminPageSkeleton,
  AdminQuickActionSkeleton
};
