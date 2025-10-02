import { useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { setAccessTokenCookie } from '../../lib/auth/cookies';

interface SessionGuardProps {
  redirectTo?: string;
}

export function SessionGuard({ redirectTo = '/login' }: SessionGuardProps) {
  useEffect(() => {
    let active = true;

    async function ensureSession() {
      console.log('SessionGuard: Checking session...');

      const { data } = await supabase.auth.getSession();
      console.log('SessionGuard: Current session:', data.session ? 'EXISTS' : 'NONE');

      if (!active) return;

      if (data.session) {
        console.log('SessionGuard: Setting access token cookie');
        setAccessTokenCookie(data.session.access_token, data.session.expires_in ?? undefined);
      } else {
        console.log('SessionGuard: No session found, clearing cookie and redirecting');
        setAccessTokenCookie(null);
        if (window.location.pathname !== redirectTo) {
          console.log('SessionGuard: Redirecting to login');
          window.location.href = `${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    void ensureSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('SessionGuard: Auth state changed:', _event, session ? 'SESSION EXISTS' : 'NO SESSION');

      if (session) {
        console.log('SessionGuard: Setting access token cookie from auth change');
        setAccessTokenCookie(session.access_token, session.expires_in ?? undefined);
      } else {
        console.log('SessionGuard: Clearing cookie from auth change');
        setAccessTokenCookie(null);
        if (window.location.pathname !== redirectTo) {
          console.log('SessionGuard: Redirecting to login from auth change');
          window.location.href = `${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    });

    return () => {
      active = false;
      subscription.subscription?.unsubscribe();
    };
  }, [redirectTo]);

  return null;
}
