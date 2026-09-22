import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, EmptyState, Loader, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { formatDistanceToNow } from "date-fns";

const TYPE_LABELS = {
  MR_HIRING: "MR Hiring",
  TERRITORY_EXPANSION: "Territory Expansion",
  DISTRIBUTION: "Distribution",
  PRODUCT_PROMOTION: "Product Promotion",
};

export default function OpportunitiesPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState(null);

  useEffect(() => {
    http.get("/opportunities?status=OPEN").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Opportunities</h1>
          <p className="text-taupe text-sm mt-1">MR hiring, territory expansion, and distribution opportunities.</p>
        </div>
        {user?.role === "PHARMA_COMPANY" && (
          <Link to="/opportunities/create">
            <Button>Post opportunity</Button>
          </Link>
        )}
      </div>

      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState title="No open opportunities right now" subtitle="Check back soon, or post one if you're a pharma company." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((o) => (
            <Link key={o.id} to={`/opportunities/${o.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">{TYPE_LABELS[o.type]}</span>
                  <StatusBadge status={o.status} />
                </div>
                <h3 className="font-display font-semibold text-navy mt-3">{o.title}</h3>
                <p className="text-sm text-taupedark mt-1.5 line-clamp-2">{o.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {o.categories.map((c) => (
                    <span key={c} className="text-xs bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-taupe mt-3 block">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
