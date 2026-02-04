import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Webhook,
  Users,
  Settings,
  Phone,
  CheckCircle2,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookCredentials, setWebhookCredentials] = useState(null);
  const [testCallStatus, setTestCallStatus] = useState(null);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to AudiaPro',
      icon: Rocket,
      description: 'Let\'s get you set up in just a few minutes'
    },
    {
      id: 'phone-system',
      title: 'Connect Phone System',
      icon: Webhook,
      description: 'Configure webhook to receive call data'
    },
    {
      id: 'team-setup',
      title: 'Add Team Members',
      icon: Users,
      description: 'Invite your team to the platform'
    },
    {
      id: 'features',
      title: 'Enable AI Features',
      icon: Settings,
      description: 'Configure AI analytics and insights'
    },
    {
      id: 'test-call',
      title: 'Test Connection',
      icon: Phone,
      description: 'Verify everything is working'
    },
    {
      id: 'complete',
      title: 'All Set!',
      icon: CheckCircle2,
      description: 'You\'re ready to start analyzing calls'
    }
  ];

  useEffect(() => {
    loadWebhookInfo();
  }, []);

  const loadWebhookInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/webhook`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWebhookUrl(data.webhook_url);
        setWebhookCredentials({
          username: data.webhook_username,
          password: data.webhook_password
        });
      }
    } catch (err) {
      console.error('Failed to load webhook info:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const checkTestCall = async () => {
    setLoading(true);
    try {
      // Check if any calls have been received in the last 5 minutes
      const response = await fetch(`${import.meta.env.VITE_API_URL}/calls?limit=1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.calls && data.calls.length > 0) {
          const latestCall = data.calls[0];
          const callTime = new Date(latestCall.start_time);
          const now = new Date();
          const diffMinutes = (now - callTime) / (1000 * 60);

          if (diffMinutes < 5) {
            setTestCallStatus('success');
          } else {
            setTestCallStatus('no_recent');
          }
        } else {
          setTestCallStatus('no_calls');
        }
      }
    } catch (err) {
      setError('Failed to check for test calls');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    // Mark onboarding as complete in the backend
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/settings/onboarding-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
    } catch (err) {
      console.error('Failed to mark onboarding complete:', err);
    }
    navigate('/dashboard');
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-12">
            <Rocket className="h-24 w-24 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to AudiaPro!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Get ready to transform your call analytics with AI-powered insights.
              This quick setup will have you up and running in just a few minutes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <Phone className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Connect Your PBX</h3>
                <p className="text-sm text-gray-600">
                  Integrate with CloudUCM, 3CX, or any PBX system via webhook
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <Settings className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Enable AI Features</h3>
                <p className="text-sm text-gray-600">
                  Transcription, sentiment analysis, quality scoring, and more
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Invite Your Team</h3>
                <p className="text-sm text-gray-600">
                  Add team members and start analyzing calls together
                </p>
              </div>
            </div>
          </div>
        );

      case 'phone-system':
        return (
          <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Phone System
              </h2>
              <p className="text-gray-600">
                Configure your PBX to send call data to AudiaPro via webhook
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Webhook URL</CardTitle>
                <CardDescription>
                  Copy this URL and configure it in your phone system's CDR webhook settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={webhookUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(webhookUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {webhookCredentials && (
                    <>
                      <div>
                        <Label>Username</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={webhookCredentials.username}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(webhookCredentials.username)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Password</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={webhookCredentials.password}
                            readOnly
                            type="password"
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(webhookCredentials.password)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-blue-900">
                  <div className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <p>Log in to your phone system admin panel (CloudUCM, 3CX, etc.)</p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <p>Navigate to CDR Settings or Webhook Configuration</p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <p>Add the webhook URL above as the CDR destination</p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <p>Enter the username and password for authentication</p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold mr-2">5.</span>
                    <p>Enable the webhook and save settings</p>
                  </div>
                </div>

                <Button
                  variant="link"
                  className="mt-4 text-blue-600"
                  onClick={() => window.open('https://docs.grandstream.com/webhook-guide', '_blank')}
                >
                  View detailed setup guide <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'team-setup':
        return (
          <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Add Team Members
              </h2>
              <p className="text-gray-600">
                Invite colleagues to view call analytics and insights
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Invite Users</CardTitle>
                <CardDescription>
                  You can add team members now or skip and do it later from Settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/users')}
                  className="w-full mb-4"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Go to User Management
                </Button>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Tip:</strong> You can add users later from the User Management page.
                  </p>
                  <p className="text-sm text-gray-600">
                    Team members will receive an email invitation with login credentials.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'features':
        return (
          <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                AI Features
              </h2>
              <p className="text-gray-600">
                These features are automatically enabled based on your subscription plan
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Call Transcription</h3>
                      <p className="text-sm text-green-800">
                        Automatically convert speech to text for searchable call records
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Sentiment Analysis</h3>
                      <p className="text-sm text-green-800">
                        Understand customer satisfaction and emotional tone
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Call Quality Scoring</h3>
                      <p className="text-sm text-green-800">
                        AI-powered evaluation of greeting, professionalism, and more
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Action Items & Insights</h3>
                      <p className="text-sm text-green-800">
                        Extract key topics, follow-ups, and actionable intelligence
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Sales Intelligence</h3>
                      <p className="text-sm text-green-800">
                        Objection handling, churn risk, and deal risk analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'test-call':
        return (
          <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Test Your Connection
              </h2>
              <p className="text-gray-600">
                Make a test call to verify the webhook is working
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">How to Test:</h3>
                    <ol className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">1.</span>
                        <span>Make a call through your phone system</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">2.</span>
                        <span>Let it ring or answer it briefly</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">3.</span>
                        <span>End the call</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">4.</span>
                        <span>Click "Check for Test Call" below</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    onClick={checkTestCall}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Checking...' : 'Check for Test Call'}
                  </Button>

                  {testCallStatus === 'success' && (
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Success!</strong> We received your test call. Your webhook is configured correctly!
                      </AlertDescription>
                    </Alert>
                  )}

                  {testCallStatus === 'no_recent' && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        No recent calls found. Please make a test call and try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {testCallStatus === 'no_calls' && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        No calls received yet. Please verify your webhook configuration and try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setCurrentStep(1)}
                      className="text-sm"
                    >
                      Need to reconfigure webhook?
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="bg-green-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You're All Set!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Your AudiaPro account is configured and ready to go.
              Start making calls and watch the AI-powered insights roll in!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Phone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">View Call Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    See all your calls with AI insights
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Settings className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Configure Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Customize your experience
                  </p>
                  <Button
                    onClick={() => navigate('/settings')}
                    variant="outline"
                    className="w-full"
                  >
                    Go to Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.id} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center font-medium ${
                        isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                      style={{ width: 'calc(100% - 3rem)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-[600px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={nextStep}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Complete Setup
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
