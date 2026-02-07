import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ArrowLeft, Save, Server, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TenantDetailPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tenant, setTenant] = useState({
    company_name: '',
    subdomain: '',
    phone_system_type: 'grandstream_ucm',
    pbx_ip: '',
    pbx_username: '',
    pbx_password: '',
    pbx_port: 8443,
    is_active: true
  });

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const loadTenant = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/superadmin/tenants/${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTenant(data);
      } else {
        console.error('Failed to load tenant');
        navigate('/tenants');
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      navigate('/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/superadmin/tenants/${tenantId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tenant)
        }
      );

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save tenant settings. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save tenant:', error);
      alert('Failed to save tenant settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tenant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/tenants')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tenants
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{tenant.company_name}</h1>
              <p className="text-sm text-muted-foreground">Manage tenant configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Save Success Alert */}
          {saveSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tenant settings saved successfully! The scraper will use these credentials on the next iteration.
              </AlertDescription>
            </Alert>
          )}

          {/* UCM Credentials Warning */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Important:</strong> These credentials are used by the recording scraper to login to CloudUCM and download call recordings.
              Ensure the credentials are correct to avoid account lockouts.
            </AlertDescription>
          </Alert>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic tenant account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={tenant.company_name}
                    onChange={(e) => setTenant({ ...tenant, company_name: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={tenant.subdomain}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Subdomain cannot be changed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={tenant.is_active}
                  onChange={(e) => setTenant({ ...tenant, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is-active" className="cursor-pointer">
                  Active (Scraper will process this tenant)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* CloudUCM Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                CloudUCM Configuration
              </CardTitle>
              <CardDescription>
                Configure CloudUCM credentials for recording scraper
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone-system">Phone System Type</Label>
                <Select
                  value={tenant.phone_system_type}
                  onValueChange={(value) => setTenant({ ...tenant, phone_system_type: value })}
                >
                  <SelectTrigger id="phone-system">
                    <SelectValue placeholder="Select phone system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grandstream_ucm">Grandstream CloudUCM</SelectItem>
                    <SelectItem value="3cx">3CX</SelectItem>
                    <SelectItem value="freepbx">FreePBX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="pbx-ip">UCM Hostname or IP</Label>
                  <Input
                    id="pbx-ip"
                    value={tenant.pbx_ip || ''}
                    onChange={(e) => setTenant({ ...tenant, pbx_ip: e.target.value })}
                    placeholder="071ffb.c.myucm.cloud or 192.168.1.100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the CloudUCM hostname (without https://) or IP address
                  </p>
                </div>
                <div>
                  <Label htmlFor="pbx-username">UCM Web Username</Label>
                  <Input
                    id="pbx-username"
                    value={tenant.pbx_username || ''}
                    onChange={(e) => setTenant({ ...tenant, pbx_username: e.target.value })}
                    placeholder="admin1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Web interface login username
                  </p>
                </div>
                <div>
                  <Label htmlFor="pbx-password">UCM Web Password</Label>
                  <Input
                    id="pbx-password"
                    type="password"
                    value={tenant.pbx_password || ''}
                    onChange={(e) => setTenant({ ...tenant, pbx_password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Web interface login password
                  </p>
                </div>
                <div>
                  <Label htmlFor="pbx-port">Port</Label>
                  <Input
                    id="pbx-port"
                    type="number"
                    value={tenant.pbx_port || ''}
                    onChange={(e) => setTenant({ ...tenant, pbx_port: parseInt(e.target.value) })}
                    placeholder="8443"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usually 8443 for HTTPS
                  </p>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">How Recording Scraper Works:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Logs into CloudUCM web interface using these credentials</li>
                  <li>Navigates to CDR → Recordings page every 15 minutes</li>
                  <li>Creates CDR records and downloads new recordings</li>
                  <li>Converts to MP3 and extracts duration from audio</li>
                  <li>Uploads to Supabase and triggers AI processing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/tenants')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Tenant Settings'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
