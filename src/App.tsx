import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Layouts
import Layout from './components/layout/Layout';
import EmployeeLayout from './components/layout/EmployeeLayout';

// Pages - Auth
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Pages - Admin Dashboard
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminRoles from './pages/AdminRoles';

// Pages - Company Management
import Companies from './pages/Companies';
import EmployeesNew from './pages/EmployeesNew';

// Pages - Project Management
import ProjectProduction from './pages/ProjectProduction';
import ProjectStatistics from './pages/ProjectStatistics';

// Pages - Time Management
import Timesheets from './pages/Timesheets';
import TimesheetApprovals from './pages/TimesheetApprovals';
import TimesheetExport from './pages/TimesheetExport';

// Pages - Leave & Absence
import Leave from './pages/Leave';
import Absence from './pages/Absence';
import AdminLeaveApprovals from './pages/AdminLeaveApprovals';
import AdminAbsenceManagement from './pages/AdminAbsenceManagement';

// Pages - Expenses
import Expenses from './pages/Expenses';

// Pages - Payroll
import Payslips from './pages/Payslips';

// Pages - Invoicing
import InvoiceRelations from './pages/InvoiceRelations';
import OutgoingInvoices from './pages/OutgoingInvoices';
import IncomingInvoices from './pages/IncomingInvoices';

// Pages - Data & Files
import DriveFiles from './pages/DriveFiles';

// Pages - System
import Settings from './pages/Settings';
import AuditLogPage from './pages/AuditLog';

// Pages - Employee
import EmployeeDashboard from './pages/EmployeeDashboard';

/**
 * Route configuration for better maintainability
 */
const ADMIN_ROUTES = [
  { path: '/', element: Dashboard },
  { path: 'companies', element: Companies },
  { path: 'employees', element: EmployeesNew },
  { path: 'project-production', element: ProjectProduction },
  { path: 'project-statistics', element: ProjectStatistics },
  
  // Admin specific
  { path: 'admin/dashboard', element: AdminDashboard },
  { path: 'admin/users', element: AdminUsers },
  { path: 'admin/roles', element: AdminRoles },
  
  // Time Management
  { path: 'timesheets', element: Timesheets },
  { path: 'timesheet-approvals', element: TimesheetApprovals },
  
  // Leave & Absence
  { path: 'admin/leave-approvals', element: AdminLeaveApprovals },
  { path: 'admin/absence-management', element: AdminAbsenceManagement },
  
  // Invoicing
  { path: 'invoice-relations', element: InvoiceRelations },
  { path: 'outgoing-invoices', element: OutgoingInvoices },
  { path: 'incoming-invoices', element: IncomingInvoices },
  
  // Data & Files
  { path: 'timesheet-export', element: TimesheetExport },
  { path: 'drive-files', element: DriveFiles },
  
  // System
  { path: 'payslips', element: Payslips },
  { path: 'audit-log', element: AuditLogPage },
  { path: 'settings', element: Settings },
];

const MANAGER_ROUTES = [
  { path: '/', element: Dashboard },
  { path: 'employees', element: EmployeesNew },
  
  // Time Management
  { path: 'timesheets', element: Timesheets },
  { path: 'timesheet-approvals', element: TimesheetApprovals },
  
  // Leave & Absence
  { path: 'admin/leave-approvals', element: AdminLeaveApprovals },
  { path: 'admin/absence-management', element: AdminAbsenceManagement },
  
  // Data & Files
  { path: 'timesheet-export', element: TimesheetExport },
  
  // System
  { path: 'payslips', element: Payslips },
  { path: 'settings', element: Settings },
];

const EMPLOYEE_ROUTES = [
  { path: '/', element: EmployeeDashboard },
  { path: 'leave', element: Leave },
  { path: 'absence', element: Absence },
  { path: 'expenses', element: Expenses },
  { path: 'timesheets', element: Timesheets },
  { path: 'payslips', element: Payslips },
];

interface RouteConfig {
  path: string;
  element: React.ComponentType<any>;
}

/**
 * Render routes dynamically
 */
const RenderRoutes: React.FC<{ routes: RouteConfig[] }> = ({ routes }) => {
  return (
    <>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={<route.element />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </>
  );
};

/**
 * Admin Routes Component
 */
const AdminRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <RenderRoutes routes={ADMIN_ROUTES} />
      </Routes>
    </Layout>
  );
};

/**
 * Manager Routes Component
 */
const ManagerRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <RenderRoutes routes={MANAGER_ROUTES} />
      </Routes>
    </Layout>
  );
};

/**
 * Employee Routes Component
 */
const EmployeeRoutes: React.FC = () => {
  return (
    <EmployeeLayout>
      <Routes>
        <RenderRoutes routes={EMPLOYEE_ROUTES} />
      </Routes>
    </EmployeeLayout>
  );
};

/**
 * Main App Content - Routes based on user role
 */
const AppContent: React.FC = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/Logo.png" element={<Navigate to="/Logo.png" replace />} />
      <Route path="/Logo-groot.png" element={<Navigate to="/Logo-groot.png" replace />} />

      {/* Protected Routes - Based on User Role */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            {userRole === 'admin' && <AdminRoutes />}
            {userRole === 'manager' && <ManagerRoutes />}
            {userRole === 'employee' && (
              <Routes>
                <Route path="/" element={<Navigate to="/employee-dashboard" replace />} />
                <Route path="/employee-dashboard/*" element={<EmployeeRoutes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
            {!userRole && <LoadingSpinner />}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

/**
 * Root App Component
 */
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="App">
            <AppContent />
            <ToastContainer />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;