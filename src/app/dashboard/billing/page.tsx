'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';

interface UsageData {
  currentMonth: {
    callCount: number;
    monthlyCharge: number;
    perCallCharge: number;
    totalCharge: number;
  };
  history: Array<{
    id: string;
    month: string;
    callCount: number;
    totalCharge: number;
    status: string;
  }>;
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch('/api/dashboard/billing', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.data) {
          setUsage(data.data);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 15 seconds');
        } else {
          console.error('Failed to fetch billing data:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      open: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
      overdue: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    };

    return (
      <Badge variant="default" className={variants[status] || ''}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
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
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 text-muted-foreground">View your usage and billing history</p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Current Month Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Month Usage</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Calls Processed</p>
                <p className="mt-1 text-2xl font-bold">{usage?.currentMonth.callCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Base</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(usage?.currentMonth.monthlyCharge || 34900)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usage Charges</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(usage?.currentMonth.perCallCharge || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {formatCurrency(usage?.currentMonth.totalCharge || 34900)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-surface p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Pricing:</strong> $349/month base + $0.10 per call analyzed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {usage?.history && usage.history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.history.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.month}</TableCell>
                      <TableCell>{invoice.callCount}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalCharge)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No billing history available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to update payment methods
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
