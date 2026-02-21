'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Search } from 'lucide-react';

interface Utterance {
  speaker: string;
  text: string;
  timestamp: number; // milliseconds from call start
}

interface TranscriptViewerProps {
  callId: string;
  currentTime?: number; // Current playback time in seconds
  onSeek?: (timeInSeconds: number) => void;
}

export function TranscriptViewer({ callId, currentTime = 0, onSeek }: TranscriptViewerProps) {
  const [transcript, setTranscript] = useState<Utterance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUtteranceIndex, setActiveUtteranceIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const utteranceRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function fetchTranscript() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/calls/${callId}/transcript`);
        const data = await response.json();

        if (data.error) {
          setError(data.error.message);
        } else if (data.data?.utterances) {
          setTranscript(data.data.utterances);
        } else {
          setError('No transcript available');
        }
      } catch (err) {
        setError('Failed to load transcript');
        console.error('Failed to fetch transcript:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTranscript();
  }, [callId]);

  // Auto-scroll to current utterance
  useEffect(() => {
    if (transcript.length === 0) return;

    const currentTimeMs = currentTime * 1000;
    let activeIndex = -1;

    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].timestamp <= currentTimeMs) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== -1 && activeIndex !== activeUtteranceIndex) {
      setActiveUtteranceIndex(activeIndex);

      // Scroll to active utterance
      if (utteranceRefs.current[activeIndex]) {
        utteranceRefs.current[activeIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentTime, transcript, activeUtteranceIndex]);

  const formatTimestamp = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string) => {
    if (speaker.toLowerCase().includes('agent') || speaker === 'Speaker 2') {
      return 'text-green-500';
    }
    return 'text-blue-500';
  };

  const handleUtteranceClick = (timestamp: number) => {
    if (onSeek) {
      onSeek(timestamp / 1000); // Convert ms to seconds
    }
  };

  const copyTranscript = () => {
    const fullText = transcript
      .map((u) => `[${formatTimestamp(u.timestamp)}] ${u.speaker}: ${u.text}`)
      .join('\n');

    navigator.clipboard.writeText(fullText);
  };

  const filteredTranscript = searchQuery
    ? transcript.filter((u) =>
        u.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transcript;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error || transcript.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No transcript available'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transcript</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyTranscript}
              aria-label="Copy transcript to clipboard"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              aria-label="Search transcript"
            />
          </div>
          <Badge variant="secondary">
            {filteredTranscript.length} / {transcript.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="max-h-[500px] space-y-4 overflow-y-auto rounded-lg border p-4"
        >
          {filteredTranscript.map((utterance, index) => {
            const originalIndex = transcript.indexOf(utterance);
            const isActive = originalIndex === activeUtteranceIndex;

            return (
              <div
                key={index}
                ref={(el) => {
                  utteranceRefs.current[originalIndex] = el;
                }}
                className={`cursor-pointer rounded-lg border-l-4 p-3 transition-all hover:bg-surface ${
                  isActive ? 'border-primary bg-surface' : 'border-transparent'
                }`}
                onClick={() => handleUtteranceClick(utterance.timestamp)}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${getSpeakerColor(utterance.speaker)}`}
                  >
                    {utterance.speaker}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(utterance.timestamp)}
                  </span>
                </div>
                <p className="text-sm">
                  {searchQuery
                    ? utterance.text
                        .split(new RegExp(`(${searchQuery})`, 'gi'))
                        .map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark key={i} className="bg-yellow-500/30">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )
                    : utterance.text}
                </p>
              </div>
            );
          })}
        </div>

        {searchQuery && filteredTranscript.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No results found for "{searchQuery}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}
