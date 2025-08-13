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
      {/* Premium Combined RWU Logo with Rotation */}
      <div className={`${sizeClasses[size]} relative group cursor-pointer`}>
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-blue-400/30 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700 ease-in-out overflow-hidden transform-gpu">
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-pulse delay-1000"></div>

          {/* Combined RWU Text Design */}
          <div className={`relative z-10 flex items-center space-x-0.5 ${rwuTextSize[size]}`}>
            <span className="text-white font-black tracking-tight drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              R
            </span>
            <span className="text-blue-200 font-black tracking-tight drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300 delay-75" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              W
            </span>
            <span className="text-blue-100 font-black tracking-tight drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300 delay-150" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              U
            </span>
          </div>

          {/* Enhanced shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>

          {/* Rotating border effect */}
          <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-blue-400/50 via-white/30 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-300">
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tight leading-none group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300`}>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300">Ride</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-75">With</span>
            <span className="inline-block transform group-hover:scale-105 transition-transform duration-300 delay-150">Us</span>
          </span>
          <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase opacity-80 -mt-1 group-hover:opacity-100 transition-opacity duration-300">
            Premium Mobility
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
