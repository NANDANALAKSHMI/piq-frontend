import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoginPage from '../pages/LoginPage.jsx';

// Pages are loaded on demand so the first screen stays fast.
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));
const JobsPage = lazy(() => import('../pages/JobsPage.jsx'));
const JobDetailPage = lazy(() => import('../pages/JobDetailPage.jsx'));
const AddJobPage = lazy(() => import('../pages/AddJobPage.jsx'));
const ClientsPage = lazy(() => import('../pages/ClientsPage.jsx'));
const AddClientPage = lazy(() => import('../pages/AddClientPage.jsx'));
const EnquiriesPage = lazy(() => import('../pages/EnquiriesPage.jsx'));
const UnitsPage = lazy(() => import('../pages/UnitsPage.jsx'));
const VendorsPage = lazy(() => import('../pages/VendorsPage.jsx'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage.jsx'));
const WorkflowsPage = lazy(() => import('../pages/WorkflowsPage.jsx'));
const TeamPage = lazy(() => import('../pages/TeamPage.jsx'));
const ReportsPage = lazy(() => import('../pages/ReportsPage.jsx'));
const SettingsPage = lazy(() => import('../pages/SettingsPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

function PageLoader() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading page">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

const page = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={page(DashboardPage)} />
        <Route path="jobs" element={page(JobsPage)} />
        <Route path="jobs/new" element={page(AddJobPage)} />
        <Route path="jobs/:jobId" element={page(JobDetailPage)} />
        <Route path="clients" element={page(ClientsPage)} />
        <Route path="clients/new" element={page(AddClientPage)} />
        <Route path="clients/:clientId" element={page(ClientsPage)} />
        <Route path="enquiries" element={page(EnquiriesPage)} />
        <Route path="units" element={page(UnitsPage)} />
        <Route path="vendors" element={page(VendorsPage)} />
        <Route path="categories" element={page(CategoriesPage)} />
        <Route path="workflows" element={page(WorkflowsPage)} />
        <Route path="team" element={page(TeamPage)} />
        <Route path="reports" element={page(ReportsPage)} />
        <Route path="settings" element={page(SettingsPage)} />
        <Route path="*" element={page(NotFoundPage)} />
      </Route>
    </Routes>
  );
}
