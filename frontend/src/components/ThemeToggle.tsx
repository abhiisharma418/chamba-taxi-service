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
        className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:scale-105"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
          {currentTheme.label}
        </span>
        <ChevronDown className={`h-3 w-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 animate-fadeInDown">
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
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    theme === themeOption.value
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">
              Current: {isDark ? 'Dark' : 'Light'} mode
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
