'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry or error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Something Went Wrong</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 space-x-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
