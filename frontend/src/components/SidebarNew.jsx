import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Phone, Settings, Sparkles, Users, Building2,
  TrendingUp, Bell, Activity, Sliders, FileText, BarChart3,
  UserCog, CreditCard, Code, Shield, Plug, ChevronDown,
  ChevronRight, Menu, X, LogOut, Zap
} from 'lucide-react';

/**
 * Redesigned Sidebar Navigation
 *
 * Features:
 * - 6 main categories with expandable submenus
 * - Smooth animations for expand/collapse
 * - Mobile responsive (drawer on mobile)
 * - Active state highlighting
 * - Role-based visibility
 * - Collapsible to icon-only mode
 */

// Main navigation structure
const navigationConfig = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    description: 'Overview & analytics'
  },
  {
    id: 'calls',
    name: 'Calls',
    icon: Phone,
    description: 'Call management',
    submenu: [
      { name: 'All Calls', path: '/dashboard', icon: Phone },
      { name: 'Notifications', path: '/notifications', icon: Bell, badge: true },
      { name: 'Activity Logs', path: '/activity-logs', icon: Activity }
    ]
  },
  {
    id: 'ai',
    name: 'AI & Analytics',
    icon: Sparkles,
    description: 'AI features & insights',
    submenu: [
      { name: 'Prompt Customization', path: '/prompt-customization', icon: Zap },
      { name: 'Team Performance', path: '/team-performance', icon: TrendingUp, role: 'admin' },
      { name: 'Usage Analytics', path: '/usage-analytics', icon: BarChart3 },
      { name: 'Advanced Reporting', path: '/advanced-reporting', icon: FileText }
    ]
  },
  {
    id: 'team',
    name: 'Team',
    icon: Users,
    description: 'User management',
    role: 'admin',
    submenu: [
      { name: 'User Management', path: '/users', icon: Users },
      { name: 'Team Management', path: '/team-management', icon: UserCog }
    ]
  },
  {
    id: 'account',
    name: 'Account',
    icon: CreditCard,
    description: 'Billing & integrations',
    submenu: [
      { name: 'Subscription', path: '/subscription', icon: CreditCard },
      { name: 'Compliance', path: '/compliance', icon: Shield },
      { name: 'Integrations', path: '/integrations', icon: Plug, role: 'admin' },
      { name: 'API Management', path: '/api-management', icon: Code, role: 'admin' }
    ]
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    path: '/settings',
    description: 'System configuration'
  }
];

// Super admin navigation
const superAdminNav = {
  id: 'superadmin',
  name: 'Super Admin',
  icon: Building2,
  description: 'Tenant management',
  submenu: [
    { name: 'All Tenants', path: '/superadmin/tenants', icon: Building2 },
    { name: 'Create Tenant', path: '/superadmin/tenants/onboarding', icon: Sparkles }
  ]
};

export default function SidebarNew() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set(['calls', 'ai'])); // Default expanded

  const isActive = (path) => location.pathname === path;

  const isParentActive = (item) => {
    if (item.path && isActive(item.path)) return true;
    if (item.submenu) {
      return item.submenu.some(sub => isActive(sub.path));
    }
    return false;
  };

  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
      setMobileOpen(false);
    } else if (item.submenu) {
      toggleExpand(item.id);
    }
  };

  const filterByRole = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      if (item.role) {
        return user?.role === item.role || user?.role === 'superadmin';
      }
      return true;
    });
  };

  // Build navigation list
  const navItems = user?.role === 'superadmin'
    ? [superAdminNav, ...navigationConfig]
    : navigationConfig;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">AudiaPro</h1>
              <p className="text-xs text-gray-600 truncate">{user?.tenant?.company_name || 'Admin'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.has(item.id);
            const parentActive = isParentActive(item);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const filteredSubmenu = hasSubmenu ? filterByRole(item.submenu) : [];
            const showSubmenu = hasSubmenu && filteredSubmenu.length > 0;

            // Check role visibility for parent item
            if (item.role && user?.role !== item.role && user?.role !== 'superadmin') {
              return null;
            }

            return (
              <div key={item.id}>
                {/* Main Item */}
                <button
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    parentActive
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    parentActive && "text-primary-600"
                  )} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      {showSubmenu && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform flex-shrink-0",
                            isExpanded && "transform rotate-180"
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {!collapsed && showSubmenu && isExpanded && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                    {filteredSubmenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = isActive(subItem.path);

                      return (
                        <button
                          key={subItem.path}
                          onClick={() => {
                            navigate(subItem.path);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                            subActive
                              ? "bg-primary-100 text-primary-700 font-medium"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 text-left">{subItem.name}</span>
                          {subItem.badge && (
                            <Badge className="bg-error-100 text-error-700 text-xs">3</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                <Badge className="mt-1 text-xs capitalize">
                  {user?.role || 'user'}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2"
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
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex h-screen bg-white border-r border-gray-200 flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white shadow-md"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar (Drawer) */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col shadow-xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
