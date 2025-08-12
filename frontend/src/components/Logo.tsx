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

  const rwsTextSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Premium RWS Circle Logo */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
          <span className={`text-white font-black ${rwsTextSize[size]} tracking-tighter`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            RWS
          </span>
        </div>
      </div>

      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-current`}>
          RideWithUs
        </span>
      )}
    </div>
  );
};

export default Logo;
