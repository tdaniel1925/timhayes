import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Calendar,
  Download,
  AlertCircle,
  Zap
} from 'lucide-react';

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subResponse, plansResponse, billingResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/tenant/subscription`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/plans/available`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/tenant/billing-history`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData.plans || []);
      }

      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setBillingHistory(billingData.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (planId) => {
    if (!confirm('Are you sure you want to change your plan?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/subscription/change-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_id: planId })
      });

      if (response.ok) {
        alert('Plan change request submitted successfully!');
        fetchSubscriptionData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to change plan');
      }
    } catch (err) {
      console.error('Error changing plan:', err);
      alert('Failed to change plan');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'success', className: 'bg-green-100 text-green-800' },
      trialing: { label: 'Trial', variant: 'info', className: 'bg-blue-100 text-blue-800' },
      past_due: { label: 'Past Due', variant: 'warning', className: 'bg-yellow-100 text-yellow-800' },
      canceled: { label: 'Canceled', variant: 'destructive', className: 'bg-red-100 text-red-800' },
      paused: { label: 'Paused', variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Subscription & Billing</h1>
                <p className="text-sm text-muted-foreground">Manage your plan and billing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {subscription && (
          <>
            {/* Current Plan */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan Name</p>
                    <p className="text-2xl font-bold capitalize">{subscription.plan_name || 'Starter'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                    <p className="text-2xl font-bold capitalize">{subscription.billing_cycle || 'Monthly'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                    <p className="text-2xl font-bold">
                      ${subscription.price ? subscription.price.toFixed(2) : '0.00'}/mo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Current Period
                    </p>
                    <p className="text-sm font-medium">
                      {subscription.current_period_start && subscription.current_period_end
                        ? `${new Date(subscription.current_period_start).toLocaleDateString()} - ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Next Billing Date
                    </p>
                    <p className="text-sm font-medium">
                      {subscription.next_billing_date
                        ? new Date(subscription.next_billing_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {subscription.status === 'trialing' && subscription.trial_end && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Trial Period</p>
                        <p className="text-sm text-blue-800 mt-1">
                          Your trial ends on <strong>{new Date(subscription.trial_end).toLocaleDateString()}</strong>.
                          Upgrade to a paid plan to continue using all features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subscription.cancel_at_period_end && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Subscription Ending</p>
                        <p className="text-sm text-yellow-800 mt-1">
                          Your subscription will be canceled on <strong>
                            {new Date(subscription.current_period_end).toLocaleDateString()}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Plans */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Available Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availablePlans.map((plan) => {
                  const isCurrentPlan = plan.id === subscription.plan_id;

                  return (
                    <Card key={plan.id} className={isCurrentPlan ? 'border-blue-500 border-2' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{plan.name}</CardTitle>
                          {isCurrentPlan && (
                            <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                          )}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-3xl font-bold">${plan.monthly_price}</p>
                          <p className="text-sm text-muted-foreground">/month</p>
                          {plan.annual_price && (
                            <p className="text-sm text-green-600 mt-1">
                              ${plan.annual_price}/year (save {Math.round((1 - plan.annual_price / (plan.monthly_price * 12)) * 100)}%)
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span>{plan.max_calls_per_month.toLocaleString()} calls/month</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span>Up to {plan.max_users} users</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span>{plan.max_storage_gb}GB storage</span>
                          </div>
                          {plan.has_api_access && (
                            <div className="flex items-center text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span>API Access</span>
                            </div>
                          )}
                          {plan.has_priority_support && (
                            <div className="flex items-center text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span>Priority Support</span>
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => handleChangePlan(plan.id)}
                          disabled={isCurrentPlan}
                          variant={isCurrentPlan ? 'outline' : 'default'}
                        >
                          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription>Your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory && billingHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Description</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((invoice) => (
                          <tr key={invoice.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">
                              {new Date(invoice.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm">{invoice.description}</td>
                            <td className="py-3 px-4 text-sm font-medium">
                              ${invoice.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Badge
                                className={
                                  invoice.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : invoice.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No billing history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
