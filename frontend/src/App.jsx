import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupRoleSelectPage from "./pages/SignupRoleSelectPage";
import SignupFormPage from "./pages/SignupFormPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverCompaniesPage from "./pages/DiscoverCompaniesPage";
import DiscoverMRsPage from "./pages/DiscoverMRsPage";
import DiscoverPharmaciesPage from "./pages/DiscoverPharmaciesPage";
import DiscoverStockistsPage from "./pages/DiscoverStockistsPage";
import RequirementsPage from "./pages/RequirementsPage";
import RequirementCreatePage from "./pages/RequirementCreatePage";
import RequirementDetailPage from "./pages/RequirementDetailPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import OpportunityCreatePage from "./pages/OpportunityCreatePage";
import OpportunityDetailPage from "./pages/OpportunityDetailPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import MessagesPage from "./pages/MessagesPage";
import ConversationPage from "./pages/ConversationPage";
import NotificationsPage from "./pages/NotificationsPage";
import VerificationPage from "./pages/VerificationPage";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminVerificationsPage from "./pages/AdminVerificationsPage";

function Protected({ children, adminOnly }) {
  return <ProtectedLayout adminOnly={adminOnly}>{children}</ProtectedLayout>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupRoleSelectPage />} />
      <Route path="/signup/:role" element={<SignupFormPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Authenticated app */}
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/discover/companies" element={<Protected><DiscoverCompaniesPage /></Protected>} />
      <Route path="/discover/mrs" element={<Protected><DiscoverMRsPage /></Protected>} />
      <Route path="/discover/pharmacies" element={<Protected><DiscoverPharmaciesPage /></Protected>} />
      <Route path="/discover/stockists" element={<Protected><DiscoverStockistsPage /></Protected>} />
      <Route path="/requirements" element={<Protected><RequirementsPage /></Protected>} />
      <Route path="/requirements/create" element={<Protected><RequirementCreatePage /></Protected>} />
      <Route path="/requirements/:id" element={<Protected><RequirementDetailPage /></Protected>} />
      <Route path="/opportunities" element={<Protected><OpportunitiesPage /></Protected>} />
      <Route path="/opportunities/create" element={<Protected><OpportunityCreatePage /></Protected>} />
      <Route path="/opportunities/:id" element={<Protected><OpportunityDetailPage /></Protected>} />
      <Route path="/connections" element={<Protected><ConnectionsPage /></Protected>} />
      <Route path="/appointments" element={<Protected><AppointmentsPage /></Protected>} />
      <Route path="/appointments/:id" element={<Protected><AppointmentDetailPage /></Protected>} />
      <Route path="/messages" element={<Protected><MessagesPage /></Protected>} />
      <Route path="/messages/:conversationId" element={<Protected><ConversationPage /></Protected>} />
      <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
      <Route path="/verification" element={<Protected><VerificationPage /></Protected>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<Protected adminOnly><AdminDashboardPage /></Protected>} />
      <Route path="/admin/users" element={<Protected adminOnly><AdminUsersPage /></Protected>} />
      <Route path="/admin/verifications" element={<Protected adminOnly><AdminVerificationsPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
