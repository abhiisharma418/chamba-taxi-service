import React from 'react';

interface RWUTextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'glow' | 'premium';
  className?: string;
  animate?: boolean;
}

const RWUText: React.FC<RWUTextProps> = ({ 
  size = 'md', 
  variant = 'default', 
  className = '',
  animate = true 
}) => {
  const sizeClasses = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent';
      case 'glow':
        return 'text-white drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]';
      case 'premium':
        return 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent drop-shadow-lg';
      default:
        return 'text-blue-600';
    }
  };

  const baseClasses = `
    font-black 
    tracking-tight 
    select-none 
    ${sizeClasses[size]} 
    ${getVariantClasses()}
    ${className}
  `;

  return (
    <div className={`inline-flex items-center ${animate ? 'group cursor-pointer' : ''}`}>
      {/* Combined RWU as cohesive word */}
      <span 
        className={baseClasses}
        style={{ 
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em',
          textRendering: 'optimizeLegibility'
        }}
      >
        <span className={`inline-block ${animate ? 'transform group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-300' : ''}`}>
          R
        </span>
        <span className={`inline-block ${animate ? 'transform group-hover:scale-110 group-hover:rotate-[-3deg] transition-all duration-300 delay-75' : ''}`}>
          W
        </span>
        <span className={`inline-block ${animate ? 'transform group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-300 delay-150' : ''}`}>
          U
        </span>
      </span>
      
      {/* Connecting underline effect */}
      {animate && (
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-500 ease-out"></div>
      )}
    </div>
  );
};

export default RWUText;
