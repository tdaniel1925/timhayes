import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Phone,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  CreditCard,
  Code,
  FileText,
  Shield,
  UserCog,
  Bell,
  Plug,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Team Performance', path: '/team-performance', icon: TrendingUp, role: 'admin' }
    ]
  },
  {
    title: 'Call Management',
    items: [
      { name: 'All Calls', path: '/dashboard', icon: Phone },
      { name: 'Notifications', path: '/notifications', icon: Bell }
    ]
  },
  {
    title: 'AI & Analytics',
    items: [
      { name: 'AI Customization', path: '/prompt-customization', icon: Sparkles },
      { name: 'Advanced Reporting', path: '/advanced-reporting', icon: FileText },
      { name: 'Usage Analytics', path: '/usage-analytics', icon: BarChart3 }
    ]
  },
  {
    title: 'Team & Users',
    items: [
      { name: 'User Management', path: '/users', icon: Users, role: 'admin' },
      { name: 'Team Management', path: '/team-management', icon: UserCog, role: 'admin' }
    ]
  },
  {
    title: 'Subscription & Billing',
    items: [
      { name: 'Subscription', path: '/subscription', icon: CreditCard },
      { name: 'API Management', path: '/api-management', icon: Code, role: 'admin' }
    ]
  },
  {
    title: 'Compliance & Security',
    items: [
      { name: 'Compliance Dashboard', path: '/compliance', icon: Shield },
      { name: 'Integrations', path: '/integrations', icon: Plug, role: 'admin' }
    ]
  },
  {
    title: 'Settings',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  }
];

const superAdminItems = [
  {
    title: 'Super Admin',
    items: [
      { name: 'All Tenants', path: '/tenants', icon: Building2 }
    ]
  }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const filteredNavItems = navigationItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // If item has a role requirement, check if user has that role
      if (item.role) {
        return user?.role === item.role || user?.role === 'superadmin';
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  const navSections = user?.role === 'superadmin'
    ? [...superAdminItems, ...filteredNavItems]
    : filteredNavItems;

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-900">AudiaPro</h1>
            <p className="text-xs text-gray-500">{user?.tenant?.company_name}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            {!collapsed && (
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100",
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
      <div className="p-4 border-t border-gray-200">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="text-sm">
              <p className="font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">{user?.role?.toUpperCase()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="w-full"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
