'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SentimentTimelineProps {
  data: Array<{ timestamp_ms: number; sentiment: string; score: number }>;
}

export function SentimentTimeline({ data }: SentimentTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sentiment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sentiment timeline data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    time: point.timestamp_ms,
    score: point.score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="score"
              stroke="#FF7F50"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Call Start</span>
          <span>Call End</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface TalkRatioProps {
  talkRatio: { caller?: number; agent?: number };
  talkTimeSeconds: { caller?: number; agent?: number };
  silenceSeconds?: number;
}

export function TalkRatioVisualization({
  talkRatio,
  talkTimeSeconds,
  silenceSeconds,
}: TalkRatioProps) {
  const callerRatio = (talkRatio.caller || 0) * 100;
  const agentRatio = (talkRatio.agent || 0) * 100;
  const silenceRatio = silenceSeconds
    ? ((silenceSeconds / (silenceSeconds + (talkTimeSeconds.caller || 0) + (talkTimeSeconds.agent || 0))) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Talk Ratio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          <div
            className="bg-blue-500"
            style={{ width: `${callerRatio}%` }}
            title={`Caller: ${callerRatio.toFixed(1)}%`}
          />
          <div
            className="bg-green-500"
            style={{ width: `${agentRatio}%` }}
            title={`Agent: ${agentRatio.toFixed(1)}%`}
          />
          {silenceRatio > 0 && (
            <div
              className="bg-muted"
              style={{ width: `${silenceRatio}%` }}
              title={`Silence: ${silenceRatio.toFixed(1)}%`}
            />
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span>Caller</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{callerRatio.toFixed(0)}%</span>
              <span className="text-muted-foreground">
                ({formatTime(talkTimeSeconds.caller || 0)})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span>Agent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{agentRatio.toFixed(0)}%</span>
              <span className="text-muted-foreground">
                ({formatTime(talkTimeSeconds.agent || 0)})
              </span>
            </div>
          </div>

          {silenceSeconds && silenceSeconds > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-muted" />
                <span>Silence</span>
              </div>
              <span className="text-muted-foreground">({formatTime(silenceSeconds)})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComplianceScoreProps {
  score: number; // 0-1
  flags: Array<{ flag: string; description: string; passed: boolean }>;
}

export function ComplianceScoreGauge({ score, flags }: ComplianceScoreProps) {
  const percentage = score * 100;
  const getColor = () => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBackgroundColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compliance Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                className={getColor()}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getColor()}`}>
                {percentage.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {flags && flags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Compliance Checks</h4>
            {flags.map((flag, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full ${
                    flag.passed ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <div>
                  <p className="font-medium">{flag.flag}</p>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EscalationRiskProps {
  risk: 'low' | 'medium' | 'high';
  reasons: string[];
}

export function EscalationRiskCard({ risk, reasons }: EscalationRiskProps) {
  const getBadgeClass = () => {
    if (risk === 'high') return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
    if (risk === 'medium') return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
    return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Escalation Risk</CardTitle>
          <Badge variant="default" className={getBadgeClass()}>
            {risk.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {reasons && reasons.length > 0 ? (
          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-primary">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No specific risk factors identified</p>
        )}
      </CardContent>
    </Card>
  );
}
