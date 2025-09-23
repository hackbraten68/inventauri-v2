'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, MailQuestion, AlertCircle } from 'lucide-react';

import { useSupabase } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      console.error('Error sending reset email:', error);
      const message = error instanceof Error ? error.message : 'Unable to send reset link. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.25),transparent_60%)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 border border-transparent hover:border-border/40">
          <Link href="/auth/signin">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </Button>

        <Card className="border border-border/50 bg-black/45 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-content-center rounded-full bg-primary/10 text-primary">
                <MailQuestion className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-xl text-foreground">Forgot password</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your email address and we will send you a reset link.
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
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="text-foreground">Check your inbox</p>
                <p>
                  We sent a reset link to <span className="font-medium text-foreground">{email}</span>. Follow the instructions
                  to choose a new password.
                </p>
                <Button asChild variant="outline" className="w-full border-border/60">
                  <Link href="/auth/signin">Return to sign in</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending reset link…' : 'Send reset link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
