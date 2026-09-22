import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UserCircle,
  Search,
  Briefcase,
  ClipboardList,
  Users,
  CalendarClock,
  MessageSquare,
  Bell,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Pill,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { http } from "../../lib/api";
import { useRealtimeEvent } from "../../lib/socket";
import { ROLE_LABELS } from "../../lib/constants";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/discover/companies", label: "Discover", icon: Search },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/connections", label: "Connections", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Overview & Analytics", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
];

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clear } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    http
      .get("/notifications")
      .then((list) => setUnread(list.filter((n) => !n.readAt).length))
      .catch(() => {});
  }, [location.pathname]);

  useRealtimeEvent("notification:new", () => setUnread((c) => c + 1));

  function logout() {
    clear();
    navigate("/login");
  }

  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : NAV_ITEMS;

  return (
    <div className="min-h-screen flex bg-[#F4F1EC]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-navy text-white/90 fixed inset-y-0">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sage flex items-center justify-center">
            <Pill className="text-navy" size={20} />
          </div>
          <span className="font-display font-bold text-lg text-white">PharmX</span>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
                {item.href === "/notifications" && unread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-tealdeep flex items-center justify-center text-sm font-semibold">
              {initials(user?.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-white/50">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-navy text-white flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-sage flex items-center justify-center">
            <Pill className="text-navy" size={16} />
          </div>
          <span className="font-display font-bold">PharmX</span>
        </div>
        <button onClick={() => setMobileOpen((o) => !o)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed top-12 inset-x-0 z-20 bg-navy text-white/90 px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <button onClick={logout} className="flex items-center gap-2 text-sm text-white/70 px-3 py-2">
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}

      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
