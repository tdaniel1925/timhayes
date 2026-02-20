export function Header({ title }: { title?: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
        {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
      </div>
      <div className="flex items-center gap-4">
        {/* Notification bell placeholder */}
        <button className="rounded-md p-2 hover:bg-accent">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
        {/* User menu placeholder */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          U
        </button>
      </div>
    </header>
  );
}
