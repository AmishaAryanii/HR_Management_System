import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import NotificationList from './components/notifications/NotificationList';


// Lazy load pages
import { lazy, Suspense } from 'react';
import LoadingSkeleton from './components/common/LoadingSkeleton';

const LoginSelect = lazy(() => import('./pages/auth/LoginSelect'));
const LoginAdmin = lazy(() => import('./pages/auth/LoginAdmin'));
const LoginManager = lazy(() => import('./pages/auth/LoginManager'));
const LoginEmployee = lazy(() => import('./pages/auth/LoginEmployee'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const ManagerDashboard = lazy(() => import('./pages/dashboard/ManagerDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/dashboard/EmployeeDashboard'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/employees/EmployeeForm'));
const EmployeeView = lazy(() => import('./pages/employees/EmployeeView'));
const DepartmentList = lazy(() => import('./pages/departments/DepartmentList'));
const DesignationList = lazy(() => import('./pages/designations/DesignationList'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const LeavePage = lazy(() => import('./pages/leaves/LeavePage'));
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage'));
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const PerformancePage = lazy(() => import('./pages/performance/PerformancePage'));
const TaskPage = lazy(() => import('./pages/tasks/TaskPage'));
const AnnouncementPage = lazy(() => import('./pages/announcements/AnnouncementPage'));
const DocumentPage = lazy(() => import('./pages/documents/DocumentPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const TimesheetPage = lazy(() => import('./pages/timesheets/TimesheetPage'));

function DashboardRedirect() {
  const { userRole, loading } = useAuth();
  if (loading) return <LoadingSkeleton />;
  switch (userRole) {
    case 'super_admin': return <SuperAdminDashboard />;
    case 'admin': return <AdminDashboard />;
    case 'manager': return <ManagerDashboard />;
    default: return <EmployeeDashboard />;
  }
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginSelect />} />
        <Route path="/login/admin" element={<LoginAdmin />} />
        <Route path="/login/manager" element={<LoginManager />} />
        <Route path="/login/employee" element={<LoginEmployee />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRedirect />} />

          <Route path="employees" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}><EmployeeList /></ProtectedRoute>} />
          <Route path="employees/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><EmployeeForm /></ProtectedRoute>} />
          <Route path="employees/:id/edit" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><EmployeeForm /></ProtectedRoute>} />
          <Route path="employees/:id" element={<EmployeeView />} />

          <Route path="departments" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><DepartmentList /></ProtectedRoute>} />
          <Route path="designations" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><DesignationList /></ProtectedRoute>} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<LeavePage />} />

          <Route path="payroll" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'employee']}><PayrollPage /></ProtectedRoute>} />
          <Route path="recruitment" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><RecruitmentPage /></ProtectedRoute>} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="tasks" element={<TaskPage />} />
          <Route path="announcements" element={<AnnouncementPage />} />
          <Route path="documents" element={<DocumentPage />} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}><ReportsPage /></ProtectedRoute>} />
          <Route path="timesheets" element={<ProtectedRoute><TimesheetPage /></ProtectedRoute>} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="notifications" element={<NotificationList />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
