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
 * SUSTAIN-Inspired Premium Dashboard
 *
 * Design System:
 * - Muskeg Pine (#31543A) - Primary
 * - Boreal Sky (#6CA8C2) - Accent
 * - Cree Teal (#3F8A84) - Secondary
 * - Prairie Gold (#E4B756) - Highlight
 * - Playfair Display (serif headings) + Inter (sans body)
 * - Glass morphism cards with backdrop blur
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
          <h1 className="text-4xl font-serif text-[#31543A]">Dashboard</h1>
          <DashboardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Add SUSTAIN color variables */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        :root {
          --muskeg-pine: #31543A;
          --boreal-sky: #6CA8C2;
          --cree-teal: #3F8A84;
          --prairie-gold: #E4B756;
          --calm-clay: #C89A8F;
          --charcoal: #2A2A2A;
          --fog-grey: #F9FAFA;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-card {
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(49, 84, 58, 0.08);
        }
      `}</style>

      <div className="space-y-8">
        {/* Header with Gradient Background */}
        <div className="relative pb-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label text-[#E4B756] mb-2">
                01 — Overview
              </span>
              <h1 className="text-4xl md:text-5xl font-serif text-[#31543A] mt-2">
                Call Intelligence Dashboard
              </h1>
              <p className="text-gray-500 mt-2 font-light">
                AI-powered insights from your customer conversations
              </p>
            </div>
            <Button
              onClick={() => navigate('/settings')}
              className="bg-[#31543A] hover:bg-[#2A2A2A] text-white rounded-full px-6 py-3 transition-all hover:scale-105"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards - SUSTAIN Style */}
        <div>
          <span className="section-label text-[#6CA8C2] mb-4">
            02 — Key Metrics
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            <PremiumStatCard
              icon={<Phone className="h-6 w-6" />}
              label="Total Calls"
              value={stats.total_calls || 0}
              trend={`${stats.answered_rate || 0}% answered`}
              iconColor="text-white"
              bgGradient="from-[#31543A] to-[#3F8A84]"
            />
            <PremiumStatCard
              icon={<TrendingUp className="h-6 w-6" />}
              label="Answered"
              value={stats.answered_calls || 0}
              trend={`${stats.missed_calls || 0} missed`}
              iconColor="text-white"
              bgGradient="from-[#6CA8C2] to-[#3F8A84]"
            />
            <PremiumStatCard
              icon={<MessageSquare className="h-6 w-6" />}
              label="Transcribed"
              value={stats.transcribed_calls || 0}
              trend={`${((stats.transcribed_calls / stats.total_calls) * 100 || 0).toFixed(0)}% of total`}
              iconColor="text-white"
              bgGradient="from-[#E4B756] to-[#C89A8F]"
            />
            <PremiumStatCard
              icon={<Sparkles className="h-6 w-6" />}
              label="AI Analyzed"
              value={stats.ai_summary_calls || 0}
              trend="With insights"
              iconColor="text-white"
              bgGradient="from-[#3F8A84] to-[#6CA8C2]"
            />
          </div>
        </div>

        {/* Charts - Glass Morphism Style */}
        <div>
          <span className="section-label text-[#3F8A84] mb-4">
            03 — Analytics
          </span>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Call Volume Chart */}
            <div className="glass-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-serif text-[#31543A] mb-6">
                Call Volume
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Last 30 days of activity
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={callVolume}>
                  <defs>
                    <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3F8A84" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3F8A84" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#3F8A84"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#callGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment Distribution */}
            <div className="glass-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-serif text-[#31543A] mb-6">
                Sentiment Distribution
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Overall conversation tone
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={90}
                    fill="#3F8A84"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'POSITIVE' ? '#3F8A84' :
                          entry.name === 'NEUTRAL' ? '#E4B756' :
                          '#C89A8F'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Search & Filters - Premium Style */}
        <div>
          <span className="section-label text-[#E4B756] mb-4">
            04 — Search & Filter
          </span>
          <div className="glass-card rounded-3xl p-6 shadow-sm mt-4">
            <div className="space-y-6">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#31543A]/40" />
                  <input
                    type="text"
                    placeholder="Search by phone number, caller name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#3F8A84] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#31543A] text-white rounded-full text-sm font-medium hover:bg-[#2A2A2A] transition-all hover:scale-105 whitespace-nowrap"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-3 rounded-full border border-[#31543A]/20 text-[#31543A] text-sm font-medium hover:bg-[#31543A] hover:text-white transition-all whitespace-nowrap"
                >
                  <Filter className="h-4 w-4 inline mr-2" />
                  Filters
                </button>
              </form>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#F9FAFA] rounded-2xl border border-gray-100">
                  <div>
                    <label className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide mb-2 block">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3F8A84] bg-white"
                    >
                      <option value="">All</option>
                      <option value="ANSWERED">Answered</option>
                      <option value="NO ANSWER">No Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide mb-2 block">Sentiment</label>
                    <select
                      value={filters.sentiment}
                      onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3F8A84] bg-white"
                    >
                      <option value="">All</option>
                      <option value="POSITIVE">Positive</option>
                      <option value="NEUTRAL">Neutral</option>
                      <option value="NEGATIVE">Negative</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide mb-2 block">From Date</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3F8A84] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide mb-2 block">To Date</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3F8A84] bg-white"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2 text-sm text-[#31543A] hover:text-[#2A2A2A] transition-colors inline-flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call List - Premium Design */}
        <div>
          <span className="section-label text-[#C89A8F] mb-4">
            05 — Recent Activity
          </span>
          <div className="glass-card rounded-3xl p-8 shadow-sm mt-4">
            <h2 className="text-2xl font-serif text-[#31543A] mb-6">
              Recent Calls
            </h2>
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

                {/* Pagination - SUSTAIN Style */}
                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                  <div className="text-sm text-gray-500 font-light">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-5 py-2 rounded-full border border-[#31543A]/20 text-[#31543A] text-sm font-medium hover:bg-[#31543A] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#31543A]"
                    >
                      <ChevronLeft className="h-4 w-4 inline mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-5 py-2 rounded-full border border-[#31543A]/20 text-[#31543A] text-sm font-medium hover:bg-[#31543A] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#31543A]"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 inline ml-1" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * Premium Stat Card Component - SUSTAIN Style
 */
const PremiumStatCard = ({ icon, label, value, trend, iconColor, bgGradient }) => (
  <div className={cn(
    "stat-card group relative overflow-hidden rounded-2xl p-8 text-white bg-gradient-to-br shadow-md",
    bgGradient
  )}>
    {/* Decorative circle */}
    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500"></div>

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-full bg-white/20", iconColor)}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-white/80 mb-2 font-medium">{label}</p>
        <p className="text-3xl font-serif mb-2">{value.toLocaleString()}</p>
        <p className="text-xs text-white/70 font-light">{trend}</p>
      </div>
    </div>
  </div>
);

/**
 * Call Table Row (Desktop) - SUSTAIN Style
 */
const CallTableRow = ({ call, onCallClick, formatDate, formatDuration, getStatusColor, getSentimentColor }) => {
  const sentimentColorMap = {
    POSITIVE: 'bg-[#3F8A84]/10 text-[#3F8A84] border-[#3F8A84]/30',
    NEUTRAL: 'bg-[#E4B756]/10 text-[#E4B756] border-[#E4B756]/30',
    NEGATIVE: 'bg-[#C89A8F]/10 text-[#C89A8F] border-[#C89A8F]/30'
  };

  return (
    <tr
      onClick={() => onCallClick(call.id)}
      className="border-b border-gray-50 hover:bg-[#F9FAFA] cursor-pointer transition-all group"
    >
      <td className="py-5 px-4">
        <div>
          <div className="font-medium text-[#31543A] group-hover:text-[#3F8A84] transition-colors">
            {call.src} → {call.dst}
          </div>
          <div className="text-sm text-gray-500 mt-1 font-light">{formatDate(call.start_time)}</div>
          {call.caller_name && (
            <div className="text-xs text-gray-400 mt-1">{call.caller_name}</div>
          )}
        </div>
      </td>
      <td className="py-5 px-4">
        <span className="text-sm text-[#2A2A2A]">{formatDuration(call.duration)}</span>
      </td>
      <td className="py-5 px-4">
        <span className={cn(
          "text-xs px-3 py-1 rounded-full border inline-block",
          call.disposition === 'ANSWERED'
            ? 'bg-[#3F8A84]/10 text-[#3F8A84] border-[#3F8A84]/30'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        )}>
          {call.disposition}
        </span>
      </td>
      <td className="py-5 px-4">
        <div className="flex flex-col gap-2">
          {/* AI Summary */}
          {call.ai_summary?.summary && (
            <div className="text-xs text-[#2A2A2A]/70 font-light max-w-xs truncate" title={call.ai_summary.summary}>
              <Sparkles className="h-3 w-3 inline mr-1 text-[#E4B756]" />
              {call.ai_summary.summary}
            </div>
          )}
          {/* Customer Intent */}
          {call.ai_summary?.customer_intent && (
            <span className="text-xs px-3 py-1 rounded-full border border-[#6CA8C2]/30 text-[#6CA8C2] bg-[#6CA8C2]/10 w-fit">
              {call.ai_summary.customer_intent}
            </span>
          )}
          {/* Sentiment */}
          {call.sentiment_analysis?.sentiment && (
            <span className={cn(
              "text-xs px-3 py-1 rounded-full border w-fit",
              sentimentColorMap[call.sentiment_analysis.sentiment] || 'bg-gray-100 text-gray-600 border-gray-200'
            )}>
              {call.sentiment_analysis.sentiment}
              {call.sentiment_analysis.confidence && ` (${Math.round(call.sentiment_analysis.confidence * 100)}%)`}
            </span>
          )}
          {/* Transcription available indicator */}
          {call.transcription && (
            <span className="text-xs text-[#31543A]/70 font-light">
              📝 Transcription available
            </span>
          )}
        </div>
      </td>
      <td className="py-5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Play Recording */}
          {call.recording_url && (
            <a
              href={call.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-[#31543A] hover:bg-[#31543A]/10 rounded-full transition-colors"
              title="Play recording"
            >
              <Play className="h-4 w-4" />
            </a>
          )}
          {/* View Details */}
          <button
            onClick={() => onCallClick(call.id)}
            className="px-4 py-2 text-xs font-medium text-[#31543A] border border-[#31543A]/20 rounded-full hover:bg-[#31543A] hover:text-white transition-all"
          >
            View Details
          </button>
        </div>
      </td>
    </tr>
  );
};

/**
 * Call Card (Mobile) - SUSTAIN Style
 */
const CallCard = ({ call, onCallClick, formatDate, formatDuration, getStatusColor, getSentimentColor }) => {
  const sentimentColorMap = {
    POSITIVE: 'bg-[#3F8A84]/10 text-[#3F8A84] border-[#3F8A84]/30',
    NEUTRAL: 'bg-[#E4B756]/10 text-[#E4B756] border-[#E4B756]/30',
    NEGATIVE: 'bg-[#C89A8F]/10 text-[#C89A8F] border-[#C89A8F]/30'
  };

  return (
    <div
      onClick={() => onCallClick(call.id)}
      className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer bg-white"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="font-medium text-[#31543A]">{call.src} → {call.dst}</div>
          <div className="text-sm text-gray-500 mt-1 font-light">{formatDate(call.start_time)}</div>
        </div>
        <span className={cn(
          "text-xs px-3 py-1 rounded-full border",
          call.disposition === 'ANSWERED'
            ? 'bg-[#3F8A84]/10 text-[#3F8A84] border-[#3F8A84]/30'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        )}>
          {call.disposition}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-gray-500 font-light">Duration:</span>
        <span className="font-medium text-[#2A2A2A]">{formatDuration(call.duration)}</span>
      </div>

      {/* AI Summary with Sparkle Icon */}
      {call.ai_summary?.summary && (
        <div className="mb-3 p-3 bg-[#E4B756]/5 rounded-lg border border-[#E4B756]/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-[#E4B756] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#2A2A2A]/80 font-light leading-relaxed">
              {call.ai_summary.summary}
            </p>
          </div>
        </div>
      )}

      {/* Badges: Customer Intent, Sentiment, Transcription */}
      {(call.ai_summary?.customer_intent || call.sentiment_analysis?.sentiment || call.transcription) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {call.ai_summary?.customer_intent && (
            <span className="text-xs px-3 py-1 rounded-full border border-[#6CA8C2]/30 text-[#6CA8C2] bg-[#6CA8C2]/10">
              {call.ai_summary.customer_intent}
            </span>
          )}
          {call.sentiment_analysis?.sentiment && (
            <span className={cn(
              "text-xs px-3 py-1 rounded-full border",
              sentimentColorMap[call.sentiment_analysis.sentiment] || 'bg-gray-100 text-gray-600 border-gray-200'
            )}>
              {call.sentiment_analysis.sentiment}
              {call.sentiment_analysis.confidence && ` (${Math.round(call.sentiment_analysis.confidence * 100)}%)`}
            </span>
          )}
          {call.transcription && (
            <span className="text-xs px-3 py-1 rounded-full border border-[#31543A]/20 text-[#31543A]/70 bg-[#31543A]/5">
              📝 Transcription
            </span>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-3 border-t border-gray-50">
        {call.recording_url && (
          <a
            href={call.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 text-xs font-medium text-[#31543A] hover:bg-[#31543A]/10 rounded-full transition-colors inline-flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Play Recording
          </a>
        )}
        <button className="flex-1 px-4 py-2 text-xs font-medium text-white bg-[#31543A] rounded-full hover:bg-[#2A2A2A] transition-all">
          View Details
        </button>
      </div>
    </div>
  );
};
