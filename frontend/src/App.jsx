import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Marketing Pages
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import BookDemo from './pages/BookDemo';
import HowItWorks from './pages/HowItWorks';
import Integrations from './pages/Integrations';
import Contact from './pages/Contact';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';

// App Pages
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SetupRequest from './pages/SetupRequest';
import CallDetail from './pages/CallDetailEnhanced';
import AdminSetupRequests from './pages/AdminSetupRequests';
import Notifications from './pages/Notifications';
import ActivityLogs from './pages/ActivityLogs';
import UserManagement from './pages/UserManagement';
import IntegrationsPanel from './pages/IntegrationsPanel';
import TenantsPage from './pages/TenantsPage';
import CreateTenantPage from './pages/CreateTenantPage';
import TenantDetailPage from './pages/TenantDetailPage';
import TeamPerformance from './pages/TeamPerformance';
import OnboardingWizard from './pages/OnboardingWizard';
import UsageAnalytics from './pages/UsageAnalytics';
import SubscriptionManagement from './pages/SubscriptionManagement';
import APIManagement from './pages/APIManagement';
import AdvancedReporting from './pages/AdvancedReporting';
import ComplianceDashboard from './pages/ComplianceDashboard';
import TeamManagementEnhanced from './pages/TeamManagementEnhanced';
import PromptCustomization from './pages/PromptCustomization';
import PromptCopilot from './pages/PromptCopilot';
import PromptScenarios from './pages/PromptScenarios';
import PromptPerformance from './pages/PromptPerformance';
import PromptSettings from './pages/PromptSettings';

// Super Admin Pages
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantList from './pages/TenantList';
import TenantCreate from './pages/TenantCreate';
import TenantDetail from './pages/TenantDetail';
import RevenueDashboard from './pages/RevenueDashboard';
import PlansManagement from './pages/PlansManagement';
import RevenueAnalytics from './pages/RevenueAnalytics';
import CostTracking from './pages/CostTracking';
import SystemMonitoring from './pages/SystemMonitoring';
import FeatureFlagsManagement from './pages/FeatureFlagsManagement';
import SystemAlerts from './pages/SystemAlerts';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Marketing Pages (Public - No Auth Required) */}
      <Route path="/" element={<Home />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/book-demo" element={<BookDemo />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/platform-integrations" element={<Integrations />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth Routes (Public - Redirect if Logged In) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route path="/setup-request" element={<SetupRequest />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/call/:callId"
        element={
          <ProtectedRoute>
            <CallDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/setup-requests"
        element={
          <ProtectedRoute>
            <AdminSetupRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute>
            <ActivityLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ProtectedRoute>
            <IntegrationsPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRoute>
            <TenantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/create"
        element={
          <ProtectedRoute>
            <CreateTenantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/:tenantId"
        element={
          <ProtectedRoute>
            <TenantDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-performance"
        element={
          <ProtectedRoute>
            <TeamPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usage-analytics"
        element={
          <ProtectedRoute>
            <UsageAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-management"
        element={
          <ProtectedRoute>
            <APIManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advanced-reporting"
        element={
          <ProtectedRoute>
            <AdvancedReporting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute>
            <ComplianceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-management"
        element={
          <ProtectedRoute>
            <TeamManagementEnhanced />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prompt-customization"
        element={
          <ProtectedRoute>
            <PromptCustomization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prompts/copilot"
        element={
          <ProtectedRoute>
            <PromptCopilot />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prompts/scenarios"
        element={
          <ProtectedRoute>
            <PromptScenarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prompts/performance"
        element={
          <ProtectedRoute>
            <PromptPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prompts/settings"
        element={
          <ProtectedRoute>
            <PromptSettings />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Routes (manage their own auth) */}
      <Route path="/superadmin/login" element={<SuperAdminLogin />} />
      <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/superadmin/tenants" element={<TenantList />} />
      <Route path="/superadmin/tenants/create" element={<TenantCreate />} />
      <Route path="/superadmin/tenants/:tenantId" element={<TenantDetail />} />
      <Route path="/superadmin/revenue" element={<RevenueDashboard />} />
      <Route path="/superadmin/plans" element={<PlansManagement />} />
      <Route path="/superadmin/costs" element={<CostTracking />} />
      <Route path="/superadmin/monitoring" element={<SystemMonitoring />} />
      <Route path="/superadmin/feature-flags" element={<FeatureFlagsManagement />} />
      <Route path="/superadmin/alerts" element={<SystemAlerts />} />

      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
