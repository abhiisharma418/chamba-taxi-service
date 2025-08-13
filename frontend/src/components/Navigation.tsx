import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { responsive, touch, patterns } from '../utils/responsive';
import {
  Car,
  User,
  Menu,
  X,
  LogOut,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Settings,
  HelpCircle
} from 'lucide-react';
import Logo from './Logo';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const getNavItems = () => {
    if (!user) return [];

    switch (user.type) {
      case 'customer':
        return [
          { path: '/customer/dashboard', label: 'Dashboard', icon: User },
          { path: '/customer/book-ride', label: 'Book Ride', icon: Car },
          { path: '/customer/history', label: 'History', icon: Clock }
        ];
      case 'driver':
        return [
          { path: '/driver/dashboard', label: 'Dashboard', icon: User },
          { path: '/driver/trip-history', label: 'Trip History', icon: MapPin },
          { path: '/driver/earnings', label: 'Earnings', icon: DollarSign },
          { path: '/driver/profile', label: 'Profile', icon: User },
          { path: '/driver/vehicle-management', label: 'Vehicle', icon: Settings },
          { path: '/driver/support', label: 'Support', icon: HelpCircle }
        ];
      default:
        return [];
    }
  };

  const getHomePath = () => {
    if (!user) return '/';
    return user.type === 'customer' ? '/customer/dashboard' : '/driver/dashboard';
  };

  const navItems = getNavItems();

  return (
    <nav className="relative bg-white/80 dark:bg-dark-card/80 backdrop-blur-2xl shadow-2xl sticky top-0 z-50 border-b border-white/30 dark:border-dark-border/30 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-blue-50/20 dark:from-dark-card/10"></div>

      <div className={`${patterns.navigation.inner} relative z-10`}>
        <div className={patterns.navigation.content}>
          <div className="flex items-center">
            <Link to={getHomePath()} className="group flex items-center transition-transform duration-300 hover:scale-105">
              <div className="p-2 bg-white/50 dark:bg-dark-card/50 backdrop-blur-xl rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 border border-white/40">
                <Logo size="md" />
              </div>
            </Link>
          </div>

          {user && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-1 text-slate-700 hover:text-blue-600 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <NotificationBell />
                <ThemeToggle />
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-slate-700 hover:text-red-600 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className={`${responsive.nav.mobile} ${responsive.flex.center} gap-2`}>
                <NotificationBell />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`text-slate-700 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all duration-300 ${touch.target}`}
                >
                  {isMenuOpen ? <X className={touch.icon} /> : <Menu className={touch.icon} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMenuOpen && (
          <div className={`${responsive.nav.mobileMenu} animate-fadeInDown`}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 ${touch.target}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <item.icon className={touch.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t pt-2">
                <div className="flex items-center space-x-2 px-3 py-2">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
