'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';

interface Job {
  id: string;
  tenantId: string;
  cdrRecordId: string;
  jobType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  priority: number;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  cdrRecord?: {
    src: string;
    dst: string;
    callerName?: string;
    startTime: string;
  };
}

interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retry: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    retry: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [retrying, setRetrying] = useState(false);

  const fetchJobs = async (status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== 'all') {
        params.set('status', status);
      }
      params.set('limit', '100');

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data || []);
        setStats(data.meta?.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the jobs list
        fetchJobs(selectedStatus);
      }
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const bulkRetry = async () => {
    try {
      setRetrying(true);
      const response = await fetch('/api/jobs/bulk-retry', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.data.count} job(s) queued for retry`);
        // Refresh the jobs list
        fetchJobs(selectedStatus);
      }
    } catch (error) {
      console.error('Failed to bulk retry jobs:', error);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchJobs(selectedStatus);
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => fetchJobs(selectedStatus), 10000);
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'default',
      completed: 'secondary',
      failed: 'destructive',
      retry: 'outline',
    };

    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="h-3 w-3" />,
      processing: <RefreshCw className="h-3 w-3 animate-spin" />,
      completed: <CheckCircle className="h-3 w-3" />,
      failed: <AlertCircle className="h-3 w-3" />,
      retry: <RefreshCw className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center gap-1">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Queue</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor and manage background processing jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchJobs(selectedStatus)}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {(stats.failed > 0 || stats.retry > 0) && (
            <Button
              onClick={bulkRetry}
              disabled={retrying}
            >
              <Play className="h-4 w-4 mr-2" />
              Retry All Failed ({stats.failed + stats.retry})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retry Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.retry}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>
            View and manage all background processing jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="retry">Retry</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Call Details</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Loading jobs...
                        </TableCell>
                      </TableRow>
                    ) : jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No jobs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.jobType}</Badge>
                          </TableCell>
                          <TableCell>
                            {job.cdrRecord ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {job.cdrRecord.callerName || job.cdrRecord.src}
                                </div>
                                <div className="text-muted-foreground">
                                  {job.cdrRecord.src} → {job.cdrRecord.dst}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {job.attempts}/{job.maxAttempts}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(job.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {job.startedAt ? formatDate(job.startedAt) : '—'}
                          </TableCell>
                          <TableCell>
                            {job.errorMessage ? (
                              <span className="text-xs text-red-600 truncate max-w-xs block" title={job.errorMessage}>
                                {job.errorMessage}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {(job.status === 'failed' || job.status === 'retry') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryJob(job.id)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
