import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../lib/api'

export default function CallDetail() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const [call, setCall] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'gray'
    const sentimentLower = sentiment.toLowerCase()
    if (sentimentLower === 'positive') return 'green'
    if (sentimentLower === 'negative') return 'red'
    return 'yellow'
  }

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return '😐'
    const sentimentLower = sentiment.toLowerCase()
    if (sentimentLower === 'positive') return '😊'
    if (sentimentLower === 'negative') return '😞'
    return '😐'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading call details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-2">
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Call Details</h1>
            <p className="text-gray-600">Call ID: {call.uniqueid}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Call Info & Recording */}
          <div className="lg:col-span-1 space-y-6">
            {/* Call Information */}
            <Card>
              <CardHeader>
                <CardTitle>Call Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-semibold">{call.src || 'Unknown'}</p>
                  {call.caller_name && (
                    <p className="text-sm text-gray-600">{call.caller_name}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-semibold">{call.dst || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-semibold">{formatDateTime(call.start_time)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{formatDuration(call.duration)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    call.disposition === 'ANSWERED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {call.disposition}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player */}
            {call.has_recording && (
              <Card>
                <CardHeader>
                  <CardTitle>Call Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio controls className="w-full" preload="metadata">
                    <source src={`/api/recording/${call.id}`} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => window.open(`/api/recording/${call.id}`, '_blank')}
                  >
                    Download Recording
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sentiment Analysis */}
            {call.sentiment && (
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-2">
                      {getSentimentIcon(call.sentiment.sentiment)}
                    </div>
                    <p className="text-2xl font-bold capitalize" style={{
                      color: getSentimentColor(call.sentiment.sentiment) === 'green' ? '#10B981' :
                             getSentimentColor(call.sentiment.sentiment) === 'red' ? '#EF4444' : '#F59E0B'
                    }}>
                      {call.sentiment.sentiment}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {(call.sentiment.sentiment_score * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-600">Positive</span>
                        <span className="font-semibold">{(call.sentiment.positive_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${call.sentiment.positive_score * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-yellow-600">Neutral</span>
                        <span className="font-semibold">{(call.sentiment.neutral_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${call.sentiment.neutral_score * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-600">Negative</span>
                        <span className="font-semibold">{(call.sentiment.negative_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${call.sentiment.negative_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {call.sentiment.key_phrases && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Key Phrases:</p>
                      <p className="text-sm text-gray-600">{call.sentiment.key_phrases}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Transcription & AI Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Summary */}
            {call.ai_summary && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                  <CardDescription>Automatically generated call summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-800 leading-relaxed">{call.ai_summary.summary}</p>
                  </div>

                  {call.ai_summary.topics && call.ai_summary.topics.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Topics Discussed:</p>
                      <div className="flex flex-wrap gap-2">
                        {call.ai_summary.topics.map((topic, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {call.ai_summary.action_items && call.ai_summary.action_items.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {call.ai_summary.action_items.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    {call.ai_summary.customer_intent && (
                      <div>
                        <p className="text-xs text-gray-600">Intent</p>
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded capitalize">
                          {call.ai_summary.customer_intent}
                        </span>
                      </div>
                    )}

                    {call.ai_summary.call_outcome && (
                      <div>
                        <p className="text-xs text-gray-600">Outcome</p>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded capitalize">
                          {call.ai_summary.call_outcome}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Transcription */}
            {call.transcription && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Call Transcription</CardTitle>
                      <CardDescription>
                        Language: {call.transcription.language || 'en'} | Duration: {formatDuration(call.transcription.duration)}
                      </CardDescription>
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
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {call.transcription.text}
                    </p>
                  </div>

                  {call.transcription.transcribed_at && (
                    <p className="text-xs text-gray-500 mt-3">
                      Transcribed on {formatDateTime(call.transcription.transcribed_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {!call.transcription && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcription</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    No transcription available for this call.
                    {call.disposition !== 'ANSWERED' && ' Call was not answered.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
