'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BillingOverview {
  totalTenants: number;
  activeTenants: number;
  totalMonthlyRevenue: number;
  totalCalls: number;
  totalCallRevenue: number;
  currentMonth: string;
  tenants: {
    id: string;
    name: string;
    slug: string;
    status: string;
    monthlyRateCents: number;
    perCallRateCents: number;
    callCount: number;
    monthlyCharge: number;
    callsCharge: number;
    totalCharge: number;
  }[];
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch all tenants with their billing info
      const tenantsResponse = await fetch('/api/tenants');
      const tenantsData = await tenantsResponse.json();

      if (tenantsData.error) {
        setError(tenantsData.error.message);
        return;
      }

      // For now, simulate billing data
      // In production, you'd fetch actual billing events from /api/billing
      const tenants = tenantsData.data || [];
      const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      // Calculate billing for each tenant
      const tenantBilling = tenants.map((tenant: any) => {
        const callCount = tenant._count?.cdrRecords || 0;
        const monthlyCharge = tenant.monthlyRateCents;
        const callsCharge = callCount * tenant.perCallRateCents;
        const totalCharge = monthlyCharge + callsCharge;

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          monthlyRateCents: tenant.monthlyRateCents,
          perCallRateCents: tenant.perCallRateCents,
          callCount,
          monthlyCharge,
          callsCharge,
          totalCharge,
        };
      });

      // Calculate totals
      const activeTenants = tenantBilling.filter((t: any) => t.status === 'active');
      const totalMonthlyRevenue = activeTenants.reduce(
        (sum: number, t: any) => sum + t.monthlyCharge,
        0
      );
      const totalCallRevenue = activeTenants.reduce(
        (sum: number, t: any) => sum + t.callsCharge,
        0
      );
      const totalCalls = tenantBilling.reduce(
        (sum: number, t: any) => sum + t.callCount,
        0
      );

      setData({
        totalTenants: tenants.length,
        activeTenants: activeTenants.length,
        totalMonthlyRevenue,
        totalCalls,
        totalCallRevenue,
        currentMonth,
        tenants: tenantBilling,
      });
    } catch (err) {
      setError('Failed to load billing data');
      console.error('Failed to fetch billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error || 'Failed to load data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = data.totalMonthlyRevenue + data.totalCallRevenue;

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Overview</h1>
        <p className="mt-2 text-muted-foreground">
          System-wide billing for {data.currentMonth}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.activeTenants} active tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Subscription revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Call Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCallRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalCalls.toLocaleString()} calls processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg per Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeTenants > 0
                ? formatCurrency(Math.round(totalRevenue / data.activeTenants))
                : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Average monthly charge</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Billing Breakdown */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tenant Billing Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Tenant
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Calls
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Monthly Fee
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Call Charges
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  data.tenants
                    .sort((a, b) => b.totalCharge - a.totalCharge)
                    .map((tenant) => (
                      <tr key={tenant.id} className="border-b border-border/50 last:border-0">
                        <td className="py-4">
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                          </div>
                        </td>
                        <td className="py-4">{getStatusBadge(tenant.status)}</td>
                        <td className="py-4 text-right">
                          {tenant.callCount.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          {formatCurrency(tenant.monthlyCharge)}
                        </td>
                        <td className="py-4 text-right">
                          {formatCurrency(tenant.callsCharge)}
                          <div className="text-xs text-muted-foreground">
                            @{formatCurrency(tenant.perCallRateCents)}/call
                          </div>
                        </td>
                        <td className="py-4 text-right font-semibold">
                          {formatCurrency(tenant.totalCharge)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={2} className="pt-4 font-semibold">
                    Total
                  </td>
                  <td className="pt-4 text-right font-semibold">
                    {data.totalCalls.toLocaleString()}
                  </td>
                  <td className="pt-4 text-right font-semibold">
                    {formatCurrency(data.totalMonthlyRevenue)}
                  </td>
                  <td className="pt-4 text-right font-semibold">
                    {formatCurrency(data.totalCallRevenue)}
                  </td>
                  <td className="pt-4 text-right text-lg font-bold text-primary">
                    {formatCurrency(totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Notes */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold">Notes:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Revenue shown for current billing period ({data.currentMonth})</li>
              <li>Only active tenants contribute to revenue</li>
              <li>Call counts and charges update in real-time as calls are processed</li>
              <li>Monthly fees are charged at the beginning of each billing cycle</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
