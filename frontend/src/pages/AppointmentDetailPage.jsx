import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, ErrorState, Label, Loader, Select, StatusBadge, TextArea } from "../components/ui";
import { Button } from "../components/ui";
import { DISRUPTION_REASONS } from "../lib/constants";
import { format } from "date-fns";

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState(DISRUPTION_REASONS[0]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("UNSAFE_CONDUCT");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  function load() {
    http
      .get(`/appointments/${id}`)
      .then(setAppointment)
      .catch((requestError) => {
        setError(apiErrorMessage(requestError, "Unable to load this appointment."));
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !appointment) return <Loader />;
  if (!appointment && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          load();
        }}
      />
    );
  }
  if (!appointment) return <Loader />;

  const other = appointment.requester?.userId === user?.id ? appointment.recipient : appointment.requester;
  const isDoctorRecipient =
    appointment.status === "REQUESTED" &&
    user?.role === "DOCTOR" &&
    appointment.recipient?.userId === user?.id;
  const isRequestOwner =
    appointment.status === "REQUESTED" &&
    appointment.requester?.userId === user?.id;
  const isActive = ![
    "REQUESTED",
    "DECLINED",
    "CANCELLED",
    "COMPLETED",
  ].includes(appointment.status);
  const canBlockOther =
    user?.role === "DOCTOR" &&
    Boolean(other?.userId) &&
    !["DECLINED", "CANCELLED", "COMPLETED"].includes(
      appointment.status
    );

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

  async function blockOther() {
    if (!other?.userId) return;
    if (
      !window.confirm(
        "Block this contact? They will no longer be able to find you, request appointments, or message you."
      )
    ) {
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await http.post("/profiles/doctor/blocked-users", {
        targetUserId: other.userId,
      });
      if (appointment.status === "REQUESTED") {
        setAppointment(
          await http.patch(`/appointments/${id}/status`, {
            status: "DECLINED",
          })
        );
      } else if (isActive) {
        setAppointment(
          await http.patch(`/appointments/${id}/status`, {
            status: "CANCELLED",
          })
        );
      }
    } catch (requestError) {
      setError(
        apiErrorMessage(
          requestError,
          "Unable to block this professional contact."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!other?.userId) return;

    setError(null);
    setBusy(true);
    try {
      await http.post("/reports", {
        targetUserId: other.userId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSubmitted(true);
      setShowReportForm(false);
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Unable to submit your report.")
      );
    } finally {
      setBusy(false);
    }
  }

  const iProposedReschedule = appointment.pendingReschedule?.proposedByUserId === user?.id;

  return (
    <div className="max-w-3xl space-y-5">
      <Card className="border-[#E9E2EA]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-primary">Appointment details</p>
            <h1 className="mt-2 font-display text-xl font-semibold text-navy sm:text-2xl">Appointment with {other?.name ?? "Unknown"}</h1>
            <p className="mt-2 text-sm text-[#6E6658]">{format(new Date(appointment.scheduledAt), "EEEE d MMMM yyyy, h:mm a")}</p>
            <p className="mt-1 text-xs text-[#8C8496]">
              {appointment.mode === "VIDEO" ? "Video call" : "Physical visit"} · {appointment.durationMinutes} min
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        {appointment.purposeCategory && (
          <p className="mt-4 border-t border-[#E9E2EA] pt-4 text-xs font-medium text-purple">
            Professional category: {appointment.purposeCategory}
          </p>
        )}
        {appointment.notes && <p className="mt-2 text-sm leading-6 text-[#6E6658]">{appointment.notes}</p>}
        {appointment.disruptionReason && (
          <p className="text-sm text-red-500 mt-3">Disruption reason: {appointment.disruptionReason.toLowerCase().replaceAll("_", " ")}</p>
        )}
      </Card>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {isDoctorRecipient && (
        <Card className="border-[#E9E2EA]">
          <h2 className="mb-2 font-display font-semibold text-navy">
            Review professional request
          </h2>
          <p className="mb-4 text-sm leading-6 text-[#6E6658]">
            Review the sender, stated category and purpose before accepting.
            No appointment is confirmed until you accept.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() => setStatus("CONFIRMED")}
            >
              Accept request
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => setStatus("DECLINED")}
            >
              Decline request
            </Button>
          </div>
        </Card>
      )}

      {canBlockOther && (
        <Card className="border-[#E9E2EA]">
          <h2 className="mb-2 font-display font-semibold text-navy">
            Safety controls
          </h2>
          <p className="mb-4 text-sm leading-6 text-[#6E6658]">
            Blocking this contact also declines a pending request or cancels
            this active appointment.
          </p>
          <Button
            variant="danger"
            disabled={busy}
            onClick={blockOther}
          >
            Block contact
          </Button>
        </Card>
      )}

      {other?.userId && other.userId !== user?.id && (
        <Card className="border-[#E9E2EA]">
          <h2 className="mb-2 font-display font-semibold text-navy">
            Report a concern
          </h2>
          {reportSubmitted ? (
            <p className="text-sm leading-6 text-[#6E6658]">
              Your report was sent to the PharmX moderation team.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm leading-6 text-[#6E6658]">
                Report unsafe, fraudulent, or inappropriate behavior for
                confidential review by PharmX administrators.
              </p>
              {!showReportForm ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setShowReportForm(true)}
                >
                  Report contact
                </Button>
              ) : (
                <form onSubmit={submitReport} className="space-y-4">
                  <div>
                    <Label>Reason</Label>
                    <Select
                      value={reportReason}
                      onChange={(event) =>
                        setReportReason(event.target.value)
                      }
                    >
                      <option value="HARASSMENT">Harassment</option>
                      <option value="FRAUD">Fraud or misrepresentation</option>
                      <option value="UNSAFE_CONDUCT">Unsafe conduct</option>
                      <option value="SPAM">Spam</option>
                      <option value="PRIVACY">Privacy concern</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Details (optional)</Label>
                    <TextArea
                      rows={3}
                      maxLength={1000}
                      value={reportDetails}
                      onChange={(event) =>
                        setReportDetails(event.target.value)
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>
                      Submit report
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setShowReportForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </Card>
      )}

      {isRequestOwner && (
        <Card className="border-[#E9E2EA]">
          <p className="text-sm leading-6 text-[#6E6658]">
            Your request is awaiting the doctor&apos;s decision. The meeting is
            not confirmed yet.
          </p>
          <Button
            className="mt-4"
            variant="danger"
            disabled={busy}
            onClick={() => setStatus("CANCELLED")}
          >
            Cancel request
          </Button>
        </Card>
      )}

      {isActive && (
        <Card className="border-[#E9E2EA]">
          <h2 className="mb-4 font-display font-semibold text-navy">Update status</h2>
          <div className="mb-5 flex flex-wrap gap-2">
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

          <h3 className="mb-2 text-sm font-medium text-navy">Need to reschedule?</h3>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
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
        <Card className={iProposedReschedule ? "border-[#E9E2EA] bg-[#EFEBF9]" : "border-[#E98074]/25 bg-[#FCF4F0]"}>
          {iProposedReschedule ? (
            <>
              <p className="text-sm text-[#6E6658]">Waiting for {other?.name} to confirm one of these times:</p>
              <ul className="mt-3 space-y-1 text-sm text-navy">
                {appointment.pendingReschedule.proposedSlots.map((s) => (
                  <li key={s}>• {format(new Date(s), "EEE d MMM, h:mm a")}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-[#6E6658]">{other?.name} suggested these new times — pick one to confirm:</p>
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
