import { Link } from "react-router-dom";
import { BadgeCheck, Bell, Plus, ShieldCheck } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { Eyebrow } from "./DashboardPrimitives";

/* =========================================================
   PHARMUNIS — DASHBOARD HERO
   Editorial greeting, live workspace summary and actions.
========================================================= */

export function DashboardHero({
  pharmacyName,
  summary,
  hasUnread = false,
  verified = false,
  verificationStatus,
  workspaceLabel = "Pharmacy workspace",
  actionHref = "/requirements/create",
  actionLabel = "New requirement",
  actionIcon: ActionIcon = Plus,
}) {
  const status = String(verificationStatus || "").toUpperCase();
  const verificationStatusDisplay = {
    VERIFIED: {
      label: "Verification: Verified",
      backgroundColor: SURFACE.successSoft,
      color: SURFACE.success,
    },
    PENDING: {
      label: "Verification: Pending review",
      backgroundColor: SURFACE.pinkSoft,
      color: SURFACE.pink,
    },
    ACTION_REQUIRED: {
      label: "Verification: Action required",
      backgroundColor: SURFACE.coralSoft,
      color: SURFACE.coral,
    },
    NOT_SUBMITTED: {
      label: "Verification: Not submitted",
      backgroundColor: SURFACE.navySoft,
      color: SURFACE.inkMuted,
    },
  }[status] || null;

  return (
    <header
      className="relative overflow-hidden rounded-[18px] border border-t-[3px] px-5 py-6 shadow-[0_6px_22px_rgba(42,27,61,0.04)] sm:px-8 sm:py-8 lg:px-9"
      style={{
        borderColor: SURFACE.hairline,
        borderTopColor: SURFACE.purple,
        backgroundColor: SURFACE.paper,
      }}
    >
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span
            className="inline-flex rounded-md border bg-white px-3 py-2"
            style={{ borderColor: SURFACE.hairline }}
          >
            <Eyebrow color={SURFACE.pink}>{workspaceLabel}</Eyebrow>
          </span>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1
              className="max-w-3xl break-words font-editorial text-[30px] font-medium leading-[1.08] tracking-[-0.025em] sm:text-[38px] lg:text-[46px]"
              style={{ color: SURFACE.ink }}
            >
              Hello, {pharmacyName}
            </h1>
            {verificationStatusDisplay ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: verificationStatusDisplay.backgroundColor,
                  color: verificationStatusDisplay.color,
                }}
              >
                {status === "VERIFIED" ? (
                  <BadgeCheck size={13} strokeWidth={2} />
                ) : (
                  <ShieldCheck size={13} strokeWidth={2} />
                )}
                {verificationStatusDisplay.label}
              </span>
            ) : verified ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: SURFACE.successSoft,
                  color: SURFACE.success,
                }}
              >
                <BadgeCheck size={13} strokeWidth={2} />
                Verified
              </span>
            ) : null}
          </div>

          <p
            className="mt-4 max-w-2xl font-body text-[13px] leading-6 sm:text-[14px]"
            style={{ color: SURFACE.inkSoft }}
          >
            {summary}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white transition-all duration-200 hover:border-[#44318D]/30 hover:bg-[#F7F5FA]"
            style={{ borderColor: SURFACE.hairline, color: SURFACE.ink }}
          >
            <Bell size={17} strokeWidth={1.6} />

            {hasUnread && (
              <span
                className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: SURFACE.coral }}
              />
            )}
          </Link>

          <Link
            to={actionHref}
            className="group flex h-11 items-center gap-2.5 rounded-lg px-5 font-nav text-[9px] uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:brightness-105"
            style={{ backgroundColor: SURFACE.pink }}
          >
            <ActionIcon
              size={16}
              strokeWidth={2}
              className={
                ActionIcon === Plus
                  ? "transition-transform duration-200 group-hover:rotate-90"
                  : "transition-transform duration-200 group-hover:translate-x-0.5"
              }
            />

            <span>{actionLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
