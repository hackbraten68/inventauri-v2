import * as React from 'react';
import { Button } from '../ui/button';

interface LogoutButtonProps {
  redirectTo?: string;
}

export function LogoutButton({ redirectTo = '/login' }: LogoutButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Abmeldung fehlgeschlagen.');
      }
      window.location.href = redirectTo;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Abmelden fehlgeschlagen.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" className="justify-start" onClick={handleSignOut} disabled={loading}>
        {loading ? 'Wird abgemeldet …' : 'Abmelden'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
