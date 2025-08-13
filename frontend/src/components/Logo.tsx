import React from 'react';
import '../styles/logo-animations.css';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  enableRotation?: boolean; // Control rotation
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
      {/* Premium Combined RWU Logo */}
      <div className={`${sizeClasses[size]} relative group cursor-pointer ${enableRotation ? 'rwu-3d-effect' : ''}`}>
        <div className={`w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl flex items-center justify-center ${enableRotation ? 'shadow-2xl group-hover:shadow-none' : 'shadow-lg'} border-2 border-blue-400/30 ${enableRotation ? 'group-hover:scale-110 group-hover:rotate-[360deg]' : ''} transition-all duration-700 ease-in-out overflow-hidden transform-gpu ${enableRotation ? 'rwu-pulse-border-effect' : ''}`}>
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-pulse delay-1000"></div>

          {/* Combined RWU Text Design - Bound as One Word */}
          <div className={`relative z-10 ${rwuTextSize[size]} rwu-premium-text`}>
            <span
              className={`relative font-black tracking-tighter drop-shadow-lg transform ${enableRotation ? 'group-hover:scale-110 rwu-glow-effect' : ''} transition-all duration-500 inline-block`}
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '-0.05em',
                background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #dbeafe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              <span className={`inline-block transform ${enableRotation ? 'rwu-letter group-hover:rotate-[8deg]' : ''} transition-transform duration-300`}>R</span>
              <span className={`inline-block transform ${enableRotation ? 'rwu-letter group-hover:rotate-[-5deg]' : ''} transition-transform duration-300 delay-75`}>W</span>
              <span className={`inline-block transform ${enableRotation ? 'rwu-letter group-hover:rotate-[8deg]' : ''} transition-transform duration-300 delay-150`}>U</span>
            </span>

            {/* Connecting line effect to bind letters */}
            {enableRotation && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-white/40 via-blue-200/60 to-white/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
            )}

            {/* Binding glow effect */}
            {enableRotation && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-white/30 to-blue-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
            )}
          </div>

          {/* Enhanced shimmer effect */}
          {enableRotation && (
            <div className="absolute inset-0 rwu-shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500 skew-x-12"></div>
          )}

          {/* Rotating border effect */}
          {enableRotation && (
            <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-blue-400/50 via-white/30 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}

          {/* Pulsing glow effect - No background shadow during rotation */}
          {enableRotation && (
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
          )}
        </div>
      </div>

      {showText && (
        <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-300">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight leading-none group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300 rwu-premium-text`}>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 group-hover:text-shadow-lg">Ride</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-75">With</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-150">Us</span>
          </span>
          <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase opacity-80 -mt-1 group-hover:opacity-100 transition-opacity duration-300 group-hover:tracking-wider">
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-200">Premium</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-200 delay-100 ml-1">Mobility</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
