import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Activity, RefreshCw, Phone, Mic, Sparkles, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';

const ActivityLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getActivityLogs(page, 50);
      setLogs(response.logs || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call_received':
        return <Phone className="h-4 w-4 text-blue-600" />;
      case 'recording_downloaded':
        return <Download className="h-4 w-4 text-green-600" />;
      case 'transcription_completed':
        return <Mic className="h-4 w-4 text-purple-600" />;
      case 'ai_analysis_completed':
        return <Sparkles className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'call_received':
        return 'bg-[#6CA8C2]/10 border-[#6CA8C2]/30';
      case 'recording_downloaded':
        return 'bg-[#3F8A84]/10 border-[#3F8A84]/30';
      case 'transcription_completed':
        return 'bg-[#C89A8F]/10 border-[#C89A8F]/30';
      case 'ai_analysis_completed':
        return 'bg-[#E4B756]/10 border-[#E4B756]/30';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-[#F9FAFA] border-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Activity Logs" subtitle="Real-time system activity and events">
      <Card className="glass-card border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-[#3F8A84]" />
              <div>
                <CardTitle className="font-serif text-[#31543A]">Activity Logs</CardTitle>
                <CardDescription className="text-[#2A2A2A]/60 font-light">Real-time system activity and events</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A] hover:text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-[#3F8A84]" />
              <span className="ml-2 text-[#2A2A2A]/70 font-light">Loading activity logs...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-2xl border ${getActivityColor(log.type)} transition-all hover:shadow-md cursor-pointer`}
                    onClick={() => log.call_id && navigate(`/call/${log.call_id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActivityIcon(log.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-[#2A2A2A]">{log.message}</span>
                          <span className="text-xs text-[#2A2A2A]/60 font-light">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-xs text-[#2A2A2A]/60 font-light mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <div className="text-sm text-[#2A2A2A]/60 font-light">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A] hover:text-white transition-colors rounded-full"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A] hover:text-white transition-colors rounded-full"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ActivityLogs;
