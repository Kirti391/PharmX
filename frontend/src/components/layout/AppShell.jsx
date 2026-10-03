import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Bell,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { http } from "../../lib/api";
import { useRealtimeEvent } from "../../lib/socket";
import { ROLE_LABELS } from "../../lib/constants";
import logo from "../../assets/pharmunis logo.png";
import {
  getNavigationForRole,
  isNavigationActive,
  userInitials,
} from "./shellNavigation";

/* =========================================================
   APP SHELL
========================================================= */

export function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, clear } = useAuthStore();

  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * Desktop sidebar state.
   *
   * Expanded  = 250px
   * Collapsed = 76px
   */
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("pharmunis-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const isAdmin = user?.role === "ADMIN";
  const {
    primary: primaryItems,
    secondary: secondaryItems,
    workspaceLabel,
  } = getNavigationForRole(user?.role);

  /* =======================================================
     PERSIST SIDEBAR STATE
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "pharmunis-sidebar-collapsed",
        String(collapsed)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [collapsed]);

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  useEffect(() => {
    http
      .get("/notifications")
      .then((list) => {
        setUnread(
          Array.isArray(list)
            ? list.filter(
                (notification) => !notification.readAt
              ).length
            : 0
        );
      })
      .catch(() => {});
  }, [location.pathname]);

  useRealtimeEvent("notification:new", () => {
    setUnread((count) => count + 1);
  });

  /* =======================================================
     CLOSE MOBILE NAV ON ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

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

  /* =======================================================
     LOGOUT
  ======================================================= */

  function logout() {
    clear();
    navigate("/login");
  }

  /* =======================================================
     ACTIVE ROUTE
  ======================================================= */

  function isActive(href) {
    const item = [...primaryItems, ...secondaryItems].find(
      (navigationItem) => navigationItem.href === href
    );
    return item ? isNavigationActive(location.pathname, item) : false;
  }

  /* =======================================================
     TOGGLE SIDEBAR
  ======================================================= */

  function toggleSidebar() {
    setCollapsed((value) => !value);
  }

  /* =======================================================
     NAV ITEM
  ======================================================= */

  function NavItem({ item }) {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        to={item.href}
        title={collapsed ? item.label : undefined}
        className={[
          "group relative flex items-center rounded-lg transition-all duration-200",
          collapsed
            ? "justify-center px-0 py-3"
            : "gap-3 px-3 py-2.5",
          "font-[Fauna_One] text-[11px]",
          active
            ? "bg-[#FBEAF2] text-[#D83F87]"
            : "text-[#2A1B3D]/55 hover:bg-white hover:text-[#2A1B3D]",
        ].join(" ")}
      >
        {/* Active line */}

        {active && (
          <span
            className={[
              "absolute rounded-full bg-[#D83F87]",
              collapsed
                ? "left-1 top-2 bottom-2 w-[2px]"
                : "left-0 top-2 bottom-2 w-[2px]",
            ].join(" ")}
          />
        )}

        {/* Icon */}

        <Icon
          size={17}
          strokeWidth={active ? 2 : 1.6}
          className={[
            "shrink-0 transition-colors duration-200",
            active
              ? "text-[#D83F87]"
              : "text-[#A4B3B6] group-hover:text-[#44318D]",
          ].join(" ")}
        />

        {/* Label */}

        {!collapsed && (
          <span className="min-w-0 flex-1 truncate">
            {item.label}
          </span>
        )}

        {/* Notification badge */}

        {!collapsed &&
          item.href === "/notifications" &&
          unread > 0 && (
            <span
              className="
                flex
                h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                bg-[#E98074]
                px-1
                font-[Unica_One]
                text-[8px]
                text-white
              "
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}

        {/* Collapsed notification dot */}

        {collapsed &&
          item.href === "/notifications" &&
          unread > 0 && (
            <span
              className="
                absolute
                right-2
                top-2
                h-2
                w-2
                rounded-full
                bg-[#E98074]
              "
            />
          )}

        {/* Collapsed tooltip */}

        {collapsed && (
          <span
            className="
              pointer-events-none
              absolute
              left-[calc(100%+12px)]
              z-[100]
              hidden
              whitespace-nowrap
              rounded-md
              bg-[#2A1B3D]
              px-3
              py-2
              font-[Fauna_One]
              text-[10px]
              text-white
              opacity-0
              shadow-lg
              transition-opacity
              duration-150
              group-hover:opacity-100
              md:block
            "
          >
            {item.label}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF8] text-[#2A1B3D]">
      {/* ===================================================
          MOBILE BACKDROP
      =================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-[#2A1B3D]/25
            backdrop-blur-[2px]
            md:hidden
          "
        />
      )}

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-[#E8E3E6] bg-[#FCFAF8]",
          "transition-[width,transform] duration-300 ease-out",
          collapsed ? "md:w-[76px]" : "md:w-[250px]",
          "w-[250px]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* =================================================
            BRAND
        ================================================= */}

        <div
          className={[
            "shrink-0 transition-all duration-300",
            collapsed
              ? "px-3 pt-7 pb-6"
              : "px-7 pt-8 pb-7",
          ].join(" ")}
        >
          <Link
            to={isAdmin ? "/admin/dashboard" : "/dashboard"}
            className={[
              "group flex items-center",
              collapsed
                ? "justify-center"
                : "gap-3",
            ].join(" ")}
          >
            {/* Logo */}

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
              "
            >
              <img
                src={logo}
                alt="PharmUnis"
                className="
                  h-full
                  w-full
                  object-contain
                  transition-transform
                  duration-300
                  group-hover:scale-105
                "
              />
            </div>

            {/* Brand text */}

            {!collapsed && (
              <div className="min-w-0">
                <div
                  className="
                    whitespace-nowrap
                    font-[Cinzel]
                    text-[20px]
                    font-semibold
                    tracking-wide
                    text-[#2A1B3D]
                  "
                >
                  Pharm
                  <span className="text-[#D83F87]">
                    Unis
                  </span>
                </div>

                <div
                  className="
                    mt-0.5
                    whitespace-nowrap
                    font-[Unica_One]
                    text-[8px]
                    uppercase
                    tracking-[0.24em]
                    text-[#A4B3B6]
                  "
                >
                  Healthcare Network
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* =================================================
            WORKSPACE IDENTITY
        ================================================= */}

        {!isAdmin && !collapsed && (
          <div className="px-6 pb-7">
            <div
              className="
                border-b
                border-[#E8E3E6]
                pb-6
              "
            >
              <p
                className="
                  font-[Unica_One]
                  text-[9px]
                  uppercase
                  tracking-[0.22em]
                  text-[#A4B3B6]
                "
              >
                Workspace
              </p>

              <p
                className="
                  mt-2
                  font-[Philosopher]
                  text-[17px]
                  font-semibold
                  text-[#2A1B3D]
                "
              >
                {workspaceLabel}
              </p>

              <p
                className="
                  mt-1
                  truncate
                  font-[Fauna_One]
                  text-[10px]
                  text-[#A4B3B6]
                "
              >
                {user?.email || "Your pharmacy"}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            COLLAPSED WORKSPACE DIVIDER
        ================================================= */}

        {!isAdmin && collapsed && (
          <div className="mx-4 mb-5 h-px bg-[#E8E3E6]" />
        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className={[
            "flex-1 overflow-y-auto",
            collapsed ? "px-3" : "px-5",
          ].join(" ")}
        >
          {/* Section label */}

          {!collapsed && (
            <p
              className="
                mb-3
                px-3
                font-[Unica_One]
                text-[9px]
                uppercase
                tracking-[0.22em]
                text-[#A4B3B6]
              "
            >
              {isAdmin ? "Administration" : "Workspace"}
            </p>
          )}

          {/* Main navigation */}

          <div className="space-y-1">
            {primaryItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
              />
            ))}
          </div>

          {/* =================================================
              PERSONAL SECTION
          ================================================= */}

          {!isAdmin && (
            <>
              <div
                className={[
                  "h-px bg-[#E8E3E6]",
                  collapsed
                    ? "my-5"
                    : "my-7",
                ].join(" ")}
              />

              {!collapsed && (
                <p
                  className="
                    mb-3
                    px-3
                    font-[Unica_One]
                    text-[9px]
                    uppercase
                    tracking-[0.22em]
                    text-[#A4B3B6]
                  "
                >
                  Personal
                </p>
              )}

              <div className="space-y-1">
                {secondaryItems.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* =================================================
            USER / LOGOUT
        ================================================= */}

        <div
          className={[
            "shrink-0",
            collapsed
              ? "px-3 pb-5 pt-4"
              : "px-6 pb-6 pt-5",
          ].join(" ")}
        >
          <div
            className={[
              "border-t border-[#E8E3E6]",
              collapsed ? "pt-4" : "pt-5",
            ].join(" ")}
          >
            {/* User */}

            <Link
              to={isAdmin ? "/admin/dashboard" : "/profile"}
              title={
                collapsed
                  ? isAdmin
                    ? "Administration"
                    : user?.email || "Profile"
                  : undefined
              }
              className={[
                "group flex items-center rounded-xl transition-colors duration-200 hover:bg-white",
                collapsed
                  ? "justify-center px-1 py-2"
                  : "gap-3 px-2 py-2",
              ].join(" ")}
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#44318D]
                  font-[Unica_One]
                  text-[10px]
                  text-white
                "
              >
                {userInitials(user?.name || user?.email)}
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate
                      font-[Fauna_One]
                      text-[10px]
                      font-semibold
                      text-[#2A1B3D]
                    "
                  >
                    {user?.email || "User"}
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      font-[Unica_One]
                      text-[8px]
                      uppercase
                      tracking-[0.12em]
                      text-[#A4B3B6]
                    "
                  >
                    {ROLE_LABELS[user?.role] ||
                      user?.role}
                  </p>
                </div>
              )}
            </Link>

            {/* Logout */}

            <button
              type="button"
              onClick={logout}
              title={collapsed ? "Log out" : undefined}
              className={[
                "group mt-3 flex font-[Unica_One] text-[9px] uppercase tracking-[0.14em] text-[#A4B3B6] transition-colors duration-200 hover:text-[#D83F87]",
                collapsed
                  ? "w-full justify-center px-2"
                  : "w-full items-center gap-2 px-2",
              ].join(" ")}
            >
              <LogOut
                size={14}
                strokeWidth={1.6}
              />

              {!collapsed && <span>Log out</span>}

              {collapsed && (
                <span
                  className="
                    pointer-events-none
                    absolute
                    left-[88px]
                    hidden
                    whitespace-nowrap
                    rounded-md
                    bg-[#2A1B3D]
                    px-3
                    py-2
                    font-[Fauna_One]
                    text-[10px]
                    normal-case
                    tracking-normal
                    text-white
                    opacity-0
                    shadow-lg
                    transition-opacity
                    duration-150
                    group-hover:opacity-100
                    md:block
                  "
                >
                  Log out
                </span>
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            DESKTOP COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className={[
            "absolute -right-3 top-[92px] z-50",
            "hidden h-7 w-7 items-center justify-center",
            "rounded-full border border-[#E8E3E6]",
            "bg-[#FCFAF8] text-[#A4B3B6]",
            "shadow-[0_2px_8px_rgba(42,27,61,0.06)]",
            "transition-all duration-200",
            "hover:border-[#D83F87]/30",
            "hover:bg-white",
            "hover:text-[#D83F87]",
            "md:flex",
          ].join(" ")}
        >
          {collapsed ? (
            <PanelLeftOpen
              size={13}
              strokeWidth={1.7}
            />
          ) : (
            <PanelLeftClose
              size={13}
              strokeWidth={1.7}
            />
          )}
        </button>

        {/* =================================================
            MOBILE CLOSE
        ================================================= */}

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="
            absolute
            right-4
            top-5
            rounded-full
            p-2
            text-[#A4B3B6]
            transition-colors
            hover:bg-white
            hover:text-[#D83F87]
            md:hidden
          "
        >
          <X size={18} />
        </button>
      </aside>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div
        className={[
          "min-h-screen transition-[padding] duration-300 ease-out",
          collapsed
            ? "md:pl-[76px]"
            : "md:pl-[250px]",
        ].join(" ")}
      >
        {/* =================================================
            MOBILE HEADER
        ================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            flex
            h-[62px]
            items-center
            justify-between
            border-b
            border-[#E8E3E6]
            bg-[#FCFAF8]/95
            px-4
            backdrop-blur-md
            md:hidden
          "
        >
          {/* Menu */}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-[#2A1B3D]
              transition-colors
              hover:bg-white
              hover:text-[#D83F87]
            "
          >
            <Menu size={20} />
          </button>

          {/* Mobile brand */}

          <Link
            to={isAdmin ? "/admin/dashboard" : "/dashboard"}
            className="
              font-[Cinzel]
              text-[18px]
              font-semibold
              tracking-wide
              text-[#2A1B3D]
            "
          >
            Pharm
            <span className="text-[#D83F87]">
              Unis
            </span>
          </Link>

          {/* Notifications */}

          <Link
            to="/notifications"
            aria-label="Notifications"
            className="
              relative
              p-2
              text-[#2A1B3D]
              transition-colors
              hover:text-[#D83F87]
            "
          >
            <Bell
              size={18}
              strokeWidth={1.7}
            />

            {unread > 0 && (
              <span
                className="
                  absolute
                  right-1
                  top-1
                  h-2
                  w-2
                  rounded-full
                  bg-[#D83F87]
                "
              />
            )}
          </Link>
        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="min-h-screen bg-[#FCFAF8]">
          {children}
        </main>
      </div>
    </div>
  );
}