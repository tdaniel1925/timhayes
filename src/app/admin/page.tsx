'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdminStats {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    cancelled: number;
  };
  connections: {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
  };
  calls: {
    today: number;
  };
  jobs: {
    failed: number;
    pending: number;
    processing: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (data.data) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="mt-2 text-muted-foreground">Monitor your entire AudiaPro infrastructure</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.tenants.total || 0}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                {stats?.tenants.active || 0} active
              </Badge>
              {stats && stats.tenants.suspended > 0 && (
                <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                  {stats.tenants.suspended} suspended
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PBX Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.connections.total || 0}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                {stats?.connections.connected || 0} connected
              </Badge>
              {stats && stats.connections.error > 0 && (
                <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  {stats.connections.error} error
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calls Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.calls.today || 0}</div>
            <p className="mt-2 text-xs text-muted-foreground">Processed in the last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Job Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats?.jobs.failed || 0}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                {stats?.jobs.failed || 0} failed
              </Badge>
              <Badge variant="secondary">{stats?.jobs.pending || 0} pending</Badge>
              {stats && stats.jobs.processing > 0 && (
                <Badge variant="default" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                  {stats.jobs.processing} processing
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">Manage Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, edit, and manage tenant accounts
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">PBX Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure and test PBX system connections
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage super admin and client admin users
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
