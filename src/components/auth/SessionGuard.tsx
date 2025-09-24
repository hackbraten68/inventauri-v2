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
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setAccessTokenCookie(data.session.access_token, data.session.expires_in ?? undefined);
      } else {
        setAccessTokenCookie(null);
        if (window.location.pathname !== redirectTo) {
          window.location.href = `${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    void ensureSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAccessTokenCookie(session.access_token, session.expires_in ?? undefined);
      } else {
        setAccessTokenCookie(null);
        if (window.location.pathname !== redirectTo) {
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
