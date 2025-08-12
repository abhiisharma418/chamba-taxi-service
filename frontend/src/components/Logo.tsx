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
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2Fb5fd1e57bd4244fe81b312d7e7579ba5%2F41d29b6806c84d6abfb0a013666ca367?format=webp&width=800"
        alt="RideWithUs Logo"
        className={`${sizeClasses[size]} object-contain`}
      />

      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent`}>
          RideWithUs
        </span>
      )}
    </div>
  );
};

export default Logo;
