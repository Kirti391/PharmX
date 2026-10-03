import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, RefreshCw } from "lucide-react";
import { Button, Card, EmptyState, Input, Label, Loader, Select, StatusBadge, TextArea } from "../components/ui";
import { apiErrorMessage, http } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const STAGES = [
  "NEW",
  "REVIEWED",
  "CONTACT_REQUESTED",
  "CONNECTED",
  "CONVERSATION_STARTED",
  "APPOINTMENT_REQUESTED",
  "APPOINTMENT_SCHEDULED",
  "APPOINTMENT_COMPLETED",
  "QUALIFIED",
  "FOLLOW_UP",
  "PARTNERSHIP_DISCUSSION",
  "CONVERTED",
  "CLOSED_WON",
  "CLOSED_LOST",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "DUPLICATE",
  "DISQUALIFIED",
  "EXPIRED",
  "REPORTED",
  "SUSPENDED",
];

const CLOSED_STAGES = new Set([
  "CLOSED_WON",
  "CLOSED_LOST",
  "NOT_INTERESTED",
  "UNREACHABLE",
  "DUPLICATE",
  "DISQUALIFIED",
  "EXPIRED",
  "REPORTED",
  "SUSPENDED",
]);

function getConnectionTarget(connection, userId) {
  if (String(connection.requester?.userId) === String(userId)) {
    return connection.recipient;
  }
  if (String(connection.recipient?.userId) === String(userId)) {
    return connection.requester;
  }
  return null;
}

