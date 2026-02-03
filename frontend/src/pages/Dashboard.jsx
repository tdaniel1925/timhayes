import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Phone, TrendingUp, MessageSquare, BarChart3, Download,
  ChevronLeft, ChevronRight, Search, Settings, Filter, X, FileText, Mail
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import NotificationBell from '@/components/NotificationBell';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({});
  const [callVolume, setCallVolume] = useState([]);
  const [sentimentTrends, setSentimentTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const perPage = 25;

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sentiment: '',
    dateFrom: '',
    dateTo: '',
    minDuration: '',
    maxDuration: ''
  });

  useEffect(() => {
    loadData();
  }, [currentPage, searchQuery, filters]);

  const loadData = async () => {
    try {
      const [callsData, statsData, volumeData, sentimentData] = await Promise.all([
        api.getCalls(currentPage, perPage, searchQuery, filters),
        api.getStats(),
        api.getCallVolume(30),
        api.getSentimentTrends()
      ]);

      setCalls(callsData.calls || []);
      setTotalPages(callsData.pagination?.pages || 1);
      setTotalCalls(callsData.pagination?.total || 0);
      setStats(statsData);
      setCallVolume(volumeData);
      setSentimentTrends(sentimentData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      sentiment: '',
      dateFrom: '',
      dateTo: '',
      minDuration: '',
      maxDuration: ''
    });
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '').length;
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportCallsCSV(searchQuery, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calls-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleEmailReport = async () => {
    const email = prompt('Enter email address to send report to:');
    if (!email) return;

    try {
      await api.emailReport(email, searchQuery, filters);
      alert(`Report sent successfully to ${email}!`);
    } catch (error) {
      console.error('Failed to email report:', error);
      alert('Failed to send report');
    }
  };

  const handleDownloadRecording = async (callId) => {
    try {
      const blob = await api.getRecording(callId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${callId}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download recording:', error);
      alert('Recording not available');
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
    const s = sentiment.toUpperCase();
    if (s === 'POSITIVE') return 'text-green-600';
    if (s === 'NEGATIVE') return 'text-red-600';
    return 'text-yellow-600';
  };

  // Chart colors
  const SENTIMENT_COLORS = {
    'POSITIVE': '#22c55e',
    'NEGATIVE': '#ef4444',
    'NEUTRAL': '#eab308',
    'positive': '#22c55e',
    'negative': '#ef4444',
    'neutral': '#eab308'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
            <h1 className="text-2xl font-bold">AudiaPro</h1>
            <p className="text-sm text-muted-foreground">{user?.tenant?.company_name}</p>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/setup-requests')}
                  className="text-sm"
                >
                  Setup Requests
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/users')}
                  className="text-sm"
                >
                  Users
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/integrations')}
                  className="text-sm"
                >
                  Integrations
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <NotificationBell />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                All time calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Answered
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.answered_calls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.answer_rate || 0}% answer rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missed
              </CardTitle>
              <Phone className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.missed_calls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unanswered calls
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
                AI transcriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Call Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Call Volume (Last 30 Days)</CardTitle>
              <CardDescription>Daily call activity</CardDescription>
            </CardHeader>
            <CardContent>
              {callVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={callVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Calls"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No call data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>Call sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {sentimentTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentTrends}
                      dataKey="count"
                      nameKey="sentiment"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ sentiment, count }) => `${sentiment}: ${count}`}
                    >
                      {sentimentTrends.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SENTIMENT_COLORS[entry.sentiment] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No sentiment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calls Table with Pagination */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Call Records
                </CardTitle>
                <CardDescription>
                  {totalCalls} total calls - Page {currentPage} of {totalPages}
                </CardDescription>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search calls..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button onClick={handleSearch} size="icon" variant="ghost">
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={getActiveFilterCount() > 0 ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-1 bg-white text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="flex items-center gap-2"
                  title="Export to CSV"
                >
                  <FileText className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  onClick={handleEmailReport}
                  variant="outline"
                  className="flex items-center gap-2"
                  title="Email report"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Advanced Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <Label htmlFor="filter-status" className="text-sm font-medium">
                      Call Status
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(val) => {
                        setFilters({ ...filters, status: val });
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger id="filter-status" className="mt-1">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="ANSWERED">Answered</SelectItem>
                        <SelectItem value="NO ANSWER">No Answer</SelectItem>
                        <SelectItem value="BUSY">Busy</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sentiment Filter */}
                  <div>
                    <Label htmlFor="filter-sentiment" className="text-sm font-medium">
                      Sentiment
                    </Label>
                    <Select
                      value={filters.sentiment}
                      onValueChange={(val) => {
                        setFilters({ ...filters, sentiment: val });
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger id="filter-sentiment" className="mt-1">
                        <SelectValue placeholder="All sentiments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All sentiments</SelectItem>
                        <SelectItem value="POSITIVE">Positive</SelectItem>
                        <SelectItem value="NEUTRAL">Neutral</SelectItem>
                        <SelectItem value="NEGATIVE">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div>
                    <Label htmlFor="filter-date-from" className="text-sm font-medium">
                      Date From
                    </Label>
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => {
                        setFilters({ ...filters, dateFrom: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="mt-1"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <Label htmlFor="filter-date-to" className="text-sm font-medium">
                      Date To
                    </Label>
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => {
                        setFilters({ ...filters, dateTo: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="mt-1"
                    />
                  </div>

                  {/* Min Duration */}
                  <div>
                    <Label htmlFor="filter-min-duration" className="text-sm font-medium">
                      Min Duration (seconds)
                    </Label>
                    <Input
                      id="filter-min-duration"
                      type="number"
                      min="0"
                      value={filters.minDuration}
                      onChange={(e) => {
                        setFilters({ ...filters, minDuration: e.target.value });
                        setCurrentPage(1);
                      }}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>

                  {/* Max Duration */}
                  <div>
                    <Label htmlFor="filter-max-duration" className="text-sm font-medium">
                      Max Duration (seconds)
                    </Label>
                    <Input
                      id="filter-max-duration"
                      type="number"
                      min="0"
                      value={filters.maxDuration}
                      onChange={(e) => {
                        setFilters({ ...filters, maxDuration: e.target.value });
                        setCurrentPage(1);
                      }}
                      placeholder="3600"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No calls found matching your search' : 'No calls yet'}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Make a call on your phone system to see it appear here
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Caller</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Sentiment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow
                          key={call.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/call/${call.id}`)}
                        >
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
                          <TableCell>
                            {call.has_recording ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadRecording(call.id);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
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

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCalls)} of {totalCalls} calls
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
