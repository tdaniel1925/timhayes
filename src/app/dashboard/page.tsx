export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Analytics overview will be implemented in Stage 5
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Calls</h3>
          <p className="mt-2 text-3xl font-bold">---</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Avg Duration</h3>
          <p className="mt-2 text-3xl font-bold">---</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Avg Sentiment</h3>
          <p className="mt-2 text-3xl font-bold">---</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Analysis</h3>
          <p className="mt-2 text-3xl font-bold">---</p>
        </div>
      </div>
    </div>
  );
}
