import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import HomePage from "../pages/public/HomePage";

import Register from "../pages/auth/Register";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ChangePassword from "../pages/auth/ChangePassword";

import AppLayout from "../components/layout/AppLayout";

import SuperAdminDashboard from "../pages/superadmin/SuperAdminDashboard";
import AdminManagement from "../pages/superadmin/AdminManagement";

import AdminDashboard from "../pages/admin/AdminDashboard";
import BranchManagement from "../pages/admin/BranchManagement";
import EmployeeManagement from "../pages/admin/EmployeeManagement";

import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerApproval from "../pages/manager/ManagerApproval";
import ManagerTasks from "../pages/manager/ManagerTasks";
import ManagerRiskReports from "../pages/manager/ManagerRiskReports";

import LoanOfficerQueue from "../pages/loanofficer/LoanOfficerQueue";

import RiskOfficerReview from "../pages/riskofficer/RiskOfficerReview";
import RiskReports from "../pages/riskofficer/RiskReports";

import CustomerApplyPage from "../pages/customer/CustomerApplyPage";
import CustomerStatusPage from "../pages/customer/CustomerStatusPage";

import MyProfile from "../pages/profile/MyProfile";

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.must_change_password === "Yes") {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return children;
  }

  if (currentUser.must_change_password === "Yes") {
    return <Navigate to="/change-password" replace />;
  }

  const routes = {
    SUPER_ADMIN: "/super-admin/dashboard",
    ADMIN: "/admin/dashboard",
    BANK_MANAGER: "/manager/dashboard",
    LOAN_OFFICER: "/loan-officer/queue",
    RISK_OFFICER: "/risk-officer/review",
    CUSTOMER: "/customer/apply"
  };

  return <Navigate to={routes[currentUser.role] || "/"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <HomePage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />

      <Route path="/change-password" element={<ChangePassword />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MyProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <AppLayout>
              <SuperAdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/admins"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <AppLayout>
              <AdminManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/branches"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AppLayout>
              <BranchManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AppLayout>
              <EmployeeManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["BANK_MANAGER"]}>
            <AppLayout>
              <ManagerDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/approvals"
        element={
          <ProtectedRoute allowedRoles={["BANK_MANAGER"]}>
            <AppLayout>
              <ManagerApproval />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/tasks"
        element={
          <ProtectedRoute allowedRoles={["BANK_MANAGER", "ADMIN", "SUPER_ADMIN"]}>
            <AppLayout>
              <ManagerTasks />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/risk-reports"
        element={
          <ProtectedRoute allowedRoles={["BANK_MANAGER", "ADMIN", "SUPER_ADMIN"]}>
            <AppLayout>
              <ManagerRiskReports />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/loan-officer/queue"
        element={
          <ProtectedRoute allowedRoles={["LOAN_OFFICER"]}>
            <AppLayout>
              <LoanOfficerQueue />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk-officer/review"
        element={
          <ProtectedRoute allowedRoles={["RISK_OFFICER"]}>
            <AppLayout>
              <RiskOfficerReview />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk-officer/reports"
        element={
          <ProtectedRoute allowedRoles={["RISK_OFFICER"]}>
            <AppLayout>
              <RiskReports />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/apply"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <AppLayout>
              <CustomerApplyPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/status"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <AppLayout>
              <CustomerStatusPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;