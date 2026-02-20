export default function TenantsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="mt-2 text-muted-foreground">
            Tenant management will be implemented in Stage 2
          </p>
        </div>
        <a
          href="/admin/tenants/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Tenant
        </a>
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-center text-muted-foreground">No tenants to display</p>
      </div>
    </div>
  );
}
