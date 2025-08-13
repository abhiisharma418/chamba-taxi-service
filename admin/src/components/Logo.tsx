import React from 'react';
import '../styles/logo-animations.css';

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
      {/* Premium Admin Combined RWU Logo with Rotation */}
      <div className={`${sizeClasses[size]} relative group cursor-pointer`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-blue-400/30 dark:border-blue-500/40 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700 ease-in-out overflow-hidden transform-gpu relative">
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5"></div>

          {/* Admin Crown Effect - Enhanced */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gradient-to-b from-yellow-300 to-transparent rounded-b-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gradient-to-b from-yellow-200 to-transparent rounded-b-sm opacity-80"></div>

          <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-pulse delay-1000"></div>

          {/* Combined Admin RWU Text Design */}
          <div className={`relative z-10 flex items-center space-x-0.5 ${rwuTextSize[size]}`}>
            <span className="text-white font-black tracking-tight drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              R
            </span>
            <span className="text-yellow-200 font-black tracking-tight drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300 delay-75" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              W
            </span>
            <span className="text-blue-100 font-black tracking-tight drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300 delay-150" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              U
            </span>
          </div>

          {/* Enhanced shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>

          {/* Rotating admin border effect */}
          <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-yellow-400/50 via-white/30 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-300">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent tracking-tight leading-none group-hover:from-blue-500 group-hover:to-blue-700 dark:group-hover:from-blue-300 dark:group-hover:to-blue-500 transition-all duration-300`}>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300">Ride</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-75">With</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-150">Us</span>
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase opacity-80 -mt-1 group-hover:opacity-100 transition-opacity duration-300">
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300">Admin</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-75 ml-1">Control</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
