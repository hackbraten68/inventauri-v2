import * as React from 'react';
import { supabase } from '../../lib/supabase-client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { setAccessTokenCookie } from '../../lib/auth/cookies';
import { useTranslation } from '../../i18n/react-integration';
import { useEffect } from 'react';

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

  // Use the React translation hook
  const { t, language } = useTranslation();
  
  // Log when the component re-renders due to language changes
  useEffect(() => {
    console.log('🌐 LoginForm: Language changed to', language);
  }, [language]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔍 LoginForm: Starting authentication process...');
      console.log('🔍 LoginForm: Email:', email);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('🔍 LoginForm: Supabase response:', { data: data ? 'SESSION RECEIVED' : 'NO DATA', error: signInError });

      if (signInError) {
        console.error('❌ LoginForm: Authentication failed:', signInError);
        setError(t('auth.loginFailed', { message: signInError.message }));
        setLoading(false);
        return;
      }

      if (data.session) {
        console.log('✅ LoginForm: Session received successfully');
        console.log('🔍 LoginForm: Session details:', {
          user: data.session.user?.email,
          expires: data.session.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'No expiry'
        });

        // Set cookie immediately
        setAccessTokenCookie(data.session.access_token, data.session.expires_in ?? undefined);

        // Also set the session in Supabase client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        console.log('✅ LoginForm: Session and cookie set, redirecting...');

        setSuccess(t('auth.loginSuccess', { message: 'Anmeldung erfolgreich. Weiterleitung...' }));

        // Small delay to ensure everything is set
        setTimeout(() => {
          console.log('🔄 LoginForm: Redirecting to:', redirectTo);
          window.location.href = redirectTo;
        }, 100);
      } else {
        console.error('❌ LoginForm: No session received from Supabase');
        setError(t('auth.loginFailed', { message: 'Anmeldung fehlgeschlagen. Keine Session vom Server erhalten.' }));
        setLoading(false);
      }
    } catch (cause) {
      console.error('💥 LoginForm: Unexpected error:', cause);
      const message = cause instanceof Error ? cause.message : 'Unerwarteter Fehler bei der Anmeldung.';
      setError(t('auth.error', { message: message || 'An unknown error occurred' }));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email', { defaultValue: 'E-Mail' })}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('form.emailPlaceholder', { defaultValue: 'ihre@email.com' })}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.password', { defaultValue: 'Passwort' })}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t('form.passwordPlaceholder', { defaultValue: '••••••••' })}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-3 text-sm">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{t(success, { defaultValue: success })}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('form.loading', { defaultValue: 'Lädt...' }) : t('auth.login', { defaultValue: 'Anmelden' })}
      </Button>
    </form>
  );
}
