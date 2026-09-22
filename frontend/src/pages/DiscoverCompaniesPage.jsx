import { useEffect, useState } from "react";
import { http } from "../lib/api";
import { Card, EmptyState, Input, Loader } from "../components/ui";
import { DiscoverTabs, ConnectButton } from "../components/discovery";

export default function DiscoverCompaniesPage() {
  const [items, setItems] = useState(null);
  const [territory, setTerritory] = useState("");
  const [category, setCategory] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (territory) params.set("territory", territory);
    if (category) params.set("category", category);
    http.get(`/discover/companies?${params}`).then(setItems).catch(() => setItems([]));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Discover</h1>
      <DiscoverTabs />
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Filter by territory…" value={territory} onChange={(e) => setTerritory(e.target.value)} className="max-w-xs" />
        <Input placeholder="Filter by category…" value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-xs" />
        <button onClick={load} className="text-sm text-tealdeep font-medium px-3">
          Apply filters
        </button>
      </div>

      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState title="No companies found" subtitle="Try broadening your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-navy">{c.companyName}</h3>
                  {c.manufacturingLocation && <p className="text-xs text-taupe mt-0.5">{c.manufacturingLocation}</p>}
                  {c.description && <p className="text-sm text-taupedark mt-2">{c.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.productCategories.map((cat) => (
                      <span key={cat} className="text-xs bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <ConnectButton recipientUserId={c.userId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
