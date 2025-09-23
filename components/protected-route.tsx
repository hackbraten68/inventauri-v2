'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

import { useSupabase } from "./auth-provider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      if (!session) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      }
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-6 py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Syncing session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
