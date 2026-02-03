import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PHONE_SYSTEMS = [
  { id: 'grandstream_ucm', name: 'Grandstream UCM', defaultPort: 8443 },
  { id: 'ringcentral', name: 'RingCentral', defaultPort: 443 },
  { id: '3cx', name: '3CX Phone System', defaultPort: 5001 },
  { id: 'freepbx', name: 'FreePBX / Asterisk', defaultPort: 80 },
  { id: 'yeastar', name: 'Yeastar PBX', defaultPort: 8088 },
  { id: 'vitalpbx', name: 'VitalPBX', defaultPort: 443 },
  { id: 'fusionpbx', name: 'FusionPBX', defaultPort: 443 },
  { id: 'twilio', name: 'Twilio', defaultPort: 443 },
  { id: 'other', name: 'Other (Please Specify)', defaultPort: 80 }
]

const PLANS = [
  { id: 'starter', name: 'Starter Plan', price: '$49/month', calls: '500 calls/month' },
  { id: 'professional', name: 'Professional Plan', price: '$149/month', calls: '2,000 calls/month' },
  { id: 'enterprise', name: 'Enterprise Plan', price: '$499/month', calls: 'Unlimited calls' }
]

export default function SetupRequest() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    industry: '',
    company_size: '',
    website: '',

    // Contact Information
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_title: '',

    // Technical Details
    phone_system_type: '',
    phone_system_other: '',
    pbx_ip: '',
    pbx_username: '',
    pbx_password: '',
    pbx_port: '',
    current_call_volume: '',

    // Features Needed
    transcription_needed: true,
    sentiment_analysis_needed: true,
    real_time_alerts: false,
    integration_slack: false,
    integration_email: false,
    export_reports: false,

    // Technical Access
    has_pbx_admin_access: '',
    can_configure_webhooks: '',
    network_type: '',
    static_ip: '',

    // Plan Selection
    selected_plan: '',

    // Additional Information
    specific_requirements: '',
    compliance_requirements: '',
    timezone: '',
    preferred_setup_date: '',

    // Terms
    agree_terms: false
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-populate port when phone system is selected
    if (field === 'phone_system_type') {
      const system = PHONE_SYSTEMS.find(s => s.id === value)
      if (system) {
        setFormData(prev => ({ ...prev, pbx_port: system.defaultPort.toString() }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate current step
    if (currentStep === 1) {
      if (!formData.company_name || !formData.contact_email || !formData.contact_phone) {
        setError('Please fill in all required company and contact information')
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      if (!formData.phone_system_type || !formData.pbx_ip) {
        setError('Please provide phone system details')
        return
      }
      setCurrentStep(3)
      return
    }

    if (currentStep === 3) {
      if (!formData.selected_plan) {
        setError('Please select a plan')
        return
      }
      setCurrentStep(4)
      return
    }

    // Final submission
    if (!formData.agree_terms) {
      setError('You must agree to the terms and conditions')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/setup-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to checkout/payment page
        navigate(`/checkout/${data.request_id}`)
      } else {
        setError(data.error || 'Failed to submit setup request')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="e.g., Healthcare, Retail, Finance"
            />
          </div>

          <div>
            <Label htmlFor="company_size">Company Size</Label>
            <Select value={formData.company_size} onValueChange={(val) => handleChange('company_size', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="500+">500+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://acme.com"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_name">Full Name *</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_email">Email Address *</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="john@acme.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_phone">Phone Number *</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_title">Job Title</Label>
            <Input
              id="contact_title"
              value={formData.contact_title}
              onChange={(e) => handleChange('contact_title', e.target.value)}
              placeholder="IT Manager"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Phone System Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="phone_system_type">Phone System Type *</Label>
            <Select value={formData.phone_system_type} onValueChange={(val) => handleChange('phone_system_type', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your phone system" />
              </SelectTrigger>
              <SelectContent>
                {PHONE_SYSTEMS.map(system => (
                  <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.phone_system_type === 'other' && (
            <div className="md:col-span-2">
              <Label htmlFor="phone_system_other">Please Specify Phone System</Label>
              <Input
                id="phone_system_other"
                value={formData.phone_system_other}
                onChange={(e) => handleChange('phone_system_other', e.target.value)}
                placeholder="Enter your phone system name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="pbx_ip">PBX IP Address / Hostname *</Label>
            <Input
              id="pbx_ip"
              value={formData.pbx_ip}
              onChange={(e) => handleChange('pbx_ip', e.target.value)}
              placeholder="192.168.1.100 or pbx.acme.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="pbx_port">PBX Port</Label>
            <Input
              id="pbx_port"
              type="number"
              value={formData.pbx_port}
              onChange={(e) => handleChange('pbx_port', e.target.value)}
              placeholder="8443"
            />
          </div>

          <div>
            <Label htmlFor="pbx_username">PBX Admin Username (if available)</Label>
            <Input
              id="pbx_username"
              value={formData.pbx_username}
              onChange={(e) => handleChange('pbx_username', e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <Label htmlFor="pbx_password">PBX Admin Password (if available)</Label>
            <Input
              id="pbx_password"
              type="password"
              value={formData.pbx_password}
              onChange={(e) => handleChange('pbx_password', e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label htmlFor="current_call_volume">Current Monthly Call Volume</Label>
            <Input
              id="current_call_volume"
              type="number"
              value={formData.current_call_volume}
              onChange={(e) => handleChange('current_call_volume', e.target.value)}
              placeholder="1500"
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={formData.timezone} onValueChange={(val) => handleChange('timezone', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Technical Access</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="has_pbx_admin_access">Do you have admin access to your PBX?</Label>
            <Select value={formData.has_pbx_admin_access} onValueChange={(val) => handleChange('has_pbx_admin_access', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes - Full access</SelectItem>
                <SelectItem value="limited">Limited access</SelectItem>
                <SelectItem value="no">No - Need vendor assistance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="can_configure_webhooks">Can you configure webhooks on your PBX?</Label>
            <Select value={formData.can_configure_webhooks} onValueChange={(val) => handleChange('can_configure_webhooks', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes - I can configure</SelectItem>
                <SelectItem value="need_help">Need help configuring</SelectItem>
                <SelectItem value="no">No - Cannot configure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="network_type">Network Setup</Label>
            <Select value={formData.network_type} onValueChange={(val) => handleChange('network_type', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">Cloud-hosted PBX</SelectItem>
                <SelectItem value="on_premise">On-premise with public IP</SelectItem>
                <SelectItem value="vpn">Behind firewall (VPN required)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${formData.selected_plan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleChange('selected_plan', plan.id)}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-black">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{plan.calls}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>✓ AI Transcription</li>
                  <li>✓ Sentiment Analysis</li>
                  <li>✓ Call Recording Storage</li>
                  <li>✓ Analytics Dashboard</li>
                  {plan.id === 'professional' && <li>✓ Email Alerts</li>}
                  {plan.id === 'enterprise' && (
                    <>
                      <li>✓ Priority Support</li>
                      <li>✓ Custom Integrations</li>
                      <li>✓ Dedicated Account Manager</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Features & Integrations</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="transcription_needed"
              checked={formData.transcription_needed}
              onChange={(e) => handleChange('transcription_needed', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="transcription_needed">AI Transcription (included)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sentiment_analysis_needed"
              checked={formData.sentiment_analysis_needed}
              onChange={(e) => handleChange('sentiment_analysis_needed', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="sentiment_analysis_needed">Sentiment Analysis (included)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="real_time_alerts"
              checked={formData.real_time_alerts}
              onChange={(e) => handleChange('real_time_alerts', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="real_time_alerts">Real-time Alerts for Negative Calls</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="integration_slack"
              checked={formData.integration_slack}
              onChange={(e) => handleChange('integration_slack', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="integration_slack">Slack Integration</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="integration_email"
              checked={formData.integration_email}
              onChange={(e) => handleChange('integration_email', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="integration_email">Email Notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="export_reports"
              checked={formData.export_reports}
              onChange={(e) => handleChange('export_reports', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="export_reports">Export & Reporting</Label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="specific_requirements">Specific Requirements or Use Cases</Label>
            <textarea
              id="specific_requirements"
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={formData.specific_requirements}
              onChange={(e) => handleChange('specific_requirements', e.target.value)}
              placeholder="Tell us about your specific needs, goals, or use cases for AudiaPro..."
            />
          </div>

          <div>
            <Label htmlFor="compliance_requirements">Compliance Requirements</Label>
            <textarea
              id="compliance_requirements"
              className="w-full min-h-[80px] p-2 border rounded-md"
              value={formData.compliance_requirements}
              onChange={(e) => handleChange('compliance_requirements', e.target.value)}
              placeholder="Do you have any compliance requirements? (HIPAA, PCI-DSS, GDPR, etc.)"
            />
          </div>

          <div>
            <Label htmlFor="preferred_setup_date">Preferred Setup Date</Label>
            <Input
              id="preferred_setup_date"
              type="date"
              value={formData.preferred_setup_date}
              onChange={(e) => handleChange('preferred_setup_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="agree_terms"
            checked={formData.agree_terms}
            onChange={(e) => handleChange('agree_terms', e.target.checked)}
            className="mt-1 rounded"
            required
          />
          <Label htmlFor="agree_terms" className="text-sm">
            I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. I understand that AudiaPro will contact me to complete the setup process.
          </Label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">What Happens Next?</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Complete payment for your selected plan</li>
          <li>Our team will review your setup request (usually within 24 hours)</li>
          <li>We'll schedule a setup call with you to configure your PBX integration</li>
          <li>Complete testing to ensure everything works correctly</li>
          <li>Your account will be activated and ready to use!</li>
        </ol>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-3xl">AudiaPro Setup Request</CardTitle>
          <CardDescription>
            Fill out this form and our team will set up your account
          </CardDescription>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mt-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-full h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} style={{ width: '60px' }} />
                )}
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600 mt-2">
            Step {currentStep} of 4: {
              currentStep === 1 ? 'Company & Contact Info' :
              currentStep === 2 ? 'Technical Details' :
              currentStep === 3 ? 'Plan Selection' :
              'Review & Submit'
            }
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}

              <div className="flex-1" />

              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : currentStep === 4 ? 'Submit & Proceed to Payment' : 'Next'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Questions? Email us at <a href="mailto:support@audiapro.com" className="text-blue-600 hover:underline">support@audiapro.com</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
