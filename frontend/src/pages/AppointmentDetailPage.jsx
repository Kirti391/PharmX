import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, Label, Loader, Select, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { DISRUPTION_REASONS } from "../lib/constants";
import { format } from "date-fns";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [appointment, setAppointment] = useState(null);
  const [reason, setReason] = useState(DISRUPTION_REASONS[0]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    http.get(`/appointments/${id}`).then(setAppointment).catch(() => {});
  }
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!appointment) return <Loader />;

  const other = appointment.requester?.userId === user?.id ? appointment.recipient : appointment.requester;
  const isActive = !["CANCELLED", "COMPLETED"].includes(appointment.status);

  async function setStatus(status, disruptionReason) {
    setError(null);
    setBusy(true);
    try {
      const updated = await http.patch(`/appointments/${id}/status`, { status, disruptionReason });
      setAppointment(updated);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update"));
    } finally {
      setBusy(false);
    }
  }

  async function requestReschedule() {
    setError(null);
    setBusy(true);
    try {
      await http.post(`/appointments/${id}/reschedule`, { reason });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to request reschedule"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmSlot(slot) {
    if (!appointment.pendingReschedule) return;
    setError(null);
    setBusy(true);
    try {
      const updated = await http.patch(`/appointments/${id}/reschedule/${appointment.pendingReschedule.id}/confirm`, {
        acceptedSlot: slot,
      });
      setAppointment(updated);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to confirm slot"));
    } finally {
      setBusy(false);
    }
  }

  const iProposedReschedule = appointment.pendingReschedule?.proposedByUserId === user?.id;

  return (
    <div className="max-w-2xl">
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-navy">Appointment with {other?.name ?? "Unknown"}</h1>
            <p className="text-sm text-taupedark mt-1">{format(new Date(appointment.scheduledAt), "EEEE d MMMM yyyy, h:mm a")}</p>
            <p className="text-xs text-taupe mt-1">
              {appointment.mode === "VIDEO" ? "Video call" : "Physical visit"} · {appointment.durationMinutes} min
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        {appointment.notes && <p className="text-sm text-taupedark mt-4 border-t border-taupedark/10 pt-4">{appointment.notes}</p>}
        {appointment.disruptionReason && (
          <p className="text-sm text-red-500 mt-3">Disruption reason: {appointment.disruptionReason.toLowerCase().replaceAll("_", " ")}</p>
        )}
      </Card>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {isActive && (
        <Card className="mb-6">
          <h2 className="font-display font-semibold text-navy mb-4">Update status</h2>
          <div className="flex flex-wrap gap-2 mb-5">
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("RUNNING_LATE", "TRAFFIC")}>
              Mark running late
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("EMERGENCY", "EMERGENCY")}>
              Report emergency
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("COMPLETED")}>
              Mark completed
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => setStatus("CANCELLED")}>
              Cancel
            </Button>
          </div>

          <h3 className="text-sm font-medium text-taupedark mb-2">Need to reschedule?</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Reason</Label>
              <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                {DISRUPTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" disabled={busy} onClick={requestReschedule}>
              Suggest new times
            </Button>
          </div>
        </Card>
      )}

      {appointment.pendingReschedule && (
        <Card className={iProposedReschedule ? "bg-tealdeep/5 border-tealdeep/20" : "bg-amber-50 border-amber-200"}>
          {iProposedReschedule ? (
            <>
              <p className="text-sm text-taupedark">Waiting for {other?.name} to confirm one of these times:</p>
              <ul className="mt-3 space-y-1 text-sm text-navy">
                {appointment.pendingReschedule.proposedSlots.map((s) => (
                  <li key={s}>• {format(new Date(s), "EEE d MMM, h:mm a")}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="text-sm text-taupedark mb-3">{other?.name} suggested these new times — pick one to confirm:</p>
              <div className="flex flex-wrap gap-2">
                {appointment.pendingReschedule.proposedSlots.map((s) => (
                  <Button key={s} size="sm" disabled={busy} onClick={() => confirmSlot(s)}>
                    {format(new Date(s), "EEE d MMM, h:mm a")}
                  </Button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
