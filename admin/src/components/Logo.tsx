import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  const rwuTextSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Luxury Elite Logo - Same as frontend */}
      <div className={`${sizeClasses[size]} relative group`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            {/* Premium Gradients */}
            <linearGradient id="admin-luxury-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="25%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="75%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            <linearGradient id="admin-luxury-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="admin-luxury-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>

            {/* Premium Shadow Filter */}
            <filter id="admin-luxury-shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1e40af" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Outer Ring */}
          <circle cx="50" cy="50" r="45" fill="url(#admin-luxury-main)" filter="url(#admin-luxury-shadow)" className="animate-pulse opacity-90" />

          {/* Inner Design */}
          <circle cx="50" cy="50" r="35" fill="url(#admin-luxury-main)" opacity="0.8" />

          {/* Premium Admin Crown */}
          <g transform="translate(30, 30)">
            {/* Crown Base */}
            <path d="M5 30 L35 30 L32 25 L8 25 Z" fill="url(#admin-luxury-accent)" />

            {/* Crown Peaks */}
            <path d="M8 25 L12 15 L16 25 L20 15 L24 25 L28 15 L32 25"
                  stroke="url(#admin-luxury-accent)" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Crown Gems */}
            <circle cx="12" cy="15" r="2" fill="url(#admin-luxury-highlight)" />
            <circle cx="20" cy="15" r="2" fill="url(#admin-luxury-highlight)" />
            <circle cx="28" cy="15" r="2" fill="url(#admin-luxury-highlight)" />
            <circle cx="16" cy="25" r="1.5" fill="#ffffff" />
            <circle cx="24" cy="25" r="1.5" fill="#ffffff" />
          </g>

          {/* Luxury Border */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#admin-luxury-highlight)" strokeWidth="1" opacity="0.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="url(#admin-luxury-accent)" strokeWidth="1" opacity="0.7" />

          {/* Premium Sparkle Effects */}
          <circle cx="25" cy="25" r="1" fill="#ffffff" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="75" cy="75" r="1" fill="#ffffff" opacity="0.8">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight leading-none`}>
            RideWithUs
          </span>
          <span className="text-xs font-bold text-amber-600 tracking-widest uppercase opacity-80 -mt-1">
            Admin Control
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
