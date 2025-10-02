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
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const themeService = getThemeService();

  useEffect(() => {
    // Set mounted immediately to avoid hydration issues
    setMounted(true);

    // Get initial theme
    const initialTheme = themeService.getCurrentTheme();
    setCurrentTheme(initialTheme);

    // Subscribe to theme changes
    const unsubscribe = themeService.subscribe((preference) => {
      setCurrentTheme(preference.theme);
    });

    return unsubscribe;
  }, []);

  const handleToggle = () => {
    if (disabled) {
      setShowConfirmation(true);
      return;
    }

    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeService.setTheme(newTheme);
    onToggle?.(newTheme);
  };

  const handleConfirmToggle = () => {
    setShowConfirmation(false);
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeService.setTheme(newTheme);
    onToggle?.(newTheme);
  };

  const handleCancelToggle = () => {
    setShowConfirmation(false);
  };

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

  // Slider variant (default)
  return (
    <>
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors ${className}`}>
        <div className="flex items-center gap-2">
          {mounted && currentTheme === 'dark' ? (
            // Moon icon for dark mode
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
          ) : mounted && currentTheme === 'light' ? (
            // Sun icon for light mode
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
            // Sun icon as default (loading state)
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
          )}
          <span className="text-xs text-muted-foreground">
            {mounted ? (currentTheme === 'dark' ? 'Dark' : 'Light') : 'Theme'}
          </span>
        </div>

        {/* Slider toggle */}
        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
              mounted
                ? currentTheme === 'dark'
                  ? 'translate-x-6'
                  : 'translate-x-1'
                : 'translate-x-1'
            }`}
          />
          <button
            onClick={handleToggle}
            disabled={disabled}
            className="absolute inset-0 h-full w-full cursor-pointer rounded-full"
            aria-label={`Switch to ${mounted ? (currentTheme === 'dark' ? 'light' : 'dark') : 'dark'} mode`}
            title={`Switch to ${mounted ? (currentTheme === 'dark' ? 'light' : 'dark') : 'dark'} mode`}
          />
        </div>
      </div>

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
