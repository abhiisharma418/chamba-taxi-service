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
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-md shadow-xl border-r border-gray-100">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <Logo size="md" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-100">
            <div className="mb-4">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-300">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </button>
            </div>
            
            {/* User Info */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-sm text-slate-600 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg transition-all duration-300 border border-slate-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Logout</span>
              </button>
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
