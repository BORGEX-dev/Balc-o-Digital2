import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 transition-all duration-200"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
          <span className="text-gray-700 dark:text-gray-200">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 mr-2 text-yellow-500" />
          <span className="text-gray-700 dark:text-gray-200">Light</span>
        </>
      )}
    </Button>
  );
};