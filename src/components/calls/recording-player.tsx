'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Play,
  Pause,
  Download,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface RecordingPlayerProps {
  callId: string;
  filename?: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export function RecordingPlayer({ callId, filename, onTimeUpdate }: RecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch signed URL for recording
    async function fetchRecordingUrl() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/calls/${callId}/recording-url`);
        const data = await response.json();

        if (data.error) {
          setError(data.error.message);
        } else if (data.data?.url) {
          setAudioUrl(data.data.url);
        } else {
          setError('Recording URL not available');
        }
      } catch (err) {
        setError('Failed to load recording');
        console.error('Failed to fetch recording URL:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecordingUrl();
  }, [callId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = filename || 'recording.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error || !audioUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'Recording not available'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recording</CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload} aria-label="Download recording">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Waveform / Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full"
            aria-label="Seek through recording"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => skip(-15)}
              aria-label="Skip back 15 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => skip(15)}
              aria-label="Skip forward 15 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Playback Speed */}
          <div className="flex gap-1">
            {[1, 1.25, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? 'default' : 'outline'}
                size="sm"
                onClick={() => changePlaybackRate(rate)}
                aria-label={`Set playback speed to ${rate}x`}
              >
                {rate}x
              </Button>
            ))}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute} aria-label="Toggle mute">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20"
              aria-label="Volume control"
            />
          </div>
        </div>

        {filename && (
          <p className="text-xs text-muted-foreground">
            File: {filename}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
