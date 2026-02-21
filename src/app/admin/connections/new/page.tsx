'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewConnectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenantId: '',
    name: '',
    providerType: 'grandstream_ucm',
    host: '',
    port: '8443',
    apiUsername: '',
    apiPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error.message);
      } else if (data.data) {
        router.push('/admin/connections');
      }
    } catch (err) {
      setError('Failed to create connection');
      console.error('Failed to create connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">New PBX Connection</h1>
        <p className="mt-2 text-muted-foreground">
          Connect a PBX system to start receiving call data
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            Webhook URL and secret will be auto-generated after creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                type="text"
                value={formData.tenantId}
                onChange={(e) => handleChange('tenantId', e.target.value)}
                placeholder="Tenant UUID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Main Office PBX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerType">PBX Provider Type</Label>
              <Select
                value={formData.providerType}
                onValueChange={(value) => handleChange('providerType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grandstream_ucm">Grandstream UCM</SelectItem>
                  <SelectItem value="freepbx">FreePBX</SelectItem>
                  <SelectItem value="3cx">3CX</SelectItem>
                  <SelectItem value="generic_webhook">Generic Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  type="text"
                  value={formData.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  placeholder="pbx.example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleChange('port', e.target.value)}
                  placeholder="8443"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiUsername">API Username</Label>
              <Input
                id="apiUsername"
                type="text"
                value={formData.apiUsername}
                onChange={(e) => handleChange('apiUsername', e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiPassword">API Password</Label>
              <Input
                id="apiPassword"
                type="password"
                value={formData.apiPassword}
                onChange={(e) => handleChange('apiPassword', e.target.value)}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-muted-foreground">
                Password will be encrypted before storage
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Connection'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
