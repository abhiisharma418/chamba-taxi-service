/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Enhanced dark mode color palette
        dark: {
          25: '#0c0a09',   // darker surface
          50: '#18181b',   // main dark surface
          100: '#27272a',  // dark cards
          200: '#3f3f46',  // elevated elements
          300: '#52525b',  // borders
          400: '#71717a',  // disabled text
          500: '#a1a1aa',  // secondary text
          600: '#d4d4d8',  // primary text
          700: '#e4e4e7',  // highlighted text
          800: '#f4f4f5',  // contrast text
          900: '#fafafa',  // white in dark mode
        },
        // Premium dark mode gradients
        'dark-gradient': {
          'from': '#0f172a', // slate-900
          'via': '#1e293b',  // slate-800
          'to': '#334155',   // slate-700
        },
        // Premium accent colors for dark mode
        'dark-accent': {
          'blue': '#3b82f6',
          'purple': '#8b5cf6',
          'indigo': '#6366f1',
          'green': '#10b981',
          'yellow': '#f59e0b',
          'red': '#ef4444',
        }
      },
      backgroundColor: {
        'dark-card': 'rgba(30, 41, 59, 0.8)',    // glass-like card
        'dark-surface': '#0f172a',               // main background
        'dark-elevated': 'rgba(51, 65, 85, 0.6)', // elevated surfaces
        'dark-glass': 'rgba(15, 23, 42, 0.8)',   // glassmorphism
      },
      borderColor: {
        'dark-border': 'rgba(51, 65, 85, 0.3)',
        'dark-accent': 'rgba(59, 130, 246, 0.5)',
      },
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dark': '0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        'dark-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'dark-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'fadeInDown': 'fadeInDown 0.4s ease-out',
        'slideInLeft': 'slideInLeft 0.5s ease-out',
        'slideInRight': 'slideInRight 0.5s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};
