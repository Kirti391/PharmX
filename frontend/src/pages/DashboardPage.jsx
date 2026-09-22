import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, EmptyState, Loader, StatusBadge } from "../components/ui";
import { CalendarClock, ClipboardList, Briefcase, Bell, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    http.get("/appointments").then(setAppointments).catch(() => setAppointments([]));
    http.get("/requirements").then(setRequirements).catch(() => setRequirements([]));
    http.get("/opportunities").then(setOpportunities).catch(() => setOpportunities([]));
    http.get("/notifications").then(setNotifications).catch(() => setNotifications([]));
  }, []);

  const upcoming = (appointments || [])
    .filter((a) => new Date(a.scheduledAt).getTime() > Date.now() && a.status !== "CANCELLED")
    .slice(0, 4);

  const canPostRequirement = user?.role === "PHARMACY";
  const canPostOpportunity = user?.role === "PHARMA_COMPANY";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">
          Welcome back{user ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-taupe text-sm mt-1">Here's what's happening across your PharmX network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={CalendarClock} label="Upcoming appointments" value={upcoming.length} href="/appointments" />
        <StatCard icon={ClipboardList} label="Open requirements" value={requirements?.length ?? "…"} href="/requirements" />
        <StatCard icon={Briefcase} label="Open opportunities" value={opportunities?.length ?? "…"} href="/opportunities" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy">Upcoming appointments</h2>
            <Link to="/appointments" className="text-tealdeep text-sm font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!appointments ? (
            <Loader />
          ) : upcoming.length === 0 ? (
            <EmptyState title="No upcoming appointments" subtitle="Book one from a connection's profile." />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((a) => {
                const other = a.requester?.userId === user?.id ? a.recipient : a.requester;
                return (
                  <li key={a.id} className="flex items-center justify-between border-b border-taupedark/5 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{other?.name ?? "Unknown"}</p>
                      <p className="text-xs text-taupe">{format(new Date(a.scheduledAt), "EEE d MMM, h:mm a")}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy">Recent notifications</h2>
            <Link to="/notifications" className="text-tealdeep text-sm font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!notifications ? (
            <Loader />
          ) : notifications.length === 0 ? (
            <EmptyState title="You're all caught up" />
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="flex items-start gap-3 border-b border-taupedark/5 pb-3 last:border-0 last:pb-0">
                  <Bell size={16} className="text-tealdeep mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{n.title}</p>
                    <p className="text-xs text-taupe line-clamp-2">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(canPostRequirement || canPostOpportunity) && (
        <Card className="bg-navy text-white border-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold text-lg">
                {canPostRequirement ? "Need a supplier or MR?" : "Looking to expand your territory?"}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                {canPostRequirement
                  ? "Post a requirement and let matching MRs, companies, and distributors come to you."
                  : "Post an opportunity and reach available MRs matched to your categories and territories."}
              </p>
            </div>
            <Link
              to={canPostRequirement ? "/requirements/create" : "/opportunities/create"}
              className="bg-sage text-navy font-semibold px-5 py-2.5 rounded-lg whitespace-nowrap text-center"
            >
              {canPostRequirement ? "Post requirement" : "Post opportunity"}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href }) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-sage/15 flex items-center justify-center">
            <Icon className="text-tealdeep" size={22} />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-navy">{value}</p>
            <p className="text-xs text-taupe">{label}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
