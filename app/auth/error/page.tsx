'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'There was a server configuration issue. Please contact support.',
  AccessDenied: 'You do not have permission to sign in with this account.',
  Verification: 'The verification link has expired. Request a new sign-in link.',
  NoOrganization: 'We could not find an organization for this user. Reach out to your administrator.',
  Default: 'Something went wrong while signing you in. Please try again.',
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params?.get('error');
  const message = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default : ERROR_MESSAGES.Default;

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.25),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border border-destructive/40 bg-black/50 text-foreground">
          <CardHeader className="space-y-3 text-center">
            <span className="mx-auto grid h-12 w-12 place-content-center rounded-full bg-destructive/20 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <CardTitle className="text-2xl">Authentication error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center text-sm text-muted-foreground">
            <p>{message}</p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Back to sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-border/60">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
