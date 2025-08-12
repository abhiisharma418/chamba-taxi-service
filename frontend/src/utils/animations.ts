// Animation utilities for consistent micro-interactions

export const animationDelays = {
  none: '0s',
  xs: '0.1s',
  sm: '0.2s',
  md: '0.3s',
  lg: '0.4s',
  xl: '0.5s',
  '2xl': '0.6s',
  '3xl': '0.8s'
};

export const staggerChildren = (index: number, baseDelay: number = 0.1) => ({
  animationDelay: `${baseDelay * index}s`
});

export const springConfig = {
  tension: 300,
  friction: 20
};

// Common animation classes
export const animations = {
  // Entrance animations
  fadeInUp: 'animate-fadeInUp',
  fadeInDown: 'animate-fadeInDown',
  scaleIn: 'animate-scaleIn',
  
  // Hover effects
  hoverLift: 'hover-lift',
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverGlow: 'hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300',
  
  // Button animations
  buttonPress: 'active:scale-95 transition-transform duration-100',
  buttonHover: 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
  
  // Loading states
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  
  // Special effects
  gradient: 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient',
  float: 'animate-float',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200'
};

// Animation variants for different component types
export const cardVariants = {
  default: `${animations.fadeInUp} ${animations.hoverLift}`,
  interactive: `${animations.fadeInUp} ${animations.hoverLift} ${animations.buttonPress}`,
  highlighted: `${animations.scaleIn} ${animations.hoverGlow}`,
  floating: `${animations.fadeInUp} ${animations.float}`
};

export const buttonVariants = {
  primary: `${animations.buttonHover} ${animations.buttonPress} ${animations.focusRing}`,
  secondary: `${animations.hoverScale} ${animations.buttonPress} ${animations.focusRing}`,
  ghost: `${animations.buttonPress} ${animations.focusRing} hover:bg-gray-100`,
  danger: `${animations.buttonHover} ${animations.buttonPress} ${animations.focusRing} hover:shadow-red-500/25`
};

export const inputVariants = {
  default: `${animations.focusRing} transition-all duration-200 hover:border-gray-400`,
  error: `${animations.focusRing} border-red-300 focus:border-red-500 focus:ring-red-500`,
  success: `${animations.focusRing} border-green-300 focus:border-green-500 focus:ring-green-500`
};

// Utility function to combine animation classes
export const combineAnimations = (...animations: string[]) => {
  return animations.filter(Boolean).join(' ');
};

// Page transition variants
export const pageTransitions = {
  slideIn: 'animate-fadeInUp',
  scaleIn: 'animate-scaleIn',
  fadeIn: 'opacity-0 animate-fadeInUp'
};

// Stagger utility for lists
export const getStaggerDelay = (index: number, baseDelay: number = 100) => ({
  style: { animationDelay: `${index * baseDelay}ms` }
});

// Loading animation configurations
export const loadingAnimations = {
  dots: 'loading-dots',
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce'
};
