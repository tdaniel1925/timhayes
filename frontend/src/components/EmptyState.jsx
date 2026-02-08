import React from 'react';
import { Phone, Search, AlertCircle, FileX, Inbox, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Empty State Component
 * Shows friendly message when there's no data
 *
 * Usage:
 * <EmptyState
 *   icon={<Phone />}
 *   title="No calls yet"
 *   description="Calls will appear here once your phone system is connected"
 *   action={<Button>Connect Phone System</Button>}
 * />
 */

const PRESET_STATES = {
  noCalls: {
    icon: Phone,
    title: "No calls yet",
    description: "Calls will appear here once your phone system starts sending data",
    iconColor: "text-primary-500",
    iconBg: "bg-primary-50"
  },
  noResults: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters",
    iconColor: "text-gray-500",
    iconBg: "bg-gray-100"
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We're having trouble loading your data. Please try again.",
    iconColor: "text-error-500",
    iconBg: "bg-error-50"
  },
  noRecording: {
    icon: FileX,
    title: "No recording available",
    description: "This call was not recorded or the recording file is missing",
    iconColor: "text-gray-500",
    iconBg: "bg-gray-100"
  },
  emptyInbox: {
    icon: Inbox,
    title: "All caught up!",
    description: "You don't have any new notifications",
    iconColor: "text-success-500",
    iconBg: "bg-success-50"
  },
  noData: {
    icon: Filter,
    title: "No data to display",
    description: "Try changing your filters or date range",
    iconColor: "text-gray-500",
    iconBg: "bg-gray-100"
  }
};

const EmptyState = ({
  preset,
  icon: CustomIcon,
  title,
  description,
  action,
  className = '',
  size = 'default' // 'sm' | 'default' | 'lg'
}) => {
  // Use preset if provided
  const state = preset ? PRESET_STATES[preset] : {};
  const Icon = CustomIcon || state.icon || Inbox;
  const finalTitle = title || state.title || "No data";
  const finalDescription = description || state.description || "";
  const iconColor = state.iconColor || "text-gray-500";
  const iconBg = state.iconBg || "bg-gray-100";

  // Size variants
  const sizeClasses = {
    sm: {
      container: "py-8",
      iconWrapper: "h-12 w-12",
      icon: "h-6 w-6",
      title: "text-base",
      description: "text-sm"
    },
    default: {
      container: "py-12",
      iconWrapper: "h-16 w-16",
      icon: "h-8 w-8",
      title: "text-lg",
      description: "text-base"
    },
    lg: {
      container: "py-16",
      iconWrapper: "h-20 w-20",
      icon: "h-10 w-10",
      title: "text-xl",
      description: "text-lg"
    }
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "rounded-full flex items-center justify-center mb-4",
          sizes.iconWrapper,
          iconBg
        )}
      >
        <Icon className={cn(sizes.icon, iconColor)} />
      </div>

      {/* Title */}
      <h3 className={cn("font-semibold text-gray-900 mb-2", sizes.title)}>
        {finalTitle}
      </h3>

      {/* Description */}
      {finalDescription && (
        <p className={cn("text-gray-600 max-w-md mb-6", sizes.description)}>
          {finalDescription}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

/**
 * Pre-configured empty states for common scenarios
 */

export const NoCallsYet = ({ onConnect }) => (
  <EmptyState
    preset="noCalls"
    action={
      onConnect && (
        <Button onClick={onConnect} size="lg">
          <Phone className="mr-2 h-4 w-4" />
          Connect Phone System
        </Button>
      )
    }
  />
);

export const NoSearchResults = ({ onClear }) => (
  <EmptyState
    preset="noResults"
    action={
      onClear && (
        <Button onClick={onClear} variant="outline">
          Clear Filters
        </Button>
      )
    }
  />
);

export const ErrorState = ({ onRetry, message }) => (
  <EmptyState
    preset="error"
    description={message || PRESET_STATES.error.description}
    action={
      onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )
    }
  />
);

export const NoRecordingAvailable = () => (
  <EmptyState
    preset="noRecording"
    size="sm"
  />
);

export const AllCaughtUp = () => (
  <EmptyState
    preset="emptyInbox"
    size="sm"
  />
);

export default EmptyState;