function displayName(profile) {
  return (
    profile?.name ||
    profile?.fullName ||
    profile?.companyName ||
    profile?.businessName ||
    "Healthcare partner"
  );
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function LeadCard({ lead, onChanged }) {
  const [stage, setStage] = useState(lead.stage);
  const [reason, setReason] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const closed = CLOSED_STAGES.has(lead.stage);

  async function updateStage(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await http.patch(`/leads/${lead.id}/stage`, {
        stage,
        reason: reason || undefined,
      });
      setReason("");
      await onChanged();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update lead stage."));
    } finally {
      setBusy(false);
    }
  }

  async function createFollowUp(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await http.post(`/leads/${lead.id}/follow-ups`, {
        dueAt: new Date(followUpAt).toISOString(),
        notes: followUpNotes || undefined,
      });
      setFollowUpAt("");
      setFollowUpNotes("");
      await onChanged();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to schedule follow-up."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">{lead.title}</h2>
          <p className="mt-1 text-sm text-taupedark">
            {displayName(lead.target)} · {String(lead.target?.role || "").replaceAll("_", " ")}
          </p>
          {lead.ownerCompanyName && (
            <p className="mt-1 text-xs text-taupe">Company: {lead.ownerCompanyName}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={lead.stage} />
          <StatusBadge status={lead.priority} />
        </div>
      </div>

      {(lead.category || lead.territory) && (
        <p className="text-sm text-taupe">
          {[lead.category, lead.territory].filter(Boolean).join(" · ")}
        </p>
      )}
      {lead.notes && <p className="whitespace-pre-wrap text-sm text-taupedark">{lead.notes}</p>}
      {lead.closeReason && (
        <p className="text-sm text-taupe">Closure reason: {lead.closeReason}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-taupe">
        <span>Last contact: {formatDate(lead.lastContactAt)}</span>
        <span>Next follow-up: {formatDate(lead.nextFollowUpAt)}</span>
        <span>Updated: {formatDate(lead.updatedAt)}</span>
      </div>

      {!closed && (
        <div className="grid gap-4 border-t border-taupedark/10 pt-4 lg:grid-cols-2">
          <form onSubmit={updateStage} className="space-y-3">
            <Label htmlFor={`stage-${lead.id}`}>Pipeline stage</Label>
            <Select
              id={`stage-${lead.id}`}
              value={stage}
              onChange={(event) => setStage(event.target.value)}
            >
              {STAGES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            {CLOSED_STAGES.has(stage) && (
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Required closure reason"
                maxLength={1000}
                required
              />
            )}
            <Button type="submit" size="sm" loading={busy}>Save stage</Button>
          </form>

          <form onSubmit={createFollowUp} className="space-y-3">
            <Label htmlFor={`follow-up-${lead.id}`}>Schedule follow-up</Label>
            <Input
              id={`follow-up-${lead.id}`}
              type="datetime-local"
              value={followUpAt}
              onChange={(event) => setFollowUpAt(event.target.value)}
              required
            />
            <TextArea
              value={followUpNotes}
              onChange={(event) => setFollowUpNotes(event.target.value)}
              placeholder="Follow-up notes (optional)"
              rows={2}
              maxLength={2000}
            />
            <Button type="submit" size="sm" variant="secondary" loading={busy}>
              <CalendarClock size={15} /> Add reminder
            </Button>
          </form>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export default function LeadsPage() {
  const user = useAuthStore((state) => state.user);
  const [leads, setLeads] = useState(null);
  const [connections, setConnections] = useState([]);
  const [authorizations, setAuthorizations] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [territory, setTerritory] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    const requests = [
      http.get("/leads"),
      http.get("/connections"),
      http.get("/leads/follow-ups"),
    ];
    if (user?.role === "MR") requests.push(http.get("/authorizations"));
    const [leadRows, connectionRows, followUpRows, authorizationRows = []] =
      await Promise.all(requests);
    return {
      leads: leadRows,
      connections: connectionRows,
      followUps: followUpRows,
      authorizations: authorizationRows.filter(
        (row) => row.status === "ACTIVE" && new Date(row.expiresAt) > new Date()
      ),
    };
  }, [user?.role]);

  const refreshData = useCallback(async () => {
    const data = await fetchData();
    setLeads(data.leads);
    setConnections(data.connections);
    setFollowUps(data.followUps);
    setAuthorizations(data.authorizations);
  }, [fetchData]);

  useEffect(() => {
    let mounted = true;
    fetchData()
      .then((data) => {
        if (!mounted) return;
        setLeads(data.leads);
        setConnections(data.connections);
        setFollowUps(data.followUps);
        setAuthorizations(data.authorizations);
      })
      .catch((requestError) => {
        if (!mounted) return;
        setError(apiErrorMessage(requestError, "Unable to load lead workspace."));
        setLeads([]);
      });
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const connectedProfiles = connections
    .map((connection) => getConnectionTarget(connection, user?.id))
    .filter((profile) => profile && profile.role !== "DOCTOR");

  const pendingFollowUps = followUps;

  async function createLead(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await http.post("/leads", {
        targetUserId,
        ...(user?.role === "MR" ? { companyId } : {}),
        title,
        source: "CONNECTION",
        category: category || undefined,
        territory: territory || undefined,
        priority,
        notes: notes || undefined,
      });
      setTitle("");
      setCategory("");
      setTerritory("");
      setPriority("NORMAL");
      setNotes("");
      setShowCreate(false);
      await refreshData();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to create lead."));
    } finally {
      setBusy(false);
    }
  }

  async function updateFollowUp(id, status) {
    setError("");
    try {
      await http.patch(`/leads/follow-ups/${id}`, { status });
      await refreshData();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update follow-up."));
    }
  }

  if (leads === null) return <Loader />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Leads & follow-ups</h1>
          <p className="mt-1 max-w-2xl text-sm text-taupe">
            Keep track of professional relationships and reminders. Leads are limited to accepted connections and authorized company scope.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => refreshData().catch((e) => setError(apiErrorMessage(e, "Unable to refresh leads.")))}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={() => setShowCreate((visible) => !visible)}>
            <Plus size={16} /> {showCreate ? "Cancel" : "New lead"}
          </Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {showCreate && (
        <Card>
          <form onSubmit={createLead} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="lead-contact">Accepted connection</Label>
              <Select
                id="lead-contact"
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
                required
              >
                <option value="">Choose a contact</option>
                {connectedProfiles.map((profile) => (
                  <option key={profile.userId} value={profile.userId}>
                    {displayName(profile)} · {String(profile.role).replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              {connectedProfiles.length === 0 && (
                <p className="mt-1 text-xs text-taupe">Accept a connection before recording a lead.</p>
              )}
            </div>
            {user?.role === "MR" && (
              <div>
                <Label htmlFor="lead-company">Authorized company</Label>
                <Select
                  id="lead-company"
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  required
                >
                  <option value="">Choose an active authorization</option>
                  {authorizations.map((authorization) => (
                    <option key={authorization.id} value={authorization.companyId}>
                      {authorization.companyName}
                    </option>
                  ))}
                </Select>
                {authorizations.length === 0 && (
                  <p className="mt-1 text-xs text-taupe">An active company authorization is required.</p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="lead-title">Lead title</Label>
              <Input id="lead-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={160} required />
            </div>
            <div>
              <Label htmlFor="lead-priority">Priority</Label>
              <Select id="lead-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="lead-category">Product category (optional)</Label>
              <Input id="lead-category" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="lead-territory">Territory (optional)</Label>
              <Input id="lead-territory" value={territory} onChange={(event) => setTerritory(event.target.value)} maxLength={120} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="lead-notes">Notes (optional)</Label>
              <TextArea id="lead-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={5000} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" loading={busy} disabled={!connectedProfiles.length || (user?.role === "MR" && !authorizations.length)}>
                Create lead
              </Button>
            </div>
          </form>
        </Card>
      )}

      {pendingFollowUps.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-navy">
            <CalendarClock size={18} /> Open follow-ups
          </h2>
          <div className="space-y-3">
            {pendingFollowUps.map((followUp) => (
              <div key={followUp.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-taupedark/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-navy">{followUp.leadTitle}</p>
                  <p className="text-sm text-taupe">{formatDate(followUp.dueAt)}{followUp.notes ? ` · ${followUp.notes}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateFollowUp(followUp.id, "COMPLETED")}>Mark complete</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateFollowUp(followUp.id, "CANCELLED")}>Cancel</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-navy">Pipeline ({leads.length})</h2>
        {leads.length === 0 ? (
          <Card>
            <EmptyState title="No leads yet" subtitle="Create a lead from an accepted professional connection to start tracking its progress." />
          </Card>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} onChanged={refreshData} />)
        )}
      </section>
    </div>
  );
}
