import React from 'react';

// Route manifest for admin portal lazy loading optimization
export interface RouteManifest {
  path: string;
  componentName: string;
  priority: 'high' | 'medium' | 'low';
  preloadTrigger: 'immediate' | 'hover' | 'idle' | 'interaction';
  dependencies?: string[];
  estimatedSize?: number; // in KB
  description: string;
}

export const adminRouteManifest: RouteManifest[] = [
  {
    path: '/dashboard',
    componentName: 'Dashboard',
    priority: 'high',
    preloadTrigger: 'immediate',
    estimatedSize: 45,
    description: 'Main admin dashboard with analytics and overview'
  },
  {
    path: '/users',
    componentName: 'UserManagement',
    priority: 'high',
    preloadTrigger: 'immediate',
    dependencies: ['Dashboard'],
    estimatedSize: 38,
    description: 'User management interface for customers and drivers'
  },
  {
    path: '/rides',
    componentName: 'LiveRideMonitoring',
    priority: 'high',
    preloadTrigger: 'immediate',
    dependencies: ['Dashboard'],
    estimatedSize: 42,
    description: 'Real-time ride monitoring and management'
  },
  {
    path: '/financial',
    componentName: 'FinancialManagement',
    priority: 'medium',
    preloadTrigger: 'hover',
    dependencies: ['Dashboard'],
    estimatedSize: 35,
    description: 'Financial transactions and payment management'
  },
  {
    path: '/financial-reports',
    componentName: 'FinancialReporting',
    priority: 'medium',
    preloadTrigger: 'hover',
    dependencies: ['FinancialManagement'],
    estimatedSize: 32,
    description: 'Financial reports and analytics'
  },
  {
    path: '/support',
    componentName: 'SupportManagement',
    priority: 'medium',
    preloadTrigger: 'hover',
    dependencies: ['Dashboard'],
    estimatedSize: 28,
    description: 'Customer support ticket management'
  },
  {
    path: '/emergency',
    componentName: 'EmergencyManagement',
    priority: 'medium',
    preloadTrigger: 'hover',
    dependencies: ['Dashboard'],
    estimatedSize: 30,
    description: 'Emergency incident management and monitoring'
  },
  {
    path: '/scheduled-rides',
    componentName: 'ScheduledRidesManagement',
    priority: 'medium',
    preloadTrigger: 'hover',
    dependencies: ['Dashboard'],
    estimatedSize: 33,
    description: 'Scheduled rides management and analytics'
  },
  {
    path: '/promo-codes',
    componentName: 'PromoCodeManagement',
    priority: 'low',
    preloadTrigger: 'idle',
    dependencies: ['Dashboard'],
    estimatedSize: 25,
    description: 'Promotional codes and discount management'
  }
];

// Route groups for batch preloading
export const routeGroups = {
  core: ['Dashboard', 'UserManagement', 'LiveRideMonitoring'],
  financial: ['FinancialManagement', 'FinancialReporting'],
  operations: ['SupportManagement', 'EmergencyManagement', 'ScheduledRidesManagement'],
  marketing: ['PromoCodeManagement']
};

// Preloading strategies
export class AdminRoutePreloader {
  private preloadedRoutes = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  constructor() {
    this.initializePreloading();
  }

  private initializePreloading() {
    // Preload high-priority routes immediately
    this.preloadByPriority('high');

    // Preload medium-priority routes on idle
    this.scheduleIdlePreload('medium');

    // Setup hover preloading
    this.setupHoverPreloading();
  }

  private preloadByPriority(priority: 'high' | 'medium' | 'low') {
    const routesToPreload = adminRouteManifest.filter(route => 
      route.priority === priority && route.preloadTrigger === 'immediate'
    );

    routesToPreload.forEach(route => {
      this.preloadRoute(route.componentName);
    });
  }

  private scheduleIdlePreload(priority: 'high' | 'medium' | 'low') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const routesToPreload = adminRouteManifest.filter(route => 
          route.priority === priority && route.preloadTrigger === 'idle'
        );

