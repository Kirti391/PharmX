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
  ChevronRight,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { http } from "../../lib/api";
import { useRealtimeEvent } from "../../lib/socket";
import { ROLE_LABELS } from "../../lib/constants";
import logo from "../../assets/pharmunis logo.png";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: UserCircle,
  },
  {
    href: "/discover/companies",
    label: "Discover",
    icon: Search,
  },
  {
    href: "/opportunities",
    label: "Opportunities",
    icon: Briefcase,
  },
  {
    href: "/requirements",
    label: "Requirements",
    icon: ClipboardList,
  },
  {
    href: "/connections",
    label: "Connections",
    icon: Users,
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: CalendarClock,
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
  },
];

const ADMIN_NAV = [
  {
    href: "/admin/dashboard",
    label: "Overview & Analytics",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/verifications",
    label: "Verifications",
    icon: ShieldCheck,
  },
];

function initials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
      .then((list) => {
        setUnread(
          Array.isArray(list)
            ? list.filter((notification) => !notification.readAt).length
            : 0
        );
      })
      .catch(() => {});
  }, [location.pathname]);

  useRealtimeEvent("notification:new", () => {
    setUnread((count) => count + 1);
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function logout() {
    clear();
    navigate("/login");
  }

  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : NAV_ITEMS;

  function isActive(href) {
    if (href === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/"
      );
    }

    return location.pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#F8F7F9] text-[#2A1B3D]">
      {/* =====================================================
          MOBILE BACKDROP
          ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="
            fixed inset-0 z-40
            bg-[#2A1B3D]/55
            backdrop-blur-sm
            md:hidden
            pharmunis-fade-in
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col",
          "bg-[#2A1B3D] text-white",
          "shadow-[10px_0_45px_rgba(42,27,61,0.18)]",
          "transition-transform duration-300 ease-out",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* ===================================================
            BRAND
            =================================================== */}

        <div
          className="
            flex h-[78px] shrink-0
            items-center justify-between
            border-b border-white/10
            px-5
          "
        >
          <Link
            to={isAdmin ? "/admin/dashboard" : "/dashboard"}
            className="group flex min-w-0 items-center gap-3"
          >
            {/* PharmUnis Logo */}
            <div
              className="
                relative flex h-11 w-11 shrink-0
                items-center justify-center
                overflow-hidden rounded-xl
                bg-white
                p-1.5
                ring-1 ring-white/20
                transition-all duration-300
                group-hover:scale-105
                group-hover:ring-[#D83F87]/60
                group-hover:shadow-[0_0_28px_rgba(216,63,135,0.28)]
              "
            >
              <img
                src={logo}
                alt="PharmUnis"
                className="
                  h-full w-full
                  object-contain
                  transition-transform duration-300
                  group-hover:scale-110
                "
              />
            </div>

            <div className="min-w-0">
              <div
                className="
                  font-display
                  text-xl
                  font-semibold
                  tracking-wide
                  text-white
                  transition-colors duration-200
                  group-hover:text-[#E98074]
                "
              >
                PharmUnis
              </div>

              <div
                className="
                  mt-1 truncate
                  font-nav
                  text-[9px]
                  uppercase
                  tracking-[0.22em]
                  text-[#A4B3B6]/65
                "
              >
                Healthcare Network
              </div>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="
              rounded-xl p-2
              text-[#A4B3B6]
              transition-all duration-200
              hover:bg-white/10
              hover:text-white
              hover:rotate-90
              md:hidden
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION
            =================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div
            className="
              mb-3 px-3
              font-nav
              text-[10px]
              uppercase
              tracking-[0.22em]
              text-[#A4B3B6]/45
            "
          >
            Navigation
          </div>

          <div className="space-y-1.5">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={[
                    "pharmunis-nav-item",
                    "group",
                    "flex items-center gap-3",
                    "rounded-xl px-3.5 py-3",
                    "font-nav text-sm",
                    "pharmunis-fade-up",
                    active
                      ? "pharmunis-nav-item-active bg-[#D83F87] text-white shadow-[0_8px_28px_rgba(216,63,135,0.28)]"
                      : "text-[#A4B3B6] hover:bg-white/[0.07] hover:text-white",
                  ].join(" ")}
                  style={{
                    animationDelay: `${index * 35}ms`,
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.1 : 1.8}
                    className={[
                      "shrink-0 transition-all duration-200",
                      active
                        ? "text-white"
                        : "text-[#A4B3B6]/65 group-hover:scale-110 group-hover:text-[#E98074]",
                    ].join(" ")}
                  />

                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                  </span>

                  {/* Notification Count */}
                  {item.href === "/notifications" && unread > 0 && (
                    <span
                      className="
                        pharmunis-notification-pulse
                        flex min-w-[23px]
                        items-center justify-center
                        rounded-full
                        bg-[#E98074]
                        px-1.5 py-0.5
                        font-nav
                        text-[10px]
                        font-semibold
                        text-white
                      "
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}

                  {/* Active Indicator */}
                  {active && item.href !== "/notifications" && (
                    <ChevronRight
                      size={15}
                      className="
                        shrink-0
                        text-white/65
                        transition-transform duration-200
                        group-hover:translate-x-1
                      "
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ===================================================
            USER AREA
            =================================================== */}

        <div className="shrink-0 border-t border-white/10 p-4">
          <div
            className="
              mb-3
              flex items-center gap-3
              rounded-xl
              bg-white/[0.06]
              p-3
              ring-1 ring-white/[0.04]
              transition-all duration-200
              hover:bg-white/[0.09]
            "
          >
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                bg-[#44318D]
                font-nav
                text-sm
                font-semibold
                text-white
                shadow-[0_6px_18px_rgba(68,49,141,0.30)]
                transition-transform duration-200
                hover:scale-105
              "
            >
              {initials(user?.email)}
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  font-body
                  text-sm
                  font-medium
                  text-white
                "
              >
                {user?.email || "User"}
              </p>

              <p
                className="
                  mt-0.5 truncate
                  font-nav
                  text-[10px]
                  uppercase
                  tracking-wide
                  text-[#A4B3B6]
                "
              >
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="
              group
              flex w-full
              items-center gap-3
              rounded-xl
              px-3 py-2.5
              font-nav
              text-sm
              text-[#A4B3B6]
              transition-all duration-200
              hover:bg-white/[0.07]
              hover:text-white
            "
          >
            <LogOut
              size={17}
              strokeWidth={1.8}
              className="
                transition-transform duration-200
                group-hover:-translate-x-0.5
              "
            />

            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="min-h-screen md:pl-72">
        {/* ===================================================
            TOPBAR
            =================================================== */}

        <header
          className="
            sticky top-0 z-30
            h-[78px]
            border-b border-[#E9E6EC]
            bg-white/90
            backdrop-blur-xl
          "
        >
          <div
            className="
              flex h-full
              items-center justify-between
              px-4
              sm:px-6
              lg:px-8
            "
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-[#E9E6EC]
                  bg-white
                  text-[#2A1B3D]
                  shadow-sm
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-[#D83F87]
                  hover:text-[#D83F87]
                  hover:shadow-[0_8px_22px_rgba(216,63,135,0.12)]
                  md:hidden
                "
              >
                <Menu size={20} />
              </button>

              {/* Workspace Context */}
              <div className="hidden sm:block">
                <p
                  className="
                    font-nav
                    text-[10px]
                    uppercase
                    tracking-[0.22em]
                    text-[#A4B3B6]
                  "
                >
                  PharmUnis
                </p>

                <p
                  className="
                    mt-0.5
                    font-support
                    text-base
                    font-semibold
                    text-[#2A1B3D]
                  "
                >
                  {isAdmin
                    ? "Administration"
                    : "Pharmacy Workspace"}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <Link
                to="/discover/companies"
                className="
                  group
                  hidden h-10
                  items-center gap-2
                  rounded-xl
                  border border-[#E9E6EC]
                  bg-[#F8F7F9]
                  px-4
                  font-nav
                  text-xs
                  text-[#A4B3B6]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-[#D83F87]
                  hover:bg-white
                  hover:text-[#2A1B3D]
                  hover:shadow-[0_8px_22px_rgba(216,63,135,0.10)]
                  sm:flex
                "
              >
                <Search
                  size={16}
                  className="
                    transition-transform duration-200
                    group-hover:scale-110
                  "
                />

                <span>Search</span>
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="
                  group
                  relative
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-[#E9E6EC]
                  bg-[#F8F7F9]
                  text-[#2A1B3D]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-[#D83F87]
                  hover:bg-white
                  hover:text-[#D83F87]
                  hover:shadow-[0_8px_22px_rgba(216,63,135,0.10)]
                "
              >
                <Bell
                  size={18}
                  strokeWidth={1.8}
                  className="
                    transition-transform duration-300
                    group-hover:rotate-[-8deg]
                  "
                />

                {unread > 0 && (
                  <span
                    className="
                      pharmunis-notification-pulse
                      absolute
                      right-1.5
                      top-1.5
                      h-2.5
                      w-2.5
                      rounded-full
                      bg-[#D83F87]
                      ring-2
                      ring-[#F8F7F9]
                    "
                  />
                )}
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                className="
                  group
                  flex items-center gap-2
                  rounded-xl
                  border border-[#E9E6EC]
                  bg-[#F8F7F9]
                  px-2 py-1.5
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-[#D83F87]
                  hover:bg-white
                  hover:shadow-[0_8px_22px_rgba(216,63,135,0.10)]
                  sm:gap-3 sm:pr-3
                "
              >
                <div
                  className="
                    flex h-8 w-8
                    items-center justify-center
                    rounded-lg
                    bg-[#44318D]
                    font-nav
                    text-xs
                    font-semibold
                    text-white
                    transition-transform duration-200
                    group-hover:scale-105
                  "
                >
                  {initials(user?.email)}
                </div>

                <div className="hidden max-w-[160px] sm:block">
                  <p
                    className="
                      truncate
                      font-body
                      text-xs
                      font-semibold
                      text-[#2A1B3D]
                    "
                  >
                    {user?.email || "User"}
                  </p>

                  <p
                    className="
                      truncate
                      font-nav
                      text-[9px]
                      uppercase
                      tracking-wide
                      text-[#A4B3B6]
                    "
                  >
                    {ROLE_LABELS[user?.role] || user?.role}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
            =================================================== */}

        <main className="min-h-[calc(100vh-78px)] bg-[#F8F7F9]">
          <div
            className="
              mx-auto
              w-full
              max-w-[1600px]
              px-4 py-6
              sm:px-6 sm:py-7
              lg:px-8 lg:py-8
              xl:px-10
            "
          >
            <div className="pharmunis-fade-up">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}