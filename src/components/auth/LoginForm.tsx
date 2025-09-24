import * as React from 'react';
import { supabase } from '../../lib/supabase-client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { setAccessTokenCookie } from '../../lib/auth/cookies';

interface LoginFormProps {
  className?: string;
  redirectTo?: string;
}

export function LoginForm({ className, redirectTo = '/dashboard' }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.session) {
        setAccessTokenCookie(data.session.access_token, data.session.expires_in ?? undefined);
      }

      setSuccess('Login erfolgreich. Du wirst weitergeleitet …');
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 300);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unbekannter Fehler beim Login.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="du@inventauri.app"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-3 text-sm">
        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-primary">
            {success}
          </p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Anmeldung läuft …' : 'Mit Supabase anmelden'}
      </Button>
    </form>
  );
}
