import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, EmptyState, Loader, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { formatDistanceToNow } from "date-fns";

const URGENCY_COLORS = { HIGH: "text-red-500", NORMAL: "text-taupe", LOW: "text-taupe/70" };

export default function RequirementsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState(null);

  useEffect(() => {
    http.get("/requirements?status=OPEN").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Requirements Marketplace</h1>
          <p className="text-taupe text-sm mt-1">Pharmacy needs, open for matching companies, MRs, and stockists.</p>
        </div>
        {user?.role === "PHARMACY" && (
          <Link to="/requirements/create">
            <Button>Post requirement</Button>
          </Link>
        )}
      </div>

      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState title="No open requirements right now" subtitle="Check back soon, or post your own if you're a pharmacy." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((r) => (
            <Link key={r.id} to={`/requirements/${r.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">{r.category}</span>
                  <span className={`text-xs font-medium ${URGENCY_COLORS[r.urgency]}`}>{r.urgency} urgency</span>
                </div>
                <h3 className="font-display font-semibold text-navy mt-3">{r.title}</h3>
                <p className="text-sm text-taupedark mt-1.5 line-clamp-2">{r.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-taupe">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                  <StatusBadge status={r.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
