import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, Shield } from 'lucide-react';

export default function ImpersonationBanner() {
  const isImpersonating = localStorage.getItem('impersonating') === 'true';
  const impersonatedTenant = localStorage.getItem('impersonated_tenant_name');

  if (!isImpersonating) return null;

  const handleExitImpersonation = () => {
    // Clear impersonation data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('impersonating');
    localStorage.removeItem('impersonated_tenant_name');

    // Redirect to super admin dashboard
    window.location.href = '/superadmin/tenants';
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg border-b-4 border-red-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <Shield className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-semibold">SUPER ADMIN MODE</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                You are impersonating: <strong className="underline">{impersonatedTenant || 'Tenant'}</strong>
              </span>
            </div>
          </div>
          <Button
            onClick={handleExitImpersonation}
            variant="outline"
            size="sm"
            className="bg-white text-red-600 hover:bg-red-50 border-white font-semibold"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      </div>
    </div>
  );
}
