import { useEffect, useState } from 'react';
import { Label } from './label';

const STORAGE_KEY = 'inventauri-theme';

type ThemePreference = 'dark' | 'system' | 'catppuccin';

type ThemeToggleProps = {
  className?: string;
};

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  }
  if (preference === 'catppuccin') {
    return 'dark';
  }
  return preference;
}

function applyTheme(preference: ThemePreference) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.remove('catppuccin');
  if (preference === 'catppuccin') {
    root.classList.add('catppuccin');
    root.classList.add('dark');
  } else {
    root.classList.remove('catppuccin');
    root.classList.toggle('dark', resolved === 'dark');
  }
  root.dataset.theme = preference === 'catppuccin' ? 'catppuccin' : resolved;
  root.dataset.themePreference = preference;
  try {
    document.cookie = `inventauri-theme=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch (err) {
    console.warn('Failed to persist theme cookie', err);
  }
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const datasetPreference = document.documentElement.dataset.themePreference as ThemePreference | undefined;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const initial: ThemePreference = stored && (stored === 'dark' || stored === 'system' || stored === 'catppuccin')
      ? stored
      : datasetPreference && (datasetPreference === 'dark' || datasetPreference === 'system' || datasetPreference === 'catppuccin')
        ? datasetPreference
        : 'dark';
    setPreference(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, preference);
    applyTheme(preference);
  }, [preference, mounted]);

  useEffect(() => {
    if (!mounted || preference !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [preference, mounted]);

  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Theme</Label>
      <select
        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
      >
        <option value="dark">Dark</option>
        <option value="system">System Default</option>
        <option value="catppuccin">Catppuccin (fun)</option>
      </select>
    </div>
  );
}
