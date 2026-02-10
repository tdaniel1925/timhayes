import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '../lib/api'
import {
  ArrowLeft,
  Phone,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  MessageSquare,
  Target,
  Heart,
  Zap,
  ShieldAlert
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function CallDetailEnhanced() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const [call, setCall] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('transcript')

  useEffect(() => {
    fetchCallDetail()
  }, [callId])

  const fetchCallDetail = async () => {
    try {
      const response = await api.getCallDetail(callId)
      setCall(response)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load call details')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#3F8A84] bg-[#3F8A84]/10'
    if (score >= 60) return 'text-[#E4B756] bg-[#E4B756]/10'
    return 'text-[#C89A8F] bg-[#C89A8F]/10'
  }

  const getRiskLevelColor = (level) => {
    if (!level) return 'text-gray-600 bg-gray-100'
    const levelLower = level.toLowerCase()
    if (levelLower === 'low') return 'text-[#3F8A84] bg-[#3F8A84]/10'
    if (levelLower === 'medium') return 'text-[#E4B756] bg-[#E4B756]/10'
    return 'text-[#C89A8F] bg-[#C89A8F]/10'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6CA8C2] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading call details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold font-serif text-[#31543A]">Call Details</h1>
            <p className="text-[#2A2A2A]/70 font-light mt-1">Comprehensive AI-powered analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Call Info & Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Call Information Card */}
            <Card className="glass-card rounded-2xl border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center font-serif text-[#31543A]">
                  <Phone className="mr-2 h-5 w-5 text-[#6CA8C2]" />
                  Call Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">From</p>
                  <p className="font-semibold text-gray-900">{call.src || 'Unknown'}</p>
                  {call.caller_name && (
                    <p className="text-sm text-gray-600">{call.caller_name}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">To</p>
                  <p className="font-semibold text-gray-900">{call.dst || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Start Time</p>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(call.start_time)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-blue-600">{formatDuration(call.duration)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                    call.disposition === 'ANSWERED'
                      ? 'bg-[#3F8A84]/10 text-[#3F8A84]'
                      : 'bg-[#C89A8F]/10 text-[#C89A8F]'
                  }`}>
                    {call.disposition === 'ANSWERED' ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {call.disposition}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player */}
            {call.has_recording && (
              <Card className="glass-card rounded-2xl border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif text-[#31543A]">Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio controls className="w-full mb-3" preload="metadata">
                    <source src={`/api/recording/${call.id}`} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`/api/recording/${call.id}`, '_blank')}
                  >
                    Download Recording
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick AI Insights */}
            <Card className="glass-card rounded-2xl border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-[#31543A]">Quick Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {call.quality_score && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 text-[#6CA8C2] mr-2" />
                      <span className="text-sm text-[#2A2A2A]/70 font-light">Quality Score</span>
                    </div>
                    <span className={`px-2 py-1 text-sm font-bold rounded ${getScoreColor(call.quality_score.overall_score)}`}>
                      {call.quality_score.overall_score}
                    </span>
                  </div>
                )}

                {call.sentiment && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 text-pink-600 mr-2" />
                      <span className="text-sm text-gray-700">Sentiment</span>
                    </div>
                    <span className="text-sm font-semibold capitalize">{call.sentiment.sentiment}</span>
                  </div>
                )}

                {call.churn_prediction && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm text-gray-700">Churn Risk</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRiskLevelColor(call.churn_prediction.churn_risk_level)}`}>
                      {call.churn_prediction.churn_risk_level}
                    </span>
                  </div>
                )}

                {call.deal_risk && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-700">Deal Risk</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRiskLevelColor(call.deal_risk.risk_level)}`}>
                      {call.deal_risk.risk_level}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area - Tabs */}
          <div className="lg:col-span-3">
            <Card className="glass-card rounded-2xl border-gray-100">
              <CardHeader>
                <Tabs value={activeTab} onChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                    <TabsTrigger
                      active={activeTab === 'transcript'}
                      onClick={() => setActiveTab('transcript')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Transcript
                    </TabsTrigger>
                    <TabsTrigger
                      active={activeTab === 'sentiment'}
                      onClick={() => setActiveTab('sentiment')}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Sentiment
                    </TabsTrigger>
                    <TabsTrigger
                      active={activeTab === 'quality'}
                      onClick={() => setActiveTab('quality')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Quality
                    </TabsTrigger>
                    <TabsTrigger
                      active={activeTab === 'insights'}
                      onClick={() => setActiveTab('insights')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Insights
                    </TabsTrigger>
                    <TabsTrigger
                      active={activeTab === 'emotions'}
                      onClick={() => setActiveTab('emotions')}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Emotions
                    </TabsTrigger>
                    <TabsTrigger
                      active={activeTab === 'sales'}
                      onClick={() => setActiveTab('sales')}
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Sales
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="min-h-[500px]">
                {/* Transcript Tab */}
                {activeTab === 'transcript' && (
                  <TabsContent>
                    {call.transcription ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              Language: {call.transcription.language || 'en'} |
                              Duration: {formatDuration(call.transcription.duration)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(call.transcription.text)
                              alert('Transcription copied to clipboard!')
                            }}
                          >
                            Copy Text
                          </Button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto border border-gray-200">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {call.transcription.text}
                          </p>
                        </div>
                        {call.transcription.transcribed_at && (
                          <p className="text-xs text-gray-500">
                            Transcribed on {formatDateTime(call.transcription.transcribed_at)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No transcription available for this call.
                          {call.disposition !== 'ANSWERED' && ' Call was not answered.'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Sentiment Tab */}
                {activeTab === 'sentiment' && (
                  <TabsContent>
                    {call.sentiment ? (
                      <div className="space-y-6">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                          <div className="text-6xl mb-3">
                            {call.sentiment.sentiment === 'Positive' ? '😊' :
                             call.sentiment.sentiment === 'Negative' ? '😞' : '😐'}
                          </div>
                          <p className="text-3xl font-bold text-gray-900 capitalize mb-2">
                            {call.sentiment.sentiment}
                          </p>
                          <p className="text-sm text-gray-600">
                            Confidence: {(call.sentiment.sentiment_score * 100).toFixed(0)}%
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">Sentiment Breakdown</h3>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-green-600 font-medium">Positive</span>
                              <span className="font-semibold">{(call.sentiment.positive_score * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-500"
                                style={{ width: `${call.sentiment.positive_score * 100}%`, backgroundColor: '#3F8A84' }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-yellow-600 font-medium">Neutral</span>
                              <span className="font-semibold">{(call.sentiment.neutral_score * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-500"
                                style={{ width: `${call.sentiment.neutral_score * 100}%`, backgroundColor: '#E4B756' }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-red-600 font-medium">Negative</span>
                              <span className="font-semibold">{(call.sentiment.negative_score * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-500"
                                style={{ width: `${call.sentiment.negative_score * 100}%`, backgroundColor: '#C89A8F' }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {call.sentiment.key_phrases && (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">Key Phrases:</p>
                            <p className="text-sm text-blue-800">{call.sentiment.key_phrases}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No sentiment analysis available for this call.</p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Quality Score Tab */}
                {activeTab === 'quality' && (
                  <TabsContent>
                    {call.quality_score ? (
                      <div className="space-y-6">
                        {/* Overall Score */}
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Overall Quality Score</p>
                          <div className={`text-6xl font-bold mb-2 ${getScoreColor(call.quality_score.overall_score).split(' ')[0]}`}>
                            {call.quality_score.overall_score}
                          </div>
                          <p className="text-sm text-gray-600">out of 100</p>
                        </div>

                        {/* Category Scores */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                              { label: 'Greeting', score: call.quality_score.greeting_score },
                              { label: 'Professionalism', score: call.quality_score.professionalism_score },
                              { label: 'Problem Resolution', score: call.quality_score.problem_resolution_score },
                              { label: 'Closing', score: call.quality_score.closing_score },
                              { label: 'Objection Handling', score: call.quality_score.objection_handling_score }
                            ].filter(item => item.score !== null && item.score !== undefined).map((item, idx) => (
                              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                                <p className="text-xs text-gray-600 mb-2">{item.label}</p>
                                <p className={`text-2xl font-bold ${getScoreColor(item.score).split(' ')[0]}`}>
                                  {item.score}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strengths */}
                        {call.quality_score.strengths && call.quality_score.strengths.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Strengths
                            </h3>
                            <ul className="space-y-2">
                              {call.quality_score.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-green-600 mr-2">✓</span>
                                  <span className="text-sm text-green-800">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Areas for Improvement */}
                        {call.quality_score.areas_for_improvement && call.quality_score.areas_for_improvement.length > 0 && (
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2" />
                              Areas for Improvement
                            </h3>
                            <ul className="space-y-2">
                              {call.quality_score.areas_for_improvement.map((area, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-yellow-600 mr-2">→</span>
                                  <span className="text-sm text-yellow-800">{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Coaching Recommendations */}
                        {call.quality_score.recommendations && call.quality_score.recommendations.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">Coaching Recommendations</h3>
                            <ul className="space-y-2">
                              {call.quality_score.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-600 mr-2">💡</span>
                                  <span className="text-sm text-blue-800">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No quality score available for this call.</p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <TabsContent>
                    {call.ai_summary ? (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Call Summary</h3>
                          <p className="text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {call.ai_summary.summary}
                          </p>
                        </div>

                        {/* Topics */}
                        {call.ai_summary.topics && call.ai_summary.topics.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Topics Discussed</h3>
                            <div className="flex flex-wrap gap-2">
                              {call.ai_summary.topics.map((topic, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Items */}
                        {call.ai_summary.action_items && call.ai_summary.action_items.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Action Items</h3>
                            <ul className="space-y-2">
                              {call.ai_summary.action_items.map((item, idx) => (
                                <li key={idx} className="flex items-start bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <input type="checkbox" className="mt-1 mr-3" />
                                  <span className="text-sm text-purple-900">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Intent & Outcome */}
                        <div className="flex gap-4">
                          {call.ai_summary.customer_intent && (
                            <div className="flex-1 bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-600 font-semibold mb-1">Customer Intent</p>
                              <p className="text-lg font-semibold text-purple-900 capitalize">
                                {call.ai_summary.customer_intent}
                              </p>
                            </div>
                          )}

                          {call.ai_summary.call_outcome && (
                            <div className="flex-1 bg-green-50 p-4 rounded-lg border border-green-200">
                              <p className="text-xs text-green-600 font-semibold mb-1">Call Outcome</p>
                              <p className="text-lg font-semibold text-green-900 capitalize">
                                {call.ai_summary.call_outcome}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No AI insights available for this call.</p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Emotions Tab */}
                {activeTab === 'emotions' && (
                  <TabsContent>
                    {call.emotion_detection ? (
                      <div className="space-y-6">
                        {/* Primary Emotion */}
                        <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Primary Emotion Detected</p>
                          <p className="text-3xl font-bold text-gray-900 capitalize mb-2">
                            {call.emotion_detection.primary_emotion}
                          </p>
                          <p className="text-sm text-gray-600">
                            Confidence: {(call.emotion_detection.emotion_confidence * 100).toFixed(0)}%
                          </p>
                        </div>

                        {/* All Emotions */}
                        {call.emotion_detection.emotions_detected && Object.keys(call.emotion_detection.emotions_detected).length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Emotion Breakdown</h3>
                            <div className="space-y-3">
                              {Object.entries(call.emotion_detection.emotions_detected).map(([emotion, score]) => (
                                <div key={emotion}>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="capitalize font-medium text-gray-700">{emotion}</span>
                                    <span className="font-semibold">{(score * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${score * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Customer Satisfaction Indicators */}
                        {call.emotion_detection.customer_satisfaction_indicators && call.emotion_detection.customer_satisfaction_indicators.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">Satisfaction Indicators</h3>
                            <ul className="space-y-2">
                              {call.emotion_detection.customer_satisfaction_indicators.map((indicator, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-600 mr-2">✓</span>
                                  <span className="text-sm text-blue-800">{indicator}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No emotion detection available for this call.</p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Sales Intelligence Tab */}
                {activeTab === 'sales' && (
                  <TabsContent>
                    <div className="space-y-6">
                      {/* Churn Risk */}
                      {call.churn_prediction && (
                        <Card className="border-2 border-orange-200">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                              Churn Risk Assessment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                              <span className="font-semibold text-gray-900">Risk Level:</span>
                              <span className={`px-4 py-2 font-bold rounded-full capitalize ${getRiskLevelColor(call.churn_prediction.churn_risk_level)}`}>
                                {call.churn_prediction.churn_risk_level}
                              </span>
                            </div>

                            {call.churn_prediction.risk_factors && call.churn_prediction.risk_factors.length > 0 && (
                              <div>
                                <p className="font-semibold text-gray-900 mb-2">Risk Factors:</p>
                                <ul className="space-y-2">
                                  {call.churn_prediction.risk_factors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-red-600 mr-2">⚠</span>
                                      <span className="text-sm text-gray-700">{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {call.churn_prediction.retention_recommendations && call.churn_prediction.retention_recommendations.length > 0 && (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="font-semibold text-green-900 mb-2">Retention Recommendations:</p>
                                <ul className="space-y-2">
                                  {call.churn_prediction.retention_recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-600 mr-2">→</span>
                                      <span className="text-sm text-green-800">{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Objection Analysis */}
                      {call.objection_analysis && (
                        <Card className="border-2 border-purple-200">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <ShieldAlert className="h-5 w-5 mr-2 text-purple-600" />
                              Objection Handling Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                              <span className="font-semibold text-gray-900">Handling Effectiveness:</span>
                              <span className={`px-4 py-2 font-bold rounded ${getScoreColor(call.objection_analysis.objection_handling_effectiveness)}`}>
                                {call.objection_analysis.objection_handling_effectiveness}%
                              </span>
                            </div>

                            {call.objection_analysis.objections_detected && call.objection_analysis.objections_detected.length > 0 && (
                              <div>
                                <p className="font-semibold text-gray-900 mb-2">Objections Detected:</p>
                                <div className="space-y-2">
                                  {call.objection_analysis.objections_detected.map((obj, idx) => (
                                    <div key={idx} className="bg-red-50 p-3 rounded-lg border border-red-200">
                                      <p className="text-sm text-red-900">{obj}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {call.objection_analysis.successful_rebuttals && call.objection_analysis.successful_rebuttals.length > 0 && (
                              <div>
                                <p className="font-semibold text-green-900 mb-2">Successful Rebuttals:</p>
                                <ul className="space-y-2">
                                  {call.objection_analysis.successful_rebuttals.map((rebuttal, idx) => (
                                    <li key={idx} className="flex items-start bg-green-50 p-3 rounded-lg border border-green-200">
                                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                      <span className="text-sm text-green-800">{rebuttal}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {call.objection_analysis.missed_opportunities && call.objection_analysis.missed_opportunities.length > 0 && (
                              <div>
                                <p className="font-semibold text-yellow-900 mb-2">Missed Opportunities:</p>
                                <ul className="space-y-2">
                                  {call.objection_analysis.missed_opportunities.map((opp, idx) => (
                                    <li key={idx} className="flex items-start bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                                      <span className="text-sm text-yellow-800">{opp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Deal Risk */}
                      {call.deal_risk && (
                        <Card className="border-2 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Target className="h-5 w-5 mr-2 text-blue-600" />
                              Deal Risk Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                              <span className="font-semibold text-gray-900">Risk Level:</span>
                              <span className={`px-4 py-2 font-bold rounded-full capitalize ${getRiskLevelColor(call.deal_risk.risk_level)}`}>
                                {call.deal_risk.risk_level}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {call.deal_risk.risk_factors && call.deal_risk.risk_factors.length > 0 && (
                                <div>
                                  <p className="font-semibold text-red-900 mb-2">Risk Factors:</p>
                                  <ul className="space-y-1">
                                    {call.deal_risk.risk_factors.map((factor, idx) => (
                                      <li key={idx} className="text-sm text-red-800 flex items-start">
                                        <TrendingDown className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                        {factor}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {call.deal_risk.positive_indicators && call.deal_risk.positive_indicators.length > 0 && (
                                <div>
                                  <p className="font-semibold text-green-900 mb-2">Positive Indicators:</p>
                                  <ul className="space-y-1">
                                    {call.deal_risk.positive_indicators.map((indicator, idx) => (
                                      <li key={idx} className="text-sm text-green-800 flex items-start">
                                        <TrendingUp className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                        {indicator}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {call.deal_risk.recommendations && call.deal_risk.recommendations.length > 0 && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="font-semibold text-blue-900 mb-2">Recommendations:</p>
                                <ul className="space-y-2">
                                  {call.deal_risk.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-blue-600 mr-2">→</span>
                                      <span className="text-sm text-blue-800">{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {!call.churn_prediction && !call.objection_analysis && !call.deal_risk && (
                        <div className="text-center py-12">
                          <ShieldAlert className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No sales intelligence available for this call.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
