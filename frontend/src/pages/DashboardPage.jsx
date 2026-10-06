import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Bell, CheckCircle2 } from "lucide-react";

import { apiErrorMessage, http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Loader } from "../components/ui";
import { CalendarRail } from "../components/dashboard/CalendarRail";
import { DashboardHero } from "../components/dashboard/DashboardHero";
import { PartnershipPromoCard } from "../components/dashboard/PartnershipPromoCard";
import { PharmacyProfileCard } from "../components/dashboard/PharmacyProfileCard";
import { ProcurementPanel } from "../components/dashboard/ProcurementPanel";
import { RecentConnectionsRail } from "../components/dashboard/RecentConnectionsRail";
import { RequirementsSection } from "../components/dashboard/RequirementsSection";
import { StatisticsPanel } from "../components/dashboard/StatisticsPanel";
import { VerificationPromptCard } from "../components/dashboard/VerificationPromptCard";
import { WorkspaceSearch } from "../components/dashboard/WorkspaceSearch";
import {
  buildActivityItems,
  countMatches,
  filterAppointments,
  filterConnections,
  filterRequirements,
  pharmacyDisplayName,
  todayAppointments,
  upcomingAppointments,
  workspaceSummary,
} from "../components/dashboard/dashboardData";
import { SURFACE } from "../components/dashboard/dashboardTheme";

const EMPTY_LIST = [];
const ROLE_STAT_ACCENTS = [
  { color: SURFACE.pink, background: SURFACE.pinkSoft },
  { color: SURFACE.purple, background: SURFACE.purpleSoft },
  { color: SURFACE.coral, background: SURFACE.coralSoft },
  { color: SURFACE.slate, background: SURFACE.sectionCanvas },
];

