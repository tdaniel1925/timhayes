'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportStats {
  totalCalls: number;
  answeredCalls: number;
  avgDuration: number;
  answerRate: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
  satisfaction: {
    satisfied: number;
    neutral: number;
    dissatisfied: number;
  };
  escalation: {
    low: number;
    medium: number;
    high: number;
  };
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('30');

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const params = new URLSearchParams();

        // Calculate date range
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - parseInt(dateRange, 10));

        params.set('dateFrom', dateFrom.toISOString());
        params.set('dateTo', dateTo.toISOString());

        const response = await fetch(`/api/dashboard/stats?${params}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.data) {
          setStats(data.data);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 15 seconds');
        } else {
          console.error('Failed to fetch stats:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [dateRange]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-2 text-muted-foreground">Analytics and insights for your call data</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Call Volume Report */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Call Volume Summary</CardTitle>
          <CardDescription>Overview of call activity in selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="mt-2 text-3xl font-bold text-primary">{stats?.totalCalls || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Answered Calls</p>
              <p className="mt-2 text-3xl font-bold text-green-500">{stats?.answeredCalls || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Answer Rate</p>
              <p className="mt-2 text-3xl font-bold">{stats?.answerRate || 0}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
              <p className="mt-2 text-3xl font-bold">{formatDuration(stats?.avgDuration || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis Report */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Distribution of call sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                  Positive
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.sentiment.positive || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats?.sentiment.positive || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Neutral</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.sentiment.neutral || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats?.sentiment.neutral || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  Negative
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.sentiment.negative || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats?.sentiment.negative || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                  Mixed
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.sentiment.mixed || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats?.sentiment.mixed || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Satisfaction Report */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Customer Satisfaction</CardTitle>
          <CardDescription>Predicted customer satisfaction levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                  Satisfied
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.satisfaction.satisfied || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-500">
                  {stats?.satisfaction.satisfied || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Neutral</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.satisfaction.neutral || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats?.satisfaction.neutral || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  Dissatisfied
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.satisfaction.dissatisfied || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-500">
                  {stats?.satisfaction.dissatisfied || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Risk Report */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Escalation Risk</CardTitle>
          <CardDescription>Calls flagged for potential escalation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Low Risk</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.escalation.low || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{stats?.escalation.low || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                  Medium Risk
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.escalation.medium || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-yellow-500">
                  {stats?.escalation.medium || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  High Risk
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats?.escalation.high || 0} calls
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-500">
                  {stats?.escalation.high || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Download reports for further analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" disabled>
              Export as PDF
            </Button>
            <Button variant="outline" disabled>
              Export as CSV
            </Button>
            <p className="flex items-center text-sm text-muted-foreground">
              Export functionality coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
