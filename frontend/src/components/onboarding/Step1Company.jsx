import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Hash, Briefcase, Users, CheckCircle, XCircle, Loader } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Step 1: Company Information
 * Collects basic company details and validates subdomain availability
 */

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
  'Education', 'Real Estate', 'Legal', 'Consulting', 'Other'
];

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees'
];

export default function Step1Company({ formData, updateFormData }) {
  const [subdomainStatus, setSubdomainStatus] = useState(null); // 'checking' | 'available' | 'taken'
  const [subdomainMessage, setSubdomainMessage] = useState('');

  // Auto-generate subdomain from company name
  const generateSubdomain = (companyName) => {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  };

  // Check subdomain availability with debounce
  useEffect(() => {
    if (!formData.subdomain || formData.subdomain.length < 3) {
      setSubdomainStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSubdomainStatus('checking');
        const available = await api.checkSubdomainAvailability(formData.subdomain);

        if (available) {
          setSubdomainStatus('available');
          setSubdomainMessage('This subdomain is available!');
        } else {
          setSubdomainStatus('taken');
          setSubdomainMessage('This subdomain is already taken');
        }
      } catch (error) {
        console.error('Subdomain check failed:', error);
        setSubdomainStatus(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  const handleCompanyNameChange = (value) => {
    updateFormData({ companyName: value });

    // Auto-suggest subdomain if empty
    if (!formData.subdomain) {
      const suggested = generateSubdomain(value);
      if (suggested) {
        updateFormData({ subdomain: suggested });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div>
        <Label htmlFor="companyName" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Company Name *
        </Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => handleCompanyNameChange(e.target.value)}
          placeholder="Acme Corporation"
          className="mt-2"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          The legal name of your organization
        </p>
      </div>

      {/* Subdomain */}
      <div>
        <Label htmlFor="subdomain" className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Subdomain *
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => updateFormData({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
            placeholder="acme"
            className="flex-1"
            required
          />
          <span className="text-sm text-gray-600">.audiapro.com</span>
          {subdomainStatus === 'checking' && (
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          )}
          {subdomainStatus === 'available' && (
            <CheckCircle className="h-5 w-5 text-success-600" />
          )}
          {subdomainStatus === 'taken' && (
            <XCircle className="h-5 w-5 text-error-600" />
          )}
        </div>
        {subdomainMessage && (
          <p className={cn(
            "text-xs mt-1",
            subdomainStatus === 'available' ? "text-success-600" : "text-error-600"
          )}>
            {subdomainMessage}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          This will be your unique identifier: {formData.subdomain}.audiapro.com
        </p>
      </div>

      {/* Industry */}
      <div>
        <Label htmlFor="industry" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Industry *
        </Label>
        <Select
          value={formData.industry}
          onValueChange={(value) => updateFormData({ industry: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry.toLowerCase()}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          This helps us customize AI prompts for your industry
        </p>
      </div>

      {/* Company Size */}
      <div>
        <Label htmlFor="companySize" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Company Size *
        </Label>
        <Select
          value={formData.companySize}
          onValueChange={(value) => updateFormData({ companySize: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            {COMPANY_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Helps us recommend the right plan
        </p>
      </div>

      {/* Summary */}
      {formData.companyName && formData.subdomain && subdomainStatus === 'available' && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-primary-900 mb-2">Setup Summary</h4>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>• Company: <strong>{formData.companyName}</strong></li>
            <li>• Subdomain: <strong>{formData.subdomain}.audiapro.com</strong></li>
            <li>• Webhook URL: <strong>https://api.audiapro.com/webhook/cdr/{formData.subdomain}</strong></li>
            {formData.industry && <li>• Industry: <strong>{formData.industry}</strong></li>}
          </ul>
        </div>
      )}
    </div>
  );
}
