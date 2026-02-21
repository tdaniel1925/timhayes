'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  billingPlan: string;
  billingEmail: string | null;
  createdAt: string;
}

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Get user details
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, role, tenant_id')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              fullName: userData.full_name,
              role: userData.role,
            });

            // Get tenant details
            if (userData.tenant_id) {
              const { data: tenantData } = await supabase
                .from('tenants')
                .select('id, name, slug, status, billing_plan, billing_email, created_at')
                .eq('id', userData.tenant_id)
                .single();

              if (tenantData) {
                setTenant({
                  id: tenantData.id,
                  name: tenantData.name,
                  slug: tenantData.slug,
                  status: tenantData.status,
                  billingPlan: tenantData.billing_plan,
                  billingEmail: tenantData.billing_email,
                  createdAt: tenantData.created_at,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account and organization settings</p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Details about your organization account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Organization Name</Label>
                <p className="mt-1 font-medium">{tenant?.name || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Slug</Label>
                <p className="mt-1 font-mono text-sm">{tenant?.slug || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {tenant?.status ? getStatusBadge(tenant.status) : 'Not available'}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Billing Plan</Label>
                <p className="mt-1 font-medium capitalize">{tenant?.billingPlan || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Billing Email</Label>
                <p className="mt-1 text-sm">{tenant?.billingEmail || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Member Since</Label>
                <p className="mt-1 text-sm">
                  {tenant?.createdAt
                    ? new Date(tenant.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="mt-1 font-medium">{user?.fullName || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="mt-1 text-sm">{user?.email || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {user?.role?.replace('_', ' ') || 'Not available'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PBX Connections */}
        <Card>
          <CardHeader>
            <CardTitle>PBX Connections</CardTitle>
            <CardDescription>Manage your phone system integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to configure PBX connections
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact support to cancel your account or make major changes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
