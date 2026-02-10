import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ExternalLink,
  Code,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function APIManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAPIData();
  }, []);

  const fetchAPIData = async () => {
    try {
      const [keysResponse, logsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/tenant/api-keys`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/tenant/webhook-logs?limit=50`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.api_keys || []);
      }

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setWebhookLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error('Error fetching API data:', err);
      setError('Failed to load API information');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName })
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey(data.api_key);
        setNewKeyName('');
        fetchAPIData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create API key');
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      alert('Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });

      if (response.ok) {
        fetchAPIData();
      } else {
        alert('Failed to delete API key');
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      alert('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="API Management" subtitle="Manage API keys and integration">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F8A84] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading API management...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="API Management" subtitle="Manage API keys and integration">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800 font-light">{error}</p>
          </div>
        )}

        {/* API Documentation Link */}
        <Card className="mb-8 border-[#6CA8C2]/30 bg-[#6CA8C2]/10 glass-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-[#6CA8C2] flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-serif font-semibold text-[#31543A] mb-2">API Documentation</h3>
                <p className="text-sm text-[#2A2A2A]/70 font-light mb-4">
                  Learn how to integrate AudiaPro's API into your applications. Access full documentation,
                  code examples, and best practices.
                </p>
                <Button variant="outline" className="flex items-center gap-2 border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A] hover:text-white transition-colors rounded-full" size="sm">
                  <ExternalLink className="h-4 w-4" />
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="mb-8 glass-card border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-serif text-[#31543A]">
                  <Key className="h-5 w-5 text-[#3F8A84]" />
                  API Keys
                </CardTitle>
                <CardDescription className="text-[#2A2A2A]/60 font-light">Manage your API authentication keys</CardDescription>
              </div>
              <Button onClick={() => setShowNewKeyModal(true)} className="flex items-center gap-2 bg-[#31543A] hover:bg-[#3F8A84] text-white rounded-full transition-colors">
                <Plus className="h-4 w-4" />
                Create New Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys && apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 border border-gray-200 rounded-2xl bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-[#2A2A2A]">{key.name}</h4>
                          <Badge className={key.is_active ? 'bg-[#3F8A84]/10 text-[#3F8A84] border-[#3F8A84]/30' : 'bg-gray-100 text-gray-800'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm bg-[#F9FAFA] text-[#2A2A2A] px-3 py-1 rounded-lg font-mono">
                            {key.key_preview}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(key.full_key || key.key_preview)}
                            className="flex items-center gap-1 text-[#3F8A84] hover:bg-[#3F8A84]/10"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-[#2A2A2A]/60 font-light">
                          <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                          {key.last_used_at && (
                            <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#2A2A2A]/60">
                <Key className="h-12 w-12 mx-auto mb-4 text-[#3F8A84]/40" />
                <p className="mb-2 font-light">No API keys created yet</p>
                <p className="text-sm font-light">Create your first API key to start integrating</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Logs */}
        <Card className="glass-card border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-[#31543A]">
              <Code className="h-5 w-5 text-[#3F8A84]" />
              Recent Webhook Activity
            </CardTitle>
            <CardDescription className="text-[#2A2A2A]/60 font-light">Last 50 webhook requests received</CardDescription>
          </CardHeader>
          <CardContent>
            {webhookLogs && webhookLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Timestamp</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{log.event_type}</td>
                        <td className="py-3 px-4 text-sm">
                          <Badge className={getStatusColor(log.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(log.status)}
                              {log.status}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {log.response_code}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[#2A2A2A]/60">
                <Code className="h-12 w-12 mx-auto mb-4 text-[#3F8A84]/40" />
                <p className="mb-2 font-light">No webhook activity yet</p>
                <p className="text-sm font-light">Webhook logs will appear here once you start receiving calls</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full glass-card rounded-3xl">
            <CardHeader>
              <CardTitle className="font-serif text-[#31543A]">Create New API Key</CardTitle>
              <CardDescription className="text-[#2A2A2A]/60 font-light">Generate a new API key for your integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production Server"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a descriptive name to identify this key
                  </p>
                </div>

                <div className="p-3 bg-[#E4B756]/10 border border-[#E4B756]/30 rounded-2xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#E4B756] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#2A2A2A]/70 font-light">
                      Make sure to copy your API key now. You won't be able to see it again!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-[#F9FAFA] border-t border-gray-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewKeyModal(false);
                  setNewKeyName('');
                }}
                className="border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A]/10 rounded-full"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateKey} className="bg-[#31543A] hover:bg-[#3F8A84] text-white rounded-full">
                Create Key
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Newly Created Key Modal */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full glass-card rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3F8A84] font-serif">
                <CheckCircle className="h-5 w-5" />
                API Key Created
              </CardTitle>
              <CardDescription className="text-[#2A2A2A]/60 font-light">Save this key securely - you won't be able to see it again</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Your API Key</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={newlyCreatedKey}
                      readOnly
                      className="font-mono text-sm bg-[#F9FAFA] border-gray-200 rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="border-[#31543A]/20 text-[#31543A] hover:bg-[#31543A]/10 rounded-full"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-800 font-light">
                      This is the only time you'll see this key. Store it securely!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-[#F9FAFA] border-t border-gray-100 flex justify-end">
              <Button
                onClick={() => {
                  setNewlyCreatedKey(null);
                  setShowNewKeyModal(false);
                }}
                className="bg-[#31543A] hover:bg-[#3F8A84] text-white rounded-full"
              >
                I've Saved My Key
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
