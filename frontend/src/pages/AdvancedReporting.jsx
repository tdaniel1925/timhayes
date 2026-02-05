import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Filter,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  FileCog,
  Clock
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout'

export default function AdvancedReporting() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [reportConfig, setReportConfig] = useState({
    name: '',
    type: 'call_analytics',
    dateRange: '30',
    groupBy: 'day',
    metrics: ['call_count', 'avg_duration', 'sentiment_distribution'],
    filters: {
      status: '',
      sentiment: '',
      agent: ''
    },
    schedule: 'none'
  });

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/saved-reports`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error loading saved reports:', err);
    }
  };

  const handleGenerateReport = async (format) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...reportConfig,
          export_format: format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportConfig.name.trim()) {
      alert('Please enter a name for the report');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/saved-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      });

      if (response.ok) {
        alert('Report configuration saved successfully!');
        loadSavedReports();
        setReportConfig({ ...reportConfig, name: '' });
      } else {
        alert('Failed to save report');
      }
    } catch (err) {
      console.error('Error saving report:', err);
      alert('Failed to save report');
    }
  };

  const reportTypes = [
    { value: 'call_analytics', label: 'Call Analytics Report' },
    { value: 'team_performance', label: 'Team Performance Report' },
    { value: 'quality_scores', label: 'Quality Scores Report' },
    { value: 'sentiment_analysis', label: 'Sentiment Analysis Report' },
    { value: 'compliance', label: 'Compliance Report' },
    { value: 'custom', label: 'Custom Report' }
  ];

  const dateRanges = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const groupByOptions = [
    { value: 'hour', label: 'By Hour' },
    { value: 'day', label: 'By Day' },
    { value: 'week', label: 'By Week' },
    { value: 'month', label: 'By Month' }
  ];

  const scheduleOptions = [
    { value: 'none', label: 'No Schedule' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  return (
    <DashboardLayout>
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
                <h1 className="text-2xl font-bold">Advanced Reporting</h1>
                <p className="text-sm text-muted-foreground">Create custom reports and analytics</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Builder */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Report Builder
                </CardTitle>
                <CardDescription>Configure your custom report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Name */}
                <div>
                  <Label htmlFor="reportName">Report Name (Optional)</Label>
                  <Input
                    id="reportName"
                    placeholder="e.g., Monthly Team Performance"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {/* Report Type */}
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportConfig.type}
                    onValueChange={(value) => setReportConfig({ ...reportConfig, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select
                    value={reportConfig.dateRange}
                    onValueChange={(value) => setReportConfig({ ...reportConfig, dateRange: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Group By */}
                <div>
                  <Label htmlFor="groupBy">Group By</Label>
                  <Select
                    value={reportConfig.groupBy}
                    onValueChange={(value) => setReportConfig({ ...reportConfig, groupBy: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupByOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Metrics Selection */}
                <div>
                  <Label className="mb-2 block">Included Metrics</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['call_count', 'avg_duration', 'total_duration', 'quality_score', 'sentiment_distribution', 'compliance_alerts'].map((metric) => (
                      <label key={metric} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reportConfig.metrics.includes(metric)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportConfig({
                                ...reportConfig,
                                metrics: [...reportConfig.metrics, metric]
                              });
                            } else {
                              setReportConfig({
                                ...reportConfig,
                                metrics: reportConfig.metrics.filter(m => m !== metric)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{metric.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <Label htmlFor="schedule">Schedule (Optional)</Label>
                  <Select
                    value={reportConfig.schedule}
                    onValueChange={(value) => setReportConfig({ ...reportConfig, schedule: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleGenerateReport('pdf')}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Export as PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('csv')}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('xlsx')}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export as Excel
                  </Button>
                  {reportConfig.name && (
                    <Button
                      variant="secondary"
                      onClick={handleSaveReport}
                      className="flex items-center gap-2"
                    >
                      <FileCog className="h-4 w-4" />
                      Save Configuration
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Export Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Export Templates
                </CardTitle>
                <CardDescription>Pre-configured report templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => {
                      setReportConfig({
                        ...reportConfig,
                        type: 'call_analytics',
                        dateRange: '30',
                        metrics: ['call_count', 'avg_duration', 'sentiment_distribution']
                      });
                      handleGenerateReport('pdf');
                    }}
                  >
                    <span className="font-semibold">Monthly Call Summary</span>
                    <span className="text-xs text-muted-foreground">Last 30 days call analytics</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => {
                      setReportConfig({
                        ...reportConfig,
                        type: 'team_performance',
                        dateRange: '7',
                        metrics: ['quality_score', 'call_count']
                      });
                      handleGenerateReport('pdf');
                    }}
                  >
                    <span className="font-semibold">Weekly Team Report</span>
                    <span className="text-xs text-muted-foreground">Last 7 days team performance</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => {
                      setReportConfig({
                        ...reportConfig,
                        type: 'compliance',
                        dateRange: '30',
                        metrics: ['compliance_alerts']
                      });
                      handleGenerateReport('pdf');
                    }}
                  >
                    <span className="font-semibold">Compliance Report</span>
                    <span className="text-xs text-muted-foreground">Monthly compliance overview</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => {
                      setReportConfig({
                        ...reportConfig,
                        type: 'quality_scores',
                        dateRange: '90',
                        metrics: ['quality_score']
                      });
                      handleGenerateReport('xlsx');
                    }}
                  >
                    <span className="font-semibold">Quality Trends</span>
                    <span className="text-xs text-muted-foreground">90-day quality analysis (Excel)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saved Reports */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCog className="h-5 w-5" />
                  Saved Reports
                </CardTitle>
                <CardDescription>Your saved report configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {savedReports && savedReports.length > 0 ? (
                  <div className="space-y-3">
                    {savedReports.map((report) => (
                      <div key={report.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{report.name}</h4>
                          {report.schedule !== 'none' && (
                            <Clock className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {report.type.replace(/_/g, ' ')} • {report.dateRange} days
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => {
                              setReportConfig(report);
                              handleGenerateReport('pdf');
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCog className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm">No saved reports yet</p>
                    <p className="text-xs mt-1">Save your configurations for quick access</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Export Formats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <span><strong>PDF:</strong> Best for sharing and printing</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span><strong>CSV:</strong> Simple data for any tool</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span><strong>Excel:</strong> Advanced analysis features</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