function PharmacyDashboard({ data, user }) {
  const [search, setSearch] = useState("");
  const profile = data.profile || {};
  const verification = data.verification || {};
  const stats = data.stats || {};
  const requirements = Array.isArray(data.requirements)
    ? data.requirements
    : EMPTY_LIST;
  const appointments = Array.isArray(data.appointments)
    ? data.appointments
    : EMPTY_LIST;
  const connections = Array.isArray(data.connections)
    ? data.connections
    : EMPTY_LIST;
  const notifications = Array.isArray(data.notifications)
    ? data.notifications
    : EMPTY_LIST;

  const filteredRequirements = useMemo(
    () => filterRequirements(search, requirements),
    [search, requirements]
  );
  const filteredAppointments = useMemo(
    () => filterAppointments(search, appointments),
    [search, appointments]
  );
  const filteredConnections = useMemo(
    () => filterConnections(search, connections),
    [search, connections]
  );
  const matchingRecords = useMemo(
    () =>
      countMatches(search, {
        requirements,
        appointments,
        connections,
      }),
    [search, requirements, appointments, connections]
  );

  const upcoming = useMemo(
    () => upcomingAppointments(filteredAppointments),
    [filteredAppointments]
  );
  const today = useMemo(
    () => todayAppointments(filteredAppointments),
    [filteredAppointments]
  );
  const activity = useMemo(
    () =>
      buildActivityItems({
        appointments: filteredAppointments,
        requirements: filteredRequirements,
      }),
    [filteredAppointments, filteredRequirements]
  );

  const pharmacyName = pharmacyDisplayName(profile, user);
  const verified =
    verification.businessVerified === true ||
    profile.businessVerified === true ||
    String(verification.status || "").toUpperCase() === "VERIFIED";
  const summary = workspaceSummary({
    openRequirements: stats.openRequirements,
    todayCount: today.length,
    nextAppointmentAt: upcoming[0]?.scheduledAt,
  });

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: SURFACE.canvas, color: SURFACE.ink }}
    >
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12">
        <DashboardHero
          pharmacyName={pharmacyName}
          summary={summary}
          hasUnread={Number(stats.unreadNotifications) > 0}
        />

        <div className="mt-8 sm:mt-10">
          <WorkspaceSearch
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            resultCount={matchingRecords}
          />
        </div>

        <div className="mt-8 grid min-w-0 gap-x-8 gap-y-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-7">
            <RequirementsSection
              requirements={filteredRequirements}
              query={search.trim()}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <ProcurementPanel items={activity} />
              <StatisticsPanel stats={stats} />
            </div>

            <RecentConnectionsRail connections={filteredConnections} />
          </div>

          <aside className="min-w-0 space-y-6">
            <PharmacyProfileCard
              profile={profile}
              name={pharmacyName}
              verified={verified}
            />

            <CalendarRail appointments={upcoming} />

            {!verified && (
              <VerificationPromptCard
                status={verification.status}
              />
            )}

            <PartnershipPromoCard />

            <section
              className="rounded-[18px] border px-6 py-6"
              style={{
                borderColor: SURFACE.hairline,
                backgroundColor: SURFACE.paper,
                color: SURFACE.ink,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-editorial text-[18px] font-semibold">
                  Workspace pulse
                </h2>
                <Bell size={17} strokeWidth={1.6} style={{ color: SURFACE.coral }} />
              </div>
              {notifications.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {notifications.slice(0, 3).map((notification, index) => (
                    <li
                      key={
                        notification.id ||
                        notification._id ||
                        `notification-${index}`
                      }
                      className="border-t pt-3 font-body text-[11px] leading-5"
                      style={{ borderColor: SURFACE.hairline }}
                    >
                      <p>{notification.title || "Workspace update"}</p>
                      {notification.body && (
                        <p className="mt-1" style={{ color: SURFACE.inkMuted }}>
                          {notification.body}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 flex items-center gap-2 font-body text-[11px] leading-5" style={{ color: SURFACE.inkSoft }}>
                  <CheckCircle2 size={15} className="shrink-0" style={{ color: SURFACE.success }} />
                  Your workspace is up to date.
                </p>
              )}
              <Link
                to="/notifications"
                className="mt-4 inline-flex items-center gap-1 font-nav text-[9px] uppercase tracking-[0.14em]"
                style={{ color: SURFACE.coral }}
              >
                View notifications
                <ArrowRight size={13} />
              </Link>
            </section>

            {today.length > 0 && (
              <section
                className="rounded-[18px] border px-6 py-6"
                style={{
                  borderColor: SURFACE.hairline,
                  backgroundColor: "#F8F2F5",
                }}
              >
                <h2
                  className="font-editorial text-[18px] font-semibold"
                  style={{ color: SURFACE.ink }}
                >
                  Today&apos;s meetings
                </h2>
                <ul className="mt-4 space-y-3">
                  {today.slice(0, 3).map((appointment) => (
                    <li key={appointment.id}>
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="block truncate font-body text-[12px] hover:underline"
                        style={{ color: SURFACE.inkSoft }}
                      >
                        {appointment.other?.name || "Pharmaceutical partner"}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

const ROLE_DASHBOARD_CONTENT = {
  MR: {
    title: "Medical representative workspace",
    description:
      "Find relevant opportunities, follow pharmacy demand, and plan professional appointments.",
    actions: [
      ["Find pharmacies", "/discover/pharmacies"],
      ["Company opportunities", "/opportunities"],
      ["Manage leads & follow-ups", "/leads"],
      ["Browse product catalogue", "/catalogue"],
      ["Find distributors", "/discover/stockists"],
      ["Company authorizations", "/authorizations"],
      ["Manage appointments", "/appointments"],
    ],
  },
  INDEPENDENT_MR: {
    title: "Independent representative workspace",
    description:
      "Find relevant opportunities, follow pharmacy demand, and plan professional appointments.",
    actions: [
      ["Find pharmacies", "/discover/pharmacies"],
      ["Company opportunities", "/opportunities"],
      ["Manage leads & follow-ups", "/leads"],
      ["Browse product catalogue", "/catalogue"],
      ["Find distributors", "/discover/stockists"],
      ["Company authorizations", "/authorizations"],
      ["Manage appointments", "/appointments"],
    ],
  },
  PHARMA_COMPANY: {
    title: "Pharmaceutical company workspace",
    description:
      "Coordinate territory opportunities, discover professional partners, and respond to relevant demand.",
    actions: [
      ["Publish an opportunity", "/opportunities/create"],
      ["Manage leads & follow-ups", "/leads"],
      ["Manage product catalogue", "/catalogue"],
      ["Find representatives", "/discover/mrs"],
      ["Review MR authorizations", "/authorizations"],
      ["Find pharmacies", "/discover/pharmacies"],
      ["Find distributors", "/discover/stockists"],
    ],
  },
  DISTRIBUTOR_STOCKIST: {
    title: "Distributor & stockist workspace",
    description:
      "Review pharmacy requirements, respond with your supply capability, and build relationships across your service area without exposing private order history.",
    actions: [
      ["Browse pharmacy requirements", "/requirements"],
      ["Manage leads & follow-ups", "/leads"],
      ["Browse product catalogue", "/catalogue"],
      ["Find pharmacies", "/discover/pharmacies"],
      ["Find companies", "/discover/companies"],
      ["Manage appointments", "/appointments"],
    ],
  },
  DOCTOR: {
    title: "Professional communication workspace",
    description:
      "Review purpose-specific requests and control which professional communications you accept.",
    actions: [
      ["Review appointment requests", "/appointments"],
      ["Manage communication preferences", "/profile"],
      ["View messages", "/messages"],
      ["Notifications", "/notifications"],
    ],
  },
};

function RoleDashboard({ data, user }) {
  const content =
    ROLE_DASHBOARD_CONTENT[user?.role] ||
    ROLE_DASHBOARD_CONTENT.DISTRIBUTOR_STOCKIST;
  const profile = data?.profile || {};
  const stats = data?.stats || {};
  const appointments = Array.isArray(data?.appointments)
    ? data.appointments
    : EMPTY_LIST;
  const requirements = Array.isArray(data?.requirements)
    ? data.requirements
    : EMPTY_LIST;
  const opportunities = Array.isArray(data?.opportunities)
    ? data.opportunities
    : EMPTY_LIST;
  const appointmentRequests = Array.isArray(data?.appointmentRequests)
    ? data.appointmentRequests
    : EMPTY_LIST;
  const notifications = Array.isArray(data?.notifications)
    ? data.notifications
    : EMPTY_LIST;
  const isDoctor = user?.role === "DOCTOR";
  const isDistributor = user?.role === "DISTRIBUTOR_STOCKIST";
  const licenceExpired =
    profile.licenceExpiryDate &&
    new Date(profile.licenceExpiryDate) <= new Date();
  const doctorProfileFields = [
    profile.fullName,
    profile.specialty,
    profile.qualification,
    profile.registrationCouncil,
    profile.registrationNumber,
    profile.clinicHospitalAffiliation,
    profile.location,
    profile.languages?.length,
    profile.professionalInterests?.length,
  ];
  const doctorProfileCompletion = isDoctor
    ? Math.round(
        (doctorProfileFields.filter(Boolean).length /
          doctorProfileFields.length) *
          100
      )
    : 0;
  const name =
    profile.fullName ||
    profile.companyName ||
    user?.name ||
    "Your workspace";

  return (
    <main
      className="min-h-screen px-4 py-7 sm:px-6 lg:px-9 lg:py-10"
      style={{ backgroundColor: SURFACE.canvas }}
    >
      <div className="mx-auto max-w-[1440px]">
        <header
          className="relative overflow-hidden rounded-[18px] border border-t-[3px] px-5 py-7 shadow-[0_6px_22px_rgba(42,27,61,0.04)] sm:px-8 sm:py-8 lg:px-10"
          style={{
            borderColor: SURFACE.hairline,
            borderTopColor: SURFACE.purple,
            backgroundColor: SURFACE.paper,
          }}
        >
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div className="min-w-0">
              {isDoctor && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {profile.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt=""
                      className="h-10 w-10 rounded-full border object-cover"
                      style={{ borderColor: SURFACE.hairline }}
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full font-editorial text-sm font-semibold" style={{ backgroundColor: SURFACE.purpleSoft, color: SURFACE.purple }}>
                      {(profile.fullName || name).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="rounded-full px-3 py-1 font-nav text-[9px] uppercase tracking-[0.12em]" style={{ backgroundColor: SURFACE.purpleSoft, color: SURFACE.purple }}>
                    Doctor
                  </span>
                  <span className="rounded-full px-3 py-1 font-nav text-[9px] uppercase tracking-[0.12em]" style={{
                    backgroundColor: profile.registrationStatus === "VERIFIED" ? SURFACE.successSoft : SURFACE.coralSoft,
                    color: profile.registrationStatus === "VERIFIED" ? SURFACE.success : SURFACE.coral,
                  }}>
                    Registration {String(profile.registrationStatus || "NOT_SUBMITTED").replaceAll("_", " ").toLowerCase()}
                  </span>
                </div>
              )}
              <p
                className="workspace-label inline-flex items-center gap-2 rounded-md border px-3 py-2"
                style={{ borderColor: SURFACE.hairline, color: SURFACE.pink }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SURFACE.coral }} />
                {content.title}
              </p>
              <h1
                className="mt-4 max-w-3xl font-editorial text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl lg:text-[42px]"
                style={{ color: SURFACE.ink }}
              >
                Welcome, {name}
              </h1>
              <p className="mt-3 max-w-2xl font-body text-sm leading-6" style={{ color: SURFACE.inkSoft }}>
                {content.description}
              </p>
            </div>
            <Link
              to="/profile"
              className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-5 font-nav text-[10px] uppercase tracking-[0.1em] text-white transition hover:brightness-105"
              style={{ backgroundColor: SURFACE.purple }}
            >
              {isDoctor ? "Manage profile & preferences" : "Complete your profile"}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-7 lg:grid-cols-4">
          {(isDoctor
            ? [
                ["Requests to review", stats.pendingAppointments],
                ["Upcoming appointments", stats.upcomingAppointments],
                ["Connections", stats.connections],
                ["Unread updates", stats.unreadNotifications],
              ]
            : [
                [isDistributor ? "Pharmacy requirements" : "Open requirements", stats.openRequirements],
                ["Open opportunities", stats.openOpportunities],
                ...(user?.role === "MR" || user?.role === "INDEPENDENT_MR"
                  ? [["Active authorizations", stats.activeAuthorizations]]
                  : user?.role === "PHARMA_COMPANY"
                    ? [["MR authorization requests", stats.pendingAuthorizations]]
                    : []),
                ["Open leads", stats.openLeads],
                ["Follow-ups due in 7 days", stats.dueFollowUps],
                ["Upcoming appointments", stats.upcomingAppointments],
                ["Connections", stats.connections],
              ]
          ).map(([label, value], index) => {
            const accent = ROLE_STAT_ACCENTS[index % ROLE_STAT_ACCENTS.length];

            return (
            <div
              key={label}
              className="group relative overflow-hidden rounded-[18px] border bg-white p-4 shadow-[0_5px_18px_rgba(42,27,61,0.025)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(42,27,61,0.06)] sm:p-5"
              style={{ borderColor: SURFACE.hairline }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: accent.color }}
              />
              <p className="relative font-editorial text-2xl font-semibold sm:text-[28px]" style={{ color: accent.color }}>
                {Number(value) || 0}
              </p>
              <p className="relative mt-2 max-w-[15rem] font-nav text-[9px] uppercase leading-4 tracking-[0.12em] sm:text-[10px]" style={{ color: SURFACE.inkMuted }}>
                {label}
              </p>
            </div>
            );
          })}
        </section>

        <section className="mt-7 grid min-w-0 grid-flow-dense gap-5 sm:grid-cols-2 xl:mt-8 xl:grid-cols-4 xl:gap-6">
          <div className="contents">
            <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:col-span-2 sm:p-6 xl:col-span-2" style={{ borderColor: SURFACE.hairline }}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="workspace-label" style={{ color: SURFACE.coral }}>
                    Workspace activity
                  </p>
                  <h2 className="mt-2 font-editorial text-xl font-semibold sm:text-[22px]" style={{ color: SURFACE.ink }}>
                    {isDoctor
                      ? "Requests to review"
                      : isDistributor
                        ? "Pharmacy requirements to respond to"
                        : "Relevant requirements"}
                  </h2>
                </div>
                <Link to={isDoctor ? "/appointments" : "/requirements"} className="font-nav text-xs uppercase tracking-wider" style={{ color: SURFACE.pink }}>
                  View all
                </Link>
              </div>
              {isDoctor ? (
              appointmentRequests.length > 0 ? (
                  <div className="mt-5 divide-y" style={{ borderColor: SURFACE.hairline }}>
                  {appointmentRequests.map((appointment) => (
                      <Link
                        key={appointment.id}
                        to={`/appointments/${appointment.id}`}
                        className="group -mx-3 flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-4 transition-colors hover:bg-[#F7F5FA]"
                      >
                        <span>
                          <span className="block font-body text-sm" style={{ color: SURFACE.ink }}>
                            {appointment.other?.name || "Professional contact"}{appointment.other?.role ? ` · ${appointment.other.role.replaceAll("_", " ")}` : ""}
                          </span>
                          <span className="mt-1 block font-body text-xs" style={{ color: SURFACE.inkMuted }}>
                            {[
                              appointment.purposeCategory,
                              appointment.scheduledAt && new Date(appointment.scheduledAt).toLocaleString(),
                              `${appointment.durationMinutes} min`,
                              appointment.mode === "VIDEO" ? "Online" : "In person",
                              appointment.createdAt && `Received ${new Date(appointment.createdAt).toLocaleDateString()}`,
                              appointment.notes,
                            ].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.1em]" style={{ backgroundColor: SURFACE.pinkSoft, color: SURFACE.pink }}>
                          Review request
                          <ArrowRight size={13} />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 font-body text-sm leading-6" style={{ color: SURFACE.inkSoft }}>
                    No requests need your review. Your contact preferences control who may request a meeting.
                  </p>
                )
              ) : requirements.length > 0 ? (
                <div className="mt-5 divide-y" style={{ borderColor: SURFACE.hairline }}>
                  {requirements.map((requirement) => (
                    <Link
                      key={requirement.id}
                      to={`/requirements/${requirement.id}`}
                      className="group -mx-3 flex flex-wrap items-start justify-between gap-3 rounded-lg px-3 py-4 transition-colors hover:bg-[#F7F5FA]"
                    >
                      <span>
                        <span className="block font-body text-sm" style={{ color: SURFACE.ink }}>
                          {requirement.title}
                        </span>
                        <span className="mt-1 block font-body text-xs" style={{ color: SURFACE.inkMuted }}>
                          {[requirement.category, requirement.urgency, requirement.createdAt && new Date(requirement.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {isDistributor ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.1em]" style={{ backgroundColor: SURFACE.pinkSoft, color: SURFACE.pink }}>
                          Review &amp; respond
                          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      ) : (
                        <ArrowRight size={16} className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: SURFACE.pink }} />
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-5 font-body text-sm leading-6" style={{ color: SURFACE.inkSoft }}>
                  No open requirements match this role right now.
                </p>
              )}
            </section>

            {(user?.role === "MR" || user?.role === "INDEPENDENT_MR" || user?.role === "PHARMA_COMPANY" || user?.role === "DISTRIBUTOR_STOCKIST") && (
              <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:col-span-2 sm:p-6 xl:col-span-2" style={{ borderColor: SURFACE.hairline }}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="workspace-label" style={{ color: SURFACE.purple }}>
                      {user.role === "PHARMA_COMPANY" ? "Company pipeline" : "Professional opportunities"}
                    </p>
                    <h2 className="mt-2 font-editorial text-xl font-semibold" style={{ color: SURFACE.ink }}>
                      {user.role === "PHARMA_COMPANY" ? "Your open opportunities" : "Relevant opportunities"}
                    </h2>
                  </div>
                  <Link to="/opportunities" className="font-nav text-xs uppercase tracking-wider" style={{ color: SURFACE.pink }}>
                    View opportunities
                  </Link>
                </div>
                {opportunities.length > 0 ? (
                  <div className="mt-5 divide-y" style={{ borderColor: SURFACE.hairline }}>
                    {opportunities.map((opportunity) => (
                      <Link key={opportunity.id} to={`/opportunities/${opportunity.id}`} className="group -mx-3 block rounded-lg px-3 py-4 transition-colors hover:bg-[#F7F5FA]">
                        <span className="font-body text-sm" style={{ color: SURFACE.ink }}>{opportunity.title}</span>
                        <span className="mt-1 block font-body text-xs" style={{ color: SURFACE.inkMuted }}>
                          {[opportunity.type?.replaceAll("_", " "), ...(opportunity.territories || [])].filter(Boolean).join(" · ")}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 font-body text-sm" style={{ color: SURFACE.inkSoft }}>
                    {user.role === "PHARMA_COMPANY" ? "Publish an opportunity to recruit representatives or expand your distribution network." : "No matching opportunities are currently open."}
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="contents" aria-label="Profile, actions, and notifications">
            {isDoctor ? (
              <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:p-6" style={{ borderColor: SURFACE.hairline }}>
                <p className="workspace-label" style={{ color: SURFACE.purple }}>Professional profile</p>
                <h2 className="mt-2 font-editorial text-lg font-semibold" style={{ color: SURFACE.ink }}>
                  {profile.fullName || name}
                </h2>
                <p className="mt-1 font-body text-xs" style={{ color: SURFACE.inkSoft }}>
                  {[profile.specialty, profile.subspecialty, profile.location].filter(Boolean).join(" · ") || "Add your specialty and general practice location."}
                </p>
                <div className="mt-5 border-t pt-4" style={{ borderColor: SURFACE.hairline }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-body text-xs" style={{ color: SURFACE.inkSoft }}>Profile details</p>
                    <strong className="font-nav text-xs" style={{ color: SURFACE.purple }}>{doctorProfileCompletion}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: SURFACE.navySoft }}>
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${doctorProfileCompletion}%`, backgroundColor: SURFACE.pink }} />
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t pt-4 font-body text-xs" style={{ borderColor: SURFACE.hairline, color: SURFACE.inkSoft }}>
                  <p>
                    Registration:{" "}
                    <strong style={{ color: profile.registrationStatus === "VERIFIED" ? SURFACE.success : SURFACE.coral }}>
                      {String(profile.registrationStatus || "NOT_SUBMITTED").replaceAll("_", " ")}
                    </strong>
                  </p>
                  {profile.registrationCouncil && (
                    <p>Registration council: <strong>{profile.registrationCouncil}</strong></p>
                  )}
                  {profile.verificationDate && (
                    <p>Verified: <strong>{new Date(profile.verificationDate).toLocaleDateString()}</strong></p>
                  )}
                  {profile.reVerificationDate && (
                    <p>Re-verification date: <strong>{new Date(profile.reVerificationDate).toLocaleDateString()}</strong></p>
                  )}
                  <p>MR requests: <strong>{profile.acceptsMRRequests ? "Accepted" : "Paused"}</strong></p>
                  <p>Company information: <strong>{profile.acceptsCompanyInformation ? "Accepted" : "Paused"}</strong></p>
                  <p>Meeting modes: <strong>{profile.communicationModes?.length ? profile.communicationModes.map((mode) => mode === "VIDEO" ? "Online" : "In person").join(", ") : "Not set"}</strong></p>
                  {profile.updatedAt && (
                    <p>Profile updated: <strong>{new Date(profile.updatedAt).toLocaleDateString()}</strong></p>
                  )}
                  <Link to="/verification" className="inline-flex items-center gap-1 font-nav uppercase tracking-wider" style={{ color: SURFACE.pink }}>
                    View registration verification <ArrowRight size={13} />
                  </Link>
                  <Link to="/profile" className="mt-2 inline-flex items-center gap-1 font-nav uppercase tracking-wider" style={{ color: SURFACE.pink }}>
                    Update profile &amp; preferences <ArrowRight size={13} />
                  </Link>
                </div>
              </section>
            ) : (
            <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:p-6" style={{ borderColor: SURFACE.hairline }}>
              <p className="workspace-label" style={{ color: SURFACE.purple }}>
                Your profile
              </p>
              <h2 className="mt-2 font-editorial text-lg font-semibold" style={{ color: SURFACE.ink }}>
                {profile.specialty || profile.type || profile.isIndependent
                  ? (profile.specialty || (profile.isIndependent ? "Independent representative" : profile.type) || content.title)
                  : content.title}
              </h2>
              <p className="mt-2 font-body text-xs leading-5" style={{ color: SURFACE.inkSoft }}>
                {[profile.location, ...(profile.territories || []), ...(profile.serviceAreas || []), ...(profile.productCategories || [])].filter(Boolean).join(" · ") || "Add your territory, service area, and professional interests in your profile."}
              </p>
              {isDoctor && (
                <div className="mt-5 space-y-2 border-t pt-4 font-body text-xs" style={{ borderColor: SURFACE.hairline, color: SURFACE.inkSoft }}>
                  <p>MR appointment requests: <strong>{profile.acceptsMRRequests ? "On" : "Off"}</strong></p>
                  <p>Company information: <strong>{profile.acceptsCompanyInformation ? "On" : "Off"}</strong></p>
                  <p>Registration status: <strong>{profile.registrationStatus || "NOT_SUBMITTED"}</strong></p>
                  <Link to="/profile" className="mt-2 inline-flex items-center gap-1 font-nav uppercase tracking-wider" style={{ color: SURFACE.pink }}>
                    Update consent preferences <ArrowRight size={13} />
                  </Link>
                </div>
              )}
              {isDistributor && (
                <div className="mt-5 space-y-3 border-t pt-4 font-body text-xs" style={{ borderColor: SURFACE.hairline, color: SURFACE.inkSoft }}>
                  <p>
                    Licence status:{" "}
                    <strong style={{ color: profile.businessVerified && !licenceExpired ? SURFACE.success : SURFACE.coral }}>
                      {licenceExpired
                        ? "Expired"
                        : profile.businessVerified
                          ? "Verified"
                          : "Verification required"}
                    </strong>
                  </p>
                  {profile.licenceExpiryDate && (
                    <p>
                      Licence expires:{" "}
                      <strong>{new Date(profile.licenceExpiryDate).toLocaleDateString()}</strong>
                    </p>
                  )}
                  <p>
                    Service areas:{" "}
                    <strong>{profile.serviceAreas?.length ? profile.serviceAreas.join(", ") : "Add your coverage areas"}</strong>
                  </p>
                  <Link to={profile.businessVerified && !licenceExpired ? "/profile" : "/verification"} className="inline-flex items-center gap-1 font-nav uppercase tracking-wider" style={{ color: SURFACE.pink }}>
                    {profile.businessVerified && !licenceExpired ? "Update business profile" : "Verify your licence"}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </section>
            )}

            {isDoctor && (
              <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:p-6" style={{ borderColor: SURFACE.hairline }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="workspace-label" style={{ color: SURFACE.coral }}>Your calendar</p>
                    <h2 className="mt-2 font-editorial text-lg font-semibold" style={{ color: SURFACE.ink }}>Upcoming appointments</h2>
                  </div>
                  <Link to="/appointments" className="font-nav text-[9px] uppercase tracking-wider" style={{ color: SURFACE.pink }}>View calendar</Link>
                </div>
                {appointments.length > 0 ? (
                  <div className="mt-4 divide-y" style={{ borderColor: SURFACE.hairline }}>
                    {appointments.slice(0, 3).map((appointment) => (
                      <Link key={appointment.id} to={`/appointments/${appointment.id}`} className="block py-3 first:pt-0 last:pb-0">
                        <span className="block font-body text-xs font-medium" style={{ color: SURFACE.ink }}>
                          {appointment.other?.name || "Professional contact"}
                        </span>
                        <span className="mt-1 block font-body text-[11px]" style={{ color: SURFACE.inkMuted }}>
                          {[appointment.scheduledAt && new Date(appointment.scheduledAt).toLocaleString(), appointment.purposeCategory].filter(Boolean).join(" · ")}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 font-body text-xs leading-5" style={{ color: SURFACE.inkSoft }}>No upcoming appointments scheduled.</p>
                )}
              </section>
            )}

            <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:p-6" style={{ borderColor: SURFACE.hairline }}>
              <h2 className="font-editorial text-lg font-semibold" style={{ color: SURFACE.ink }}>Quick actions</h2>
              <div className="relative mt-4 space-y-2">
                {content.actions.map(([label, href]) => (
                  <Link key={href + label} to={href} className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5 py-3 font-body text-xs transition-colors hover:bg-[#F7F5FA]" style={{ borderColor: SURFACE.hairline, color: SURFACE.inkSoft }}>
                    {label}
                    <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: SURFACE.purple }} />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border bg-white p-5 shadow-[0_5px_18px_rgba(42,27,61,0.025)] sm:p-6" style={{ borderColor: SURFACE.hairline }}>
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-lg font-semibold" style={{ color: SURFACE.ink }}>Notifications</h2>
                <Link to="/notifications" aria-label="View notifications" style={{ color: SURFACE.pink }}>
                  <Bell size={17} />
                </Link>
              </div>
              {notifications.length > 0 ? (
                <ul className="mt-4 divide-y" style={{ borderColor: SURFACE.hairline }}>
                  {notifications.slice(0, 4).map((notification, index) => (
                    <li key={notification.id || notification._id || index} className="py-3 font-body text-xs leading-5" style={{ color: SURFACE.inkSoft }}>
                      <p>{notification.title || "Workspace update"}</p>
                      {notification.body && <p className="mt-1 text-[11px]" style={{ color: SURFACE.inkMuted }}>{notification.body}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 font-body text-xs" style={{ color: SURFACE.inkMuted }}>No new notifications.</p>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user?.role || user.role === "ADMIN") {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    const endpoint =
      user.role === "PHARMACY"
        ? "/dashboard/pharmacy"
        : "/dashboard/workspace";

    http
      .get(endpoint)
      .then((response) => {
        if (mounted) setData(response || {});
      })
      .catch((requestError) => {
        if (mounted) {
          setError(
            apiErrorMessage(
              requestError,
              "Unable to load your dashboard."
            )
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.role, retryCount]);

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        style={{ backgroundColor: SURFACE.canvas }}
      >
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <main
        className="flex min-h-[60vh] items-center justify-center px-5 py-12"
        style={{ backgroundColor: SURFACE.canvas }}
      >
        <section
          className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center"
          style={{ borderColor: SURFACE.hairline }}
        >
          <h1
            className="font-editorial text-2xl font-semibold"
            style={{ color: SURFACE.ink }}
          >
            Dashboard unavailable
          </h1>
          <p
            className="mt-3 font-body text-sm leading-6"
            style={{ color: SURFACE.inkSoft }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
            className="mt-6 rounded-full px-5 py-2.5 font-body text-sm text-white"
            style={{ backgroundColor: SURFACE.pink }}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return user?.role === "PHARMACY" ? (
    <PharmacyDashboard data={data || {}} user={user} />
  ) : (
    <RoleDashboard data={data || {}} user={user} />
  );
}
