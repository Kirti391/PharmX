import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../lib/api";
import { Card, Loader, StatusBadge } from "../components/ui";
import { ConnectButton } from "../components/discovery";
import { format } from "date-fns";

export default function RequirementDetailPage() {
  const { id } = useParams();
  const [requirement, setRequirement] = useState(null);
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    http.get(`/requirements/${id}`).then(setRequirement).catch(() => {});
    http.get(`/matching/for-requirement/${id}`).then(setMatches).catch(() => setMatches([]));
  }, [id]);

  if (!requirement) return <Loader />;

  return (
    <div className="max-w-3xl">
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-medium bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">{requirement.category}</span>
            <h1 className="font-display text-xl font-semibold text-navy mt-3">{requirement.title}</h1>
            <p className="text-xs text-taupe mt-1">Posted {format(new Date(requirement.createdAt), "d MMM yyyy")}</p>
          </div>
          <StatusBadge status={requirement.status} />
        </div>
        <p className="text-taupedark mt-4 leading-relaxed">{requirement.description}</p>
      </Card>

      <h2 className="font-display font-semibold text-navy mb-4">Matched profiles</h2>
      {!matches ? (
        <Loader />
      ) : matches.length === 0 ? (
        <p className="text-taupe text-sm">No strong matches yet — check back as more profiles are added.</p>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Card key={`${m.targetType}-${m.targetId}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">{m.targetType.replaceAll("_", " ")}</span>
                    <h3 className="font-medium text-navy">{m.name}</h3>
                    <span className="text-xs text-tealdeep font-medium">{Math.round(m.score * 100)}% match</span>
                  </div>
                  <ul className="text-xs text-taupe mt-1.5 space-y-0.5">
                    {m.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                </div>
                <ConnectButton recipientUserId={m.userId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
