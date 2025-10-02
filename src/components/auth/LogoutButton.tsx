import * as React from 'react';
import { supabase } from '../../lib/supabase-client';
import { Button } from '../ui/button';

export function LogoutButton() {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Redirect to login page
      window.location.href = '/login';
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Abmeldung fehlgeschlagen.';
      console.error('Logout error:', message);
      alert(message); // Simple alert for now
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="w-full justify-start"
    >
      {loading ? 'Lädt...' : 'Abmelden'}
    </Button>
  );
}
