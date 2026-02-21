'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  billingPlan: string;
  monthlyRateCents: number;
  perCallRateCents: number;
  billingEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenant() {
      try {
        setLoading(true);
        const response = await fetch(`/api/tenants/${params.id}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error.message);
        } else if (data.data) {
          setTenant(data.data);
        }
      } catch (err) {
        setError('Failed to load tenant details');
        console.error('Failed to fetch tenant:', err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchTenant();
    }
  }, [params.id]);

  const handleToggleStatus = async () => {
    if (!tenant) return;

    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.data) {
        setTenant(data.data);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
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

  if (error || !tenant) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">{error || 'Tenant not found'}</p>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/admin/tenants')}>Back to Tenants</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/tenants')}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
              {getStatusBadge(tenant.status)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tenant ID: {tenant.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tenant.status === 'active' ? 'destructive' : 'default'}
            onClick={handleToggleStatus}
          >
            {tenant.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Organization Name
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{tenant.name}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Slug</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">{tenant.slug}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>{getStatusBadge(tenant.status)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billing Email</p>
                  <p className="mt-1">{tenant.billingEmail || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="mt-1">
                    {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">
                    {new Date(tenant.updatedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {tenant.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{tenant.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Billing Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium capitalize">{tenant.billingPlan}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{formatCurrency(tenant.monthlyRateCents)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Per Call Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{formatCurrency(tenant.perCallRateCents)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billing Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{tenant.billingEmail || 'No billing email set'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">
                PBX connections will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">
                Users for this tenant will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
