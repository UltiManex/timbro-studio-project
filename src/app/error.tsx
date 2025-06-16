// Error components must be Client Components
'use client'; 

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl font-headline">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-muted-foreground">
            We've encountered an unexpected error. Our team has been notified.
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
            You can try to refresh the page or go back to the dashboard.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => reset()} variant="outline">
            Try Again
          </Button>
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
