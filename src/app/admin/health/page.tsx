'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HealthData {
  database: {
    status: 'healthy' | 'unhealthy';
    latencyMs: number;
    connections: number;
  };
  storage: {
    status: 'healthy' | 'unhealthy';
    latencyMs: number;
  };
  worker: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    uptime: number;
    activeJobs: number;
    maxConcurrentJobs: number;
    lastCheck: string;
  };
  jobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Fetch system health from API
      const response = await fetch('/api/health', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.error) {
        setError(result.error.message);
      } else if (result.data) {
        setData(result.data);
        setLastRefresh(new Date());
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
        console.error('Request timed out after 15 seconds');
      } else {
        setError('Failed to load health data');
        console.error('Failed to fetch health:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      healthy: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      unhealthy: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      unknown: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
    };

    return (
      <Badge variant="default" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const overallHealthy =
    data?.database.status === 'healthy' &&
    data?.storage.status === 'healthy' &&
    data?.worker.status === 'healthy';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor worker status and system components
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button onClick={fetchHealth} disabled={loading} size="sm" variant="outline">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Overall Status */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Overall System Status</h2>
              <p className="text-sm text-muted-foreground">
                All components must be healthy for optimal performance
              </p>
            </div>
            {data && (
              <div className="text-right">
                {getStatusBadge(overallHealthy ? 'healthy' : 'unhealthy')}
                <p className="mt-1 text-sm text-muted-foreground">
                  {overallHealthy ? 'All systems operational' : 'Some systems degraded'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Component Health */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Database</CardTitle>
              {data && getStatusBadge(data.database.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="font-medium">{data.database.latencyMs}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Connections:</span>
                  <span className="font-medium">{data.database.connections}</span>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  PostgreSQL database via Supabase
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Storage</CardTitle>
              {data && getStatusBadge(data.storage.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="font-medium">{data.storage.latencyMs}ms</span>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Object storage for recordings and transcripts
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Worker */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Background Worker</CardTitle>
              {data && getStatusBadge(data.worker.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data && data.worker.status !== 'unknown' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="font-medium">{formatUptime(data.worker.uptime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Jobs:</span>
                  <span className="font-medium">
                    {data.worker.activeJobs} / {data.worker.maxConcurrentJobs}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Check:</span>
                  <span className="font-medium">
                    {new Date(data.worker.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Processing call recordings, transcription, and AI analysis
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Worker health endpoint not configured or unavailable</p>
                <p className="mt-2 text-xs">
                  Worker should be running at: {process.env.WORKER_URL || 'Not configured'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Job Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-medium text-yellow-500">{data.jobs.pending}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing:</span>
                  <span className="font-medium text-blue-500">{data.jobs.processing}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium text-green-500">{data.jobs.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-medium text-red-500">{data.jobs.failed}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-medium">{process.env.NODE_ENV || 'production'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application URL:</span>
            <span className="font-medium">
              {process.env.NEXT_PUBLIC_APP_URL || 'Not configured'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Worker URL:</span>
            <span className="font-medium">{process.env.WORKER_URL || 'Not configured'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auto Refresh:</span>
            <span className="font-medium">Every 30 seconds</span>
          </div>
        </CardContent>
      </Card>

      {/* Health Tips */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold">Monitoring Tips:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Database latency should be under 50ms for optimal performance</li>
              <li>Worker should always show "healthy" status when jobs are being processed</li>
              <li>Monitor pending jobs - a high number may indicate worker issues</li>
              <li>Failed jobs should be investigated and retried if necessary</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
