import { Link } from "react-router-dom";
import { AppShell } from "./AppShell";
import { useAuthGuard } from "../../lib/useAuthGuard";
import { Loader } from "../ui";

export function ProtectedLayout({ children, adminOnly = false }) {
  const { user, loading } = useAuthGuard();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC]">
        <Loader />
      </div>
    );
  }

  if (adminOnly && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] text-taupedark">
        You don't have access to this page.
      </div>
    );
  }

  return (
    <AppShell>
      {user.status === "PENDING_VERIFICATION" && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center justify-between">
          <span>Your account is pending business verification. Some trust badges are limited until an admin approves your documents.</span>
          <Link to="/verification" className="font-medium underline shrink-0 ml-4">
            Upload documents
          </Link>
        </div>
      )}
      {user.status === "SUSPENDED" && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          Your account has been suspended. Contact support for more information.
        </div>
      )}
      {children}
    </AppShell>
  );
}
