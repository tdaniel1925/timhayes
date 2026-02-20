export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">AudiaPro</h1>
          <p className="mt-2 text-muted-foreground">
            AI-Powered Call Analytics
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold">Sign In</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Login functionality will be implemented in Stage 2
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="you@example.com"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="••••••••"
                disabled
              />
            </div>
            <button
              className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground opacity-50"
              disabled
            >
              Sign In
            </button>
          </div>
          <div className="mt-4 text-center text-sm">
            <a href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
