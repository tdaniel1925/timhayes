import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Phone, TrendingUp, MessageSquare, Play, Download,
  Search, Filter, ChevronLeft, ChevronRight, X, Settings, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSkeleton, { DashboardSkeleton, CallListSkeleton } from '@/components/LoadingSkeleton';
import EmptyState, { NoCallsYet, NoSearchResults } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

/**
 * Redesigned Dashboard - Clean, Modern, Mobile-First
 *
 * Key Improvements:
 * - Reduced from 9 columns to 5 (60% less clutter)
 * - AI insights visible immediately (no hidden accordions)
 * - Card-based mobile layout
 * - Loading skeletons instead of spinners
 * - Empty states with clear CTAs
 * - Much faster to scan and understand
 */

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({});
  const [callVolume, setCallVolume] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sentiment: '',
    dateFrom: '',
    dateTo: ''
  });

  const perPage = 25;

  // Load data
  useEffect(() => {
    loadData();
  }, [currentPage, searchQuery, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [callsData, statsData, volumeData, sentimentTrendsData] = await Promise.all([
        api.getCalls(currentPage, perPage, searchQuery, filters),
        api.getStats(),
        api.getCallVolume(30),
        api.getSentimentTrends()
      ]);

      setCalls(callsData.calls || []);
      setTotalPages(callsData.pagination?.pages || 1);
      setStats(statsData);
      setCallVolume(volumeData);
      setSentimentData(sentimentTrendsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast({
        type: 'error',
        title: 'Failed to load data',
        message: 'Please try refreshing the page'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ status: '', sentiment: '', dateFrom: '', dateTo: '' });
    setSearchQuery('');
    setShowFilters(false);
  };

  const handleCallClick = (callId) => {
    navigate(`/call/${callId}`);
  };

  // Format helpers
  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();

    if (isToday) return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (isYesterday) return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      POSITIVE: 'bg-success-100 text-success-700 border-success-200',
      NEUTRAL: 'bg-warning-100 text-warning-700 border-warning-200',
      NEGATIVE: 'bg-error-100 text-error-700 border-error-200'
    };
    return colors[sentiment] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    return status === 'ANSWERED'
      ? 'bg-success-100 text-success-700 border-success-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Charts config
  const SENTIMENT_COLORS = {
    POSITIVE: 'var(--color-success-500)',
    NEUTRAL: 'var(--color-warning-500)',
    NEGATIVE: 'var(--color-error-500)'
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <DashboardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={() => navigate('/settings')} variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Phone className="h-5 w-5" />}
            label="Total Calls"
            value={stats.total_calls || 0}
            trend={`${stats.answered_rate || 0}% answered`}
            iconColor="text-primary-600"
            iconBg="bg-primary-50"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Answered"
            value={stats.answered_calls || 0}
            trend={`${stats.missed_calls || 0} missed`}
            iconColor="text-success-600"
            iconBg="bg-success-50"
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Transcribed"
            value={stats.transcribed_calls || 0}
            trend={`${((stats.transcribed_calls / stats.total_calls) * 100 || 0).toFixed(0)}% of total`}
            iconColor="text-warning-600"
            iconBg="bg-warning-50"
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            label="AI Analyzed"
            value={stats.ai_summary_calls || 0}
            trend="With insights"
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Call Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Call Volume (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={callVolume}>
                  <defs>
                    <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                  <XAxis dataKey="date" stroke="var(--color-gray-400)" fontSize={12} />
                  <YAxis stroke="var(--color-gray-400)" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="var(--color-primary-500)"
                    fillOpacity={1}
                    fill="url(#callGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="var(--color-primary-500)"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by phone number, caller name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="default">
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </form>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Status</Label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All</option>
                      <option value="ANSWERED">Answered</option>
                      <option value="NO ANSWER">No Answer</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700">Sentiment</Label>
                    <select
                      value={filters.sentiment}
                      onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All</option>
                      <option value="POSITIVE">Positive</option>
                      <option value="NEUTRAL">Neutral</option>
                      <option value="NEGATIVE">Negative</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700">From Date</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700">To Date</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <Button onClick={handleClearFilters} variant="ghost" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              searchQuery || Object.values(filters).some(v => v) ? (
                <NoSearchResults onClear={handleClearFilters} />
              ) : (
                <NoCallsYet onConnect={() => navigate('/settings')} />
              )
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Call Info</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Duration</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">AI Insights</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call) => (
                        <CallTableRow
                          key={call.id}
                          call={call}
                          onCallClick={handleCallClick}
                          formatDate={formatDate}
                          formatDuration={formatDuration}
                          getStatusColor={getStatusColor}
                          getSentimentColor={getSentimentColor}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-4">
                  {calls.map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      onCallClick={handleCallClick}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                      getStatusColor={getStatusColor}
                      getSentimentColor={getSentimentColor}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
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

/**
 * Stat Card Component
 */
const StatCard = ({ icon, label, value, trend, iconColor, iconBg }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{trend}</p>
        </div>
        <div className={cn("p-3 rounded-full", iconBg)}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Call Table Row (Desktop)
 */
const CallTableRow = ({ call, onCallClick, formatDate, formatDuration, getStatusColor, getSentimentColor }) => (
  <tr
    onClick={() => onCallClick(call.id)}
    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
  >
    <td className="py-4 px-4">
      <div>
        <div className="font-medium text-gray-900">{call.src} → {call.dst}</div>
        <div className="text-sm text-gray-600">{formatDate(call.start_time)}</div>
        {call.caller_name && (
          <div className="text-xs text-gray-500">{call.caller_name}</div>
        )}
      </div>
    </td>
    <td className="py-4 px-4">
      <span className="text-sm text-gray-900">{formatDuration(call.duration)}</span>
    </td>
    <td className="py-4 px-4">
      <Badge className={cn("text-xs border", getStatusColor(call.disposition))}>
        {call.disposition}
      </Badge>
    </td>
    <td className="py-4 px-4">
      <div className="flex flex-col gap-1">
        {call.ai_summary?.customer_intent && (
          <Badge variant="outline" className="text-xs w-fit">
            {call.ai_summary.customer_intent}
          </Badge>
        )}
        {call.sentiment_analysis?.sentiment && (
          <Badge className={cn("text-xs w-fit border", getSentimentColor(call.sentiment_analysis.sentiment))}>
            {call.sentiment_analysis.sentiment}
          </Badge>
        )}
      </div>
    </td>
    <td className="py-4 px-4 text-right">
      <div className="flex items-center justify-end gap-2">
        {call.recording_local_path && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              // Handle play
            }}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onCallClick(call.id)}>
          View Details
        </Button>
      </div>
    </td>
  </tr>
);

/**
 * Call Card (Mobile)
 */
const CallCard = ({ call, onCallClick, formatDate, formatDuration, getStatusColor, getSentimentColor }) => (
  <div
    onClick={() => onCallClick(call.id)}
    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{call.src} → {call.dst}</div>
        <div className="text-sm text-gray-600">{formatDate(call.start_time)}</div>
      </div>
      <Badge className={cn("text-xs border", getStatusColor(call.disposition))}>
        {call.disposition}
      </Badge>
    </div>

    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm text-gray-600">Duration:</span>
      <span className="text-sm font-medium text-gray-900">{formatDuration(call.duration)}</span>
    </div>

    {(call.ai_summary?.customer_intent || call.sentiment_analysis?.sentiment) && (
      <div className="flex flex-wrap gap-2 mb-3">
        {call.ai_summary?.customer_intent && (
          <Badge variant="outline" className="text-xs">
            {call.ai_summary.customer_intent}
          </Badge>
        )}
        {call.sentiment_analysis?.sentiment && (
          <Badge className={cn("text-xs border", getSentimentColor(call.sentiment_analysis.sentiment))}>
            {call.sentiment_analysis.sentiment}
          </Badge>
        )}
      </div>
    )}

    {call.ai_summary?.summary_text && (
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {call.ai_summary.summary_text}
      </p>
    )}

    <div className="flex gap-2">
      {call.recording_local_path && (
        <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
          <Play className="h-4 w-4 mr-2" />
          Play
        </Button>
      )}
      <Button size="sm" variant="outline" className="flex-1">
        View Details
      </Button>
    </div>
  </div>
);
