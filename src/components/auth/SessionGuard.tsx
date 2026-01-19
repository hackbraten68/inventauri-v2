import { useEffect } from 'react';

interface SessionGuardProps {
  redirectTo?: string;
}

export function SessionGuard({ redirectTo = '/login' }: SessionGuardProps) {
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function ensureSession() {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('session invalid');
        }
      } catch {
        if (cancelled) return;
        if (window.location.pathname !== redirectTo) {
          window.location.href = `${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    void ensureSession();

    const handleVisibility = () => {
      if (!document.hidden) {
        void ensureSession();
      }
    };

    const handleFocus = () => {
      void ensureSession();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    interval = setInterval(() => {
      void ensureSession();
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (interval) clearInterval(interval);
    };
  }, [redirectTo]);

  return null;
}
