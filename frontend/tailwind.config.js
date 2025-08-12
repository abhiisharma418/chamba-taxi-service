/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom dark mode colors
        dark: {
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
          300: '#52525b',
          400: '#71717a',
          500: '#a1a1aa',
          600: '#d4d4d8',
          700: '#e4e4e7',
          800: '#f4f4f5',
          900: '#fafafa',
        }
      },
      backgroundColor: {
        'dark-card': 'rgb(30 41 59)', // slate-800
        'dark-surface': 'rgb(15 23 42)', // slate-900
      },
      borderColor: {
        'dark-border': 'rgb(51 65 85)', // slate-700
      }
    },
  },
  plugins: [],
};
