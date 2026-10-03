import {
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";

import { ACCENTS } from "./dashboardTheme";

/* =========================================================
   PHARMUNIS — DASHBOARD DATA HELPERS
   Normalise the dashboard payload into presentable rows.
========================================================= */

/* ---------------------------------------------------------
   Dates
--------------------------------------------------------- */

export function safeDate(value) {
  if (!value) return null;

  try {
    const date =
      value instanceof Date ? value : parseISO(String(value));

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function formatClock(value) {
  const date = safeDate(value);

  return date ? format(date, "HH:mm") : "Time TBD";
}

export function formatStamp(value) {
  const date = safeDate(value);

  if (!date) return "Date TBD";

  return format(date, "dd MMM");
}

function dayPrefix(value) {
  const date = safeDate(value);

  if (!date) return "";

  return isToday(date) ? "Today" : format(date, "dd MMM");
}

/* ---------------------------------------------------------
   Labels
--------------------------------------------------------- */

export function initials(value) {
  const parts = String(value || "")
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "P"
  );
}

const MODE_LABELS = {
  PHYSICAL: "In person",
  VIDEO: "Video meeting",
  PHONE: "Phone call",
};

export function modeLabel(mode) {
  return MODE_LABELS[String(mode || "").toUpperCase()] || "Meeting";
}

export function partnerOf(record) {
  return (
    record?.other?.name ||
    record?.name ||
    "PharmUnis professional"
  );
}

export function partnerRoleOf(record) {
  const role = record?.other?.role;

  if (!role) return "Professional partner";

  return String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

/* ---------------------------------------------------------
   Today's procurement activity
--------------------------------------------------------- */

export function isScheduledToday(value) {
  const date = safeDate(value);

  return Boolean(date) && isSameDay(date, new Date());
}

/**
 * Build the "Today's procurement" list from real records:
 * today's appointments first, then recently created
 * requirements. Appointment rows carry the meeting time.
 */
export function buildActivityItems({
  appointments = [],
  requirements = [],
  limit = 4,
}) {
  const appointmentRows = appointments
    .filter((item) => isScheduledToday(item.scheduledAt))
    .map((item) => ({
      id: `appointment-${item.id}`,
      title: partnerOf(item),
      meta: `${modeLabel(item.mode)} · ${formatClock(
        item.scheduledAt
      )}`,
    }));

  const requirementRows = requirements.map((item) => ({
    id: `requirement-${item.id}`,
    title: item.title || "Untitled requirement",
    meta: `${item.urgency || "NORMAL"} urgency · ${dayPrefix(
      item.createdAt
    )} ${formatClock(item.createdAt)}`,
  }));

  return [...appointmentRows, ...requirementRows]
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      accent: ACCENTS[index % ACCENTS.length],
    }));
}

/* ---------------------------------------------------------
   Upcoming appointments
--------------------------------------------------------- */

export function upcomingAppointments(appointments = []) {
  const now = new Date();

  return appointments
    .filter((item) => {
      const date = safeDate(item.scheduledAt);

      return date && date.getTime() >= now.getTime();
    })
    .sort(
      (a, b) =>
        safeDate(a.scheduledAt) - safeDate(b.scheduledAt)
    );
}

export function todayAppointments(appointments = []) {
  return appointments.filter((item) =>
    isScheduledToday(item.scheduledAt)
  );
}

/* ---------------------------------------------------------
   Editorial copy
--------------------------------------------------------- */

/**
 * Script-font summary built from real workspace numbers —
 * never a hardcoded motivational line.
 */
export function workspaceSummary({
  openRequirements = 0,
  todayCount = 0,
  nextAppointmentAt = null,
}) {
  if (todayCount > 0) {
    return `${todayCount} appointment${
      todayCount === 1 ? "" : "s"
    } on your calendar today.`;
  }

  if (openRequirements > 0) {
    return `${openRequirements} open requirement${
      openRequirements === 1 ? "" : "s"
    } moving through your workspace.`;
  }

  if (nextAppointmentAt) {
    return `Your next meeting is booked for ${formatStamp(
      nextAppointmentAt
    )}.`;
  }

  return "A good day to keep your procurement moving.";
}

export function pharmacyDisplayName(profile, user) {
  return (
    profile?.pharmacyName ||
    profile?.displayName ||
    profile?.name ||
    user?.name ||
    "Your pharmacy"
  );
}

export function pharmacyLocation(profile) {
  return [
    profile?.city || profile?.location,
    profile?.state,
  ]
    .filter(Boolean)
    .join(", ");
}

export function startOfToday() {
  return startOfDay(new Date());
}
/* ---------------------------------------------------------
   Workspace search
--------------------------------------------------------- */

export function matchesQuery(query, values = []) {
  const needle = String(query || "").trim().toLowerCase();

  if (!needle) return true;

  return values.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(needle)
  );
}

export function filterRequirements(query, requirements = []) {
  return requirements.filter((item) =>
    matchesQuery(query, [
      item?.title,
      item?.description,
      item?.category,
      item?.urgency,
      item?.status,
    ])
  );
}

export function filterAppointments(query, appointments = []) {
  return appointments.filter((item) =>
    matchesQuery(query, [
      partnerOf(item),
      modeLabel(item?.mode),
      item?.notes,
      item?.status,
    ])
  );
}

export function filterConnections(query, connections = []) {
  return connections.filter((item) =>
    matchesQuery(query, [
      partnerOf(item),
      partnerRoleOf(item),
      item?.status,
    ])
  );
}

export function countMatches(query, { requirements, appointments, connections }) {
  if (!String(query || "").trim()) return null;

  return (
    filterRequirements(query, requirements).length +
    filterAppointments(query, appointments).length +
    filterConnections(query, connections).length
  );
}
