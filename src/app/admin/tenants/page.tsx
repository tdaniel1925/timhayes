'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'cancelled';
  billingPlan: string;
  monthlyRateCents: number;
  perCallRateCents: number;
  billingEmail: string | null;
  createdAt: string;
  _count?: {
    users: number;
    pbxConnections: number;
    cdrRecords: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenants');
      const data = await response.json();

      if (data.error) {
        setError(data.error.message);
      } else if (data.data) {
        setTenants(data.data);
      }
    } catch (err) {
      setError('Failed to load tenants');
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      suspended: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      cancelled: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    };

    return (
      <Badge variant="default" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error}</p>
            <div className="mt-4 text-center">
              <Button onClick={fetchTenants}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="mt-2 text-muted-foreground">
            Manage client organizations and their subscriptions
          </p>
        </div>
        <Link href="/admin/tenants/new">
          <Button>Create Tenant</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter((t) => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter((t) => t.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <div className="mt-8">
        {tenants.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <p className="text-muted-foreground">No tenants found</p>
                <Link href="/admin/tenants/new" className="mt-4 inline-block">
                  <Button>Create Your First Tenant</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">
                            {tenant.name}
                          </h3>
                        </Link>
                        {getStatusBadge(tenant.status)}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Slug: {tenant.slug}
                      </p>
                      {tenant.billingEmail && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Billing: {tenant.billingEmail}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pricing</p>
                      <p className="font-semibold">
                        {formatCurrency(tenant.monthlyRateCents)}/mo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        + {formatCurrency(tenant.perCallRateCents)}/call
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {formatDate(tenant.createdAt)}
                    </div>
                    {tenant._count && (
                      <>
                        <div>
                          <span className="font-medium">Users:</span> {tenant._count.users || 0}
                        </div>
                        <div>
                          <span className="font-medium">Connections:</span>{' '}
                          {tenant._count.pbxConnections || 0}
                        </div>
                        <div>
                          <span className="font-medium">Calls:</span>{' '}
                          {tenant._count.cdrRecords?.toLocaleString() || 0}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/admin/tenants/${tenant.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {tenant.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-500 hover:text-yellow-600"
                      >
                        Suspend
                      </Button>
                    )}
                    {tenant.status === 'suspended' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-500 hover:text-green-600"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
