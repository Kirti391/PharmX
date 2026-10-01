import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Building2,
  Stethoscope,
  Truck,
  Bell,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import {
  Button,
  Card,
  EmptyState,
  Loader,
  StatusBadge,
} from "../components/ui";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#A4B3B6",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

function initials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleLabel(role) {
  const labels = {
    PHARMACY: "Pharmacy",
    PHARMA_COMPANY: "Pharma Company",
    MR: "Medical Representative",
    DISTRIBUTOR: "Distributor",
    STOCKIST: "Stockist",
    ADMIN: "Administrator",
  };

  return labels[role] || role || "Member";
}

function formatDate(value, fallback = "Not scheduled") {
  if (!value) return fallback;

  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return fallback;
  }
}

function formatDateTime(value, fallback = "Not scheduled") {
  if (!value) return fallback;

  try {
    return format(new Date(value), "dd MMM, hh:mm a");
  } catch {
    return fallback;
  }
}

function DashboardStat({
  icon: Icon,
  label,
  value,
  description,
  href,
  iconClass = "bg-[#FCE8F1] text-[#D83F87]",
}) {
  const content = (
    <div className="group flex h-full items-center gap-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass} transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon size={21} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="font-[Fauna_One] text-[11px] uppercase tracking-[0.12em]"
          style={{ color: COLORS.muted }}
        >
          {label}
        </p>

        <p
          className="mt-1 font-[Cinzel] text-2xl font-semibold"
          style={{ color: COLORS.navy }}
        >
          {value ?? 0}
        </p>

        {description && (
          <p
            className="mt-1 truncate font-[Fauna_One] text-xs"
            style={{ color: COLORS.muted }}
          >
            {description}
          </p>
        )}
      </div>

      {href && (
        <ChevronRight
          size={17}
          className="shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          style={{ color: COLORS.primary }}
        />
      )}
    </div>
  );

  if (!href) {
    return (
      <Card className="border-[#E9E6EC] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        {content}
      </Card>
    );
  }

  return (
    <Link to={href} className="block h-full">
      <Card className="h-full border-[#E9E6EC] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        {content}
      </Card>
    </Link>
  );
}

function DiscoveryCard({
  icon: Icon,
  title,
  description,
  href,
  eyebrow,
  bullets,
  iconClass,
}) {
  return (
    <Link to={href} className="group block h-full">
      <div
        className="relative h-full overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ borderColor: COLORS.border }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-2xl transition-transform duration-500 group-hover:scale-150"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
            >
              <Icon size={22} strokeWidth={1.7} />
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 group-hover:bg-[#D83F87] group-hover:text-white"
              style={{ borderColor: COLORS.border }}
            >
              <ArrowRight size={16} />
            </div>
          </div>

          <p
            className="mt-5 font-[Unica_One] text-[11px] uppercase tracking-[0.18em]"
            style={{ color: COLORS.primary }}
          >
            {eyebrow}
          </p>

          <h3
            className="mt-2 font-[Cinzel] text-lg font-semibold"
            style={{ color: COLORS.navy }}
          >
            {title}
          </h3>

          <p
            className="mt-2 min-h-[48px] font-[Fauna_One] text-sm leading-6"
            style={{ color: COLORS.muted }}
          >
            {description}
          </p>

          <div className="mt-5 space-y-2.5">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  strokeWidth={1.8}
                  style={{ color: COLORS.primary }}
                />
                <span
                  className="font-[Fauna_One] text-xs"
                  style={{ color: COLORS.navy }}
                >
                  {bullet}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-6 flex items-center gap-2 border-t pt-4 font-[Unica_One] text-xs uppercase tracking-[0.1em]"
            style={{
              borderColor: COLORS.border,
              color: COLORS.primary,
            }}
          >
            Explore
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p
            className="font-[Unica_One] text-[10px] uppercase tracking-[0.2em]"
            style={{ color: COLORS.primary }}
          >
            {eyebrow}
          </p>
        )}

        <h2
          className="mt-1 font-[Cinzel] text-xl font-semibold"
          style={{ color: COLORS.navy }}
        >
          {title}
        </h2>

        {description && (
          <p
            className="mt-1 font-[Fauna_One] text-sm"
            style={{ color: COLORS.muted }}
          >
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "#F5F0F7", color: COLORS.purple }}
      >
        <Icon size={16} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p
          className="font-[Unica_One] text-[9px] uppercase tracking-[0.12em]"
          style={{ color: COLORS.muted }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 truncate font-[Fauna_One] text-xs"
          style={{ color: COLORS.navy }}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === "PHARMACY") {
    return <PharmacyDashboard />;
  }

  return <GenericDashboard />;
}

