'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Call {
  id: string;
  src: string | null;
  dst: string | null;
  callerName: string | null;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  disposition: string | null;
  recordingFilename: string | null;
  transcriptStatus: string;
  analysisStatus: string;
}

export default function CallsPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [disposition, setDisposition] = useState<string>('all');

  useEffect(() => {
    async function fetchCalls() {
      try {
        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '20',
        });

        if (disposition !== 'all') {
          params.set('disposition', disposition);
        }

        const response = await fetch(`/api/dashboard/calls?${params}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.data) {
          setCalls(data.data);
          setTotalPages(data.meta?.totalPages || 1);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 15 seconds');
        } else {
          console.error('Failed to fetch calls:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCalls();
  }, [page, disposition]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDispositionBadge = (disposition: string | null) => {
    if (!disposition) return <Badge variant="secondary">Unknown</Badge>;

    const variants: Record<string, string> = {
      answered: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      no_answer: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      busy: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
      failed: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    };

    return (
      <Badge variant="default" className={variants[disposition] || ''}>
        {disposition.replace('_', ' ')}
      </Badge>
    );
  };

  const getAnalysisBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      processing: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      failed: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
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
        <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
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
          <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
          <p className="mt-2 text-muted-foreground">View and analyze all your call recordings</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={disposition} onValueChange={setDisposition}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Dispositions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dispositions</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Analysis</TableHead>
              <TableHead>Recording</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No calls found
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow
                  key={call.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                >
                  <TableCell className="font-medium">
                    {formatDateTime(call.startTime)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{call.src || 'Unknown'}</div>
                      {call.callerName && (
                        <div className="text-xs text-muted-foreground">{call.callerName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{call.dst || 'Unknown'}</TableCell>
                  <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
                  <TableCell>{getDispositionBadge(call.disposition)}</TableCell>
                  <TableCell>{getAnalysisBadge(call.analysisStatus)}</TableCell>
                  <TableCell>
                    {call.recordingFilename ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
