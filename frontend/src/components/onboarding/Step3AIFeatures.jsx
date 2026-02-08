import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Brain, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Step 3: AI Features Selection
 * Choose which AI features to enable for this tenant
 */

const AI_FEATURES = [
  {
    id: 'transcription',
    name: 'Multilingual Transcription',
    description: 'Convert call audio to text with speaker identification',
    icon: MessageSquare,
    price: '$0.10/call',
    essential: true
  },
  {
    id: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Detect customer emotions and satisfaction levels',
    icon: TrendingUp,
    price: '$0.05/call',
    essential: true
  },
  {
    id: 'call-summary',
    name: 'AI Call Summary',
    description: 'Generate concise summaries with key points and action items',
    icon: Brain,
    price: '$0.08/call',
    essential: true
  },
  {
    id: 'call-quality',
    name: 'Call Quality Scoring',
    description: 'Evaluate agent performance and professionalism',
    icon: Sparkles,
    price: '$0.12/call',
    essential: false
  },
  {
    id: 'compliance',
    name: 'Compliance Monitoring',
    description: 'Detect policy violations and required disclosures',
    icon: CheckCircle,
    price: '$0.10/call',
    essential: false
  }
];

export default function Step3AIFeatures({ formData, updateFormData }) {
  const toggleFeature = (featureId) => {
    const newFeatures = formData.selectedFeatures.includes(featureId)
      ? formData.selectedFeatures.filter(id => id !== featureId)
      : [...formData.selectedFeatures, featureId];

    updateFormData({ selectedFeatures: newFeatures });
  };

  const isSelected = (featureId) => formData.selectedFeatures.includes(featureId);

  const essentialFeatures = AI_FEATURES.filter(f => f.essential);
  const advancedFeatures = AI_FEATURES.filter(f => !f.essential);

  return (
    <div className="space-y-6">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-900">
          <strong>Essential Features</strong> are recommended for all tenants.
          Advanced features can be added anytime from settings.
        </p>
      </div>

      {/* Essential Features */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Essential Features</h3>
        <div className="grid grid-cols-1 gap-3">
          {essentialFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              selected={isSelected(feature.id)}
              onToggle={() => toggleFeature(feature.id)}
            />
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Advanced Features</h3>
        <div className="grid grid-cols-1 gap-3">
          {advancedFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              selected={isSelected(feature.id)}
              onToggle={() => toggleFeature(feature.id)}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Selected Features</h4>
        <div className="flex flex-wrap gap-2">
          {formData.selectedFeatures.length > 0 ? (
            formData.selectedFeatures.map(id => {
              const feature = AI_FEATURES.find(f => f.id === id);
              return feature ? (
                <Badge key={id} className="bg-primary-100 text-primary-700">
                  {feature.name}
                </Badge>
              ) : null;
            })
          ) : (
            <p className="text-sm text-gray-600">No features selected yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ feature, selected, onToggle }) => {
  const Icon = feature.icon;

  return (
    <Card
      onClick={onToggle}
      className={cn(
        "p-4 cursor-pointer transition-all border-2",
        selected
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-2 rounded-lg",
            selected ? "bg-primary-100" : "bg-gray-100"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              selected ? "text-primary-600" : "text-gray-600"
            )} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{feature.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            <p className="text-xs text-gray-500 mt-2">{feature.price}</p>
          </div>
        </div>
        {selected && (
          <CheckCircle className="h-6 w-6 text-primary-600 flex-shrink-0" />
        )}
      </div>
    </Card>
  );
};
