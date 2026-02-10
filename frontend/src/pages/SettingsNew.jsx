import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, getWebhookBaseUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Save, Server, Webhook, Sliders, Building, CheckCircle, XCircle,
  Copy, Eye, EyeOff, Loader, User, Mail, Phone as PhoneIcon
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/Toast';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { getFriendlyError } from '@/lib/friendlyErrors';

/**
 * Redesigned Settings Page
 *
 * Key improvements:
 * - Unified tabs for better organization
 * - Live validation with visual feedback
 * - Toast notifications
 * - Test connection button
 * - Better visual hierarchy
 * - Password visibility toggle
 * - Copy webhook URL button
 */

export default function SettingsNew() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [showWebhookPassword, setShowWebhookPassword] = useState(false);

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

  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Settings Temporarily Unavailable',
        message: getFriendlyError('loadSettings', error)
      });
    } finally{
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setOriginalSettings(settings);
      setHasChanges(false);
      showToast({
        type: 'success',
        title: 'Settings saved',
        message: 'Your changes have been saved successfully'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to save settings',
        message: error.message || 'Please try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.pbx_ip || !settings.pbx_username || !settings.pbx_password) {
      showToast({
        type: 'warning',
        title: 'Missing credentials',
        message: 'Please fill in PBX connection details first'
      });
      return;
    }

    setTesting(true);
    try {
      const result = await api.testUCMConnection({
        ucm_url: settings.pbx_ip,
        username: settings.pbx_username,
        password: settings.pbx_password,
        port: settings.pbx_port
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Connection successful!',
          message: `Found ${result.recording_count || 0} recordings`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Connection failed',
          message: result.message || 'Check your credentials'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Connection test failed',
        message: error.message || 'Unable to connect'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${getWebhookBaseUrl()}/api/webhook/cdr/${settings.subdomain}`;
    navigator.clipboard.writeText(url);
    showToast({
      type: 'info',
      title: 'Copied!',
      message: 'Webhook URL copied to clipboard'
    });
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
    showToast({
      type: 'info',
      title: 'Changes discarded',
      message: 'Settings have been reset'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <LoadingSkeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardContent className="p-6">
              <LoadingSkeleton variant="text" lines={5} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header - SUSTAIN Style */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="section-label text-[#6CA8C2] mb-2">
              Configuration
            </span>
            <h1 className="text-4xl font-serif text-[#31543A] mt-2">Settings</h1>
            <p className="text-[#2A2A2A]/60 mt-2 font-light">Manage your account and integrations</p>
          </div>
          {hasChanges && (
            <span className="px-4 py-2 rounded-full bg-[#E4B756]/10 text-[#E4B756] border border-[#E4B756]/30 text-sm font-medium">
              Unsaved changes
            </span>
          )}
        </div>

        {/* Tabs - SUSTAIN Style */}
        <Card className="glass-card rounded-3xl overflow-hidden shadow-sm border-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex border-b border-gray-100 bg-white/50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('account')}
                className={cn(
                  "px-6 py-4 text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-2",
                  activeTab === 'account'
                    ? "text-[#31543A] border-b-2 border-[#31543A]"
                    : "text-[#2A2A2A]/60 hover:text-[#31543A]"
                )}
              >
                <Building className="h-4 w-4" />
                Account
              </button>
              <button
                onClick={() => setActiveTab('pbx')}
                className={cn(
                  "px-6 py-4 text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-2",
                  activeTab === 'pbx'
                    ? "text-[#31543A] border-b-2 border-[#31543A]"
                    : "text-[#2A2A2A]/60 hover:text-[#31543A]"
                )}
              >
                <Server className="h-4 w-4" />
                Phone System
              </button>
              <button
                onClick={() => setActiveTab('webhook')}
                className={cn(
                  "px-6 py-4 text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-2",
                  activeTab === 'webhook'
                    ? "text-[#31543A] border-b-2 border-[#31543A]"
                    : "text-[#2A2A2A]/60 hover:text-[#31543A]"
                )}
              >
                <Webhook className="h-4 w-4" />
                Webhook
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={cn(
                  "px-6 py-4 text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-2",
                  activeTab === 'features'
                    ? "text-[#31543A] border-b-2 border-[#31543A]"
                    : "text-[#2A2A2A]/60 hover:text-[#31543A]"
                )}
              >
                <Sliders className="h-4 w-4" />
                Features
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "px-6 py-4 text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-2",
                  activeTab === 'profile'
                    ? "text-[#31543A] border-b-2 border-[#31543A]"
                    : "text-[#2A2A2A]/60 hover:text-[#31543A]"
                )}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
            </div>

            {/* Account Tab */}
            <TabsContent value="account" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={settings.company_name}
                      disabled
                      className="mt-2 bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label>Subdomain</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={settings.subdomain}
                        disabled
                        className="bg-gray-50"
                      />
                      <span className="flex items-center text-sm text-gray-600">.audiapro.com</span>
                    </div>
                  </div>
                  <div>
                    <Label>Subscription Plan</Label>
                    <div className="mt-2">
                      <Badge className="capitalize text-base px-3 py-1">
                        {settings.plan}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-900">
                  <strong>Note:</strong> Contact support to change your company name, subdomain, or plan.
                </p>
              </div>
            </TabsContent>

            {/* Phone System Tab */}
            <TabsContent value="pbx" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">UCM Connection</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pbx-ip">UCM IP Address or Hostname *</Label>
                    <Input
                      id="pbx-ip"
                      value={settings.pbx_ip || ''}
                      onChange={(e) => updateSetting('pbx_ip', e.target.value)}
                      placeholder="192.168.1.100 or ucm.example.com"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      The IP address or hostname of your UCM system
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pbx-username">Username *</Label>
                      <Input
                        id="pbx-username"
                        value={settings.pbx_username || ''}
                        onChange={(e) => updateSetting('pbx_username', e.target.value)}
                        placeholder="admin"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pbx-password">Password *</Label>
                      <div className="relative mt-2">
                        <Input
                          id="pbx-password"
                          type={showPassword ? 'text' : 'password'}
                          value={settings.pbx_password || ''}
                          onChange={(e) => updateSetting('pbx_password', e.target.value)}
                          placeholder="Enter password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pbx-port">Port</Label>
                      <Input
                        id="pbx-port"
                        type="number"
                        value={settings.pbx_port || ''}
                        onChange={(e) => updateSetting('pbx_port', parseInt(e.target.value))}
                        placeholder="8443"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Typically 8443 for CloudUCM
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleTestConnection}
                    disabled={testing}
                    variant="outline"
                    className="mt-4"
                  >
                    {testing ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Webhook Tab */}
            <TabsContent value="webhook" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>

                {/* Webhook URL */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                  <Label className="text-sm font-medium text-primary-900 mb-2 block">
                    Your Webhook URL
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm overflow-x-auto">
                      {getWebhookBaseUrl()}/api/webhook/cdr/{settings.subdomain}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyWebhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-primary-700 mt-2">
                    Configure this URL in your UCM's CDR webhook settings
                  </p>
                </div>

                {/* Webhook Credentials */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="webhook-username">Webhook Username</Label>
                      <Input
                        id="webhook-username"
                        value={settings.webhook_username || ''}
                        onChange={(e) => updateSetting('webhook_username', e.target.value)}
                        placeholder="webhook_user"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Set this in your UCM webhook authentication
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="webhook-password">Webhook Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="webhook-password"
                          type={showWebhookPassword ? 'text' : 'password'}
                          value={settings.webhook_password || ''}
                          onChange={(e) => updateSetting('webhook_password', e.target.value)}
                          placeholder="Enter password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowWebhookPassword(!showWebhookPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showWebhookPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Set this in your UCM webhook authentication
                      </p>
                    </div>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">UCM Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Login to your UCM web interface</li>
                    <li>Navigate to CDR → CDR Settings</li>
                    <li>Enable "POST CDR to URL"</li>
                    <li>Paste the webhook URL above</li>
                    <li>Enter the webhook username and password</li>
                    <li>Save settings and make a test call</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h3>
                <div className="space-y-4">
                  {/* Transcription */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">AI Transcription</h4>
                        {settings.transcription_enabled && (
                          <CheckCircle className="h-4 w-4 text-success-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Automatically transcribe call recordings with speaker identification
                      </p>
                    </div>
                    <Button
                      variant={settings.transcription_enabled ? "default" : "outline"}
                      onClick={() => updateSetting('transcription_enabled', !settings.transcription_enabled)}
                    >
                      {settings.transcription_enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>

                  {/* Sentiment */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">Sentiment Analysis</h4>
                        {settings.sentiment_enabled && (
                          <CheckCircle className="h-4 w-4 text-success-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Analyze customer emotions and satisfaction levels
                      </p>
                    </div>
                    <Button
                      variant={settings.sentiment_enabled ? "default" : "outline"}
                      onClick={() => updateSetting('sentiment_enabled', !settings.sentiment_enabled)}
                    >
                      {settings.sentiment_enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{user?.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <div className="mt-2">
                      <Badge className="capitalize">
                        {user?.role || 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  To change your password or update profile information, contact your administrator.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Action Buttons - SUSTAIN Style */}
        {hasChanges && (
          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-3 rounded-full border border-[#31543A]/20 text-[#31543A] text-sm font-medium hover:bg-[#31543A]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-[#31543A] text-white rounded-full text-sm font-medium hover:bg-[#2A2A2A] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
