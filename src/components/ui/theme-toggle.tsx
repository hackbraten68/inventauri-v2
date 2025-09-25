import { useEffect, useState } from 'react';
import { getThemeService } from '../../lib/theme-service';
import type { Theme } from '../../lib/theme';

type ThemeToggleProps = {
  className?: string;
  variant?: 'button' | 'select';
  showLabel?: boolean;
  disabled?: boolean;
  onToggle?: (theme: Theme) => void;
};

export function ThemeToggle({
  className = '',
  variant = 'button',
  showLabel = false,
  disabled = false,
  onToggle
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const themeService = getThemeService();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (disabled) {
      setShowConfirmation(true);
      return;
    }

    const newTheme = themeService.getCurrentTheme() === 'light' ? 'dark' : 'light';
    themeService.setTheme(newTheme);
    onToggle?.(newTheme);
  };

  const handleConfirmToggle = () => {
    setShowConfirmation(false);
    const newTheme = themeService.getCurrentTheme() === 'light' ? 'dark' : 'light';
    themeService.setTheme(newTheme);
    onToggle?.(newTheme);
  };

  const handleCancelToggle = () => {
    setShowConfirmation(false);
  };

  const currentTheme = themeService.getCurrentTheme();

  if (variant === 'select') {
    return (
      <div className={className}>
        {showLabel && (
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Theme
          </label>
        )}
        <select
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          value={currentTheme}
          onChange={(event) => {
            const newTheme = event.target.value as Theme;
            themeService.setTheme(newTheme);
            onToggle?.(newTheme);
          }}
          disabled={disabled}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    );
  }

  // Button variant (default for login page)
  return (
    <>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
          h-10 w-10 p-0
          ${currentTheme === 'dark'
            ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-600'
            : 'bg-gray-900 text-gray-100 hover:bg-gray-800'
          }
          ${className}
        `}
        aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {mounted ? (
          currentTheme === 'dark' ? (
            // Sun icon for dark mode (click to go to light)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
              />
            </svg>
          ) : (
            // Moon icon for light mode (click to go to dark)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          )
        ) : (
          // Loading spinner
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </button>

      {/* Confirmation dialog for login process */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Change Theme?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You're currently in the login process. Are you sure you want to change the theme?
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleConfirmToggle}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Yes, Change Theme
              </button>
              <button
                onClick={handleCancelToggle}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
