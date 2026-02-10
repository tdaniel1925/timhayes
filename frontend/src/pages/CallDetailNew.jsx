import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Phone, Clock, User, Download, Copy, Play, Pause,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle,
  MessageSquare, BarChart3, Heart, Target, Zap, ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/EmptyState';
import DashboardLayout from '@/components/DashboardLayout';
import { cn } from '@/lib/utils';

/**
 * Redesigned Call Detail Page
 *
 * Key improvements:
 * - Hero section with prominent call info
 * - Inline audio player
 * - AI insights front and center
 * - Better visual hierarchy
 * - Mobile responsive
 */

export default function CallDetailNew() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    fetchCallDetail();
  }, [callId]);

  const fetchCallDetail = async () => {
    try {
      setLoading(true);
      const response = await api.getCallDetail(callId);
      setCall(response);
    } catch (err) {
      setError(err.message || 'Failed to load call details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return <Minus className="h-5 w-5" />;
    const s = sentiment.toLowerCase();
    if (s === 'positive') return <TrendingUp className="h-5 w-5 text-success-600" />;
    if (s === 'negative') return <TrendingDown className="h-5 w-5 text-error-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'bg-gray-100 text-gray-700 border-gray-200';
    const s = sentiment.toLowerCase();
    if (s === 'positive') return 'bg-[#3F8A84]/10 text-[#3F8A84] border-[#3F8A84]/30';
    if (s === 'negative') return 'bg-[#C89A8F]/10 text-[#C89A8F] border-[#C89A8F]/30';
    return 'bg-[#E4B756]/10 text-[#E4B756] border-[#E4B756]/30';
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-[#3F8A84]';
    if (score >= 60) return 'text-[#E4B756]';
    return 'text-[#C89A8F]';
  };

  const copyTranscript = () => {
    if (call?.transcription?.text) {
      navigator.clipboard.writeText(call.transcription.text);
      showToast({
        type: 'success',
        title: 'Copied!',
        message: 'Transcript copied to clipboard'
      });
    }
  };

  const downloadRecording = () => {
    window.open(`/api/recording/${call.id}`, '_blank');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <LoadingSkeleton className="h-8 w-32 mb-6" />
          <Card className="mb-6">
            <CardContent className="p-8">
              <LoadingSkeleton variant="text" lines={3} />
            </CardContent>
          </Card>
          <LoadingSkeleton variant="card" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !call) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <ErrorState
            title="Failed to load call"
            message={error || 'Call not found'}
            action={
              <Button onClick={() => fetchCallDetail()}>
                Try Again
              </Button>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#31543A]/20 text-[#31543A] text-sm font-medium hover:bg-[#31543A] hover:text-white transition-all mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Hero Section - Call Overview - SUSTAIN Style */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-md">
          <div className="bg-gradient-to-r from-[#31543A] to-[#3F8A84] p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Call Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-serif text-white mb-1">
                      {call.src} → {call.dst}
                    </h1>
                    {call.caller_name && (
                      <p className="text-white/80 font-light">{call.caller_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-white/90 font-light">{formatDateTime(call.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-light">
                      Duration: {formatDuration(call.duration)}
                    </span>
                  </div>
                  <div>
                    <span className={cn(
                      "px-3 py-1 rounded-full border inline-flex items-center gap-1",
                      call.disposition === 'ANSWERED'
                        ? 'bg-[#E4B756]/20 text-white border-[#E4B756]/40'
                        : 'bg-white/10 text-white border-white/30'
                    )}>
                      {call.disposition === 'ANSWERED' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {call.disposition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3">
                {call.quality_score && (
                  <div className="glass-card rounded-2xl p-5 text-center min-w-[110px] hover:scale-105 transition-transform">
                    <BarChart3 className="h-5 w-5 mx-auto mb-2 text-[#3F8A84]" />
                    <div className={cn("text-3xl font-serif mb-1", getScoreColor(call.quality_score.overall_score))}>
                      {call.quality_score.overall_score}
                    </div>
                    <div className="text-xs text-[#2A2A2A]/60 font-light uppercase tracking-wide">Quality</div>
                  </div>
                )}
                {call.sentiment && (
                  <div className="glass-card rounded-2xl p-5 text-center min-w-[110px] hover:scale-105 transition-transform">
                    <Heart className="h-5 w-5 mx-auto mb-2 text-[#C89A8F]" />
                    <div className="text-sm font-medium text-[#31543A] capitalize mb-1">
                      {call.sentiment.sentiment}
                    </div>
                    <div className="text-xs text-[#2A2A2A]/60 font-light uppercase tracking-wide">Sentiment</div>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Player (Inline) */}
            {call.has_recording && (
              <div className="mt-6 glass-card rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <audio
                    controls
                    className="flex-1"
                    preload="metadata"
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => setAudioPlaying(false)}
                  >
                    <source src={`/api/recording/${call.id}`} type="audio/wav" />
                  </audio>
                  <button
                    onClick={downloadRecording}
                    className="p-3 rounded-full bg-[#31543A] text-white hover:bg-[#2A2A2A] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Intent */}
          {call.intent && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-600">Intent</span>
                </div>
                <p className="font-semibold text-gray-900 capitalize">{call.intent}</p>
              </CardContent>
            </Card>
          )}

          {/* Churn Risk */}
          {call.churn_prediction && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning-600" />
                  <span className="text-sm font-medium text-gray-600">Churn Risk</span>
                </div>
                <Badge className={getSentimentColor(call.churn_prediction.churn_risk_level)}>
                  {call.churn_prediction.churn_risk_level}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Deal Risk */}
          {call.deal_risk && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Deal Risk</span>
                </div>
                <Badge className={getSentimentColor(call.deal_risk.risk_level)}>
                  {call.deal_risk.risk_level}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Emotion */}
          {call.emotion_analysis && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span className="text-sm font-medium text-gray-600">Primary Emotion</span>
                </div>
                <p className="font-semibold text-gray-900 capitalize">
                  {call.emotion_analysis.primary_emotion}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabbed Content */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b rounded-none p-0">
              <TabsTrigger value="overview" className="rounded-none border-b-2">
                <Zap className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="transcript" className="rounded-none border-b-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-none border-b-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analysis
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6">
              <div className="space-y-6">
                {/* Call Summary */}
                {call.summary && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary-600" />
                      AI Summary
                    </h3>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed">{call.summary}</p>
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {call.key_points && call.key_points.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Points</h3>
                    <ul className="space-y-2">
                      {call.key_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {call.action_items && call.action_items.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Action Items</h3>
                    <ul className="space-y-2">
                      {call.action_items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Target className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="p-6">
              {call.transcription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Language: {call.transcription.language || 'en'} •
                      Duration: {formatDuration(call.transcription.duration)}
                    </div>
                    <Button variant="outline" size="sm" onClick={copyTranscript}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {call.transcription.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No transcript available for this call
                </div>
              )}
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="p-6">
              <div className="space-y-6">
                {/* Quality Score Breakdown */}
                {call.quality_score && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Quality Score Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(call.quality_score).map(([key, value]) => {
                        if (key === 'overall_score') return null;
                        return (
                          <div key={key} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-700 capitalize">
                                {key?.replace(/_/g, ' ') || key || 'Unknown'}
                              </span>
                              <span className={cn("font-bold", getScoreColor(value))}>
                                {value}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  value >= 80 ? "bg-success-500" :
                                  value >= 60 ? "bg-warning-500" : "bg-error-500"
                                )}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sentiment Details */}
                {call.sentiment && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {getSentimentIcon(call.sentiment.sentiment)}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 capitalize">
                              {call.sentiment.sentiment}
                            </div>
                            {call.sentiment.confidence && (
                              <div className="text-sm text-gray-600">
                                Confidence: {(call.sentiment.confidence * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        {call.sentiment.explanation && (
                          <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                            {call.sentiment.explanation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
