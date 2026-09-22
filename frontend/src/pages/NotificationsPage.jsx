import { useEffect, useState } from "react";
import { http } from "../lib/api";
import { Card, EmptyState, Loader } from "../components/ui";
import { Button } from "../components/ui";
import { useRealtimeEvent } from "../lib/socket";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [items, setItems] = useState(null);

  function load() {
    http.get("/notifications").then(setItems).catch(() => setItems([]));
  }
  useEffect(load, []);

  useRealtimeEvent("notification:new", (n) => {
    setItems((prev) => (prev ? [n, ...prev] : [n]));
  });

  async function markAllRead() {
    await http.patch("/notifications/read-all");
    load();
  }

  async function markRead(id) {
    await http.patch(`/notifications/${id}/read`);
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) ?? null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Notifications</h1>
        {items && items.some((n) => !n.readAt) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState title="You're all caught up" subtitle="New matches, messages, and appointment updates will show up here." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={n.readAt ? "opacity-70" : "border-l-4 border-sage"}>
              <button className="w-full text-left flex items-start gap-3" onClick={() => !n.readAt && markRead(n.id)}>
                <Bell size={16} className="text-tealdeep mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy">{n.title}</p>
                  <p className="text-sm text-taupedark mt-0.5">{n.body}</p>
                  <p className="text-xs text-taupe mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
