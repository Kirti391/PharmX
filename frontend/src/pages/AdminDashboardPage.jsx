import { useEffect, useState } from "react";
import { http } from "../lib/api";
import { Card, Loader } from "../components/ui";

function Breakdown({ title, rows, labelKey }) {
  return (
    <Card>
      <h3 className="font-display font-semibold text-navy mb-3">{title}</h3>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-taupe">{String(r[labelKey]).replaceAll("_", " ")}</span>
            <span className="font-medium text-navy">{r.count}</span>
          </li>
        ))}
        {rows.length === 0 && <p className="text-taupe text-sm">No data yet</p>}
      </ul>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    http.get("/admin/analytics/overview").then(setOverview).catch(() => {});
  }, []);

  if (!overview) return <Loader />;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Platform Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Breakdown title="Users by role" rows={overview.usersByRole} labelKey="role" />
        <Breakdown title="Users by status" rows={overview.usersByStatus} labelKey="status" />
        <Breakdown title="Requirements" rows={overview.requirementsByStatus} labelKey="status" />
        <Breakdown title="Opportunities" rows={overview.opportunitiesByStatus} labelKey="status" />
        <Breakdown title="Appointments" rows={overview.appointmentsByStatus} labelKey="status" />
        <Card>
          <h3 className="font-display font-semibold text-navy mb-3">Total messages sent</h3>
          <p className="text-3xl font-display font-bold text-tealdeep">{overview.totalMessages}</p>
        </Card>
      </div>
    </div>
  );
}
