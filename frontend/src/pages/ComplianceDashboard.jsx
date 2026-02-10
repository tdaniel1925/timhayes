import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  TrendingDown,
  TrendingUp,
  Filter,
  Eye
} from 'lucide-react';

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplianceData();
  }, [severityFilter, statusFilter]);

  const fetchComplianceData = async () => {
    try {
      const [summaryResponse, alertsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/tenant/compliance/summary`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/tenant/compliance/alerts?severity=${severityFilter}&status=${statusFilter}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setComplianceData(summaryData);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/compliance/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolved_by: user?.email })
      });

      if (response.ok) {
        fetchComplianceData();
      } else {
        alert('Failed to resolve alert');
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Failed to resolve alert');
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/compliance/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ severity: severityFilter, status: statusFilter })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export report');
      }
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />;
      case 'low':
        return <Shield className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchQuery ||
      alert.keyword?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.context?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout title="Compliance Center" subtitle="Monitor regulatory compliance and alerts">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading compliance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Compliance Center" subtitle="Monitor regulatory compliance and alerts">
      <div className="max-w-7xl mx-auto">
        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="flex items-center gap-2 border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A] hover:text-white transition-colors rounded-full"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800 font-light">{error}</p>
          </div>
        )}

        {complianceData && (
          <>
            {/* Compliance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass-card border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[#2A2A2A]/60 font-light tracking-wide uppercase">Total Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold font-serif text-[#31543A]">{complianceData.total_alerts || 0}</span>
                    <Shield className="h-8 w-8 text-[#6CA8C2]" />
                  </div>
                  <p className="text-xs text-[#2A2A2A]/60 font-light mt-2">All time</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[#2A2A2A]/60 font-light tracking-wide uppercase">Unresolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold font-serif text-[#E4B756]">
                      {complianceData.unresolved_alerts || 0}
                    </span>
                    <AlertTriangle className="h-8 w-8 text-[#E4B756]" />
                  </div>
                  <p className="text-xs text-[#2A2A2A]/60 font-light mt-2">Needs attention</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[#2A2A2A]/60 font-light tracking-wide uppercase">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold font-serif text-[#3F8A84]">
                      {complianceData.resolved_alerts || 0}
                    </span>
                    <CheckCircle className="h-8 w-8 text-[#3F8A84]" />
                  </div>
                  <p className="text-xs text-[#2A2A2A]/60 font-light mt-2">Handled</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[#2A2A2A]/60 font-light tracking-wide uppercase">Compliance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold font-serif text-[#3F8A84]">
                      {complianceData.compliance_score || 95}%
                    </span>
                    {complianceData.score_trend === 'up' ? (
                      <TrendingUp className="h-8 w-8 text-[#3F8A84]" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <p className="text-xs text-[#2A2A2A]/60 font-light mt-2">
                    {complianceData.score_trend === 'up' ? 'Improving' : 'Declining'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alert Types Breakdown */}
            <Card className="mb-8 glass-card border-gray-100">
              <CardHeader>
                <CardTitle className="font-serif text-[#31543A]">Alert Types</CardTitle>
                <CardDescription className="text-[#2A2A2A]/60 font-light">Distribution by compliance category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {complianceData.alert_types && Object.entries(complianceData.alert_types).map(([type, count]) => (
                    <div key={type} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{type?.replace(/_/g, ' ') || type || 'Unknown'}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / complianceData.total_alerts) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card className="mb-6 glass-card border-gray-100">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search alerts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Alerts List */}
            <Card className="glass-card border-gray-100">
              <CardHeader>
                <CardTitle className="font-serif text-[#31543A]">Compliance Alerts</CardTitle>
                <CardDescription className="text-[#2A2A2A]/60 font-light">
                  {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-2xl ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm">
                                    {alert.alert_type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN ALERT'}
                                  </h4>
                                  <Badge className={getSeverityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  {alert.resolved ? (
                                    <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                                  ) : (
                                    <Badge className="bg-orange-100 text-orange-800">Unresolved</Badge>
                                  )}
                                </div>
                                <p className="text-sm mb-2">
                                  <strong>Keyword detected:</strong> "{alert.keyword}"
                                </p>
                                {alert.context && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <strong>Context:</strong> {alert.context}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Call ID: {alert.cdr_id}</span>
                                  <span>
                                    {alert.timestamp_in_call && `Time: ${Math.floor(alert.timestamp_in_call / 60)}:${(alert.timestamp_in_call % 60).toString().padStart(2, '0')}`}
                                  </span>
                                  <span>{new Date(alert.created_at).toLocaleString()}</span>
                                </div>
                                {alert.resolved && alert.resolved_at && (
                                  <p className="text-xs text-green-700 mt-2">
                                    Resolved on {new Date(alert.resolved_at).toLocaleString()}
                                    {alert.resolved_by && ` by ${alert.resolved_by}`}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/call/${alert.cdr_id}`)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  View Call
                                </Button>
                                {!alert.resolved && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleResolveAlert(alert.id)}
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    Resolve
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-[#3F8A84]/40" />
                    <h3 className="text-lg font-serif font-medium text-[#31543A] mb-2">No Compliance Alerts</h3>
                    <p className="text-[#2A2A2A]/70 font-light">
                      {searchQuery || severityFilter !== 'all' || statusFilter !== 'all'
                        ? 'No alerts match your filters'
                        : 'All calls are compliant - great job!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
