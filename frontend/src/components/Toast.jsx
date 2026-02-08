import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast Notification System
 * Shows temporary notifications for user actions
 *
 * Usage:
 * const { showToast } = useToast();
 *
 * showToast({
 *   type: 'success',
 *   title: 'Call deleted',
 *   message: 'The call has been removed',
 *   action: { label: 'Undo', onClick: () => restore() }
 * });
 */

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    borderColor: 'border-success-200',
    iconColor: 'text-success-600',
    titleColor: 'text-success-900',
    textColor: 'text-success-700'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-error-50',
    borderColor: 'border-error-200',
    iconColor: 'text-error-600',
    titleColor: 'text-error-900',
    textColor: 'text-error-700'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-200',
    iconColor: 'text-warning-600',
    titleColor: 'text-warning-900',
    textColor: 'text-warning-700'
  },
  info: {
    icon: Info,
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    iconColor: 'text-primary-600',
    titleColor: 'text-primary-900',
    textColor: 'text-primary-700'
  }
};

const Toast = ({ id, type = 'info', title, message, action, onClose, duration }) => {
  const config = TOAST_TYPES[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg p-4",
        "animate-in slide-in-from-right duration-300",
        config.bgColor,
        config.borderColor
      )}
      role="alert"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          {title && (
            <p className={cn("text-sm font-medium", config.titleColor)}>
              {title}
            </p>
          )}
          {message && (
            <p className={cn("mt-1 text-sm", config.textColor)}>
              {message}
            </p>
          )}

          {/* Action Button */}
          {action && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onClose(id);
                }}
                className={cn(
                  "text-sm font-medium underline hover:no-underline",
                  config.titleColor
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            onClick={() => onClose(id)}
            className={cn(
              "inline-flex rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2",
              config.iconColor
            )}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', title, message, action, duration = 5000 }) => {
    const id = Date.now() + Math.random();

    setToasts(prev => [...prev, { id, type, title, message, action }]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        closeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const closeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, closeToast, closeAllToasts }}>
      {children}

      {/* Toast Container */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-tooltip"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={closeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Convenience functions for common toast types
 */
export const toast = {
  success: (title, message, options = {}) => {
    const { showToast } = useToast();
    return showToast({ type: 'success', title, message, ...options });
  },
  error: (title, message, options = {}) => {
    const { showToast } = useToast();
    return showToast({ type: 'error', title, message, ...options });
  },
  warning: (title, message, options = {}) => {
    const { showToast } = useToast();
    return showToast({ type: 'warning', title, message, ...options });
  },
  info: (title, message, options = {}) => {
    const { showToast } = useToast();
    return showToast({ type: 'info', title, message, ...options });
  }
};

export default Toast;
