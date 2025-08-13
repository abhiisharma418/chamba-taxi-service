import React from 'react';
import '../styles/logo-animations.css';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  enableRotation?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = false, size = 'md', enableRotation = false }) => {
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
    <div className={`flex items-center space-x-3 ${className} ${enableRotation ? 'rwu-logo-container' : ''}`}>
      {/* Premium Admin Combined RWU Logo */}
      <div className={`${sizeClasses[size]} relative group cursor-pointer ${enableRotation ? 'rwu-3d-effect' : ''}`}>
        <div className={`w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl flex items-center justify-center ${enableRotation ? 'shadow-2xl group-hover:shadow-none' : 'shadow-lg'} border-2 border-blue-400/30 dark:border-blue-500/40 ${enableRotation ? 'group-hover:scale-110 group-hover:rotate-[360deg]' : ''} transition-all duration-700 ease-in-out overflow-hidden transform-gpu relative ${enableRotation ? 'rwu-pulse-border-effect' : ''}`}>
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5"></div>

          {/* Admin Crown Effect - Enhanced with Animation */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gradient-to-b from-yellow-300 to-transparent rounded-b-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300 rwu-admin-crown-effect"></div>
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gradient-to-b from-yellow-200 to-transparent rounded-b-sm opacity-80 rwu-admin-crown-effect"></div>

          <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-pulse delay-1000"></div>

          {/* Combined Admin RWU Text Design - Bound as One Word */}
          <div className={`relative z-10 ${rwuTextSize[size]} rwu-premium-text`}>
            <span
              className={`relative font-black tracking-tighter drop-shadow-lg transform ${enableRotation ? 'group-hover:scale-110 rwu-admin-glow' : ''} transition-all duration-500 inline-block`}
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '-0.05em',
                background: 'linear-gradient(135deg, #ffffff 0%, #fde047 30%, #93c5fd 70%, #dbeafe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              <span className={`inline-block transform ${enableRotation ? 'rwu-letter group-hover:rotate-[8deg]' : ''} transition-transform duration-300`}>R</span>
              <span className={`inline-block transform ${enableRotation ? 'rwu-letter group-hover:rotate-[-5deg]' : ''} transition-transform duration-300 delay-75`}>W</span>
              <span className={`inline-block transform ${enableRotation ? 'rwu-letter group-hover:rotate-[8deg]' : ''} transition-transform duration-300 delay-150`}>U</span>
            </span>

            {/* Admin connecting line effect with crown colors */}
            {enableRotation && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-300/60 via-white/60 to-blue-200/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
            )}

            {/* Admin binding glow effect */}
            {enableRotation && (
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-white/30 to-blue-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
            )}
          </div>

          {/* Enhanced shimmer effect */}
          <div className="absolute inset-0 rwu-shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500 skew-x-12"></div>

          {/* Rotating admin border effect */}
          <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-yellow-400/50 via-white/30 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Pulsing admin glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-blue-600/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-300">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent tracking-tight leading-none group-hover:from-blue-500 group-hover:to-blue-700 dark:group-hover:from-blue-300 dark:group-hover:to-blue-500 transition-all duration-300 rwu-premium-text`}>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300">Ride</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-75">With</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-150">Us</span>
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase opacity-80 -mt-1 group-hover:opacity-100 transition-opacity duration-300 group-hover:tracking-wider">
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300">Admin</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-75 ml-1">Control</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
