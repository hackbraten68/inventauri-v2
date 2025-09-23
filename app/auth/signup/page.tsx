'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

import { useSupabase } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const supabase = useSupabase();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: unknown) {
      console.error('Error signing up:', error);
      const message = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(59,130,246,0.25),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up an Inventauri account to start tracking inventory with clarity.
          </p>
        </div>

        <Card className="border border-border/50 bg-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Sign up</CardTitle>
            <CardDescription className="text-muted-foreground">
              Use your email to receive a confirmation link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-6 text-center text-sm text-muted-foreground">
                <p className="text-foreground">Check your email</p>
                <p>
                  We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Follow the
                  instructions to activate your account.
                </p>
                <Button asChild variant="outline" className="w-full border-border/50">
                  <Link href="/auth/signin">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already have access?{' '}
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
