import React from 'react';

// Performance monitoring utilities for admin portal
interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  bundleSize?: number;
  route?: string;
}

class AdminPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.trackPageLoad(entry as PerformanceNavigationTiming);
          } else if (entry.entryType === 'longtask') {
            this.trackLongTask(entry);
          }
        });
      });

      this.observer.observe({ entryTypes: ['navigation', 'longtask'] });
    } catch (error) {
      console.debug('Error setting up admin performance monitoring:', error);
    }
  }

  trackComponentLoad(componentName: string, startTime: number, route?: string) {
    const loadTime = performance.now() - startTime;
    
    const metric: PerformanceMetrics = {
      componentName,
      loadTime,
      route
    };

    this.metrics.push(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔥 Admin ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }

    // Send to analytics if available
    this.sendToAnalytics('admin_component_load', metric);
  }

  trackBundleSize(bundleName: string, size: number) {
    const sizeKB = (size / 1024).toFixed(2);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Admin ${bundleName} bundle: ${sizeKB}KB`);
    }

    this.sendToAnalytics('admin_bundle_size', {
      bundleName,
      size: parseFloat(sizeKB)
    });
  }

  private trackPageLoad(entry: PerformanceNavigationTiming) {
    const loadTime = entry.loadEventEnd - entry.navigationStart;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📄 Admin page loaded in ${loadTime.toFixed(2)}ms`);
    }

    this.sendToAnalytics('admin_page_load', {
      loadTime,
      route: window.location.pathname
    });
  }

  private trackLongTask(entry: PerformanceEntry) {
    const duration = entry.duration;
    
    if (duration > 50) { // Tasks longer than 50ms
      console.warn(`⚠️ Admin long task detected: ${duration.toFixed(2)}ms`);
      
      this.sendToAnalytics('admin_long_task', {
        duration,
        route: window.location.pathname
      });
    }
  }

  private sendToAnalytics(eventName: string, data: any) {
    try {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('event', eventName, data);
      }

      // Custom analytics endpoint (if available)
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/admin/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: eventName,
            data,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          })
        }).catch(() => {
          // Silently handle analytics errors
        });
      }
    } catch (error) {
      // Silently handle analytics errors
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(componentName?: string): number {
    const filteredMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const totalTime = filteredMetrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return totalTime / filteredMetrics.length;
  }

  generateReport(): string {
    const report = {
      totalComponents: this.metrics.length,
      averageLoadTime: this.getAverageLoadTime(),
      slowestComponent: this.metrics.reduce((slowest, current) => 
        current.loadTime > (slowest?.loadTime || 0) ? current : slowest, 
        null as PerformanceMetrics | null
      ),
      fastestComponent: this.metrics.reduce((fastest, current) => 
        current.loadTime < (fastest?.loadTime || Infinity) ? current : fastest,
        null as PerformanceMetrics | null
      )
    };

    return JSON.stringify(report, null, 2);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Global instance
export const adminPerformanceMonitor = new AdminPerformanceMonitor();

// React hook for component performance tracking
export const useAdminPerformanceTracking = (componentName: string, route?: string) => {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      adminPerformanceMonitor.trackComponentLoad(componentName, startTime, route);
    };
  }, [componentName, route]);
};

// Decorator for tracking component performance
export const withAdminPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const TrackedComponent: React.FC<P> = (props) => {
    useAdminPerformanceTracking(componentName, window.location.pathname);
    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withAdminPerformanceTracking(${componentName})`;
  
  return TrackedComponent;
};

// Bundle size tracking (to be called when chunks are loaded)
export const trackBundleLoad = (bundleName: string, size?: number) => {
  if (size) {
    adminPerformanceMonitor.trackBundleSize(bundleName, size);
  }
};

// Web Vitals tracking for admin portal
export const trackWebVitals = () => {
  if ('web-vital' in window) {
    // Implementation would depend on web-vitals library
    console.log('Web Vitals tracking enabled for admin portal');
  }
};

export default adminPerformanceMonitor;
