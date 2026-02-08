import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Loading Skeleton Component
 * Shows animated placeholder while content loads
 *
 * Usage:
 * <LoadingSkeleton className="h-4 w-32" />
 * <LoadingSkeleton variant="text" lines={3} />
 * <LoadingSkeleton variant="circle" className="h-12 w-12" />
 */

const LoadingSkeleton = ({
  variant = 'default',
  lines = 1,
  className = '',
  ...props
}) => {
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-gray-200 rounded animate-pulse",
              i === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
              className
            )}
            {...props}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn(
          "rounded-full bg-gray-200 animate-pulse",
          className
        )}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("border border-gray-200 rounded-lg p-4 space-y-3", className)}>
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex gap-4 pb-2 border-b border-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: lines || 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default rectangular skeleton
  return (
    <div
      className={cn(
        "bg-gray-200 rounded animate-pulse",
        className
      )}
      {...props}
    />
  );
};

/**
 * Pre-configured skeleton layouts for common use cases
 */

export const CallListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <LoadingSkeleton variant="circle" className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-3 w-48" />
            </div>
          </div>
          <LoadingSkeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-full" />
          <LoadingSkeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export const CallDetailSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center space-x-4">
      <LoadingSkeleton variant="circle" className="h-16 w-16" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-6 w-64" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>
    </div>

    {/* Audio Player */}
    <LoadingSkeleton className="h-16 w-full" />

    {/* Stats */}
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-5 w-16" />
        </div>
      ))}
    </div>

    {/* Content Sections */}
    <div className="space-y-4">
      <LoadingSkeleton className="h-6 w-32" />
      <LoadingSkeleton variant="text" lines={5} />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-8 w-16" />
          <LoadingSkeleton className="h-3 w-32" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <LoadingSkeleton className="h-64" />
      <LoadingSkeleton className="h-64" />
    </div>

    {/* Table */}
    <LoadingSkeleton variant="table" lines={10} />
  </div>
);

export { LoadingSkeleton };
export default LoadingSkeleton;
