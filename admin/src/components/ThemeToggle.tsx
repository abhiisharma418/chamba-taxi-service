import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2.5 bg-white/60 dark:bg-dark-card/60 hover:bg-white/80 dark:hover:bg-dark-card/80 rounded-xl shadow-lg dark:shadow-dark-lg border border-white/40 dark:border-dark-border transition-all duration-300 hover:scale-105 backdrop-blur-xl"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-4 w-4 text-gray-600 dark:text-dark-600" />
        <span className="text-sm font-medium text-gray-700 dark:text-dark-600 hidden sm:block">
          {currentTheme.label}
        </span>
        <ChevronDown className={`h-3 w-3 text-gray-500 dark:text-dark-500 transition-transform duration-200 hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl rounded-xl shadow-xl dark:shadow-dark-2xl border border-white/40 dark:border-dark-border z-50 animate-fadeInDown">
          <div className="p-2">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value as any);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    theme === themeOption.value
                      ? 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-md'
                      : 'text-gray-700 dark:text-dark-600 hover:bg-gray-100/60 dark:hover:bg-dark-100/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200/60 dark:border-dark-border p-2">
            <div className="text-xs text-gray-500 dark:text-dark-400 px-3 py-1">
              Currently: {isDark ? 'Dark' : 'Light'} mode active
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ThemeToggle;
