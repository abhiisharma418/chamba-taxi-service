import React, { Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { AdminPageSkeleton } from './components/LoadingSkeletons';
import { AdminRouter } from './components/AdminRouter';
import { useCodeSplitting, usePerformanceMonitoring } from './hooks/useCodeSplitting';
import { useRoutePreloading } from './utils/routeManifest';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load login page
const Login = React.lazy(() => import('./pages/Login'));

const AppRoutes: React.FC = () => {
  useCodeSplitting();
  usePerformanceMonitoring();
  useRoutePreloading();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-25 dark:via-dark-50/30 dark:to-dark-100/50 transition-colors duration-200">
      <ErrorBoundary>
        <AdminRouter />
      </ErrorBoundary>
    </div>
  );
};

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-dark-25 dark:via-dark-50 dark:to-dark-100 flex items-center justify-center transition-colors duration-200">
        <div className="text-center bg-white/70 dark:bg-dark-100/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-dark-75/20 p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-300 text-lg">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<AdminPageSkeleton showSidebar={false} />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

export default App;
