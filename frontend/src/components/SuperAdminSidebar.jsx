import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  TrendingUp,
  Tag,
  Activity,
  Flag,
  Bell,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlusCircle,
  Phone
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
      { name: 'System Monitoring', path: '/superadmin/monitoring', icon: Activity }
    ]
  },
  {
    title: 'Tenant Management',
    items: [
      { name: 'All Tenants', path: '/superadmin/tenants', icon: Building2 },
      { name: 'Create Tenant', path: '/superadmin/tenants/create', icon: PlusCircle }
    ]
  },
  {
    title: 'Revenue & Billing',
    items: [
      { name: 'Revenue Dashboard', path: '/superadmin/revenue', icon: DollarSign },
      { name: 'Plans Management', path: '/superadmin/plans', icon: Tag },
      { name: 'Cost Tracking', path: '/superadmin/costs', icon: TrendingUp }
    ]
  },
  {
    title: 'System Settings',
    items: [
      { name: 'Feature Flags', path: '/superadmin/feature-flags', icon: Flag },
      { name: 'System Alerts', path: '/superadmin/alerts', icon: Bell }
    ]
  }
];

export default function SuperAdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_refresh_token');
    localStorage.removeItem('superadmin_user');
    navigate('/superadmin/login');
  };

  const superAdminUser = JSON.parse(localStorage.getItem('superadmin_user') || '{}');

  return (
    <div className={cn(
      "h-screen bg-gradient-to-b from-[#31543A] to-[#3F8A84] text-white flex flex-col transition-all duration-300 shadow-2xl",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#E4B756] to-[#C89A8F] rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Super Admin
              </h1>
              <p className="text-xs text-white/70">AudiaPro Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-[#E4B756] to-[#C89A8F] rounded-lg flex items-center justify-center mx-auto">
            <Phone className="w-4 h-4 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-white hover:bg-white/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navigationItems.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            {!collapsed && (
              <h3 className="px-4 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <nav className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-[#E4B756] text-[#31543A] shadow-lg"
                        : "text-white/90 hover:bg-white/10",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/10">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="text-sm">
              <p className="font-medium text-white truncate">{superAdminUser.full_name || 'Super Admin'}</p>
              <p className="text-xs text-white/70 truncate">{superAdminUser.email || ''}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3 text-[#E4B756]" />
                <p className="text-xs text-[#E4B756] font-medium">SUPER ADMIN</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 bg-[#3F8A84] hover:bg-[#6CA8C2] text-white border-[#3F8A84]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-full text-white hover:bg-white/10"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
