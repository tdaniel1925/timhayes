import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Building2, Mail, User, Key, Globe, CreditCard, Users, Phone } from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';

export default function CreateTenantPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    subdomain: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    plan: 'starter',
    max_users: 5,
    max_calls_per_month: 500,
    status: 'active'
  });

  // Plan configurations
  const plans = {
    starter: {
      name: 'Starter',
      price: '$49/month',
      defaultUsers: 5,
      defaultCalls: 500,
      features: ['Call Recording', 'Basic Analytics', 'Email Support', '90-day Storage']
    },
    professional: {
      name: 'Professional',
      price: '$149/month',
      defaultUsers: 25,
      defaultCalls: 2000,
      features: ['All Starter Features', 'AI Transcription', 'Sentiment Analysis', 'Quality Scoring', 'Advanced Analytics', 'Priority Support']
    },
    enterprise: {
      name: 'Enterprise',
      price: '$399/month',
      defaultUsers: 999,
      defaultCalls: 999999,
      features: ['All Professional Features', 'Unlimited Calls & Users', 'Custom Integrations', 'Dedicated Support', 'White-Label', 'API Access']
    }
  };

  const handlePlanChange = (plan) => {
    const planConfig = plans[plan];
    setFormData({
      ...formData,
      plan,
      max_users: planConfig.defaultUsers,
      max_calls_per_month: planConfig.defaultCalls
    });
  };

  const handleSubdomainChange = (e) => {
    // Auto-format subdomain: lowercase, no spaces, alphanumeric + hyphens only
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/\s+/g, '-');
    setFormData({ ...formData, subdomain: value });
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.subdomain.trim()) {
      setError('Subdomain is required');
      return false;
    }
    if (formData.subdomain.length < 3) {
      setError('Subdomain must be at least 3 characters');
      return false;
    }
    if (!formData.admin_name.trim()) {
      setError('Admin name is required');
      return false;
    }
    if (!formData.admin_email.trim()) {
      setError('Admin email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      setError('Invalid email format');
      return false;
    }
    if (formData.admin_password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/tenants');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <SuperAdminLayout title="Access Denied">
        <Alert variant="destructive">
          <AlertDescription>You must be a super admin to access this page.</AlertDescription>
        </Alert>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Create New Tenant"
      subtitle="Set up a new client account with administrator access"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/superadmin/tenants')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              Tenant created successfully! Redirecting to tenant list...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Basic details about the client's company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={handleSubdomainChange}
                    placeholder="acmecorp"
                    required
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">.yourdomain.com</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and hyphens only. This will be used for webhook URL.
                </p>
                {formData.subdomain && (
                  <p className="text-xs text-blue-600 mt-1">
                    Webhook URL: https://audiapro-backend.onrender.com/api/webhook/cdr/{formData.subdomain}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Administrator Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Administrator Account
              </CardTitle>
              <CardDescription>Login credentials for the company's admin user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="admin_name">Full Name *</Label>
                <Input
                  id="admin_name"
                  value={formData.admin_name}
                  onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <Label htmlFor="admin_email">Email Address *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  placeholder="admin@acmecorp.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="admin_password">Initial Password *</Label>
                <Input
                  id="admin_password"
                  type="text"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Admin will receive this password via email. They can change it after first login.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Subscription Plan
              </CardTitle>
              <CardDescription>Choose the plan and set account limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plan">Plan Tier *</Label>
                <Select value={formData.plan} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(plans).map(([key, plan]) => (
                      <SelectItem key={key} value={key}>
                        {plan.name} - {plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Display selected plan features */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                  {plans[formData.plan].name} Plan Includes:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {plans[formData.plan].features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="max_calls_per_month">Max Calls/Month</Label>
                  <Input
                    id="max_calls_per_month"
                    type="number"
                    value={formData.max_calls_per_month}
                    onChange={(e) => setFormData({ ...formData, max_calls_per_month: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Set initial account status</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tenants')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
