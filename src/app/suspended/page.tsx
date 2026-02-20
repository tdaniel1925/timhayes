export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
            <svg
              className="h-10 w-10 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Account Suspended</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your account has been temporarily suspended.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          This is usually due to a billing issue or policy violation. Please contact support to
          resolve this issue and reactivate your account.
        </p>
        <div className="mt-8 space-y-3">
          <a
            href="mailto:support@audiapro.com"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Contact Support
          </a>
          <div>
            <a
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
