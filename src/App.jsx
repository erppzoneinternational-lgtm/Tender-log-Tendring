import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, goToPortalLogin, useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { RibbonLoader } from '@/components/ui/RibbonLoader';
import { Dashboard } from '@/pages/Dashboard';
import { Tenders } from '@/pages/Tenders';
import { TenderNew } from '@/pages/TenderNew';
import { TenderDetail } from '@/pages/TenderDetail';
import { Board } from '@/pages/Board';
import { ExecutiveDashboard } from '@/pages/ExecutiveDashboard';
import { PeriodReports } from '@/pages/PeriodReports';
import { Notifications } from '@/pages/Notifications';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { UsersAdmin } from '@/pages/admin/UsersAdmin';
import { LookupsAdmin } from '@/pages/admin/LookupsAdmin';
import { RatesAdmin } from '@/pages/admin/RatesAdmin';
import { AuditAdmin } from '@/pages/admin/AuditAdmin';
import { ErpWorkspacePage } from '@/pages/ErpWorkspacePage';
import {
  canCreateTender,
  canEditModule,
  canManageAdmin,
  canManageFxAndCatalog,
  canViewModule,
} from '@/lib/permissions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function LoginRedirect() {
  React.useEffect(() => {
    goToPortalLogin();
  }, []);
  return null;
}

function ProtectedRoutes() {
  const { user, loading } = useApp();
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RibbonLoader size="lg" />
      </div>
    );
  }
  return <AppLayout />;
}

function AdminRouteGuard({ children }) {
  const { user } = useApp();
  if (!user || !canManageAdmin(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AdminOrFxRouteGuard({ children }) {
  const { user } = useApp();
  if (!user || (!canManageAdmin(user.role) && !canManageFxAndCatalog(user))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function CreateTenderRouteGuard({ children }) {
  const { user } = useApp();
  if (!user || (!canCreateTender(user.role) && !canEditModule(user, 'tender_log'))) {
    return <Navigate to="/tenders" replace />;
  }
  return <>{children}</>;
}

function ModuleRouteGuard({ moduleKey, fallback = '/', children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (canViewModule(user, moduleKey)) {
    return <>{children}</>;
  }
  return <Navigate to={fallback} replace />;
}

function resolveFirstAllowedErpPath(user) {
  if (!user) return '/login';
  if (canViewModule(user, 'erp_geometry')) return '/erp/water-features';
  if (canViewModule(user, 'erp_civil')) return '/erp/structural-works';
  if (canViewModule(user, 'erp_mep')) return '/erp/wf-electromechanical';
  if (canViewModule(user, 'erp_overheads')) return '/erp/commercial-bid';
  if (canViewModule(user, 'catalog_fx')) return '/erp/database';
  return '/tenders';
}

function ErpRootRedirect() {
  const { user } = useApp();
  return <Navigate to={resolveFirstAllowedErpPath(user)} replace />;
}

function LegacyDatabaseRedirect() {
  const location = useLocation();
  return <Navigate to={`/erp${location.pathname}${location.search}`} replace />;
}

function ErpStepRouteGuard({ moduleKey, children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (canViewModule(user, moduleKey)) {
    return <>{children}</>;
  }
  return <Navigate to={resolveFirstAllowedErpPath(user)} replace />;
}

function AppRoutes() {
  const { user } = useApp();

  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />

      <Route element={<ProtectedRoutes />}>
        {/* PZ.Tender Log Core Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/tenders" element={<Tenders />} />
        <Route
          path="/tenders/new"
          element={
            <CreateTenderRouteGuard>
              <TenderNew />
            </CreateTenderRouteGuard>
          }
        />
        <Route path="/tenders/:id" element={<TenderDetail />} />
        <Route
          path="/board"
          element={
            <ModuleRouteGuard moduleKey="kanban_team" fallback="/tenders">
              <Board />
            </ModuleRouteGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ModuleRouteGuard moduleKey="analytics_reports" fallback="/">
              <ExecutiveDashboard />
            </ModuleRouteGuard>
          }
        />
        <Route
          path="/reports"
          element={
            <ModuleRouteGuard moduleKey="analytics_reports" fallback="/">
              <PeriodReports />
            </ModuleRouteGuard>
          }
        />
        <Route path="/notifications" element={<Notifications />} />

        {/* Intelligent Tendering ERP Integrated Routes */}
        <Route path="/erp" element={<ErpRootRedirect />} />
        <Route
          path="/erp/water-features"
          element={
            <ErpStepRouteGuard moduleKey="erp_geometry">
              <ErpWorkspacePage activeStep="water-features" />
            </ErpStepRouteGuard>
          }
        />
        <Route
          path="/erp/structural-works"
          element={
            <ErpStepRouteGuard moduleKey="erp_civil">
              <ErpWorkspacePage activeStep="structural-works" />
            </ErpStepRouteGuard>
          }
        />
        <Route
          path="/erp/wf-electromechanical"
          element={
            <ErpStepRouteGuard moduleKey="erp_mep">
              <ErpWorkspacePage activeStep="wf-electromechanical" />
            </ErpStepRouteGuard>
          }
        />
        <Route
          path="/erp/commercial-bid"
          element={
            <ErpStepRouteGuard moduleKey="erp_overheads">
              <ErpWorkspacePage activeStep="commercial-bid" />
            </ErpStepRouteGuard>
          }
        />
        <Route
          path="/erp/proposals"
          element={
            <ErpStepRouteGuard moduleKey="erp_geometry">
              <ErpWorkspacePage activeStep="proposals" />
            </ErpStepRouteGuard>
          }
        />
        <Route
          path="/erp/database/*"
          element={
            <ErpStepRouteGuard moduleKey="catalog_fx">
              <ErpWorkspacePage activeStep="database" />
            </ErpStepRouteGuard>
          }
        />

        {/* Legacy ERP Direct URL Aliases */}
        <Route
          path="/water-features"
          element={<Navigate to="/erp/water-features" replace />}
        />
        <Route
          path="/structural-works"
          element={<Navigate to="/erp/structural-works" replace />}
        />
        <Route
          path="/wf-electromechanical"
          element={<Navigate to="/erp/wf-electromechanical" replace />}
        />
        <Route
          path="/commercial-bid"
          element={<Navigate to="/erp/commercial-bid" replace />}
        />
        <Route
          path="/database/*"
          element={<LegacyDatabaseRedirect />}
        />

        {/* Admin & Lookups Console Routes */}
        <Route
          path="/admin"
          element={
            <AdminOrFxRouteGuard>
              <AdminLayout />
            </AdminOrFxRouteGuard>
          }
        >
          <Route
            index
            element={
              user && canManageAdmin(user.role) ? (
                <Navigate to="/admin/users" replace />
              ) : (
                <Navigate to="/admin/rates" replace />
              )
            }
          />
          <Route
            path="users"
            element={
              <AdminRouteGuard>
                <UsersAdmin />
              </AdminRouteGuard>
            }
          />
          <Route
            path="lookups"
            element={
              <AdminRouteGuard>
                <LookupsAdmin />
              </AdminRouteGuard>
            }
          />
          <Route path="rates" element={<RatesAdmin />} />
          <Route
            path="audit"
            element={
              <AdminRouteGuard>
                <AuditAdmin />
              </AdminRouteGuard>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
