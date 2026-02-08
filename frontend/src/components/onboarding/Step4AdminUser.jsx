import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Step 4: Admin User Creation
 * Create the first admin account for this tenant
 */

export default function Step4AdminUser({ formData, updateFormData }) {
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Weak', color: 'error' };
    if (strength <= 3) return { strength: 2, label: 'Fair', color: 'warning' };
    if (strength === 4) return { strength: 3, label: 'Good', color: 'success' };
    return { strength: 4, label: 'Strong', color: 'success' };
  };

  const passwordStrength = getPasswordStrength(formData.adminPassword);
  const passwordsMatch = confirmPassword && formData.adminPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword && formData.adminPassword !== confirmPassword;

  // Email validation
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const emailValid = formData.adminEmail && isValidEmail(formData.adminEmail);
  const emailInvalid = formData.adminEmail && !isValidEmail(formData.adminEmail);

  return (
    <div className="space-y-6">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-900">
          <strong>Create Admin Account:</strong> This will be the primary administrator
          who can manage settings, users, and access all features.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <Label htmlFor="adminFullName" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name *
        </Label>
        <Input
          id="adminFullName"
          value={formData.adminFullName}
          onChange={(e) => updateFormData({ adminFullName: e.target.value })}
          placeholder="John Smith"
          className="mt-2"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          The admin's full name for display purposes
        </p>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="adminEmail" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address *
        </Label>
        <div className="relative mt-2">
          <Input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => updateFormData({ adminEmail: e.target.value })}
            placeholder="john@company.com"
            className={cn(
              emailInvalid && "border-error-500 focus:border-error-500"
            )}
            required
          />
          {emailValid && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success-600" />
          )}
          {emailInvalid && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-error-600" />
          )}
        </div>
        {emailInvalid && (
          <p className="text-xs text-error-600 mt-1">
            Please enter a valid email address
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          This will be used to log in to the system
        </p>
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="adminPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password *
        </Label>
        <Input
          id="adminPassword"
          type="password"
          value={formData.adminPassword}
          onChange={(e) => updateFormData({ adminPassword: e.target.value })}
          onFocus={() => setPasswordFocused(true)}
          placeholder="••••••••"
          className="mt-2"
          autoComplete="new-password"
          required
        />

        {/* Password Strength Indicator */}
        {formData.adminPassword && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password strength:</span>
              <span className={cn(
                "text-xs font-medium",
                passwordStrength.color === 'error' && "text-error-600",
                passwordStrength.color === 'warning' && "text-warning-600",
                passwordStrength.color === 'success' && "text-success-600"
              )}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  passwordStrength.color === 'error' && "bg-error-500",
                  passwordStrength.color === 'warning' && "bg-warning-500",
                  passwordStrength.color === 'success' && "bg-success-500"
                )}
                style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Password Requirements */}
        {(passwordFocused || formData.adminPassword) && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-600 font-medium">Password must contain:</p>
            <PasswordRequirement
              met={formData.adminPassword.length >= 8}
              text="At least 8 characters"
            />
            <PasswordRequirement
              met={/[a-z]/.test(formData.adminPassword) && /[A-Z]/.test(formData.adminPassword)}
              text="Upper and lowercase letters"
            />
            <PasswordRequirement
              met={/\d/.test(formData.adminPassword)}
              text="At least one number"
            />
            <PasswordRequirement
              met={/[^a-zA-Z0-9]/.test(formData.adminPassword)}
              text="At least one special character"
            />
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Confirm Password *
        </Label>
        <div className="relative mt-2">
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={cn(
              passwordsDontMatch && "border-error-500 focus:border-error-500"
            )}
            autoComplete="new-password"
            required
          />
          {passwordsMatch && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success-600" />
          )}
          {passwordsDontMatch && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-error-600" />
          )}
        </div>
        {passwordsDontMatch && (
          <p className="text-xs text-error-600 mt-1">
            Passwords do not match
          </p>
        )}
      </div>

      {/* Phone (Optional) */}
      <div>
        <Label htmlFor="adminPhone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Phone Number (Optional)
        </Label>
        <Input
          id="adminPhone"
          type="tel"
          value={formData.adminPhone}
          onChange={(e) => updateFormData({ adminPhone: e.target.value })}
          placeholder="+1 (555) 123-4567"
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Used for account recovery and notifications
        </p>
      </div>

      {/* Summary */}
      {formData.adminFullName && emailValid && passwordsMatch && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-success-900">Admin Account Ready</p>
              <p className="text-sm text-success-700 mt-1">
                <strong>{formData.adminFullName}</strong> ({formData.adminEmail}) will be created
                as the primary administrator with full access to all features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PasswordRequirement = ({ met, text }) => {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
      )}
      <span className={cn(
        "text-xs",
        met ? "text-success-700" : "text-gray-600"
      )}>
        {text}
      </span>
    </div>
  );
};
