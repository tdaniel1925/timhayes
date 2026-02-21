'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface HeatmapData {
  [day: string]: {
    [hour: string]: number;
  };
}

interface PeakHoursHeatmapProps {
  data: HeatmapData;
  isLoading?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PeakHoursHeatmap({ data, isLoading }: PeakHoursHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; count: number } | null>(
    null
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  // Find max value for color scaling
  let maxCalls = 0;
  DAYS.forEach((day) => {
    HOURS.forEach((hour) => {
      const count = data[day]?.[hour] || 0;
      if (count > maxCalls) maxCalls = count;
    });
  });

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    const intensity = count / maxCalls;
    if (intensity < 0.2) return 'bg-primary/20';
    if (intensity < 0.4) return 'bg-primary/40';
    if (intensity < 0.6) return 'bg-primary/60';
    if (intensity < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Hours Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">Call volume by day of week and hour</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Hour labels */}
            <div className="mb-2 flex">
              <div className="w-24" /> {/* Space for day labels */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground"
                  style={{ fontSize: '10px' }}
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {DAYS.map((day) => (
              <div key={day} className="mb-1 flex items-center">
                <div className="w-24 pr-2 text-xs text-muted-foreground">{day.slice(0, 3)}</div>
                {HOURS.map((hour) => {
                  const count = data[day]?.[hour] || 0;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`relative flex-1 cursor-pointer transition-all hover:opacity-80 ${getColor(
                        count
                      )}`}
                      style={{
                        height: '32px',
                        margin: '1px',
                        borderRadius: '2px',
                      }}
                      onMouseEnter={() => setHoveredCell({ day, hour, count })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            ))}

            {/* Tooltip */}
            {hoveredCell && (
              <div className="mt-4 rounded-lg border bg-surface p-3">
                <p className="text-sm font-medium">
                  {hoveredCell.day}, {hoveredCell.hour}:00
                </p>
                <p className="text-xs text-muted-foreground">{hoveredCell.count} calls</p>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-primary/20" />
              <div className="h-4 w-4 rounded bg-primary/40" />
              <div className="h-4 w-4 rounded bg-primary/60" />
              <div className="h-4 w-4 rounded bg-primary/80" />
              <div className="h-4 w-4 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
