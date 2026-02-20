export default function UnauthorizedPage() {
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-8">
          <a
            href="/login"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