        routesToPreload.forEach(route => {
          this.preloadRoute(route.componentName);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.scheduleIdlePreload(priority);
      }, 2000);
    }
  }

  private setupHoverPreloading() {
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link) {
        const path = new URL(link.href).pathname;
        const route = adminRouteManifest.find(r => r.path === path);
        
        if (route && route.preloadTrigger === 'hover') {
          this.preloadRoute(route.componentName);
        }
      }
    });
  }

  public preloadRoute(componentName: string): Promise<any> | null {
    if (this.preloadedRoutes.has(componentName)) {
      return this.preloadPromises.get(componentName) || null;
    }

    const route = adminRouteManifest.find(r => r.componentName === componentName);
    if (!route) {
      console.warn(`Route not found in manifest: ${componentName}`);
      return null;
    }

    // Check dependencies
    if (route.dependencies) {
      route.dependencies.forEach(dep => {
        this.preloadRoute(dep);
      });
    }

    const preloadPromise = this.getRouteImport(componentName);
    if (preloadPromise) {
      this.preloadPromises.set(componentName, preloadPromise);
      this.preloadedRoutes.add(componentName);

      preloadPromise
        .then(() => {
          console.log(`✅ Admin route preloaded: ${componentName}`);
        })
        .catch((error) => {
          console.warn(`❌ Failed to preload admin route: ${componentName}`, error);
          this.preloadedRoutes.delete(componentName);
          this.preloadPromises.delete(componentName);
        });

      return preloadPromise;
    }

    return null;
  }

  private getRouteImport(componentName: string): Promise<any> | null {
    const imports: Record<string, () => Promise<any>> = {
      Dashboard: () => import('../pages/Dashboard'),
      UserManagement: () => import('../pages/UserManagement'),
      LiveRideMonitoring: () => import('../pages/LiveRideMonitoring'),
      FinancialManagement: () => import('../pages/FinancialManagement'),
      FinancialReporting: () => import('../pages/FinancialReporting'),
      SupportManagement: () => import('../pages/SupportManagement'),
      EmergencyManagement: () => import('../pages/EmergencyManagement'),
      ScheduledRidesManagement: () => import('../pages/ScheduledRidesManagement'),
      PromoCodeManagement: () => import('../pages/PromoCodeManagement')
    };

    return imports[componentName] ? imports[componentName]() : null;
  }

  public preloadGroup(groupName: keyof typeof routeGroups) {
    const components = routeGroups[groupName];
    return Promise.all(
      components.map(component => this.preloadRoute(component))
    );
  }

  public getPreloadedRoutes(): string[] {
    return Array.from(this.preloadedRoutes);
  }

  public getEstimatedBundleSize(): number {
    return Array.from(this.preloadedRoutes)
      .map(routeName => {
        const route = adminRouteManifest.find(r => r.componentName === routeName);
        return route?.estimatedSize || 0;
      })
      .reduce((total, size) => total + size, 0);
  }

  public generateReport(): object {
    return {
      preloadedRoutes: this.getPreloadedRoutes(),
      estimatedBundleSize: this.getEstimatedBundleSize(),
      totalRoutes: adminRouteManifest.length,
      preloadProgress: (this.preloadedRoutes.size / adminRouteManifest.length) * 100
    };
  }
}

// Global instance
export const adminRoutePreloader = new AdminRoutePreloader();

// React hook for route preloading
export const useRoutePreloading = () => {
  React.useEffect(() => {
    // Any additional preloading logic based on user interactions
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Preload remaining routes when user comes back to tab
        adminRoutePreloader.preloadByPriority('low');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    preloadRoute: adminRoutePreloader.preloadRoute.bind(adminRoutePreloader),
    preloadGroup: adminRoutePreloader.preloadGroup.bind(adminRoutePreloader),
    getReport: adminRoutePreloader.generateReport.bind(adminRoutePreloader)
  };
};

export default adminRouteManifest;
