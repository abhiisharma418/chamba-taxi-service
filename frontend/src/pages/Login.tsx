import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'customer' | 'driver'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const type = searchParams.get('type') as 'customer' | 'driver' | 'admin' | null;
    if (type === 'admin') {
      window.location.href = (import.meta as any).env?.VITE_ADMIN_URL || 'https://ride-with-us.onrender.com';
      return;
    }
    if (type === 'customer' || type === 'driver') {
      setUserType(type);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password, userType);
      switch (userType) {
        case 'customer':
          navigate('/customer/dashboard');
          break;
        case 'driver':
          navigate('/driver/dashboard');
          break;
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
            <Logo size="lg" />
          <p className="text-slate-600 mt-4 text-lg">Welcome back to your trusted ride partner</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div className="flex space-x-2 bg-slate-100 rounded-xl p-1.5">
            <button
              type="button"
              onClick={() => setUserType('customer')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                userType === 'customer'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setUserType('driver')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                userType === 'driver'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Driver
            </button>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80"
                placeholder="Enter your email"
              />
              <Mail className="h-5 w-5 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 pl-12 pr-12 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80"
                placeholder="Enter your password"
              />
              <Lock className="h-5 w-5 text-slate-400 absolute left-4 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-slate-600 transition-colors duration-300"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to={`/signup?type=${userType}`}
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-300"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-slate-700">Smart Backend Mode</p>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Primary:</span>
              <span className="text-green-600 text-xs">Live API (Render.com)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Fallback:</span>
              <span className="text-blue-600 text-xs">Demo Mode</span>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-center">
              <p className="text-xs text-slate-600">
                🔄 Automatically uses demo data if live backend is unavailable
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <span className="font-mono">customer@test.com / password</span> <br/>
                <span className="text-slate-500">or any email/password in demo mode</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
