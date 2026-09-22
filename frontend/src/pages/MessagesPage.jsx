import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../lib/api";
import { Card, EmptyState, Loader } from "../components/ui";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
  const startWith = search.get("with");

  useEffect(() => {
    http.get("/conversations").then(setConversations).catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    if (!startWith) return;
    http.post("/conversations", { participantId: startWith }).then((conv) => {
      navigate(`/messages/${conv.id}`, { replace: true });
    });
  }, [startWith, navigate]);

  if (startWith) return <Loader />;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Messages</h1>
      {!conversations ? (
        <Loader />
      ) : conversations.length === 0 ? (
        <EmptyState title="No conversations yet" subtitle="Start one from a connection's profile." />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} to={`/messages/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">{c.otherParticipant?.name ?? "Unknown"}</p>
                    <p className="text-xs text-taupe">{c.otherParticipant?.role.replaceAll("_", " ")}</p>
                  </div>
                  {c.lastMessageAt && <span className="text-xs text-taupe">{formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
