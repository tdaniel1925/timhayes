import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle, Zap, Rocket, Crown, CreditCard, DollarSign, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Step 5: Payment & Plan Selection
 * Choose subscription plan and configure payment
 */

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 49,
    billingPeriod: 'month',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 500 calls/month',
      'Basic AI features',
      'Email support',
      '30-day data retention',
      '1 admin user'
    ],
    limits: {
      calls: 500,
      users: 1,
      retention: 30
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Rocket,
    price: 149,
    billingPeriod: 'month',
    description: 'For growing businesses with advanced needs',
    popular: true,
    features: [
      'Up to 2,000 calls/month',
      'All AI features',
      'Priority support',
      '90-day data retention',
      '5 admin users',
      'Custom integrations',
      'API access'
    ],
    limits: {
      calls: 2000,
      users: 5,
      retention: 90
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    price: 499,
    billingPeriod: 'month',
    description: 'Unlimited scale for large organizations',
    features: [
      'Unlimited calls',
      'All AI features + custom prompts',
      'Dedicated support',
      'Unlimited data retention',
      'Unlimited users',
      'White-label options',
      'SLA guarantee',
      'Custom development'
    ],
    limits: {
      calls: -1, // unlimited
      users: -1,
      retention: -1
    }
  }
];

const PAYMENT_METHODS = [
  { value: 'paypal', label: 'PayPal', icon: '💳' },
  { value: 'stripe', label: 'Credit Card (Stripe)', icon: '💳', disabled: true },
  { value: 'invoice', label: 'Invoice (Enterprise only)', icon: '📄', disabled: true }
];

export default function Step5Payment({ formData, updateFormData }) {
  const selectedPlanData = PLANS.find(p => p.id === formData.selectedPlan);

  // Calculate estimated monthly cost based on selected features
  const calculateEstimatedCost = () => {
    if (!selectedPlanData) return 0;

    const baseCost = selectedPlanData.price;
    const featureCost = formData.selectedFeatures.length * 5; // $5 per feature
    return baseCost + featureCost;
  };

  const estimatedCost = calculateEstimatedCost();

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = formData.selectedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                onClick={() => updateFormData({ selectedPlan: plan.id })}
                className={cn(
                  "p-6 cursor-pointer transition-all border-2 relative",
                  isSelected
                    ? "border-primary-500 bg-primary-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center">
                  <div className={cn(
                    "inline-flex p-3 rounded-lg mb-3",
                    isSelected ? "bg-primary-100" : "bg-gray-100"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      isSelected ? "text-primary-600" : "text-gray-600"
                    )} />
                  </div>

                  <h4 className="font-semibold text-lg text-gray-900">{plan.name}</h4>
                  <p className="text-sm text-gray-600 mt-1 mb-4">{plan.description}</p>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.billingPeriod}</span>
                  </div>

                  <ul className="space-y-2 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <div className="flex items-center justify-center gap-2 text-primary-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Selected</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Payment Method</h3>

        <div>
          <Label>Select Payment Method</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => updateFormData({ paymentMethod: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem
                  key={method.value}
                  value={method.value}
                  disabled={method.disabled}
                >
                  {method.icon} {method.label} {method.disabled && '(Coming Soon)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {formData.paymentMethod === 'paypal' && (
            <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CreditCard className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-900">
                  <p className="font-medium mb-1">PayPal Payment</p>
                  <p className="text-primary-700">
                    After clicking "Create Tenant", you'll be redirected to PayPal to
                    complete your subscription setup. Your tenant will be activated
                    once payment is confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Selected Plan */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">{selectedPlanData?.name} Plan</p>
              <p className="text-sm text-gray-600">Billed monthly</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">${selectedPlanData?.price}</p>
              <p className="text-xs text-gray-600">/month</p>
            </div>
          </div>

          {/* AI Features */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              AI Features ({formData.selectedFeatures.length} selected)
            </p>
            <div className="space-y-1">
              {formData.selectedFeatures.map((featureId) => (
                <div key={featureId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {featureId.replace('-', ' ')}
                  </span>
                  <span className="text-gray-700">Included</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Total</p>
              <p className="text-xs text-gray-600">per month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">
                ${selectedPlanData?.price}
              </p>
            </div>
          </div>
        </div>

        {/* Trial Notice */}
        <div className="mt-4 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-success-900">
              <p className="font-medium mb-1">14-Day Free Trial</p>
              <p className="text-success-700">
                Your first 14 days are free! You won't be charged until your trial ends.
                Cancel anytime during the trial period with no charges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-medium text-gray-900 mb-3">What Happens Next?</h3>
        <div className="space-y-3">
          <Step number={1} text="Your tenant account will be created instantly" />
          <Step number={2} text="UCM connection will be configured automatically" />
          <Step number={3} text="Admin user will receive a welcome email" />
          <Step number={4} text="You'll be redirected to PayPal to activate subscription" />
          <Step number={5} text="Start using the platform immediately!" />
        </div>
      </div>
    </div>
  );
}

const Step = ({ number, text }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
        {number}
      </div>
      <p className="text-sm text-gray-700 pt-0.5">{text}</p>
    </div>
  );
};
