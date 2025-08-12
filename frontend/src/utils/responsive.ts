// Responsive design utilities for consistent mobile experience

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Common responsive classes
export const responsive = {
  // Container classes
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSmall: 'max-w-4xl mx-auto px-4 sm:px-6',
  containerMedium: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Grid layouts
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    responsive: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  },
  
  // Flexbox layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    column: 'flex flex-col',
    columnCenter: 'flex flex-col items-center justify-center',
    wrap: 'flex flex-wrap',
    responsive: 'flex flex-col sm:flex-row',
    responsiveReverse: 'flex flex-col-reverse sm:flex-row'
  },
  
  // Spacing
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    sectionSmall: 'py-6 sm:py-8 lg:py-12',
    card: 'p-4 sm:p-6 lg:p-8',
    cardSmall: 'p-3 sm:p-4 lg:p-6',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
    gapSmall: 'gap-2 sm:gap-4 lg:gap-6'
  },
  
  // Typography
  text: {
    hero: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl',
    title: 'text-2xl sm:text-3xl lg:text-4xl',
    heading: 'text-xl sm:text-2xl lg:text-3xl',
    subheading: 'text-lg sm:text-xl lg:text-2xl',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm'
  },
  
  // Navigation
  nav: {
    desktop: 'hidden md:flex',
    mobile: 'md:hidden',
    mobileMenu: 'absolute top-full left-0 right-0 bg-white shadow-lg md:hidden'
  },
  
  // Forms
  form: {
    input: 'w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base',
    button: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
    buttonLarge: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg'
  },
  
  // Cards and containers
  card: {
    default: 'rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8',
    compact: 'rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6',
    modal: 'rounded-xl sm:rounded-2xl p-6 sm:p-8',
    shadow: 'shadow-md sm:shadow-lg lg:shadow-xl'
  },
  
  // Responsive utilities
  hide: {
    onMobile: 'hidden sm:block',
    onTablet: 'hidden md:block',
    onDesktop: 'sm:hidden',
    onLarge: 'lg:hidden'
  },
  
  show: {
    onMobile: 'block sm:hidden',
    onTablet: 'hidden sm:block md:hidden',
    onDesktop: 'hidden md:block',
    onLarge: 'hidden lg:block'
  }
};

// Responsive image utilities
export const imageResponsive = {
  hero: 'w-full h-48 sm:h-64 lg:h-80 xl:h-96 object-cover',
  card: 'w-full h-32 sm:h-40 lg:h-48 object-cover',
  avatar: 'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full',
  icon: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6'
};

// Mobile-first media queries (for use in CSS-in-JS)
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`
};

// Touch-friendly sizing
export const touch = {
  target: 'min-h-[44px] min-w-[44px]', // Apple's recommended minimum touch target
  button: 'py-3 px-4 sm:py-3 sm:px-6', // Larger buttons on mobile
  input: 'py-3 px-4', // Larger form inputs
  icon: 'w-6 h-6 sm:w-5 sm:h-5' // Larger icons on mobile
};

// Safe area utilities for mobile devices
export const safeArea = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom',
  left: 'pl-safe-left',
  right: 'pr-safe-right',
  all: 'p-safe'
};

// Responsive utility functions
export const isMobile = (width: number) => width < 768;
export const isTablet = (width: number) => width >= 768 && width < 1024;
export const isDesktop = (width: number) => width >= 1024;

// Get responsive class based on screen size
export const getResponsiveClass = (mobile: string, tablet?: string, desktop?: string) => {
  const classes = [mobile];
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  return classes.join(' ');
};

// Common responsive patterns
export const patterns = {
  // Dashboard layout
  dashboard: {
    container: responsive.container,
    grid: 'grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8',
    sidebar: 'lg:col-span-1',
    main: 'lg:col-span-3'
  },
  
  // Card grid
  cardGrid: {
    container: responsive.grid.responsive,
    gap: responsive.spacing.gap,
    item: responsive.card.default
  },
  
  // Modal
  modal: {
    backdrop: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
    container: 'bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md lg:max-w-lg w-full max-h-[90vh] overflow-y-auto',
    header: 'text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6'
  },
  
  // Navigation
  navigation: {
    container: 'bg-white shadow-lg sticky top-0 z-50',
    inner: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    content: 'flex justify-between items-center h-14 sm:h-16',
    menu: 'hidden md:flex items-center space-x-6 lg:space-x-8'
  }
};
