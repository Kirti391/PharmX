import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, EmptyState, ErrorState, Input, Label, Loader, Select, StatusBadge, TextArea } from "../components/ui";
import { Button } from "../components/ui";
import { format } from "date-fns";
import { PRODUCT_CATEGORIES } from "../lib/constants";
import { CalendarDays, Clock3 } from "lucide-react";

export default function AppointmentsPage() {
  const [search] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState(null);
  const [appointmentLoadError, setAppointmentLoadError] = useState("");
  const [connections, setConnections] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(!!search.get("with"));

  const [recipientId, setRecipientId] = useState(search.get("with") || "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState("PHYSICAL");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [purposeCategory, setPurposeCategory] = useState(search.get("category") || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const canRequestAppointment = [
    "PHARMACY",
    "MR",
    "PHARMA_COMPANY",
    "DISTRIBUTOR_STOCKIST",
  ].includes(user?.role);

  const selectedDoctor = doctors.find(
    (doctor) => doctor.userId === recipientId
  );
  const selectedMode =
    selectedDoctor?.communicationModes?.includes(mode)
      ? mode
      : selectedDoctor?.communicationModes?.[0] || mode;

  function loadAppointments() {
    http
      .get("/appointments")
      .then(setAppointments)
      .catch((requestError) => {
        setAppointmentLoadError(
          apiErrorMessage(requestError, "Unable to load appointments.")
        );
      });
  }

  useEffect(() => {
    loadAppointments();
    http
      .get("/connections")
      .then(setConnections)
      .catch((requestError) => {
        setError(
          apiErrorMessage(requestError, "Unable to load your connections.")
        );
      });
    if (["MR", "PHARMA_COMPANY"].includes(user?.role)) {
      http
        .get("/discover/doctors")
        .then((result) => setDoctors(Array.isArray(result) ? result : []))
        .catch((requestError) =>
          setError(
            apiErrorMessage(
              requestError,
              "Unable to load doctors accepting professional requests."
            )
          )
        );
    }
  }, [user?.role]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await http.post("/appointments", {
        recipientId,
        ...(selectedDoctor?.companyId
          ? { companyId: selectedDoctor.companyId }
          : {}),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: selectedDoctor
          ? selectedDoctor.appointmentDurationMinutes
          : Number(durationMinutes),
        mode: selectedMode,
        notes: notes || undefined,
        purposeCategory: selectedDoctor
          ? purposeCategory
          : undefined,
      });
      setShowForm(false);
      setNotes("");
      setPurposeCategory("");
      loadAppointments();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to book appointment"));
    } finally {
      setLoading(false);
    }
  }

  const sorted = (appointments || []).slice().sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#E9E2EA] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:px-8">
        <div>
          <p className="font-nav text-[9px] uppercase tracking-[0.18em] text-primary">Professional connections</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">Appointments</h1>
          <p className="mt-2 text-xs leading-5 text-[#6E6658]">Plan and manage conversations with your healthcare partners.</p>
        </div>
        {canRequestAppointment && (
          <Button className="rounded-full px-5" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Book appointment"}</Button>
        )}
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {appointmentLoadError && (
        <ErrorState
          message={appointmentLoadError}
          onRetry={() => {
            setAppointments(null);
            setAppointmentLoadError("");
            loadAppointments();
          }}
        />
      )}

      {showForm && canRequestAppointment && (
        <Card className="border-[#E9E2EA] p-5 sm:p-7">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label>With</Label>
              <Select
                value={recipientId}
                onChange={(event) => {
                  const nextRecipientId = event.target.value;
                  setRecipientId(nextRecipientId);
                  if (!doctors.some((doctor) => doctor.userId === nextRecipientId)) {
                    setMode("PHYSICAL");
                    setDurationMinutes(30);
                    setPurposeCategory("");
                  }
                }}
                required
              >
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
                {doctors.map((doctor) => (
                  <option key={doctor.userId} value={doctor.userId}>
                    Dr. {doctor.fullName} ({doctor.specialty || "verified doctor"})
                  </option>
                ))}
              </Select>
              {connections.length === 0 && doctors.length === 0 && (
                <p className="text-xs text-taupe mt-1">
                  {user?.role === "DOCTOR"
                    ? "Professional appointment requests will appear here for your review."
                    : "Connect with a relevant professional first. Doctors are listed only when verified and opted in."}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Date & time</Label>
                <Input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <Label>Mode</Label>
                <Select
                  value={selectedMode}
                  onChange={(e) => setMode(e.target.value)}
                  required
                >
                  {(
                    selectedDoctor?.communicationModes?.length
                      ? selectedDoctor.communicationModes
                      : ["PHYSICAL", "VIDEO"]
                  ).map((item) => (
                    <option key={item} value={item}>
                      {item === "VIDEO" ? "Video call" : "Physical visit"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {selectedDoctor ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Therapeutic category</Label>
                  <Select
                    required
                    value={purposeCategory}
                    onChange={(event) =>
                      setPurposeCategory(event.target.value)
                    }
                  >
                    <option value="">Select a category</option>
                    {(selectedDoctor.acceptedCategories?.length
                      ? selectedDoctor.acceptedCategories
                      : PRODUCT_CATEGORIES
                    ).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Proposed duration (minutes)</Label>
                  <Input
                    type="number"
                    readOnly
                    value={selectedDoctor.appointmentDurationMinutes}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="240"
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(event.target.value)
                  }
                />
              </div>
            )}
            <div>
              <Label>
                {selectedDoctor
                  ? "Professional purpose (required)"
                  : "Notes (optional)"}
              </Label>
              <TextArea
                required={Boolean(selectedDoctor)}
                minLength={selectedDoctor ? 10 : undefined}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selectedDoctor
                    ? "Describe the approved scientific or professional information to be discussed."
                    : ""
                }
              />
            </div>
            <Button type="submit" loading={loading}>
              Request appointment
            </Button>
          </form>
        </Card>
      )}

      {!appointments ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <Card className="border-[#E9E2EA]">
          <EmptyState title="No appointments yet" subtitle="Arrange meetings with accepted connections or submit a purpose-specific request to an opted-in doctor." />
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => {
            const other = a.requester?.userId === user?.id ? a.recipient : a.requester;
            return (
              <Link key={a.id} to={`/appointments/${a.id}`}>
                <Card className="group border-[#E9E2EA] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(42,27,61,0.08)] sm:p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#F8F2F5] text-primary">
                      <CalendarDays size={16} />
                      <span className="mt-0.5 font-nav text-[8px] uppercase">{format(new Date(a.scheduledAt), "MMM")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-navy">{other?.name ?? "Unknown"}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6E6658]">
                        <span>{format(new Date(a.scheduledAt), "EEE d MMM yyyy")}</span>
                        <span className="text-[#D7CED9]">·</span>
                        <span className="inline-flex items-center gap-1"><Clock3 size={12} />{format(new Date(a.scheduledAt), "h:mm a")}</span>
                        <span className="text-[#D7CED9]">·</span>
                        <span>{a.mode === "VIDEO" ? "Video call" : "Physical visit"}</span>
                      </p>
                      {a.disruptionReason && <p className="mt-1 text-xs text-red-500">Reason: {a.disruptionReason.toLowerCase()}</p>}
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
