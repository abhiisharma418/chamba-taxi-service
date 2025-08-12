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

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Professional admin logo design */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <defs>
            <linearGradient id="admin-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="admin-logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          
          {/* Circle background */}
          <circle cx="20" cy="20" r="18" fill="url(#admin-logo-gradient)" className="drop-shadow-lg" />
          
          {/* Admin crown icon */}
          <g transform="translate(8, 10)">
            {/* Crown base */}
            <path 
              d="M2 16 L22 16 L20 12 L4 12 Z"
              fill="url(#admin-logo-accent)"
            />
            {/* Crown peaks */}
            <path 
              d="M4 12 L8 8 L12 12 L16 8 L20 12"
              stroke="url(#admin-logo-accent)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Crown gems */}
            <circle cx="8" cy="8" r="1.5" fill="white" />
            <circle cx="16" cy="8" r="1.5" fill="white" />
            <circle cx="12" cy="12" r="1.5" fill="white" />
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent`}>
            RideWithUs
          </span>
          <span className="text-xs text-amber-600 font-semibold -mt-1">Admin Portal</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
