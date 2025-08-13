import { adminPerformanceMonitor } from './performance';
import { adminRoutePreloader } from './routeManifest';

// Development tools for monitoring lazy loading performance
class AdminDevTools {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    if (this.isEnabled) {
      this.initializeDevTools();
    }
  }

  private initializeDevTools() {
    // Add dev tools to window for debugging
    (window as any).__ADMIN_DEV_TOOLS__ = {
      performance: adminPerformanceMonitor,
      routes: adminRoutePreloader,
      getPerformanceReport: () => adminPerformanceMonitor.generateReport(),
      getRouteReport: () => adminRoutePreloader.generateReport(),
      preloadAllRoutes: () => this.preloadAllRoutes(),
      clearCache: () => this.clearCache(),
      logBundle: () => this.logBundleInfo()
    };

    // Log initialization
    console.log('🛠️ Admin Dev Tools initialized');
    console.log('Access via window.__ADMIN_DEV_TOOLS__');
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + P = Performance Report
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.showPerformanceReport();
      }
      
      // Ctrl/Cmd + Shift + R = Route Report
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        this.showRouteReport();
      }
      
      // Ctrl/Cmd + Shift + L = Preload All Routes
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        this.preloadAllRoutes();
      }
    });
  }

  private showPerformanceReport() {
    const report = adminPerformanceMonitor.generateReport();
    console.group('📊 Admin Performance Report');
    console.log(report);
    console.groupEnd();
    
    // Show in modal if available
    this.showModal('Performance Report', report);
  }

  private showRouteReport() {
    const report = adminRoutePreloader.generateReport();
    console.group('🛣️ Admin Route Report');
    console.log(report);
    console.groupEnd();
    
    this.showModal('Route Preloading Report', report);
  }

  private async preloadAllRoutes() {
    console.log('🚀 Preloading all admin routes...');
    
    try {
      await Promise.all([
        adminRoutePreloader.preloadGroup('core'),
        adminRoutePreloader.preloadGroup('financial'),
        adminRoutePreloader.preloadGroup('operations'),
        adminRoutePreloader.preloadGroup('marketing')
      ]);
      
      console.log('✅ All admin routes preloaded successfully');
      
      const report = adminRoutePreloader.generateReport();
      console.log('📈 Final preload report:', report);
      
    } catch (error) {
      console.error('❌ Error preloading routes:', error);
    }
  }

  private clearCache() {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
      console.log('🗑️ Cache cleared');
    }
  }

  private logBundleInfo() {
    if ('navigator' in window && 'storage' in navigator) {
      navigator.storage.estimate().then(estimate => {
        console.group('💾 Bundle & Storage Info');
        console.log('Estimated storage quota:', estimate.quota);
        console.log('Estimated storage usage:', estimate.usage);
        console.log('Estimated bundle size:', adminRoutePreloader.getEstimatedBundleSize() + 'KB');
        console.groupEnd();
      });
    }
  }

  private showModal(title: string, content: any) {
    // Create a simple modal for displaying reports
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: monospace;
    `;

    const content_div = document.createElement('div');
    content_div.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
      float: right;
      padding: 5px 10px;
      border: none;
      background: #f0f0f0;
      cursor: pointer;
      border-radius: 4px;
    `;

    closeBtn.onclick = () => document.body.removeChild(modal);

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.marginTop = '0';

    const contentEl = document.createElement('pre');
    contentEl.textContent = JSON.stringify(content, null, 2);
    contentEl.style.cssText = `
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow: auto;
      white-space: pre-wrap;
    `;

    content_div.appendChild(closeBtn);
    content_div.appendChild(titleEl);
    content_div.appendChild(contentEl);
    modal.appendChild(content_div);
    
    document.body.appendChild(modal);

    // Close on click outside
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

    // Close on Escape key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Add console styling for better dev experience
  logStyled(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    if (!this.isEnabled) return;

    const styles: Record<string, string> = {
      info: 'color: #2196F3; font-weight: bold;',
      success: 'color: #4CAF50; font-weight: bold;',
      warning: 'color: #FF9800; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;'
    };

    console.log(`%c${message}`, styles[type]);
  }

  // Performance tracking with visual feedback
  trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return operation();

    const startTime = performance.now();
    this.logStyled(`🔄 Starting: ${name}`, 'info');

    return operation()
      .then(result => {
        const duration = performance.now() - startTime;
        this.logStyled(`✅ Completed: ${name} (${duration.toFixed(2)}ms)`, 'success');
        return result;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        this.logStyled(`❌ Failed: ${name} (${duration.toFixed(2)}ms)`, 'error');
        throw error;
      });
  }
}

// Global instance
export const adminDevTools = new AdminDevTools();

// Helper functions for components
export const logRouteLoad = (routeName: string, loadTime: number) => {
  if (process.env.NODE_ENV === 'development') {
    adminDevTools.logStyled(`📄 Route loaded: ${routeName} (${loadTime.toFixed(2)}ms)`, 'success');
  }
};

export const logComponentMount = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    adminDevTools.logStyled(`🔧 Component mounted: ${componentName}`, 'info');
  }
};

export const logError = (error: Error, context: string) => {
  if (process.env.NODE_ENV === 'development') {
    adminDevTools.logStyled(`💥 Error in ${context}: ${error.message}`, 'error');
  }
};

export default adminDevTools;
