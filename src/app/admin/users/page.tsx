export default function UsersPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-2 text-muted-foreground">
            User management will be implemented in Stage 2
          </p>
        </div>
        <a
          href="/admin/users/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create User
        </a>
      </div>
    </div>
  );
}
