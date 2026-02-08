import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Server, Lock, User, Key, CheckCircle, XCircle, AlertCircle, Copy, Loader
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

/**
 * Step 2: Phone System Connection
 * Configure UCM credentials and test connection
 */

const PHONE_SYSTEMS = [
  { value: 'grandstream_ucm', label: 'Grandstream UCM' },
  { value: '3cx', label: '3CX', disabled: true },
  { value: 'freepbx', label: 'FreePBX', disabled: true },
  { value: 'asterisk', label: 'Asterisk', disabled: true }
];

export default function Step2PhoneSystem({ formData, updateFormData }) {
  const { showToast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    if (!formData.ucmUrl || !formData.ucmUsername || !formData.ucmPassword) {
      showToast({
        type: 'error',
        title: 'Missing credentials',
        message: 'Please fill in all connection details first'
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const result = await api.testUCMConnection({
        ucm_url: formData.ucmUrl,
        username: formData.ucmUsername,
        password: formData.ucmPassword,
        port: formData.ucmPort
      });

      if (result.success) {
        setTestResult('success');
        setTestMessage(`Connected successfully! Found ${result.recording_count || 0} recordings.`);
        updateFormData({ connectionTested: true });

        showToast({
          type: 'success',
          title: 'Connection successful!',
          message: 'Your UCM credentials are valid'
        });
      } else {
        setTestResult('error');
        setTestMessage(result.message || 'Connection failed');
        updateFormData({ connectionTested: false });

        showToast({
          type: 'error',
          title: 'Connection failed',
          message: result.message || 'Please check your credentials'
        });
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(error.response?.data?.message || 'Connection test failed');
      updateFormData({ connectionTested: false });

      showToast({
        type: 'error',
        title: 'Connection test failed',
        message: 'Please check your credentials and try again'
      });
    } finally {
      setTesting(false);
    }
  };

  const generateWebhookCredentials = () => {
    const username = `webhook_${Date.now()}`;
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();

    updateFormData({
      webhookUsername: username,
      webhookPassword: password
    });

    showToast({
      type: 'success',
      title: 'Credentials generated',
      message: 'Secure webhook credentials have been created'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'info',
      title: 'Copied!',
      message: 'Copied to clipboard'
    });
  };

  const webhookUrl = formData.subdomain
    ? `https://api.audiapro.com/webhook/cdr/${formData.subdomain}`
    : '';

  return (
    <div className="space-y-6">
      {/* Phone System Type */}
      <div>
        <Label>Phone System Type *</Label>
        <Select
          value={formData.phoneSystemType}
          onValueChange={(value) => updateFormData({ phoneSystemType: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_SYSTEMS.map((system) => (
              <SelectItem
                key={system.value}
                value={system.value}
                disabled={system.disabled}
              >
                {system.label} {system.disabled && '(Coming Soon)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* UCM URL */}
      <div>
        <Label htmlFor="ucmUrl" className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          UCM Web Address *
        </Label>
        <Input
          id="ucmUrl"
          value={formData.ucmUrl}
          onChange={(e) => {
            updateFormData({ ucmUrl: e.target.value, connectionTested: false });
            setTestResult(null);
          }}
          placeholder="abc123.c.myucm.cloud"
          className="mt-2"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Your CloudUCM domain (without https:// or port)
        </p>
      </div>

      {/* Port */}
      <div>
        <Label htmlFor="ucmPort" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Port
        </Label>
        <Input
          id="ucmPort"
          value={formData.ucmPort}
          onChange={(e) => updateFormData({ ucmPort: e.target.value })}
          placeholder="8443"
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Typically 8443 for CloudUCM
        </p>
      </div>

      {/* Username */}
      <div>
        <Label htmlFor="ucmUsername" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Username *
        </Label>
        <Input
          id="ucmUsername"
          value={formData.ucmUsername}
          onChange={(e) => {
            updateFormData({ ucmUsername: e.target.value, connectionTested: false });
            setTestResult(null);
          }}
          placeholder="admin"
          className="mt-2"
          autoComplete="off"
          required
        />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="ucmPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password *
        </Label>
        <Input
          id="ucmPassword"
          type="password"
          value={formData.ucmPassword}
          onChange={(e) => {
            updateFormData({ ucmPassword: e.target.value, connectionTested: false });
            setTestResult(null);
          }}
          placeholder="••••••••"
          className="mt-2"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Your UCM web interface password (encrypted in database)
        </p>
      </div>

      {/* Test Connection Button */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Test Connection</h4>
            <p className="text-sm text-gray-600 mt-1">
              Verify your credentials before continuing
            </p>
          </div>
          <Button
            onClick={handleTestConnection}
            disabled={testing || !formData.ucmUrl || !formData.ucmUsername || !formData.ucmPassword}
            size="lg"
          >
            {testing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Now'
            )}
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={cn(
            "mt-4 p-3 rounded-lg flex items-start gap-3",
            testResult === 'success' ? "bg-success-50 border border-success-200" : "bg-error-50 border border-error-200"
          )}>
            {testResult === 'success' ? (
              <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={cn(
                "font-medium text-sm",
                testResult === 'success' ? "text-success-900" : "text-error-900"
              )}>
                {testResult === 'success' ? 'Connection Successful' : 'Connection Failed'}
              </p>
              <p className={cn(
                "text-sm mt-1",
                testResult === 'success' ? "text-success-700" : "text-error-700"
              )}>
                {testMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Configuration */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Webhook Configuration</h3>

        {/* Webhook URL */}
        <div className="mb-4">
          <Label>Webhook URL</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={webhookUrl}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button
              onClick={() => copyToClipboard(webhookUrl)}
              variant="outline"
              size="sm"
              disabled={!webhookUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure this URL in your UCM's CDR webhook settings
          </p>
        </div>

        {/* Webhook Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Webhook Username</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={formData.webhookUsername}
                onChange={(e) => updateFormData({ webhookUsername: e.target.value })}
                placeholder="webhook_user"
              />
            </div>
          </div>

          <div>
            <Label>Webhook Password</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={formData.webhookPassword}
                onChange={(e) => updateFormData({ webhookPassword: e.target.value })}
                placeholder="secure_password"
                type="password"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={generateWebhookCredentials}
          variant="outline"
          size="sm"
          className="mt-3"
        >
          Generate Secure Credentials
        </Button>

        {/* Instructions */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-900">
              <p className="font-medium mb-2">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-primary-700">
                <li>Login to your UCM web interface</li>
                <li>Go to CDR → CDR Settings</li>
                <li>Enable "POST CDR to URL"</li>
                <li>Paste the webhook URL above</li>
                <li>Enter the webhook username and password</li>
                <li>Save settings</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
