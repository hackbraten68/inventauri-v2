'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, LockKeyhole, AlertCircle } from 'lucide-react';

import { useSupabase } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UpdatePasswordPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setAccessToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const update = accessToken
        ? supabase.auth.updateUser({ password }, { accessToken })
        : supabase.auth.updateUser({ password });

      const { error } = await update;
      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2500);
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      const message = error instanceof Error ? error.message : 'Unable to update password. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.25),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border border-border/50 bg-black/45 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-content-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-xl text-foreground">Set a new password</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter and confirm your new password to secure your account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4 text-center text-sm text-muted-foreground">
                <p className="text-foreground">Password updated</p>
                <p>You will be redirected to the sign-in page shortly.</p>
                <Button asChild variant="outline" className="w-full border-border/60">
                  <Link href="/auth/signin">Return to sign in</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wide text-muted-foreground">
                    New password
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Must contain at least 8 characters.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Remembered your password?{' '}
              <Link href="/auth/signin" className="text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
