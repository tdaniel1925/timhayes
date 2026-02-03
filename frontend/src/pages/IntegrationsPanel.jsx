import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import {
  Phone, Check, Copy, ExternalLink, AlertCircle, Shield,
  Server, Key, Settings as SettingsIcon, BookOpen, ChevronDown, ChevronUp,
  Loader2
} from 'lucide-react'

export default function IntegrationsPanel() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phoneSystems, setPhoneSystems] = useState([])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [showGuide, setShowGuide] = useState(false)
  const [config, setConfig] = useState({
    phone_system_type: '',
    pbx_ip: '',
    pbx_username: '',
    pbx_password: '',
    pbx_port: '',
    webhook_username: '',
    webhook_password: ''
  })

  const [webhookUrl, setWebhookUrl] = useState('')
  const [copiedField, setCopiedField] = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [systems, settings] = await Promise.all([
        api.getPhoneSystems(),
        api.getSettings()
      ])

      setPhoneSystems(systems.systems || [])

      if (settings.phone_system_type) {
        setConfig({
          phone_system_type: settings.phone_system_type || '',
          pbx_ip: settings.pbx_ip || '',
          pbx_username: settings.pbx_username || '',
          pbx_password: '',
          pbx_port: settings.pbx_port || '',
          webhook_username: settings.webhook_username || '',
          webhook_password: ''
        })
        setSelectedSystem(settings.phone_system_type)
      }

      const baseUrl = window.location.origin
      const subdomain = user?.tenant?.subdomain || 'your-subdomain'
      setWebhookUrl(`${baseUrl}/api/webhook/cdr/${subdomain}`)

    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSystemChange = (systemId) => {
    setSelectedSystem(systemId)
    const system = phoneSystems.find(s => s.id === systemId)

    if (system) {
      setConfig({
        ...config,
        phone_system_type: systemId,
        pbx_port: system.default_port || 8443
      })
    }
  }

  const handleSave = async () => {
    if (!config.pbx_ip || !config.webhook_username) {
      alert('Please fill in required fields (PBX IP and Webhook Username)')
      return
    }

    try {
      setSaving(true)
      await api.updateSettings(config)
      alert('Integration settings saved successfully! Your phone system is now configured.')
      await loadData()
    } catch (error) {
      alert('Failed to save settings: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const generateCredentials = (type) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    if (type === 'webhook_username') {
      const username = 'webhook_' + result.substr(0, 12)
      setConfig({ ...config, webhook_username: username })
    } else {
      setConfig({ ...config, webhook_password: result })
    }
  }

  const selectedSystemData = phoneSystems.find(s => s.id === selectedSystem)

  if (loading && phoneSystems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Phone System Integrations</h1>
            <p className="text-gray-600">Configure your PBX connection and webhook settings</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Select Phone System
                </CardTitle>
                <CardDescription>
                  Choose your PBX or phone system provider ({phoneSystems.length} systems supported)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phoneSystems.map((system) => (
                    <button
                      key={system.id}
                      onClick={() => handleSystemChange(system.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedSystem === system.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{system.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Port: {system.default_port}
                          </p>
                        </div>
                        {selectedSystem === system.id && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PBX Connection Settings */}
            {selectedSystem && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    PBX Connection Details
                  </CardTitle>
                  <CardDescription>
                    Enter your PBX credentials for API access (required for call recording retrieval)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pbx_ip">PBX IP Address / Hostname *</Label>
                      <Input
                        id="pbx_ip"
                        value={config.pbx_ip}
                        onChange={(e) => setConfig({ ...config, pbx_ip: e.target.value })}
                        placeholder="192.168.1.100 or pbx.example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="pbx_port">Port</Label>
                      <Input
                        id="pbx_port"
                        type="number"
                        value={config.pbx_port}
                        onChange={(e) => setConfig({ ...config, pbx_port: e.target.value })}
                        placeholder="8443"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pbx_username">API Username</Label>
                      <Input
                        id="pbx_username"
                        value={config.pbx_username}
                        onChange={(e) => setConfig({ ...config, pbx_username: e.target.value })}
                        placeholder="api_user"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        User with API access on your PBX
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="pbx_password">API Password</Label>
                      <Input
                        id="pbx_password"
                        type="password"
                        value={config.pbx_password}
                        onChange={(e) => setConfig({ ...config, pbx_password: e.target.value })}
                        placeholder="Enter password"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank to keep existing password
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> PBX credentials are encrypted at rest using Fernet encryption for security.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Webhook Configuration */}
            {selectedSystem && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Webhook Security
                  </CardTitle>
                  <CardDescription>
                    Generate secure credentials for webhook authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="webhook_username">Webhook Username *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_username"
                        value={config.webhook_username}
                        onChange={(e) => setConfig({ ...config, webhook_username: e.target.value })}
                        placeholder="webhook_user"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => generateCredentials('webhook_username')}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="webhook_password">Webhook Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_password"
                        type="text"
                        value={config.webhook_password}
                        onChange={(e) => setConfig({ ...config, webhook_password: e.target.value })}
                        placeholder="Secure password"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => generateCredentials('webhook_password')}
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep existing password
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Save these credentials! You'll need them when configuring the webhook in your PBX.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            {selectedSystem && (
              <Button
                onClick={handleSave}
                disabled={saving || !config.pbx_ip || !config.webhook_username}
                className="w-full py-6 text-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Integration Settings'
                )}
              </Button>
            )}
          </div>

          {/* Setup Guide Sidebar */}
          <div className="space-y-6">
            {/* Webhook URL Card */}
            {selectedSystem && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Webhook URL</CardTitle>
                  <CardDescription>Use this URL in your PBX configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded border break-all text-sm font-mono">
                    {webhookUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, 'webhook_url')}
                    className="w-full mt-3"
                  >
                    {copiedField === 'webhook_url' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Setup Guide */}
            {selectedSystemData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Setup Guide
                    </span>
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {showGuide ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </CardTitle>
                </CardHeader>
                {showGuide && (
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Quick Setup Steps:</h4>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li>Fill in your PBX connection details above</li>
                        <li>Generate secure webhook credentials</li>
                        <li>Click "Save Integration Settings"</li>
                        <li>Copy the webhook URL</li>
                        <li>Configure webhook in your {selectedSystemData.name}</li>
                        <li>Use HTTP Basic Auth with webhook credentials</li>
                        <li>Test by making a call</li>
                      </ol>
                    </div>

                    {selectedSystemData.setup_guide && (
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">System-Specific Notes:</h4>
                        <p className="text-sm text-gray-700">{selectedSystemData.setup_guide}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(selectedSystemData.documentation, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Official Documentation
                    </Button>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Security Notice */}
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900 text-lg">
                  <AlertCircle className="h-5 w-5" />
                  Security Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-800 space-y-2">
                <p>" All credentials are encrypted at rest</p>
                <p>" Use strong, unique passwords (16+ characters)</p>
                <p>" Never share webhook credentials</p>
                <p>" Rotate credentials every 90 days</p>
                <p>" Use HTTPS for all connections</p>
                <p>" Monitor webhook activity regularly</p>
              </CardContent>
            </Card>

            {/* Status Card */}
            {config.phone_system_type && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
                    <Check className="h-5 w-5" />
                    Integration Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-green-800">
                  <p className="font-semibold mb-2">Currently Configured:</p>
                  <p>System: {selectedSystemData?.name}</p>
                  <p>PBX: {config.pbx_ip || 'Not set'}</p>
                  <p>Webhook: {config.webhook_username ? 'Configured' : 'Not configured'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
