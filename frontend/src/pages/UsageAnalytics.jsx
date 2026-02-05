import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Phone,
  Clock,
  Database,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { api } from '@/lib/api';

export default function UsageAnalytics() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/usage`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      } else {
        setError('Failed to load usage data');
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getUsageStatus = (percentage) => {
    if (percentage >= 90) return { text: 'Critical', color: 'text-red-600', icon: AlertTriangle };
    if (percentage >= 75) return { text: 'Warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { text: 'Healthy', color: 'text-green-600', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Usage Analytics</h1>
                <p className="text-sm text-muted-foreground">Monitor your subscription usage and quotas</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {usage && (
          <>
            {/* Current Plan Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription and billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan</p>
                    <p className="text-2xl font-bold capitalize">{usage.plan_name || 'Starter'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                    <p className="text-2xl font-bold capitalize">{usage.billing_cycle || 'Monthly'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                    <p className="text-2xl font-bold">
                      {usage.next_billing_date
                        ? new Date(usage.next_billing_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Calls Usage */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Calls This Month
                      </CardTitle>
                      <CardDescription>Monthly call quota usage</CardDescription>
                    </div>
                    {(() => {
                      const percentage = getUsagePercentage(usage.calls_used || 0, usage.calls_limit || 1000);
                      const status = getUsageStatus(percentage);
                      const StatusIcon = status.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                        </div>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">{(usage.calls_used || 0).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">
                        of {(usage.calls_limit || 1000).toLocaleString()} calls
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(usage.calls_used || 0, usage.calls_limit || 1000)}
                      className="h-3"
                      indicatorClassName={getUsageColor(getUsagePercentage(usage.calls_used || 0, usage.calls_limit || 1000))}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {Math.round(getUsagePercentage(usage.calls_used || 0, usage.calls_limit || 1000))}% used
                      </span>
                      <span className="font-medium">
                        {(usage.calls_limit || 1000) - (usage.calls_used || 0)} remaining
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recording Minutes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recording Minutes
                      </CardTitle>
                      <CardDescription>Audio transcription minutes used</CardDescription>
                    </div>
                    {(() => {
                      const percentage = getUsagePercentage(
                        usage.transcription_minutes_used || 0,
                        usage.transcription_minutes_limit || 1000
                      );
                      const status = getUsageStatus(percentage);
                      const StatusIcon = status.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                        </div>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">
                        {(usage.transcription_minutes_used || 0).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {(usage.transcription_minutes_limit || 1000).toLocaleString()} minutes
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(
                        usage.transcription_minutes_used || 0,
                        usage.transcription_minutes_limit || 1000
                      )}
                      className="h-3"
                      indicatorClassName={getUsageColor(getUsagePercentage(
                        usage.transcription_minutes_used || 0,
                        usage.transcription_minutes_limit || 1000
                      ))}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {Math.round(getUsagePercentage(
                          usage.transcription_minutes_used || 0,
                          usage.transcription_minutes_limit || 1000
                        ))}% used
                      </span>
                      <span className="font-medium">
                        {(usage.transcription_minutes_limit || 1000) - (usage.transcription_minutes_used || 0)} remaining
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Usage */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Storage
                      </CardTitle>
                      <CardDescription>Recording storage used</CardDescription>
                    </div>
                    {(() => {
                      const percentage = getUsagePercentage(
                        usage.storage_gb_used || 0,
                        usage.storage_gb_limit || 10
                      );
                      const status = getUsageStatus(percentage);
                      const StatusIcon = status.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                        </div>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">
                        {(usage.storage_gb_used || 0).toFixed(2)} GB
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {(usage.storage_gb_limit || 10).toLocaleString()} GB
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(usage.storage_gb_used || 0, usage.storage_gb_limit || 10)}
                      className="h-3"
                      indicatorClassName={getUsageColor(getUsagePercentage(
                        usage.storage_gb_used || 0,
                        usage.storage_gb_limit || 10
                      ))}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {Math.round(getUsagePercentage(usage.storage_gb_used || 0, usage.storage_gb_limit || 10))}% used
                      </span>
                      <span className="font-medium">
                        {((usage.storage_gb_limit || 10) - (usage.storage_gb_used || 0)).toFixed(2)} GB remaining
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Requests */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        API Requests
                      </CardTitle>
                      <CardDescription>Monthly API call quota</CardDescription>
                    </div>
                    {(() => {
                      const percentage = getUsagePercentage(
                        usage.api_requests_used || 0,
                        usage.api_requests_limit || 10000
                      );
                      const status = getUsageStatus(percentage);
                      const StatusIcon = status.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                        </div>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">
                        {(usage.api_requests_used || 0).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {(usage.api_requests_limit || 10000).toLocaleString()} requests
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(
                        usage.api_requests_used || 0,
                        usage.api_requests_limit || 10000
                      )}
                      className="h-3"
                      indicatorClassName={getUsageColor(getUsagePercentage(
                        usage.api_requests_used || 0,
                        usage.api_requests_limit || 10000
                      ))}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {Math.round(getUsagePercentage(
                          usage.api_requests_used || 0,
                          usage.api_requests_limit || 10000
                        ))}% used
                      </span>
                      <span className="font-medium">
                        {(usage.api_requests_limit || 10000) - (usage.api_requests_used || 0)} remaining
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overages Alert */}
            {usage.quota_exceeded && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Quota Exceeded
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    You have exceeded your plan limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-800 mb-4">
                    You've used more than your allocated quota. Additional charges may apply or service may be limited.
                  </p>
                  {usage.overage_cost > 0 && (
                    <p className="text-sm font-medium text-red-900">
                      Estimated overage charges: ${usage.overage_cost.toFixed(2)}
                    </p>
                  )}
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/subscription')}
                  >
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Usage Trends */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage Period
                </CardTitle>
                <CardDescription>Current billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Period Start</p>
                    <p className="text-lg font-semibold">
                      {usage.period_start
                        ? new Date(usage.period_start).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Period End</p>
                    <p className="text-lg font-semibold">
                      {usage.period_end
                        ? new Date(usage.period_end).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Your usage quota resets on <strong>
                      {usage.period_end
                        ? new Date(usage.period_end).toLocaleDateString()
                        : 'the end of your billing cycle'}
                    </strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
