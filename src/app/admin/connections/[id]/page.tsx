'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Connection {
  id: string;
  tenantId: string;
  name: string;
  providerType: string;
  host: string;
  port: number;
  connectionStatus: string;
  webhookUrl: string;
  webhookSecret: string;
  isActive: boolean;
  lastConnectedAt: string | null;
  createdAt: string;
}

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchConnection() {
      try {
        const response = await fetch(`/api/connections/${params.id}`);
        const data = await response.json();
        if (data.data) {
          setConnection(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch connection:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchConnection();
    }
  }, [params.id]);

  const handleTestConnection = async () => {
    if (!connection) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/connections/${connection.id}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.data?.success) {
        setTestResult({
          success: true,
          message: 'Connection test successful! UCM API is accessible.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error?.message || 'Connection test failed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Connection not found</p>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/admin/connections')}>
                Back to Connections
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      connected: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      disconnected: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
      error: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    };

    return (
      <Badge variant="default" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/connections')}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{connection.name}</h1>
              {getStatusBadge(connection.connectionStatus)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {connection.providerType.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
        <Button onClick={handleTestConnection} disabled={testing}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {testResult && (
        <Card className={`mt-4 ${testResult.success ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="p-4">
            <p className={testResult.success ? 'text-green-500' : 'text-red-500'}>
              {testResult.message}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">Host</Label>
                <p className="mt-1 font-mono">{connection.host}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Port</Label>
                <p className="mt-1 font-mono">{connection.port}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Last Connected</Label>
              <p className="mt-1">
                {connection.lastConnectedAt
                  ? new Date(connection.lastConnectedAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="webhookUrl"
                  value={connection.webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(connection.webhookUrl)}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure your PBX to send CDR webhooks to this URL
              </p>
            </div>

            <div>
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="webhookSecret"
                  value={connection.webhookSecret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(connection.webhookSecret)}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Include this secret in your webhook headers for authentication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
