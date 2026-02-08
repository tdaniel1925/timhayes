import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

// Step components
import Step1Company from '@/components/onboarding/Step1Company';
import Step2PhoneSystem from '@/components/onboarding/Step2PhoneSystem';
import Step3AIFeatures from '@/components/onboarding/Step3AIFeatures';
import Step4AdminUser from '@/components/onboarding/Step4AdminUser';
import Step5Payment from '@/components/onboarding/Step5Payment';

/**
 * Tenant Onboarding Wizard
 * 5-step process to set up a new tenant/client
 *
 * Steps:
 * 1. Company Information (name, industry, subdomain)
 * 2. Phone System Connection (UCM credentials + test)
 * 3. AI Features Selection (which features to enable)
 * 4. Admin User Creation (first user account)
 * 5. Payment & Activation (plan selection + payment)
 *
 * Usage: /tenants/onboarding (super admin only)
 */

const STEPS = [
  { id: 1, name: 'Company', description: 'Basic information' },
  { id: 2, name: 'Phone System', description: 'Connect UCM' },
  { id: 3, name: 'AI Features', description: 'Select features' },
  { id: 4, name: 'Admin User', description: 'Create account' },
  { id: 5, name: 'Payment', description: 'Activate plan' }
];

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 1: Company
    companyName: '',
    subdomain: '',
    industry: '',
    companySize: '',
    logo: null,

    // Step 2: Phone System
    phoneSystemType: 'grandstream_ucm',
    ucmUrl: '',
    ucmUsername: '',
    ucmPassword: '',
    ucmPort: '8443',
    webhookUsername: '',
    webhookPassword: '',
    connectionTested: false,

    // Step 3: AI Features
    selectedFeatures: ['transcription', 'sentiment-analysis', 'call-summary'],

    // Step 4: Admin User
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
    adminPhone: '',

    // Step 5: Payment
    selectedPlan: 'professional',
    paymentMethod: 'paypal',
    subscriptionId: null
  });

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    const isValid = await validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - create tenant
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = async (step) => {
    switch (step) {
      case 1:
        if (!formData.companyName || !formData.subdomain || !formData.industry) {
          showToast({
            type: 'error',
            title: 'Missing information',
            message: 'Please fill in all required fields'
          });
          return false;
        }

        // Check subdomain availability
        try {
          const available = await api.checkSubdomainAvailability(formData.subdomain);
          if (!available) {
            showToast({
              type: 'error',
              title: 'Subdomain unavailable',
              message: 'This subdomain is already taken. Please choose another.'
            });
            return false;
          }
        } catch (error) {
          console.error('Subdomain check failed:', error);
          return false;
        }
        return true;

      case 2:
        if (!formData.ucmUrl || !formData.ucmUsername || !formData.ucmPassword) {
          showToast({
            type: 'error',
            title: 'Missing credentials',
            message: 'Please enter your UCM connection details'
          });
          return false;
        }

        if (!formData.connectionTested) {
          showToast({
            type: 'warning',
            title: 'Connection not tested',
            message: 'Please test your UCM connection before continuing'
          });
          return false;
        }
        return true;

      case 3:
        if (formData.selectedFeatures.length === 0) {
          showToast({
            type: 'warning',
            title: 'No features selected',
            message: 'Please select at least one AI feature'
          });
          return false;
        }
        return true;

      case 4:
        if (!formData.adminEmail || !formData.adminPassword || !formData.adminFullName) {
          showToast({
            type: 'error',
            title: 'Missing information',
            message: 'Please fill in all admin user fields'
          });
          return false;
        }

        // Validate password strength
        if (formData.adminPassword.length < 8) {
          showToast({
            type: 'error',
            title: 'Weak password',
            message: 'Password must be at least 8 characters'
          });
          return false;
        }
        return true;

      case 5:
        if (!formData.selectedPlan) {
          showToast({
            type: 'error',
            title: 'No plan selected',
            message: 'Please select a subscription plan'
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create tenant with all collected data
      const response = await api.createTenant({
        // Company info
        company_name: formData.companyName,
        subdomain: formData.subdomain,
        industry: formData.industry,
        company_size: formData.companySize,

        // Phone system
        phone_system_type: formData.phoneSystemType,
        pbx_ip: formData.ucmUrl,
        pbx_username: formData.ucmUsername,
        pbx_password: formData.ucmPassword,
        pbx_port: parseInt(formData.ucmPort),
        webhook_username: formData.webhookUsername,
        webhook_password: formData.webhookPassword,

        // Plan
        plan: formData.selectedPlan,

        // Admin user
        admin_user: {
          email: formData.adminEmail,
          password: formData.adminPassword,
          full_name: formData.adminFullName,
          phone: formData.adminPhone
        },

        // AI features
        ai_features: formData.selectedFeatures,

        // Payment (if applicable)
        subscription_id: formData.subscriptionId
      });

      showToast({
        type: 'success',
        title: 'Tenant created successfully!',
        message: `${formData.companyName} is now active`
      });

      // Redirect to tenant detail page
      navigate(`/superadmin/tenants/${response.tenant_id}`);

    } catch (error) {
      console.error('Failed to create tenant:', error);
      showToast({
        type: 'error',
        title: 'Failed to create tenant',
        message: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Tenant Setup</h1>
          <p className="text-gray-600 mt-2">Complete setup in 5 easy steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    step.id < currentStep
                      ? "bg-success-500 border-success-500 text-white"
                      : step.id === currentStep
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="text-center mt-2">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      step.id <= currentStep ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep}: {STEPS[currentStep - 1].name}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <Step1Company
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <Step2PhoneSystem
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <Step3AIFeatures
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 4 && (
              <Step4AdminUser
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 5 && (
              <Step5Payment
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            variant="outline"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/superadmin/tenants')}
              variant="ghost"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? 'Processing...' : currentStep === 5 ? 'Create Tenant' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