function PharmacyDashboard() {
  const { user } = useAuthStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    http
      .get("/dashboard/pharmacy")
      .then((response) => {
        if (mounted) {
          setData(response);
        }
      })
      .catch(() => {
        if (mounted) {
          setData(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const profile = data?.profile || {};
  const verification = data?.verification || {};
  const stats = data?.stats || {};
  const requirements = Array.isArray(data?.requirements)
    ? data.requirements
    : [];
  const appointments = Array.isArray(data?.appointments)
    ? data.appointments
    : [];
  const connections = Array.isArray(data?.connections)
    ? data.connections
    : [];
  const notifications = Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  const displayName =
    profile?.pharmacyName ||
    profile?.businessName ||
    profile?.name ||
    user?.name ||
    "Pharmacy";

  const firstName =
    profile?.ownerName?.split?.(" ")?.[0] ||
    user?.name?.split?.(" ")?.[0] ||
    displayName;

  const verificationStatus =
    verification?.status ||
    profile?.verificationStatus ||
    "PENDING";

  const activeRequirements =
    stats?.activeRequirements ??
    requirements.filter(
      (item) =>
        !["CLOSED", "FULFILLED", "CANCELLED"].includes(
          String(item?.status || "").toUpperCase()
        )
    ).length;

  const pendingResponses =
    stats?.pendingResponses ??
    stats?.responses ??
    0;

  const connectionCount =
    stats?.connections ??
    stats?.connectionCount ??
    connections.length;

  const upcomingAppointments =
    stats?.upcomingAppointments ??
    appointments.length;

  const isVerified =
    String(verificationStatus).toUpperCase() === "VERIFIED";

  return (
    <div className="space-y-8 pb-10">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-8 shadow-xl sm:px-8 lg:px-10 lg:py-10"
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.purple} 100%)`,
        }}
      >
        <div
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div
          className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: COLORS.coral }}
        />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-3 py-1 font-[Unica_One] text-[10px] uppercase tracking-[0.16em]"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                Pharmacy Workspace
              </span>

              {isVerified && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-[Unica_One] text-[10px] uppercase tracking-[0.12em] text-white">
                  <CheckCircle2 size={12} />
                  Verified
                </span>
              )}
            </div>

            <h1 className="max-w-3xl font-[Cinzel] text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-4 max-w-2xl font-[Fauna_One] text-sm leading-7 text-white/65 sm:text-base">
              Tell PharmUnis what your pharmacy needs and connect with the
              right pharmaceutical companies, medical representatives,
              distributors and stockists.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/requirements/create">
                <Button className="w-full border-0 bg-[#D83F87] px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.1em] text-white shadow-lg shadow-[#D83F87]/20 hover:bg-[#c93679] sm:w-auto">
                  <Plus size={17} />
                  Create Requirement
                </Button>
              </Link>

              <Link to="/discover/companies">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.1em] text-white transition hover:bg-white/15 sm:w-auto"
                >
                  <Search size={16} />
                  Discover Suppliers
                </button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative h-40 w-40">
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <div className="absolute inset-4 rounded-full border border-white/10" />
              <div className="absolute inset-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <PackageSearch
                  size={42}
                  strokeWidth={1.2}
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK PROCUREMENT SEARCH */}
      <section
        className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
        style={{ borderColor: COLORS.border }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "#FCE8F1",
                color: COLORS.primary,
              }}
            >
              <Search size={19} />
            </div>

            <div>
              <p
                className="font-[Cinzel] text-sm font-semibold"
                style={{ color: COLORS.navy }}
              >
                What are you looking for?
              </p>
              <p
                className="mt-1 font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                Find suppliers, products, brands or healthcare partners.
              </p>
            </div>
          </div>

          <Link to="/discover/companies" className="lg:w-auto">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.1em] text-white transition hover:opacity-90 lg:w-auto"
              style={{ backgroundColor: COLORS.navy }}
            >
              <Search size={16} />
              Start Discovering
            </button>
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          icon={FileText}
          label="Active Requirements"
          value={activeRequirements}
          description="Procurement needs in progress"
          href="/requirements"
        />

        <DashboardStat
          icon={MessageSquare}
          label="Responses"
          value={pendingResponses}
          description="Supplier responses to review"
          href="/requirements"
          iconClass="bg-[#F1ECFA] text-[#44318D]"
        />

        <DashboardStat
          icon={Users}
          label="Connections"
          value={connectionCount}
          description="Your professional relationships"
          href="/connections"
          iconClass="bg-[#FDF0ED] text-[#E98074]"
        />

        <DashboardStat
          icon={CalendarClock}
          label="Appointments"
          value={upcomingAppointments}
          description="Upcoming meetings"
          href="/appointments"
          iconClass="bg-[#EEF5F5] text-[#2A1B3D]"
        />
      </section>

      {/* DISCOVERY */}
      <section>
        <SectionHeader
          eyebrow="Supplier Network"
          title="Discover the right partners"
          description="Find pharmaceutical businesses and professionals based on your pharmacy's needs."
          action={
            <Link
              to="/discover/companies"
              className="hidden items-center gap-1 font-[Unica_One] text-xs uppercase tracking-[0.1em] sm:flex"
              style={{ color: COLORS.primary }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          }
        />

        {/* THREE CARDS — Distributor + Stockist are intentionally combined */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <DiscoveryCard
            icon={Building2}
            title="Pharma Companies"
            eyebrow="Manufacturers & Brands"
            description="Discover pharmaceutical companies, products and brands that match your procurement requirements."
            href="/discover/companies"
            iconClass="bg-[#FCE8F1] text-[#D83F87]"
            bullets={[
              "Browse products & brands",
              "Verified companies",
              "Connect for procurement",
            ]}
          />

          <DiscoveryCard
            icon={Stethoscope}
            title="Medical Representatives"
            eyebrow="Field Professionals"
            description="Find medical representatives by company, territory, therapeutic category and availability."
            href="/discover/mrs"
            iconClass="bg-[#F1ECFA] text-[#44318D]"
            bullets={[
              "Search by territory",
              "View company association",
              "Schedule discussions",
            ]}
          />

          <DiscoveryCard
            icon={Truck}
            title="Distributors & Stockists"
            eyebrow="Supply & Distribution"
            description="Find distributors and stockists based on location, product availability, delivery coverage and service area."
            href="/discover/distributors-stockists"
            iconClass="bg-[#FDF0ED] text-[#E98074]"
            bullets={[
              "Distributors & stockists",
              "Check local availability",
              "Compare delivery coverage",
            ]}
          />
        </div>
      </section>

      {/* VERIFICATION */}
      {!isVerified && (
        <section
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: "#F2D3DE",
            background:
              "linear-gradient(135deg, #FFF8FA 0%, #FFFFFF 100%)",
          }}
        >
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: "#FCE8F1",
                  color: COLORS.primary,
                }}
              >
                <ShieldCheck size={22} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="font-[Cinzel] text-base font-semibold"
                    style={{ color: COLORS.navy }}
                  >
                    Complete your pharmacy verification
                  </h3>

                  <StatusBadge status={verificationStatus} />
                </div>

                <p
                  className="mt-1 max-w-2xl font-[Fauna_One] text-xs leading-6"
                  style={{ color: COLORS.muted }}
                >
                  Verified pharmacies can build stronger supplier
                  relationships and provide greater confidence to their
                  professional connections.
                </p>
              </div>
            </div>

            <Link to="/verification" className="shrink-0">
              <Button
                variant="outline"
                className="w-full font-[Unica_One] text-xs uppercase tracking-[0.08em] sm:w-auto"
              >
                Complete Verification
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* REQUIREMENTS + VERIFICATION */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card
          className="overflow-hidden border-[#E9E6EC] bg-white"
          padding={false}
        >
          <div className="flex items-center justify-between border-b border-[#E9E6EC] px-5 py-5 sm:px-6">
            <div>
              <p
                className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em]"
                style={{ color: COLORS.primary }}
              >
                Procurement
              </p>
              <h2
                className="mt-1 font-[Cinzel] text-lg font-semibold"
                style={{ color: COLORS.navy }}
              >
                Your Requirements
              </h2>
            </div>

            <Link
              to="/requirements"
              className="flex items-center gap-1 font-[Unica_One] text-xs uppercase tracking-[0.08em]"
              style={{ color: COLORS.primary }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {requirements.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No procurement requirements yet"
                description="Create your first requirement and let PharmUnis help you discover relevant suppliers."
                action={
                  <Link to="/requirements/create">
                    <Button>
                      <Plus size={16} />
                      Create Requirement
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E9E6EC]">
              {requirements.slice(0, 5).map((requirement) => (
                <Link
                  key={requirement._id || requirement.id}
                  to="/requirements"
                  className="group block px-5 py-4 transition hover:bg-[#FAF8FB] sm:px-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="truncate font-[Cinzel] text-sm font-semibold transition group-hover:text-[#D83F87]"
                          style={{ color: COLORS.navy }}
                        >
                          {requirement.title || "Untitled Requirement"}
                        </h3>

                        {requirement.status && (
                          <StatusBadge status={requirement.status} />
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {requirement.category && (
                          <span
                            className="font-[Fauna_One] text-xs"
                            style={{ color: COLORS.muted }}
                          >
                            {requirement.category}
                          </span>
                        )}

                        {requirement.location && (
                          <span
                            className="flex items-center gap-1 font-[Fauna_One] text-xs"
                            style={{ color: COLORS.muted }}
                          >
                            <MapPin size={12} />
                            {requirement.location}
                          </span>
                        )}

                        {requirement.createdAt && (
                          <span
                            className="font-[Fauna_One] text-xs"
                            style={{ color: COLORS.muted }}
                          >
                            {formatDate(requirement.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={17}
                      className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: COLORS.muted }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card
          className="border-[#E9E6EC] bg-white"
          padding={false}
        >
          <div className="border-b border-[#E9E6EC] px-5 py-5 sm:px-6">
            <p
              className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em]"
              style={{ color: COLORS.primary }}
            >
              Account
            </p>

            <h2
              className="mt-1 font-[Cinzel] text-lg font-semibold"
              style={{ color: COLORS.navy }}
            >
              Pharmacy Profile
            </h2>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-[Cinzel] text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.purple})`,
                }}
              >
                {initials(displayName)}
              </div>

              <div className="min-w-0">
                <h3
                  className="truncate font-[Cinzel] text-base font-semibold"
                  style={{ color: COLORS.navy }}
                >
                  {displayName}
                </h3>

                <p
                  className="mt-1 font-[Fauna_One] text-xs"
                  style={{ color: COLORS.muted }}
                >
                  {roleLabel(user?.role)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InfoRow
                icon={MapPin}
                label="Location"
                value={profile?.location || profile?.city}
              />

              <InfoRow
                icon={ShieldCheck}
                label="Verification"
                value={verificationStatus}
              />

              <InfoRow
                icon={Users}
                label="Connections"
                value={connectionCount}
              />
            </div>

            <Link to="/profile">
              <Button
                variant="outline"
                className="w-full font-[Unica_One] text-xs uppercase tracking-[0.08em]"
              >
                Manage Pharmacy Profile
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* APPOINTMENTS */}
      <section>
        <SectionHeader
          eyebrow="Relationships"
          title="Upcoming Appointments"
          description="Stay on top of conversations with your professional connections."
          action={
            <Link
              to="/appointments"
              className="hidden items-center gap-1 font-[Unica_One] text-xs uppercase tracking-[0.1em] sm:flex"
              style={{ color: COLORS.primary }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          }
        />

        {appointments.length === 0 ? (
          <Card className="border-[#E9E6EC] bg-white">
            <EmptyState
              title="No upcoming appointments"
              description="Connect with suppliers and schedule a discussion when you find the right partner."
              action={
                <Link to="/discover/companies">
                  <Button variant="outline">
                    <Search size={16} />
                    Discover Partners
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.slice(0, 3).map((appointment) => (
              <Card
                key={appointment._id || appointment.id}
                className="border-[#E9E6EC] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: "#F1ECFA",
                      color: COLORS.purple,
                    }}
                  >
                    <CalendarClock size={19} />
                  </div>

                  {appointment.status && (
                    <StatusBadge status={appointment.status} />
                  )}
                </div>

                <h3
                  className="mt-4 font-[Cinzel] text-sm font-semibold"
                  style={{ color: COLORS.navy }}
                >
                  {appointment.title ||
                    appointment.subject ||
                    "Business Discussion"}
                </h3>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock3 size={14} style={{ color: COLORS.muted }} />
                    <span
                      className="font-[Fauna_One] text-xs"
                      style={{ color: COLORS.muted }}
                    >
                      {formatDateTime(
                        appointment.startAt ||
                          appointment.date ||
                          appointment.scheduledAt
                      )}
                    </span>
                  </div>

                  {appointment.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} style={{ color: COLORS.muted }} />
                      <span
                        className="truncate font-[Fauna_One] text-xs"
                        style={{ color: COLORS.muted }}
                      >
                        {appointment.location}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CONNECTIONS + NOTIFICATIONS */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          className="overflow-hidden border-[#E9E6EC] bg-white"
          padding={false}
        >
          <div className="flex items-center justify-between border-b border-[#E9E6EC] px-5 py-5">
            <div>
              <p
                className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em]"
                style={{ color: COLORS.primary }}
              >
                Network
              </p>
              <h2
                className="mt-1 font-[Cinzel] text-lg font-semibold"
                style={{ color: COLORS.navy }}
              >
                Recent Connections
              </h2>
            </div>

            <Link
              to="/connections"
              className="flex items-center gap-1 font-[Unica_One] text-xs uppercase tracking-[0.08em]"
              style={{ color: COLORS.primary }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {connections.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No connections yet"
                description="Your professional relationships will appear here once you connect with a partner."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E9E6EC]">
              {connections.slice(0, 4).map((connection) => {
                const name =
                  connection.name ||
                  connection.companyName ||
                  connection.businessName ||
                  connection.user?.name ||
                  "Professional Connection";

                return (
                  <div
                    key={connection._id || connection.id}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-[Cinzel] text-xs font-semibold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.primary})`,
                      }}
                    >
                      {initials(name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-[Cinzel] text-sm font-semibold"
                        style={{ color: COLORS.navy }}
                      >
                        {name}
                      </p>

                      <p
                        className="mt-1 truncate font-[Fauna_One] text-xs"
                        style={{ color: COLORS.muted }}
                      >
                        {connection.type ||
                          connection.role ||
                          "Professional Partner"}
                      </p>
                    </div>

                    <Link
                      to="/messages"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:border-[#D83F87] hover:text-[#D83F87]"
                      style={{ borderColor: COLORS.border }}
                    >
                      <MessageSquare size={15} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          className="overflow-hidden border-[#E9E6EC] bg-white"
          padding={false}
        >
          <div className="flex items-center justify-between border-b border-[#E9E6EC] px-5 py-5">
            <div>
              <p
                className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em]"
                style={{ color: COLORS.primary }}
              >
                Updates
              </p>
              <h2
                className="mt-1 font-[Cinzel] text-lg font-semibold"
                style={{ color: COLORS.navy }}
              >
                Recent Notifications
              </h2>
            </div>

            <Link
              to="/notifications"
              className="flex items-center gap-1 font-[Unica_One] text-xs uppercase tracking-[0.08em]"
              style={{ color: COLORS.primary }}
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="You're all caught up"
                description="New requirement responses, connection updates and appointment activity will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E9E6EC]">
              {notifications.slice(0, 4).map((notification) => (
                <div
                  key={notification._id || notification.id}
                  className="flex gap-3 px-5 py-4"
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: notification.readAt
                        ? "#F5F3F6"
                        : "#FCE8F1",
                      color: notification.readAt
                        ? COLORS.muted
                        : COLORS.primary,
                    }}
                  >
                    {notification.type === "WARNING" ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Bell size={16} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="font-[Fauna_One] text-sm font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      {notification.title || "New notification"}
                    </p>

                    {notification.message && (
                      <p
                        className="mt-1 line-clamp-2 font-[Fauna_One] text-xs leading-5"
                        style={{ color: COLORS.muted }}
                      >
                        {notification.message}
                      </p>
                    )}

                    {notification.createdAt && (
                      <p
                        className="mt-2 font-[Unica_One] text-[9px] uppercase tracking-wide"
                        style={{ color: COLORS.muted }}
                      >
                        {formatDateTime(notification.createdAt)}
                      </p>
                    )}
                  </div>

                  {!notification.readAt && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS.primary }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* FINAL CTA */}
      <section
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(120deg, ${COLORS.purple}, ${COLORS.navy})`,
        }}
      >
        <div
          className="absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-white/70" />

              <p className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em] text-white/60">
                Procurement made simpler
              </p>
            </div>

            <h2 className="mt-2 font-[Cinzel] text-xl font-semibold text-white sm:text-2xl">
              Tell PharmUnis what your pharmacy needs.
            </h2>

            <p className="mt-2 max-w-2xl font-[Fauna_One] text-sm leading-6 text-white/60">
              Create a requirement and start building the right supplier
              relationships around it.
            </p>
          </div>

          <Link to="/requirements/create" className="shrink-0">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D83F87] px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.1em] text-white shadow-lg shadow-[#D83F87]/20 transition hover:bg-[#c93679] sm:w-auto"
            >
              <Plus size={17} />
              Create Requirement
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function GenericDashboard() {
  const { user } = useAuthStore();

  const [appointments, setAppointments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      http.get("/appointments").catch(() => []),
      http.get("/requirements").catch(() => []),
      http.get("/opportunities").catch(() => []),
      http.get("/notifications").catch(() => []),
    ])
      .then(([appointmentData, requirementData, opportunityData, notificationData]) => {
        if (!mounted) return;

        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
        setRequirements(Array.isArray(requirementData) ? requirementData : []);
        setOpportunities(Array.isArray(opportunityData) ? opportunityData : []);
        setNotifications(
          Array.isArray(notificationData) ? notificationData : []
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-8 shadow-xl sm:px-8 lg:px-10 lg:py-10"
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.purple})`,
        }}
      >
        <div
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div className="relative z-10">
          <p className="font-[Unica_One] text-[10px] uppercase tracking-[0.2em] text-white/50">
            PharmUnis Workspace
          </p>

          <h1 className="mt-3 font-[Cinzel] text-3xl font-semibold text-white sm:text-4xl">
            Welcome back.
          </h1>

          <p className="mt-3 max-w-2xl font-[Fauna_One] text-sm leading-7 text-white/65">
            Manage your professional activity, opportunities, appointments
            and relationships from one workspace.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          icon={CalendarClock}
          label="Appointments"
          value={appointments.length}
          href="/appointments"
        />

        <DashboardStat
          icon={FileText}
          label="Requirements"
          value={requirements.length}
          href="/requirements"
          iconClass="bg-[#F1ECFA] text-[#44318D]"
        />

        <DashboardStat
          icon={TrendingUp}
          label="Opportunities"
          value={opportunities.length}
          href="/opportunities"
          iconClass="bg-[#FDF0ED] text-[#E98074]"
        />

        <DashboardStat
          icon={Bell}
          label="Notifications"
          value={notifications.filter((item) => !item.readAt).length}
          href="/notifications"
          iconClass="bg-[#EEF5F5] text-[#2A1B3D]"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#E9E6EC] bg-white">
          <SectionHeader
            eyebrow="Activity"
            title="Appointments"
            action={
              <Link
                to="/appointments"
                className="font-[Unica_One] text-xs uppercase tracking-[0.08em]"
                style={{ color: COLORS.primary }}
              >
                View all
              </Link>
            }
          />

          {appointments.length === 0 ? (
            <EmptyState
              title="No appointments"
              description="Your upcoming professional meetings will appear here."
            />
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 4).map((appointment) => (
                <div
                  key={appointment._id || appointment.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: COLORS.border }}
                >
                  <div className="flex items-center gap-3">
                    <CalendarClock
                      size={17}
                      style={{ color: COLORS.primary }}
                    />

                    <div className="min-w-0">
                      <p
                        className="truncate font-[Cinzel] text-sm font-semibold"
                        style={{ color: COLORS.navy }}
                      >
                        {appointment.title ||
                          appointment.subject ||
                          "Appointment"}
                      </p>

                      <p
                        className="mt-1 font-[Fauna_One] text-xs"
                        style={{ color: COLORS.muted }}
                      >
                        {formatDateTime(
                          appointment.startAt ||
                            appointment.date ||
                            appointment.scheduledAt
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-[#E9E6EC] bg-white">
          <SectionHeader
            eyebrow="Updates"
            title="Notifications"
            action={
              <Link
                to="/notifications"
                className="font-[Unica_One] text-xs uppercase tracking-[0.08em]"
                style={{ color: COLORS.primary }}
              >
                View all
              </Link>
            }
          />

          {notifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You're all caught up."
            />
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div
                  key={notification._id || notification.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: COLORS.border }}
                >
                  <p
                    className="font-[Fauna_One] text-sm font-medium"
                    style={{ color: COLORS.navy }}
                  >
                    {notification.title || "Notification"}
                  </p>

                  {notification.message && (
                    <p
                      className="mt-1 font-[Fauna_One] text-xs leading-5"
                      style={{ color: COLORS.muted }}
                    >
                      {notification.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}