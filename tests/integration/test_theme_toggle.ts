import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for theme toggle functionality
 * These tests verify the theme switching logic works correctly
 */

describe('Theme Toggle Functionality', () => {
  beforeEach(() => {
    // Mock document.documentElement for DOM manipulation
    vi.spyOn(document, 'documentElement', 'get').mockReturnValue({
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn(),
      }
    } as any);
  });

  it('should toggle from light to dark theme', async () => {
    const { toggleTheme } = await import('../../src/lib/theme');

    const result = toggleTheme('light');
    expect(result).toBe('dark');
  });

  it('should toggle from dark to light theme', async () => {
    const { toggleTheme } = await import('../../src/lib/theme');

    const result = toggleTheme('dark');
    expect(result).toBe('light');
  });

  it('should apply dark theme to document', async () => {
    const { applyTheme } = await import('../../src/lib/theme');
    const mockClassList = document.documentElement.classList as any;

    applyTheme('dark');

    expect(mockClassList.add).toHaveBeenCalledWith('dark');
    expect(mockClassList.remove).not.toHaveBeenCalled();
  });

  it('should apply light theme to document', async () => {
    const { applyTheme } = await import('../../src/lib/theme');
    const mockClassList = document.documentElement.classList as any;

    applyTheme('light');

    expect(mockClassList.remove).toHaveBeenCalledWith('dark');
    expect(mockClassList.add).not.toHaveBeenCalled();
  });

  it('should handle SSR environment gracefully', async () => {
    // Mock window as undefined (SSR environment)
    const originalWindow = global.window;
    delete (global as any).window;

    const { getSystemTheme, applyTheme } = await import('../../src/lib/theme');

    const systemTheme = getSystemTheme();
    expect(systemTheme).toBe('light'); // Should default to light

    // Should not throw error
    expect(() => applyTheme('dark')).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });

  it('should validate theme values correctly', async () => {
    const { isValidTheme } = await import('../../src/lib/theme');

    expect(isValidTheme('light')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
    expect(isValidTheme('invalid')).toBe(false);
    expect(isValidTheme('LIGHT')).toBe(false); // Case sensitive
  });

  it('should validate theme source values correctly', async () => {
    const { isValidThemeSource } = await import('../../src/lib/theme');

    expect(isValidThemeSource('system')).toBe(true);
    expect(isValidThemeSource('user')).toBe(true);
    expect(isValidThemeSource('invalid')).toBe(false);
    expect(isValidThemeSource('SYSTEM')).toBe(false); // Case sensitive
  });
});
