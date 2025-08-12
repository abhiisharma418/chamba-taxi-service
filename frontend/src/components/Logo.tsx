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
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* RWS Circle Logo */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">RWS</span>
        </div>
      </div>

      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-slate-900 dark:text-white`}>
          RideWithUs
        </span>
      )}
    </div>
  );
};

export default Logo;
