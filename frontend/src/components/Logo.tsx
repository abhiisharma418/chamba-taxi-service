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
      {/* Professional logo design */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          
          {/* Circle background */}
          <circle cx="20" cy="20" r="18" fill="url(#logo-gradient)" className="drop-shadow-lg" />
          
          {/* Modern car icon */}
          <g transform="translate(8, 12)">
            {/* Car body */}
            <path 
              d="M2 8 L4 4 L20 4 L22 8 L22 12 L20 12 L20 10 L4 10 L4 12 L2 12 Z"
              fill="white"
            />
            {/* Car windows */}
            <path 
              d="M5 4 L6 6 L18 6 L19 4 Z"
              fill="url(#logo-accent)"
              opacity="0.7"
            />
            {/* Wheels */}
            <circle cx="6" cy="10" r="2" fill="url(#logo-accent)" />
            <circle cx="18" cy="10" r="2" fill="url(#logo-accent)" />
            <circle cx="6" cy="10" r="1" fill="white" />
            <circle cx="18" cy="10" r="1" fill="white" />
          </g>
          
          {/* Speed lines for motion */}
          <g transform="translate(2, 20)" opacity="0.6">
            <line x1="0" y1="0" x2="6" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="3" x2="4" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent`}>
          RideWithUs
        </span>
      )}
    </div>
  );
};

export default Logo;
