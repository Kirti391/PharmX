import { Link } from "react-router-dom";

/* =========================================================
   PHARMUNIS APP SHELL — NAVIGATION ITEM
========================================================= */

export function SidebarNavItem({
  item,
  active,
  collapsed,
  unread = 0,
  onNavigate,
}) {
  const Icon = item.icon;

  const showsBadge = item.badge === "notifications" && unread > 0;

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      data-active={active ? "true" : "false"}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={[
        "shell-nav-item group relative flex items-center rounded-xl",
        "font-nav text-[11.5px] tracking-[0.02em] transition-colors duration-200",
        collapsed
          ? "justify-center px-0 py-3"
          : "gap-3 pl-3.5 pr-3 py-2.5",
        active
          ? "bg-[#FDEBF4] text-[#D83F87]"
          : "text-[#2A1B3D]/62 hover:bg-[#FAF8FC] hover:text-[#2A1B3D]",
      ].join(" ")}
    >
      <Icon
        size={17}
        strokeWidth={active ? 1.9 : 1.5}
        className={[
          "shrink-0 transition-colors duration-200",
          active
            ? "text-[#D83F87]"
            : "text-[#9C94A8] group-hover:text-[#44318D]",
        ].join(" ")}
      />

      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      )}

      {!collapsed && showsBadge && (
        <span
          className="
            flex h-[19px] min-w-[19px] items-center justify-center
            rounded-full bg-[#E98074] px-1.5
            font-nav text-[9px] leading-none text-white
          "
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}

      {collapsed && showsBadge && (
        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#E98074]" />
      )}

      {collapsed && (
        <span
          className="
            pointer-events-none absolute left-[calc(100%+14px)] z-[120] hidden
            whitespace-nowrap rounded-lg bg-[#2A1B3D] px-3 py-2
            font-body text-[10px] text-white opacity-0 shadow-lg
            transition-opacity duration-150 group-hover:opacity-100 md:block
          "
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}
