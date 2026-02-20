'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { name: 'Tenants', href: '/admin/tenants', icon: 'Building2' },
  { name: 'Connections', href: '/admin/connections', icon: 'Cable' },
  { name: 'Users', href: '/admin/users', icon: 'Users' },
  { name: 'Jobs', href: '/admin/jobs', icon: 'Layers' },
  { name: 'Billing', href: '/admin/billing', icon: 'DollarSign' },
  { name: 'Calls', href: '/admin/calls', icon: 'Phone' },
  { name: 'Health', href: '/admin/health', icon: 'Activity' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold text-primary">AudiaPro</h1>
        <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span className="text-lg">•</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Super Admin</p>
            <p className="text-xs text-muted-foreground">admin@audiapro.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
