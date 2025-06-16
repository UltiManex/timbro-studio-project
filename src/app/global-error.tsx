// Error components must be Client Components
'use client'; 

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/icons'; Link;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
          <div className="mb-8">
             <a href="/" aria-label="Go to Homepage">
                <Logo className="h-8 w-auto" />
             </a>
          </div>
          <Card className="w-full max-w-md text-center shadow-xl">
            <CardHeader>
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <CardTitle className="text-2xl font-headline">Application Error</CardTitle>
              <CardDescription className="text-muted-foreground">
                A critical error occurred. We apologize for the inconvenience. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4 text-left bg-muted p-3 rounded-md text-xs">
                  <summary className="cursor-pointer font-medium">Error Details (Dev Only)</summary>
                  <p className="mt-2 whitespace-pre-wrap">
                    {error?.message}
                    {error?.digest && ` (Digest: ${error.digest})`}
                  </p>
                  {error?.stack && <pre className="mt-2 overflow-x-auto">{error.stack}</pre>}
                </details>
              )}
              <p className="text-sm text-muted-foreground">
                Please try refreshing the application or returning to the homepage.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => reset()} variant="outline">
                Try to Recover
              </Button>
               <Button asChild>
                <a href="/">Go to Homepage</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}
