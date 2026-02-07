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
  ChevronLeft, ChevronRight, Search, Settings, Filter, X, FileText, Mail, Play, Pause,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';

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

  // Audio player state
  const [playingCallId, setPlayingCallId] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = React.useRef(null);

  // Accordion state for AI summary
  const [expandedCallId, setExpandedCallId] = useState(null);
  const [aiSummaries, setAiSummaries] = useState({});

  // Error state
  const [recordingError, setRecordingError] = useState(null);

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
      const recording = await api.getRecording(callId);
      const a = document.createElement('a');

      if (recording.type === 'supabase') {
        // Download from signed URL (Supabase storage)
        a.href = recording.url;
        a.download = `recording-${callId}.mp3`;
        a.target = '_blank';  // Open in new tab if download attribute doesn't work
      } else if (recording.type === 'blob') {
        // Download blob (legacy local files)
        const url = window.URL.createObjectURL(recording.blob);
        a.href = url;
        a.download = `recording-${callId}.wav`;

        // Clean up object URL after download
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        throw new Error('Invalid recording response type');
      }

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download recording:', error);
      setRecordingError({
        callId,
        message: 'Recording not available for download. The recording may not have been uploaded to storage yet.'
      });
      setTimeout(() => setRecordingError(null), 5000);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr} ${timeStr}`;
    }
  };

  const handlePlayRecording = async (callId) => {
    try {
      // If already playing this call, pause it
      if (playingCallId === callId && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlayingCallId(null);
        return;
      }

      // Clean up previous audio object URL if it was a blob
      if (audioUrl && audioUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(audioUrl);
      }

      // Load recording (can be signed URL or blob)
      const recording = await api.getRecording(callId);
      let url;

      if (recording.type === 'supabase') {
        // Use signed URL directly (Supabase storage)
        url = recording.url;
      } else if (recording.type === 'blob') {
        // Create object URL from blob (legacy local files)
        url = window.URL.createObjectURL(recording.blob);
      } else {
        throw new Error('Invalid recording response type');
      }

      setAudioUrl(url);
      setPlayingCallId(callId);

      // Wait for audio element to be ready
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(error => {
            console.error('Failed to play recording:', error);
            alert('Failed to play recording');
          });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load recording:', error);
      setRecordingError({
        callId,
        message: 'Recording not available for playback. The recording may still be processing or was not uploaded successfully.'
      });
      setTimeout(() => setRecordingError(null), 5000);
    }
  };

  const handleToggleExpand = async (e, call) => {
    e.stopPropagation();

    // Only allow expansion for calls > 45 seconds
    if (call.duration <= 45) {
      return;
    }

    if (expandedCallId === call.id) {
      setExpandedCallId(null);
    } else {
      setExpandedCallId(call.id);

      // Fetch AI summary if not already loaded
      if (!aiSummaries[call.id]) {
        try {
          const summary = await api.getAISummary(call.id);
          setAiSummaries(prev => ({
            ...prev,
            [call.id]: summary
          }));
        } catch (error) {
          console.error('Failed to load AI summary:', error);
          setAiSummaries(prev => ({
            ...prev,
            [call.id]: { error: 'Failed to load AI summary' }
          }));
        }
      }
    }
  };

  // Clean up audio URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
    <DashboardLayout title="Dashboard" subtitle="Overview of your call analytics">
      {/* Hidden audio player for streaming recordings */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingCallId(null)}
        onPause={() => setPlayingCallId(null)}
        style={{ display: 'none' }}
      />

      <div className="px-8 py-8">
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
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Caller Info</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Sentiment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <React.Fragment key={call.id}>
                          {/* Recording Error Row - Shows above the call if there's an error */}
                          {recordingError && recordingError.callId === call.id && (
                            <TableRow>
                              <TableCell colSpan={9} className="p-0">
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                                  <div className="flex items-center gap-3">
                                    <svg className="h-5 w-5 text-yellow-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-yellow-800 flex-1">
                                      <strong>Recording Error:</strong> {recordingError.message}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRecordingError(null);
                                      }}
                                      className="inline-flex rounded-md bg-yellow-100 p-1.5 text-yellow-600 hover:bg-yellow-200 focus:outline-none"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}

                          <TableRow
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => navigate(`/call/${call.id}`)}
                          >
                          <TableCell
                            className="p-0"
                            onClick={(e) => handleToggleExpand(e, call)}
                          >
                            {call.duration > 45 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                {expandedCallId === call.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <div className="h-8 w-8"></div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {formatDateTime(call.call_date || call.start_time)}
                          </TableCell>
                          <TableCell className="font-medium">{call.src || '-'}</TableCell>
                          <TableCell>{call.dst || '-'}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {call.caller_name || 'Unknown'}
                              </span>
                              {call.clid && call.clid !== call.caller_name && (
                                <span className="text-xs text-muted-foreground">
                                  {call.clid}
                                </span>
                              )}
                            </div>
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
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayRecording(call.id);
                                  }}
                                  className="flex items-center gap-1"
                                  title={playingCallId === call.id ? "Pause" : "Play"}
                                >
                                  {playingCallId === call.id ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadRecording(call.id);
                                  }}
                                  className="flex items-center gap-1"
                                  title="Download"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
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

                        {/* AI Summary Accordion Row */}
                        {expandedCallId === call.id && call.duration > 45 && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-blue-50 p-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                                  <Sparkles className="h-5 w-5" />
                                  <span>AI Summary</span>
                                </div>

                                {aiSummaries[call.id] ? (
                                  aiSummaries[call.id].error ? (
                                    <div className="text-red-600 text-sm">
                                      {aiSummaries[call.id].error}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {/* Customer Intent & Call Outcome Badges */}
                                      {(aiSummaries[call.id].customer_intent || aiSummaries[call.id].call_outcome) && (
                                        <div className="flex gap-2 flex-wrap">
                                          {aiSummaries[call.id].customer_intent && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                              Intent: {aiSummaries[call.id].customer_intent}
                                            </span>
                                          )}
                                          {aiSummaries[call.id].call_outcome && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                              Outcome: {aiSummaries[call.id].call_outcome}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Overview */}
                                      {aiSummaries[call.id].summary && (
                                        <div className="bg-white p-3 rounded-md border border-blue-200">
                                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Overview</h4>
                                          <p className="text-sm text-gray-600">{aiSummaries[call.id].summary}</p>
                                        </div>
                                      )}

                                      {/* Key Points */}
                                      {aiSummaries[call.id].key_points && aiSummaries[call.id].key_points.length > 0 && (
                                        <div className="bg-white p-3 rounded-md border border-blue-200">
                                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Points</h4>
                                          <ul className="list-disc list-inside space-y-1">
                                            {aiSummaries[call.id].key_points.map((point, idx) => (
                                              <li key={idx} className="text-sm text-gray-600">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Action Items */}
                                      {aiSummaries[call.id].action_items && aiSummaries[call.id].action_items.length > 0 && (
                                        <div className="bg-white p-3 rounded-md border border-blue-200">
                                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Items</h4>
                                          <ul className="list-disc list-inside space-y-1">
                                            {aiSummaries[call.id].action_items.map((item, idx) => (
                                              <li key={idx} className="text-sm text-gray-600">{item}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Sentiment Details */}
                                      {aiSummaries[call.id].sentiment_analysis && (
                                        <div className="bg-white p-3 rounded-md border border-blue-200">
                                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Sentiment Analysis</h4>
                                          <p className="text-sm text-gray-600">{aiSummaries[call.id].sentiment_analysis}</p>
                                        </div>
                                      )}

                                      {/* Full Transcription */}
                                      {call.transcription && (
                                        <div className="bg-white p-3 rounded-md border border-blue-200">
                                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Transcription</h4>
                                          <div className="text-sm text-gray-600 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border border-gray-200">
                                            {call.transcription}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-blue-700">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Loading AI summary...</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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
      </div>
    </DashboardLayout>
  );
}
