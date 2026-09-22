import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, EmptyState, Input, Label, Loader, Select, StatusBadge, TextArea } from "../components/ui";
import { Button } from "../components/ui";
import { format } from "date-fns";

export default function AppointmentsPage() {
  const [search] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState(null);
  const [connections, setConnections] = useState([]);
  const [showForm, setShowForm] = useState(!!search.get("with"));

  const [recipientId, setRecipientId] = useState(search.get("with") || "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState("PHYSICAL");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function loadAppointments() {
    http.get("/appointments").then(setAppointments).catch(() => setAppointments([]));
  }

  useEffect(() => {
    loadAppointments();
    http.get("/connections").then(setConnections).catch(() => setConnections([]));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await http.post("/appointments", {
        recipientId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        mode,
        notes: notes || undefined,
      });
      setShowForm(false);
      setNotes("");
      loadAppointments();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to book appointment"));
    } finally {
      setLoading(false);
    }
  }

  const sorted = (appointments || []).slice().sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Appointments</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Book appointment"}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>With</Label>
              <Select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required>
                <option value="">Select a connection…</option>
                {connections.map((c) => {
                  const other = c.requester?.userId === user?.id ? c.recipient : c.requester;
                  if (!other) return null;
                  return (
                    <option key={other.userId} value={other.userId}>
                      {other.name} ({other.role.replaceAll("_", " ")})
                    </option>
                  );
                })}
              </Select>
              {connections.length === 0 && <p className="text-xs text-taupe mt-1">Connect with someone first from Discover.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date & time</Label>
                <Input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="PHYSICAL">Physical visit</option>
                  <option value="VIDEO">Video call</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" loading={loading}>
              Request appointment
            </Button>
          </form>
        </Card>
      )}

      {!appointments ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <EmptyState title="No appointments yet" subtitle="Book one with any of your connections." />
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const other = a.requester?.userId === user?.id ? a.recipient : a.requester;
            return (
              <Link key={a.id} to={`/appointments/${a.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-navy">{other?.name ?? "Unknown"}</p>
                      <p className="text-xs text-taupe">
                        {format(new Date(a.scheduledAt), "EEE d MMM yyyy, h:mm a")} · {a.mode === "VIDEO" ? "Video call" : "Physical visit"}
                      </p>
                      {a.disruptionReason && <p className="text-xs text-red-500 mt-1">Reason: {a.disruptionReason.toLowerCase()}</p>}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
