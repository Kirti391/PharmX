import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../lib/api";
import { Card, EmptyState, Loader } from "../components/ui";
import { Button } from "../components/ui";
import { useAuthStore } from "../store/authStore";

export default function ConnectionsPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState("requests");
  const [connections, setConnections] = useState(null);
  const [requests, setRequests] = useState(null);

  function loadAll() {
    http.get("/connections").then(setConnections).catch(() => setConnections([]));
    http.get("/connections/requests").then(setRequests).catch(() => setRequests([]));
  }
  useEffect(loadAll, []);

  async function respond(id, action) {
    await http.patch(`/connections/${id}/${action}`);
    loadAll();
  }

  const list = tab === "connections" ? connections : requests;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Connections</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "requests" ? "bg-navy text-white" : "bg-white text-taupe"}`}
        >
          Requests {requests && requests.length > 0 ? `(${requests.length})` : ""}
        </button>
        <button
          onClick={() => setTab("connections")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "connections" ? "bg-navy text-white" : "bg-white text-taupe"}`}
        >
          My connections
        </button>
      </div>

      {!list ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState title={tab === "requests" ? "No pending requests" : "No connections yet"} subtitle="Browse Discover to connect with the ecosystem." />
      ) : (
        <div className="space-y-3">
          {list.map((c) => {
            const other = tab === "requests" ? c.requester : c.requester?.userId === user?.id ? c.recipient : c.requester;
            return (
              <Card key={c.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">{other?.name ?? "Unknown"}</p>
                    <p className="text-xs text-taupe">{other?.role.replaceAll("_", " ")}</p>
                    {c.message && <p className="text-sm text-taupedark mt-1">"{c.message}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {tab === "requests" ? (
                      <>
                        <Button size="sm" onClick={() => respond(c.id, "accept")}>
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => respond(c.id, "decline")}>
                          Decline
                        </Button>
                      </>
                    ) : (
                      other && (
                        <Link to={`/messages?with=${other.userId}`}>
                          <Button size="sm" variant="ghost">
                            Message
                          </Button>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
