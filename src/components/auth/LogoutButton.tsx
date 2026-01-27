import * as React from 'react';
import { Button } from '../ui/button';

interface LogoutButtonProps {
  redirectTo?: string;
  variant?: 'default' | 'dropdown-item';
}

import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '../ui/dropdown-menu';

export function LogoutButton({ redirectTo = '/login', variant = 'default' }: LogoutButtonProps) {
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

  if (variant === 'dropdown-item') {
    return (
      <DropdownMenuItem
        onClick={handleSignOut}
        disabled={loading}
        className="text-destructive focus:text-destructive gap-2 cursor-pointer"
      >
        <LogOut size={14} />
        <span>{loading ? 'Wird abgemeldet …' : 'Abmelden'}</span>
      </DropdownMenuItem>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" className="justify-start gap-2" onClick={handleSignOut} disabled={loading}>
        <LogOut size={16} />
        {loading ? 'Wird abgemeldet …' : 'Abmelden'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
