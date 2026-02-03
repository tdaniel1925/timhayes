import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import {
  CreditCard, TrendingUp, Calendar, CheckCircle2, XCircle,
  AlertCircle, ArrowRight, Loader2, Download, ExternalLink
} from 'lucide-react'

export default function SubscriptionManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [billingHistory, setBillingHistory] = useState([])
  const [usage, setUsage] = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadSubscriptionData()
  }, [user])

  const loadSubscriptionData = async () => {
    try {
      const [subData, historyData, usageData] = await Promise.all([
        api.getSubscription(),
        api.getBillingHistory(),
        api.getUsageStats()
      ])

      setSubscription(subData)
      setBillingHistory(historyData.history || [])
      setUsage(usageData)
    } catch (error) {
      console.error('Failed to load subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true)
      await api.cancelSubscription()
      alert('Subscription canceled successfully. You will have access until the end of your billing period.')
      await loadSubscriptionData()
      setShowCancelDialog(false)
    } catch (error) {
      alert('Failed to cancel subscription: ' + (error.response?.data?.error || error.message))
    } finally {
      setCanceling(false)
    }
  }

  const handleUpgrade = (plan) => {
    navigate(`/upgrade/${plan}`)
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      features: [
        '500 calls per month',
        '5 GB recording storage',
        'Basic analytics',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      features: [
        '2,000 calls per month',
        '25 GB recording storage',
        'Advanced analytics',
        'Priority support',
        'Custom integrations'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      features: [
        'Unlimited calls',
        '100 GB recording storage',
        'Full analytics suite',
        '24/7 phone support',
        'Custom integrations',
        'Dedicated account manager'
      ]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'starter'
  const usagePercent = usage ? (usage.calls_this_month / usage.calls_limit) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
            <p className="text-gray-600">Manage your plan, usage, and billing information</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold capitalize">{currentPlan}</h3>
                      <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                        {subscription?.status || 'active'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">
                      ${plans.find(p => p.id === currentPlan)?.price || 0}/month
                    </p>
                  </div>
                  {subscription?.next_billing_date && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Next billing date</p>
                      <p className="font-semibold">
                        {new Date(subscription.next_billing_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Plan Features:</h4>
                  <ul className="space-y-2">
                    {plans.find(p => p.id === currentPlan)?.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="h-4 w-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Usage This Month
                </CardTitle>
                <CardDescription>Track your current billing cycle usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Calls Processed</span>
                    <span className="text-sm text-gray-600">
                      {usage?.calls_this_month || 0} / {usage?.calls_limit === -1 ? 'Unlimited' : usage?.calls_limit || 500}
                    </span>
                  </div>
                  <Progress value={Math.min(usagePercent, 100)} className="h-2" />
                  {usagePercent > 80 && usagePercent < 100 && (
                    <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      You're approaching your monthly limit
                    </p>
                  )}
                  {usagePercent >= 100 && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      You've reached your monthly limit. Upgrade to continue.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Storage Used</p>
                    <p className="text-xl font-semibold">
                      {usage?.storage_used_gb || 0} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Storage Limit</p>
                    <p className="text-xl font-semibold">
                      {usage?.storage_limit_gb || 5} GB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Upgrade or Change Plan</CardTitle>
                <CardDescription>Choose the plan that fits your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-4 ${
                        plan.id === currentPlan
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{plan.name}</h4>
                        {plan.id === currentPlan && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold mb-4">${plan.price}<span className="text-sm text-gray-500">/mo</span></p>
                      <ul className="space-y-2 mb-4">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.id !== currentPlan && (
                        <Button
                          onClick={() => handleUpgrade(plan.id)}
                          variant={plan.price > (plans.find(p => p.id === currentPlan)?.price || 0) ? 'default' : 'outline'}
                          className="w-full"
                          size="sm"
                        >
                          {plan.price > (plans.find(p => p.id === currentPlan)?.price || 0) ? 'Upgrade' : 'Downgrade'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No billing history yet</p>
                ) : (
                  <div className="space-y-3">
                    {billingHistory.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${invoice.amount}</p>
                            <Badge variant={invoice.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.payment_status}
                            </Badge>
                          </div>
                          {invoice.invoice_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.invoice_url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    PayPal
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">PayPal Account</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://www.paypal.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage in PayPal
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Latest Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Payment Portal
                </Button>
              </CardContent>
            </Card>

            {/* Cancel Subscription */}
            {subscription?.status === 'active' && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-900">Cancel Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-800 mb-4">
                    Canceling will end your subscription at the end of the current billing period.
                  </p>
                  {!showCancelDialog ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-red-900">Are you sure?</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                        >
                          {canceling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Yes, Cancel'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowCancelDialog(false)}
                        >
                          Keep Plan
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
