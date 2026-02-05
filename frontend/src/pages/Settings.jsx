import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, getWebhookBaseUrl } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Server, Webhook, Sliders } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneSystems, setPhoneSystems] = useState([]);
  const [settings, setSettings] = useState({
    company_name: '',
    subdomain: '',
    phone_system_type: 'grandstream_ucm',
    pbx_ip: '',
    pbx_username: '',
    pbx_password: '',
    pbx_port: 8443,
    webhook_username: '',
    webhook_password: '',
    transcription_enabled: true,
    sentiment_enabled: true,
    plan: 'starter'
  });
  const [selectedSystem, setSelectedSystem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, systemsData] = await Promise.all([
        api.getSettings(),
        api.getPhoneSystems()
      ]);

      setSettings(settingsData);
      setPhoneSystems(systemsData.systems || []);

      // Find selected system
      const system = systemsData.systems?.find(s => s.id === settingsData.phone_system_type);
      setSelectedSystem(system);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSystemChange = (systemId) => {
    const system = phoneSystems.find(s => s.id === systemId);
    setSelectedSystem(system);
    setSettings({
      ...settings,
      phone_system_type: systemId,
      pbx_port: system?.default_port || 8443
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Settings" subtitle="Configure your account and integrations">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your company and subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={settings.company_name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Subdomain</Label>
                  <Input
                    value={settings.subdomain}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Input
                    value={settings.plan}
                    disabled
                    className="bg-gray-50 capitalize"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phone System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Phone System Configuration
              </CardTitle>
              <CardDescription>
                Configure your PBX system connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone-system">Phone System Type</Label>
                <Select
                  value={settings.phone_system_type}
                  onValueChange={handlePhoneSystemChange}
                >
                  <SelectTrigger id="phone-system">
                    <SelectValue placeholder="Select phone system" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneSystems.map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSystem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Documentation:{' '}
                    <a
                      href={selectedSystem.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedSystem.documentation}
                    </a>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="pbx-ip">PBX IP Address or Hostname</Label>
                  <Input
                    id="pbx-ip"
                    value={settings.pbx_ip || ''}
                    onChange={(e) => setSettings({ ...settings, pbx_ip: e.target.value })}
                    placeholder="192.168.1.100 or pbx.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="pbx-username">PBX Username</Label>
                  <Input
                    id="pbx-username"
                    value={settings.pbx_username || ''}
                    onChange={(e) => setSettings({ ...settings, pbx_username: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <Label htmlFor="pbx-password">PBX Password</Label>
                  <Input
                    id="pbx-password"
                    type="password"
                    value={settings.pbx_password || ''}
                    onChange={(e) => setSettings({ ...settings, pbx_password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="pbx-port">Port</Label>
                  <Input
                    id="pbx-port"
                    type="number"
                    value={settings.pbx_port || ''}
                    onChange={(e) => setSettings({ ...settings, pbx_port: parseInt(e.target.value) })}
                    placeholder="8443"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure webhook credentials for CDR delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Your Webhook URL:</p>
                <code className="block bg-white px-3 py-2 rounded border text-sm">
                  {getWebhookBaseUrl()}/api/webhook/cdr/{settings.subdomain}
                </code>
                <p className="text-xs text-blue-700 mt-2">
                  Use this URL in your phone system CDR configuration
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhook-username">Webhook Username</Label>
                  <Input
                    id="webhook-username"
                    value={settings.webhook_username || ''}
                    onChange={(e) => setSettings({ ...settings, webhook_username: e.target.value })}
                    placeholder="webhook_user"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set this in your PBX webhook authentication
                  </p>
                </div>
                <div>
                  <Label htmlFor="webhook-password">Webhook Password</Label>
                  <Input
                    id="webhook-password"
                    type="password"
                    value={settings.webhook_password || ''}
                    onChange={(e) => setSettings({ ...settings, webhook_password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set this in your PBX webhook authentication
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Feature Configuration
              </CardTitle>
              <CardDescription>
                Enable or disable AI features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Transcription</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically transcribe call recordings
                  </p>
                </div>
                <Button
                  variant={settings.transcription_enabled ? "default" : "outline"}
                  onClick={() => setSettings({
                    ...settings,
                    transcription_enabled: !settings.transcription_enabled
                  })}
                >
                  {settings.transcription_enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sentiment Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Analyze call sentiment and emotions
                  </p>
                </div>
                <Button
                  variant={settings.sentiment_enabled ? "default" : "outline"}
                  onClick={() => setSettings({
                    ...settings,
                    sentiment_enabled: !settings.sentiment_enabled
                  })}
                >
                  {settings.sentiment_enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
