import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
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
  ShieldAlert
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Car, label: 'Live Rides', path: '/rides' },
    { icon: Users, label: 'User Management', path: '/users' },
    { icon: ShieldAlert, label: 'Emergency', path: '/emergency' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Gift, label: 'Promo Codes', path: '/promo-codes' },
    { icon: FileText, label: 'Financial Reports', path: '/financial-reports' },
    { icon: DollarSign, label: 'Financial', path: '/financial' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-dark-surface dark:via-dark-100 dark:to-dark-200 transition-colors duration-300">
      {/* Premium Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white/90 dark:bg-dark-card/90 backdrop-blur-2xl shadow-2xl dark:shadow-dark-2xl border-r border-white/30 dark:border-dark-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-50/20 dark:from-dark-100/10 dark:to-dark-200/20"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        <div className="relative z-10 flex flex-col h-full">
          {/* Premium Logo Section */}
          <div className="p-8 border-b border-white/20 dark:border-dark-border">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full hover:scale-105 transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-white/50 to-white/30 dark:from-dark-card/50 dark:to-dark-card/30 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-dark-border group-hover:shadow-xl dark:group-hover:shadow-dark-xl transition-all duration-300">
                <Logo size="md" />
              </div>
            </button>
          </div>

          {/* Premium Navigation */}
          <nav className="flex-1 p-6 space-y-3">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 font-semibold ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-xl dark:shadow-dark-xl scale-105 border border-blue-300/50 dark:border-blue-400/50'
                      : 'text-slate-700 dark:text-dark-600 hover:bg-white/60 dark:hover:bg-dark-100/60 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-102 hover:shadow-lg dark:hover:shadow-dark-lg backdrop-blur-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-400/30'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 dark:bg-dark-accent-blue/20 backdrop-blur-sm'
                      : 'bg-slate-100 dark:bg-dark-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="font-semibold tracking-wide">{item.label}</span>

                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Premium Bottom Section */}
          <div className="p-6 border-t border-white/20 dark:border-dark-border">
            <div className="mb-6">
              <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-700 dark:text-dark-600 hover:bg-white/60 dark:hover:bg-dark-100/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 font-semibold backdrop-blur-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-400/30 hover:shadow-lg dark:hover:shadow-dark-lg">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-300">
                  <Settings className="h-5 w-5" />
                </div>
                <span className="font-semibold tracking-wide">Settings</span>
              </button>
            </div>

            {/* Premium User Info */}
            <div className="relative bg-gradient-to-br from-white/70 via-white/50 to-slate-50/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate text-lg">{user?.name}</p>
                    <p className="text-sm text-slate-600 truncate font-medium">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-emerald-600 font-semibold">Administrator</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold tracking-wide hover:scale-105"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72">
        {/* Premium Top Bar */}
        <header className="relative bg-white/80 dark:bg-dark-card/80 backdrop-blur-2xl shadow-xl dark:shadow-dark-xl border-b border-white/30 dark:border-dark-border px-10 py-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-blue-50/30 dark:from-dark-100/10 dark:to-dark-200/30"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-dark-800 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
              </div>
              <p className="text-slate-600 dark:text-dark-500 font-semibold tracking-wide">Manage your RideWithUs operations with premium control</p>
            </div>

            <div className="flex items-center gap-6">
              {/* Premium Notifications */}
              <button className="relative group p-4 bg-white/70 dark:bg-dark-card/70 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-dark-card/90 rounded-2xl transition-all duration-300 border border-white/40 dark:border-dark-border hover:shadow-xl dark:hover:shadow-dark-xl hover:scale-105">
                <Bell className="h-6 w-6 text-slate-600 dark:text-dark-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-full animate-pulse"></div>
                  <div className="absolute w-2 h-2 bg-white rounded-full"></div>
                </div>
              </button>

              {/* Premium Admin Badge */}
              <ThemeToggle />
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 dark:from-amber-500 dark:via-orange-600 dark:to-red-600 rounded-2xl shadow-lg dark:shadow-dark-lg border border-orange-200/50 dark:border-orange-300/30 backdrop-blur-sm">
                <div className="p-1 bg-white/20 dark:bg-white/30 rounded-lg backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-black text-white tracking-wide uppercase">Administrator</span>
              </div>

              {/* Premium Status Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
