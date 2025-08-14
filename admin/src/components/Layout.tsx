import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { getApiStatus } from '../lib/api';
import ThemeToggle from './ThemeToggle';
import {
  LogOut,
  User,
  Bell,
  Settings,
  Shield,
  LayoutDashboard,
  Car,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle,
  HelpCircle,
  FileText,
  Gift,
  ShieldAlert,
  Calendar,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState(getApiStatus());

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Car, label: 'Live Rides', path: '/rides' },
    { icon: Calendar, label: 'Scheduled Rides', path: '/scheduled-rides' },
    { icon: Users, label: 'User Management', path: '/users' },
    { icon: ShieldAlert, label: 'Emergency', path: '/emergency' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Gift, label: 'Promo Codes', path: '/promo-codes' },
    { icon: FileText, label: 'Financial Reports', path: '/financial-reports' },
    { icon: DollarSign, label: 'Financial', path: '/financial' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Update API status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setApiStatus(getApiStatus());
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300" />
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:block">
        <div className="h-full bg-white/95 dark:bg-dark-card/95 backdrop-blur-2xl shadow-xl dark:shadow-dark-2xl border-r border-white/30 dark:border-dark-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-50/20 dark:from-dark-100/10 dark:to-dark-200/20"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
          <SidebarContent 
            menuItems={menuItems}
            user={user}
            location={location}
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar fixed inset-y-0 left-0 w-72 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full bg-white/98 dark:bg-dark-card/98 backdrop-blur-2xl shadow-2xl dark:shadow-dark-2xl border-r border-white/30 dark:border-dark-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-50/20 dark:from-dark-100/10 dark:to-dark-200/20"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
          <SidebarContent 
            menuItems={menuItems}
            user={user}
            location={location}
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Mobile Header */}
        <header className="lg:hidden relative bg-white/95 dark:bg-dark-card/95 backdrop-blur-2xl shadow-lg dark:shadow-dark-lg border-b border-white/30 dark:border-dark-border px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button p-2 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl hover:bg-white dark:hover:bg-dark-card rounded-xl transition-all duration-300 border border-white/40 dark:border-dark-border shadow-lg hover:shadow-xl"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-slate-700 dark:text-dark-600" />
              ) : (
                <Menu className="h-6 w-6 text-slate-700 dark:text-dark-600" />
              )}
            </button>
            
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-dark-800 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Admin
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="relative p-2 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl hover:bg-white dark:hover:bg-dark-card rounded-xl transition-all duration-300 border border-white/40 dark:border-dark-border shadow-lg hover:shadow-xl">
                <Bell className="h-5 w-5 text-slate-600 dark:text-dark-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-full"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:block relative bg-white/90 dark:bg-dark-card/90 backdrop-blur-2xl shadow-lg dark:shadow-dark-lg border-b border-white/30 dark:border-dark-border px-8 py-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-blue-50/30 dark:from-dark-100/10 dark:to-dark-200/30"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h1 className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-dark-800 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
              </div>
              <p className="text-slate-600 dark:text-dark-500 font-medium tracking-wide text-sm xl:text-base">Manage your RideWithUs operations with control</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications with improved z-index */}
              <div className="relative">
                <button className="relative group p-3 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl hover:bg-white dark:hover:bg-dark-card rounded-xl transition-all duration-300 border border-white/40 dark:border-dark-border shadow-lg hover:shadow-xl hover:scale-105">
                  <Bell className="h-5 w-5 text-slate-600 dark:text-dark-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-full"></div>
                </button>
              </div>

              <ThemeToggle />
              
              {/* Admin Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 dark:from-amber-500 dark:via-orange-600 dark:to-red-600 rounded-xl shadow-lg border border-orange-200/50 dark:border-orange-300/30">
                <Shield className="h-4 w-4 text-white" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">Admin</span>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
                apiStatus.isOnline
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-700/50'
                  : 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-700/50'
              }`}>
                {apiStatus.isOnline ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                )}
                <span className={`text-xs font-bold ${
                  apiStatus.isOnline
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {apiStatus.isOnline ? 'ONLINE' : 'MOCK DATA'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// Sidebar Content Component
const SidebarContent: React.FC<{
  menuItems: any[];
  user: any;
  location: any;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}> = ({ menuItems, user, location, onNavigate, onLogout }) => {
  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 lg:p-8 border-b border-white/20 dark:border-dark-border">
        <button
          onClick={() => onNavigate('/dashboard')}
          className="w-full hover:scale-105 transition-all duration-300 group"
        >
          <div className="p-3 bg-gradient-to-br from-white/60 to-white/40 dark:from-dark-card/60 dark:to-dark-card/40 backdrop-blur-xl rounded-xl border border-white/40 dark:border-dark-border group-hover:shadow-lg dark:group-hover:shadow-dark-lg transition-all duration-300">
            <Logo size="md" enableRotation={true} />
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 lg:p-6 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg dark:shadow-dark-lg border border-blue-300/50 dark:border-blue-400/50'
                  : 'text-slate-700 dark:text-dark-600 hover:bg-white/70 dark:hover:bg-dark-100/70 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md dark:hover:shadow-dark-md backdrop-blur-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-400/30'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-white/20 dark:bg-dark-accent-blue/20 backdrop-blur-sm'
                  : 'bg-slate-100 dark:bg-dark-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
              }`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <span className="font-medium tracking-wide text-sm">{item.label}</span>

              {isActive && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 lg:p-6 border-t border-white/20 dark:border-dark-border">
        <div className="mb-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-dark-600 hover:bg-white/70 dark:hover:bg-dark-100/70 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 font-medium backdrop-blur-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-400/30 hover:shadow-md dark:hover:shadow-dark-md">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-dark-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-300">
              <Settings className="h-4 w-4" />
            </div>
            <span className="font-medium tracking-wide text-sm">Settings</span>
          </button>
        </div>

        {/* User Info */}
        <div className="relative bg-gradient-to-br from-white/80 via-white/60 to-slate-50/80 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate text-sm">{user?.name}</p>
                <p className="text-xs text-slate-600 truncate font-medium">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 font-medium">Administrator</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-medium tracking-wide hover:scale-105 text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
