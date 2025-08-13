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
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Premium RWU Logo */}
      <div className={`${sizeClasses[size]} relative group`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-blue-400/30 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-pulse delay-1000"></div>

          {/* Premium RWU Text */}
          <span className={`relative z-10 text-white font-black ${rwuTextSize[size]} tracking-wide drop-shadow-lg`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            RWU
          </span>

          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight leading-none`}>
            RideWithUs
          </span>
          <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase opacity-80 -mt-1">
            Premium Mobility
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
