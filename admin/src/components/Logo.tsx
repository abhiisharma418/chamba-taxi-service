import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  enableRotation?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  enableRotation = false
}) => {
  const sizeConfig = {
    sm: {
      logo: 'h-8 w-8',
      text: 'text-base',
      rwu: 'text-xs',
      spacing: 'space-x-2'
    },
    md: {
      logo: 'h-10 w-10',
      text: 'text-lg',
      rwu: 'text-sm',
      spacing: 'space-x-3'
    },
    lg: {
      logo: 'h-14 w-14',
      text: 'text-2xl',
      rwu: 'text-base',
      spacing: 'space-x-4'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.spacing} ${className}`}>
      {/* Premium Logo with consistent styling */}
      <div className={`${config.logo} relative group`}>
        <div className={`w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/20 transition-all duration-300 ${
          enableRotation ? 'group-hover:rotate-3 group-hover:scale-110' : ''
        }`}>
          <div className={`text-white font-black ${config.rwu} tracking-wider drop-shadow-sm`}>
            RWU
          </div>
          {/* Admin Crown Indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>

        {/* Glow effect on hover */}
        {enableRotation && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:to-purple-400/20 rounded-xl transition-all duration-300 -z-10 blur-sm"></div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${config.text} font-black bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 dark:from-blue-400 dark:via-blue-500 dark:to-purple-500 bg-clip-text text-transparent tracking-tight leading-none`}>
            RideWithUs
          </span>
          <span className="text-xs font-bold text-blue-600/80 dark:text-blue-400/80 tracking-widest uppercase">
            Admin Portal
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
