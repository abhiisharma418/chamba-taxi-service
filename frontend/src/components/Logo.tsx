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
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Simple RWU Logo */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md border border-blue-400/30">
          <div className={`text-white font-bold ${rwuTextSize[size]}`}>
            RWU
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight leading-none`}>
            RideWithUs
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
