import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Phone, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [callsData, statsData] = await Promise.all([
        api.getCalls(50, 0),
        api.getStats()
      ]);

      setCalls(callsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'text-gray-500';
    return sentiment === 'POSITIVE' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">CallInsight AI</h1>
            <p className="text-sm text-muted-foreground">{user?.tenant?.company_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Calls
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_calls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time calls recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Answered Calls
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.answered_calls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully connected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transcribed
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.transcribed_calls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI-powered transcriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Configuration Info */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Your Webhook Configuration</CardTitle>
            <CardDescription>Use these settings in your CloudUCM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Webhook URL:</p>
                <code className="bg-white px-3 py-2 rounded border block">
                  /api/webhook/cdr/{user?.tenant?.subdomain}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Subdomain:</p>
                <code className="bg-white px-3 py-2 rounded border block">
                  {user?.tenant?.subdomain}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Plan:</p>
                <span className="bg-white px-3 py-2 rounded border block capitalize">
                  {user?.tenant?.plan}
                </span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Features:</p>
                <div className="bg-white px-3 py-2 rounded border">
                  {user?.tenant?.transcription_enabled && '✓ Transcription '}
                  {user?.tenant?.sentiment_enabled && '✓ Sentiment'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Calls
            </CardTitle>
            <CardDescription>
              Your latest call records with AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No calls yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make a call on your UCM system to see it appear here
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Caller</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transcription</TableHead>
                      <TableHead>Sentiment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{call.src || '-'}</TableCell>
                        <TableCell>{call.dst || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {call.caller_name || '-'}
                        </TableCell>
                        <TableCell>{formatDuration(call.duration)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            call.disposition === 'ANSWERED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {call.disposition}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {call.transcription || '-'}
                        </TableCell>
                        <TableCell>
                          {call.sentiment ? (
                            <span className={`font-medium ${getSentimentColor(call.sentiment)}`}>
                              {call.sentiment}
                              {call.sentiment_score && ` (${(call.sentiment_score * 100).toFixed(0)}%)`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
