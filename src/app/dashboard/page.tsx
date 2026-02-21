'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CallVolumeChart } from '@/components/dashboard/call-volume-chart';
import { SentimentPieChart } from '@/components/dashboard/sentiment-pie-chart';
import { KeywordsBarChart } from '@/components/dashboard/keywords-bar-chart';
import { PeakHoursHeatmap } from '@/components/dashboard/peak-hours-heatmap';

interface DashboardStats {
  totalCalls: number;
  answeredCalls: number;
  avgDuration: number;
  pendingAnalysis: number;
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
  trend: Array<{
    date: string;
    total: number;
    answered: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch('/api/dashboard/stats', {
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
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Overview of your call analytics</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.totalCalls || 0}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats?.answerRate || 0}% answer rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(stats?.avgDuration || 0)}</div>
            <p className="mt-2 text-xs text-muted-foreground">Average call length</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                {stats?.sentiment.positive || 0} positive
              </Badge>
              <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                {stats?.sentiment.negative || 0} negative
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{stats?.sentiment.neutral || 0} neutral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingAnalysis || 0}</div>
            <p className="mt-2 text-xs text-muted-foreground">Calls awaiting AI analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                {stats?.satisfaction.satisfied || 0} satisfied
              </Badge>
              <Badge variant="secondary">{stats?.satisfaction.neutral || 0} neutral</Badge>
              <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                {stats?.satisfaction.dissatisfied || 0} dissatisfied
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escalation Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="secondary">{stats?.escalation.low || 0} low</Badge>
              <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                {stats?.escalation.medium || 0} medium
              </Badge>
              <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                {stats?.escalation.high || 0} high
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CallVolumeChart data={stats?.trend || []} isLoading={loading} />
        <SentimentPieChart data={stats?.sentiment || { positive: 0, neutral: 0, negative: 0, mixed: 0 }} isLoading={loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <KeywordsBarChart
          data={[
            { keyword: 'pricing', count: 45 },
            { keyword: 'support', count: 38 },
            { keyword: 'delivery', count: 32 },
            { keyword: 'refund', count: 28 },
            { keyword: 'technical', count: 25 },
          ]}
          isLoading={loading}
        />
        <PeakHoursHeatmap
          data={{
            Monday: { 9: 5, 10: 8, 11: 12, 14: 15, 15: 18, 16: 10 },
            Tuesday: { 9: 6, 10: 10, 11: 14, 14: 16, 15: 20, 16: 12 },
            Wednesday: { 9: 7, 10: 11, 11: 15, 14: 18, 15: 22, 16: 14 },
            Thursday: { 9: 8, 10: 9, 11: 13, 14: 17, 15: 19, 16: 11 },
            Friday: { 9: 4, 10: 7, 11: 10, 14: 12, 15: 14, 16: 8 },
            Saturday: { 10: 2, 11: 3, 14: 4 },
            Sunday: { 10: 1, 11: 2 },
          }}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
