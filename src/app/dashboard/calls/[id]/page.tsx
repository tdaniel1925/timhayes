'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecordingPlayer } from '@/components/calls/recording-player';
import { TranscriptViewer } from '@/components/calls/transcript-viewer';
import {
  SentimentTimeline,
  TalkRatioVisualization,
  ComplianceScoreGauge,
  EscalationRiskCard,
} from '@/components/calls/analysis-cards';

interface CallDetail {
  call: {
    id: string;
    src: string | null;
    dst: string | null;
    callerName: string | null;
    clid: string | null;
    startTime: string;
    answerTime: string | null;
    endTime: string | null;
    durationSeconds: number | null;
    billsecSeconds: number | null;
    disposition: string | null;
    callDirection: string | null;
    recordingFilename: string | null;
    recordingStoragePath: string | null;
    transcriptStoragePath: string | null;
    transcriptStatus: string;
    analysisStatus: string;
  };
  analysis: {
    summary: string | null;
    sentimentOverall: string | null;
    sentimentScore: string | null;
    talkRatio: any;
    talkTimeSeconds: any;
    silenceSeconds: number | null;
    keywords: any;
    topics: any;
    actionItems: any;
    callDispositionAi: string | null;
    escalationRisk: string | null;
    escalationReasons: any;
    satisfactionPrediction: string | null;
    satisfactionScore: string | null;
    questionsAsked: any;
    objections: any;
    wordCount: number | null;
    wordsPerMinute: any;
  } | null;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [callDetail, setCallDetail] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

  useEffect(() => {
    async function fetchCallDetail() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/calls/${params.id}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error.message);
        } else if (data.data) {
          setCallDetail(data.data);
        }
      } catch (err) {
        setError('Failed to load call details');
        console.error('Failed to fetch call detail:', err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchCallDetail();
    }
  }, [params.id]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return <Badge variant="secondary">Not analyzed</Badge>;

    const variants: Record<string, string> = {
      positive: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      negative: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      neutral: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
      mixed: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    };

    return (
      <Badge variant="default" className={variants[sentiment] || ''}>
        {sentiment}
      </Badge>
    );
  };

  const getEscalationBadge = (risk: string | null) => {
    if (!risk) return null;

    const variants: Record<string, string> = {
      low: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      high: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    };

    return (
      <Badge variant="default" className={variants[risk] || ''}>
        {risk} risk
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !callDetail) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">{error || 'Call not found'}</p>
            <div className="mt-4 text-center">
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { call, analysis } = callDetail;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(call.startTime)}</p>
        </div>
      </div>

      {/* Call Overview */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{call.src || 'Unknown'}</div>
            {call.callerName && <p className="text-sm text-muted-foreground">{call.callerName}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{call.dst || 'Unknown'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDuration(call.durationSeconds)}</div>
            <p className="text-sm text-muted-foreground">
              Talk: {formatDuration(call.billsecSeconds)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="capitalize">{call.disposition || 'Unknown'}</div>
            {call.callDirection && (
              <p className="text-sm capitalize text-muted-foreground">{call.callDirection}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recording Player and Transcript */}
      {call.recordingStoragePath && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <RecordingPlayer
            callId={call.id}
            filename={call.recordingFilename || undefined}
            onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
          />
          <TranscriptViewer
            callId={call.id}
            currentTime={currentPlaybackTime}
            onSeek={(time) => {
              // This would seek the audio player
              setCurrentPlaybackTime(time);
            }}
          />
        </div>
      )}

      {/* AI Analysis */}
      {analysis ? (
        <Tabs defaultValue="summary" className="mt-6">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Summary</CardTitle>
                  <div className="flex gap-2">
                    {getSentimentBadge(analysis.sentimentOverall)}
                    {getEscalationBadge(analysis.escalationRisk)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {analysis.summary || 'No summary available'}
                </p>
              </CardContent>
            </Card>

            {analysis.actionItems && Array.isArray(analysis.actionItems) && analysis.actionItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.actionItems.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{item.description || item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overall Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getSentimentBadge(analysis.sentimentOverall)}
                  {analysis.sentimentScore && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Score: {analysis.sentimentScore}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="capitalize">
                    {analysis.satisfactionPrediction || 'Unknown'}
                  </Badge>
                  {analysis.satisfactionScore && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Score: {analysis.satisfactionScore}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Silence Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {formatDuration(analysis.silenceSeconds)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {analysis.sentimentTimeline && (
                <SentimentTimeline data={analysis.sentimentTimeline} />
              )}

              {analysis.talkRatio && analysis.talkTimeSeconds && (
                <TalkRatioVisualization
                  talkRatio={analysis.talkRatio}
                  talkTimeSeconds={analysis.talkTimeSeconds}
                  silenceSeconds={analysis.silenceSeconds || undefined}
                />
              )}

              {analysis.complianceScore !== null && analysis.complianceScore !== undefined && (
                <ComplianceScoreGauge
                  score={parseFloat(analysis.complianceScore as any) || 0}
                  flags={analysis.complianceFlags || []}
                />
              )}

              {analysis.escalationRisk && (
                <EscalationRiskCard
                  risk={analysis.escalationRisk as any}
                  reasons={analysis.escalationReasons || []}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            {analysis.keywords && Array.isArray(analysis.keywords) && analysis.keywords.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Keywords Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map((kw: any, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {kw.keyword || kw} {kw.count && `(${kw.count})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">No keywords detected</p>
                </CardContent>
              </Card>
            )}

            {analysis.topics && Array.isArray(analysis.topics) && analysis.topics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.topics.map((topic: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {topic.topic || topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Call Disposition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="capitalize">{analysis.callDispositionAi || 'Not classified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Word Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{analysis.wordCount?.toLocaleString() || 0} words</p>
                </CardContent>
              </Card>
            </div>

            {analysis.questionsAsked && Array.isArray(analysis.questionsAsked) && analysis.questionsAsked.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Questions Asked</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.questionsAsked.map((q: any, idx: number) => (
                      <li key={idx} className="border-l-2 border-primary pl-4">
                        <p className="font-medium">{q.question}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {q.speaker || 'Unknown'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysis.objections && Array.isArray(analysis.objections) && analysis.objections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Objections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.objections.map((obj: any, idx: number) => (
                      <li key={idx} className="rounded-lg border p-3">
                        <p className="font-medium">{obj.objection}</p>
                        {obj.response && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Response: {obj.response}
                          </p>
                        )}
                        {obj.outcome && (
                          <Badge variant="secondary" className="mt-2">
                            {obj.outcome}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {call.analysisStatus === 'pending'
                ? 'AI analysis is pending...'
                : call.analysisStatus === 'processing'
                ? 'AI analysis in progress...'
                : 'No AI analysis available for this call'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
