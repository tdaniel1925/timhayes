'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Connection {
  id: string;
  tenantId: string;
  name: string;
  providerType: string;
  host: string;
  port: number;
  connectionStatus: string;
  webhookUrl: string;
  isActive: boolean;
  lastConnectedAt: string | null;
  createdAt: string;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConnections() {
      try {
        const response = await fetch('/api/connections');
        const data = await response.json();
        if (data.data) {
          setConnections(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConnections();
  }, []);

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

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">PBX Connections</h1>
        <Card className="mt-8">
          <CardContent className="p-8">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PBX Connections</h1>
          <p className="mt-2 text-muted-foreground">
            Manage PBX system integrations and webhook endpoints
          </p>
        </div>
        <Button onClick={() => router.push('/admin/connections/new')}>
          Add Connection
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No connections configured</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/admin/connections/new')}
              >
                Create First Connection
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Webhook URL</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => (
                  <TableRow key={conn.id}>
                    <TableCell className="font-medium">{conn.name}</TableCell>
                    <TableCell className="capitalize">{conn.providerType.replace('_', ' ')}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {conn.host}:{conn.port}
                    </TableCell>
                    <TableCell>{getStatusBadge(conn.connectionStatus)}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">
                      {conn.webhookUrl}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/connections/${conn.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
