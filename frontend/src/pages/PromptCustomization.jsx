import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Wand2,
  MessageSquare,
  FileCheck,
  TestTube2,
  History,
  Sparkles,
  Send,
  RotateCcw,
  Save,
  Eye,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const INDUSTRIES = [
  { id: 'sales_b2b', name: 'B2B Sales', icon: '💼' },
  { id: 'sales_b2c', name: 'B2C Sales', icon: '🛍️' },
  { id: 'customer_support', name: 'Customer Support', icon: '🎧' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'financial', name: 'Financial Services', icon: '💰' },
  { id: 'real_estate', name: 'Real Estate', icon: '🏠' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
  { id: 'saas', name: 'SaaS', icon: '☁️' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' }
];

const AI_FEATURES = [
  { slug: 'call-summaries', name: 'Call Summaries', category: 'coaching' },
  { slug: 'quality-scoring', name: 'Quality Scoring', category: 'coaching' },
  { slug: 'sentiment-analysis', name: 'Sentiment Analysis', category: 'customer_intelligence' },
  { slug: 'emotion-detection', name: 'Emotion Detection', category: 'customer_intelligence' },
  { slug: 'churn-prediction', name: 'Churn Prediction', category: 'customer_intelligence' },
  { slug: 'intent-detection', name: 'Intent Detection', category: 'revenue' },
  { slug: 'deal-risk', name: 'Deal Risk Analysis', category: 'revenue' },
  { slug: 'objection-analysis', name: 'Objection Analysis', category: 'revenue' },
  { slug: 'compliance-monitoring', name: 'Compliance Monitoring', category: 'compliance' },
  { slug: 'action-items', name: 'Action Items', category: 'insights' },
  { slug: 'topic-extraction', name: 'Topic Extraction', category: 'insights' }
];

export default function PromptCustomization() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    industry: '',
    goals: [],
    tone: 'professional',
    keywords: [],
    competitors: [],
    compliance: []
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Testing state
  const [testResults, setTestResults] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Signature modal
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureAgreed, setSignatureAgreed] = useState(false);

  // Version history
  const [versionHistory, setVersionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load current customizations
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/prompt-customizations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Set initial data
      }
    } catch (error) {
      console.error('Error loading customizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWizardNext = () => {
    if (wizardStep < 4) {
      setWizardStep(wizardStep + 1);
    } else {
      generatePromptFromWizard();
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const generatePromptFromWizard = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/prompts/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature_slug: selectedFeature,
          wizard_data: wizardData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPrompt(data.prompt);
        setWizardStep(0);
        alert('Prompt generated successfully! You can now refine it using AI chat.');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Failed to generate prompt');
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/prompts/refine`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature_slug: selectedFeature,
          current_prompt: currentPrompt,
          user_instruction: chatInput,
          chat_history: chatMessages
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPrompt(data.refined_prompt);
        setChatMessages([
          ...chatMessages,
          userMessage,
          { role: 'assistant', content: data.explanation }
        ]);
      }
    } catch (error) {
      console.error('Error refining prompt:', error);
      setChatMessages([
        ...chatMessages,
        userMessage,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTestPrompt = async () => {
    setTestLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/prompts/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature_slug: selectedFeature,
          custom_prompt: currentPrompt
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.test_results);
      }
    } catch (error) {
      console.error('Error testing prompt:', error);
      alert('Failed to test prompt');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSavePrompt = () => {
    setShowSignatureModal(true);
  };

  const handleSignatureSubmit = async () => {
    if (!signatureName.trim() || !signatureAgreed) {
      alert('Please enter your name and agree to the terms');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/prompts/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature_slug: selectedFeature,
          custom_prompt: currentPrompt,
          signature_name: signatureName,
          wizard_data: wizardData
        })
      });

      if (response.ok) {
        alert('Prompt saved and activated successfully!');
        setShowSignatureModal(false);
        setSignatureName('');
        setSignatureAgreed(false);
        loadInitialData();
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt');
    }
  };

  const handleRestore = async (versionId) => {
    if (!confirm('Are you sure you want to restore this version?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/prompts/restore/${versionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });

      if (response.ok) {
        alert('Version restored successfully!');
        loadInitialData();
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Failed to restore version');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customization studio...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        title={<div className="flex items-center gap-2"><Wand2 className="h-6 w-6 text-purple-600" />AI Customization Studio</div>}
        subtitle="Customize AI prompts for your business needs"
      >
        <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Selection Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Select AI Feature</CardTitle>
              <CardDescription>Choose a feature to customize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {AI_FEATURES.map((feature) => (
                  <button
                    key={feature.slug}
                    onClick={() => setSelectedFeature(feature.slug)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedFeature === feature.slug
                        ? 'border-purple-500 bg-purple-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{feature.name}</span>
                      {selectedFeature === feature.slug && (
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{feature.category}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Customization Area */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedFeature ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an AI Feature</h3>
                  <p className="text-sm text-gray-600">
                    Choose an AI feature from the sidebar to start customizing its prompts
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Tabs defaultValue="wizard" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="wizard">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Wizard
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      AI Chat
                    </TabsTrigger>
                    <TabsTrigger value="test">
                      <TestTube2 className="h-4 w-4 mr-2" />
                      Test
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </TabsTrigger>
                  </TabsList>

                  {/* Wizard Tab */}
                  <TabsContent value="wizard">
                    <Card>
                      <CardHeader>
                        <CardTitle>Guided Setup Wizard</CardTitle>
                        <CardDescription>
                          Step {wizardStep + 1} of 5: {
                            ['Choose Industry', 'Set Goals', 'Define Tone', 'Add Keywords', 'Review'][wizardStep]
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {wizardStep === 0 && (
                          <div className="space-y-4">
                            <Label>Select Your Industry</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {INDUSTRIES.map((industry) => (
                                <button
                                  key={industry.id}
                                  onClick={() => setWizardData({ ...wizardData, industry: industry.id })}
                                  className={`p-4 rounded-lg border text-left transition-all ${
                                    wizardData.industry === industry.id
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="text-2xl mb-2">{industry.icon}</div>
                                  <div className="font-medium text-sm">{industry.name}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {wizardStep === 1 && (
                          <div className="space-y-4">
                            <Label>What are your primary goals? (Select multiple)</Label>
                            <div className="space-y-2">
                              {['Improve call quality', 'Increase conversions', 'Ensure compliance', 'Reduce churn', 'Better coaching', 'Track objections'].map((goal) => (
                                <label key={goal} className="flex items-center gap-2 p-3 rounded border hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={wizardData.goals.includes(goal)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setWizardData({ ...wizardData, goals: [...wizardData.goals, goal] });
                                      } else {
                                        setWizardData({ ...wizardData, goals: wizardData.goals.filter(g => g !== goal) });
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{goal}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {wizardStep === 2 && (
                          <div className="space-y-4">
                            <Label>Select Communication Tone</Label>
                            <div className="space-y-2">
                              {[
                                { value: 'professional', label: 'Professional & Formal', desc: 'Business-appropriate, respectful' },
                                { value: 'friendly', label: 'Friendly & Casual', desc: 'Warm, conversational tone' },
                                { value: 'technical', label: 'Technical & Precise', desc: 'Detailed, industry-specific' }
                              ].map((tone) => (
                                <button
                                  key={tone.value}
                                  onClick={() => setWizardData({ ...wizardData, tone: tone.value })}
                                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                                    wizardData.tone === tone.value
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="font-medium">{tone.label}</div>
                                  <div className="text-sm text-muted-foreground">{tone.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {wizardStep === 3 && (
                          <div className="space-y-4">
                            <Label>Add Important Keywords (Optional)</Label>
                            <Input
                              placeholder="e.g., competitor names, product terms, compliance words"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  setWizardData({
                                    ...wizardData,
                                    keywords: [...wizardData.keywords, e.target.value.trim()]
                                  });
                                  e.target.value = '';
                                }
                              }}
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                              {wizardData.keywords.map((keyword, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setWizardData({
                                      ...wizardData,
                                      keywords: wizardData.keywords.filter((_, i) => i !== idx)
                                    });
                                  }}
                                >
                                  {keyword} ×
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {wizardStep === 4 && (
                          <div className="space-y-4">
                            <Label>Review Your Configuration</Label>
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <span className="text-sm font-medium">Industry:</span>
                                <span className="text-sm ml-2">
                                  {INDUSTRIES.find(i => i.id === wizardData.industry)?.name || 'Not set'}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Goals:</span>
                                <span className="text-sm ml-2">{wizardData.goals.join(', ') || 'None'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Tone:</span>
                                <span className="text-sm ml-2 capitalize">{wizardData.tone}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Keywords:</span>
                                <span className="text-sm ml-2">{wizardData.keywords.join(', ') || 'None'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between mt-6">
                          <Button
                            variant="outline"
                            onClick={handleWizardBack}
                            disabled={wizardStep === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back
                          </Button>
                          <Button onClick={handleWizardNext}>
                            {wizardStep === 4 ? (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Prompt
                              </>
                            ) : (
                              <>
                                Next
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AI Chat Tab */}
                  <TabsContent value="chat">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Chat Refinement</CardTitle>
                        <CardDescription>
                          Refine your prompt using natural language
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Current Prompt Display */}
                        <div className="mb-4">
                          <Label>Current Prompt</Label>
                          <div className="mt-2 p-4 bg-gray-50 rounded-lg border text-sm whitespace-pre-wrap">
                            {currentPrompt || 'No prompt generated yet. Use the wizard to create one first.'}
                          </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="mb-4 h-64 overflow-y-auto border rounded-lg p-4 bg-white">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">
                              Start chatting to refine your prompt
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {chatMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[80%] p-3 rounded-lg ${
                                      msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    <p className="text-sm">{msg.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Chat Input */}
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                            placeholder="e.g., Make it focus more on compliance keywords"
                            disabled={chatLoading || !currentPrompt}
                          />
                          <Button
                            onClick={handleChatSend}
                            disabled={chatLoading || !currentPrompt || !chatInput.trim()}
                          >
                            {chatLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Test Tab */}
                  <TabsContent value="test">
                    <Card>
                      <CardHeader>
                        <CardTitle>Test Your Prompt</CardTitle>
                        <CardDescription>
                          See how your custom prompt performs on recent calls
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={handleTestPrompt}
                          disabled={testLoading || !currentPrompt}
                          className="mb-4"
                        >
                          {testLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube2 className="h-4 w-4 mr-2" />
                              Run Test on Recent Calls
                            </>
                          )}
                        </Button>

                        {testResults && (
                          <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-900">Test Complete</span>
                              </div>
                              <p className="text-sm text-green-800">
                                Tested on {testResults.calls_tested} recent calls
                              </p>
                            </div>

                            <div className="space-y-3">
                              {testResults.sample_results?.map((result, idx) => (
                                <div key={idx} className="p-4 border rounded-lg">
                                  <div className="font-medium mb-2">Call {idx + 1}</div>
                                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {result.output}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle>Version History</CardTitle>
                        <CardDescription>View and restore previous versions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {versionHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No version history yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {versionHistory.map((version) => (
                              <div key={version.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="font-medium">Version {version.version}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {new Date(version.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(version.id)}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Restore
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Signed by: {version.signature_name}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPrompt(defaultPrompt)}
                        disabled={!currentPrompt}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Default
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate('/dashboard')}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSavePrompt}
                          disabled={!currentPrompt}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save & Activate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Digital Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                Digital Signature Required
              </CardTitle>
              <CardDescription>
                Approve this prompt customization with your digital signature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice</p>
                      <p>
                        By signing, you acknowledge that this custom prompt will affect how AI analyzes your calls.
                        You can revert to the default prompt or previous versions at any time.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signatureName">Your Full Name</Label>
                  <Input
                    id="signatureName"
                    placeholder="Enter your full name"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signatureAgreed}
                    onChange={(e) => setSignatureAgreed(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I have reviewed the custom prompt and approve its activation for my account.
                    I understand this will change how AI analyzes calls.
                  </span>
                </label>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSignatureModal(false);
                  setSignatureName('');
                  setSignatureAgreed(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignatureSubmit}
                disabled={!signatureName.trim() || !signatureAgreed}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Sign & Activate
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
