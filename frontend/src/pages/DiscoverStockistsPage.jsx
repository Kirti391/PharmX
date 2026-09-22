import { useEffect, useState } from "react";
import { http } from "../lib/api";
import { Card, EmptyState, Input, Loader, Select } from "../components/ui";
import { DiscoverTabs, ConnectButton } from "../components/discovery";

export default function DiscoverStockistsPage() {
  const [items, setItems] = useState(null);
  const [territory, setTerritory] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (territory) params.set("territory", territory);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    http.get(`/discover/stockists?${params}`).then(setItems).catch(() => setItems([]));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Discover</h1>
      <DiscoverTabs />
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Filter by service area…" value={territory} onChange={(e) => setTerritory(e.target.value)} className="max-w-xs" />
        <Input placeholder="Filter by category…" value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-xs" />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[160px]">
          <option value="">Stockist & Distributor</option>
          <option value="STOCKIST">Stockist only</option>
          <option value="DISTRIBUTOR">Distributor only</option>
        </Select>
        <button onClick={load} className="text-sm text-tealdeep font-medium px-3">
          Apply filters
        </button>
      </div>

      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState title="No stockists or distributors found" subtitle="Try broadening your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-navy">{s.companyName}</h3>
                    <span className="text-xs bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">{s.type}</span>
                    {s.businessVerified && <span className="text-xs bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">Verified</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {s.productCategories.map((cat) => (
                      <span key={cat} className="text-xs bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                    {s.serviceAreas.map((a) => (
                      <span key={a} className="text-xs bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <ConnectButton recipientUserId={s.userId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
