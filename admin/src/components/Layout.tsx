import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
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
  BarChart3
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
    { icon: DollarSign, label: 'Financial', path: '/financial' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Premium Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white/90 backdrop-blur-2xl shadow-2xl border-r border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-50/20"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        <div className="relative z-10 flex flex-col h-full">
          {/* Premium Logo Section */}
          <div className="p-8 border-b border-white/20">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full hover:scale-105 transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-xl rounded-2xl border border-white/40 group-hover:shadow-xl transition-all duration-300">
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
                      ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-xl scale-105 border border-blue-300/50'
                      : 'text-slate-700 hover:bg-white/60 hover:text-blue-600 hover:scale-102 hover:shadow-lg backdrop-blur-sm border border-transparent hover:border-blue-200/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 backdrop-blur-sm'
                      : 'bg-slate-100 group-hover:bg-blue-100'
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
          <div className="p-6 border-t border-white/20">
            <div className="mb-6">
              <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-700 hover:bg-white/60 hover:text-blue-600 transition-all duration-300 font-semibold backdrop-blur-sm border border-transparent hover:border-blue-200/50 hover:shadow-lg">
                <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-all duration-300">
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
      <div className="ml-64">
        {/* Top Bar */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
              <p className="text-slate-600">Manage your RideWithUs operations</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 bg-slate-100 hover:bg-blue-100 rounded-xl transition-colors duration-300">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Admin Badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">Admin</span>
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
