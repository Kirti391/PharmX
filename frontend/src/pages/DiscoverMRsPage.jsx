import { useEffect, useState } from "react";
import { http } from "../lib/api";
import { Card, EmptyState, Input, Loader, Select, StatusBadge } from "../components/ui";
import { DiscoverTabs, ConnectButton } from "../components/discovery";

export default function DiscoverMRsPage() {
  const [items, setItems] = useState(null);
  const [territory, setTerritory] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [workMode, setWorkMode] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (territory) params.set("territory", territory);
    if (specialization) params.set("specialization", specialization);
    if (workMode) params.set("workMode", workMode);
    http.get(`/discover/mrs?${params}`).then(setItems).catch(() => setItems([]));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Discover</h1>
      <DiscoverTabs />
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Filter by territory…" value={territory} onChange={(e) => setTerritory(e.target.value)} className="max-w-xs" />
        <Input placeholder="Filter by specialization…" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="max-w-xs" />
        <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="max-w-[160px]">
          <option value="">Any work mode</option>
          <option value="FIELD">Field</option>
          <option value="HYBRID">Hybrid</option>
          <option value="REMOTE">Remote</option>
        </Select>
        <button onClick={load} className="text-sm text-tealdeep font-medium px-3">
          Apply filters
        </button>
      </div>

      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState title="No MRs found" subtitle="Try broadening your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((mr) => (
            <Card key={mr.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-navy">{mr.fullName}</h3>
                    {mr.isIndependent && <span className="text-xs bg-tealdeep/10 text-tealdeep px-2 py-0.5 rounded-full">Independent</span>}
                  </div>
                  <p className="text-xs text-taupe mt-0.5">
                    {mr.experienceYears} yrs experience · {mr.workMode.toLowerCase()}
                  </p>
                  {mr.bio && <p className="text-sm text-taupedark mt-2">{mr.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {mr.specializations.map((s) => (
                      <span key={s} className="text-xs bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {mr.territories.map((t) => (
                      <span key={t} className="text-xs bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={mr.availabilityStatus === "AVAILABLE" ? "ACTIVE" : "PENDING"} />
                  </div>
                </div>
                <ConnectButton recipientUserId={mr.userId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
