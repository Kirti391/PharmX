/* =========================================================
   PHARMUNIS — DASHBOARD SURFACE TOKENS
   A single source of truth for the pharmacy workspace.
========================================================= */

export const SURFACE = {
  canvas: "#FBFAFC",
  paper: "#FFFFFF",
  hairline: "#ECE8F1",

  ink: "#2A1B3D",
  inkSoft: "#5B5265",
  inkMuted: "#8C8496",

  pink: "#D83F87",
  pinkSoft: "#FDEBF4",

  purple: "#44318D",
  purpleSoft: "#EFEBF9",

  coral: "#E98074",
  coralSoft: "#FBE4DE",

  navySoft: "#F3F0F7",
  sectionCanvas: "#F7F5FA",
  roseSoft: "#F5EBEB",
  slate: "#A4B3B6",
  lavender: "#EDEAF7",
  peach: "#FBE3DC",

  success: "#2F7D5F",
  successSoft: "#E9F4EF",
};

/* Rotating accents used by lists, timelines and rails. */
export const ACCENTS = [
  SURFACE.pink,
  SURFACE.purple,
  SURFACE.coral,
];

export function accentFor(index) {
  return ACCENTS[index % ACCENTS.length];
}

/* Status → colour mapping shared by every dashboard panel. */
const STATUS_COLORS = {
  VERIFIED: SURFACE.success,
  ACTIVE: SURFACE.success,
  APPROVED: SURFACE.success,
  COMPLETED: SURFACE.success,
  FULFILLED: SURFACE.success,

  PENDING: SURFACE.pink,
  OPEN: SURFACE.pink,
  MATCHING: SURFACE.pink,
  IN_REVIEW: SURFACE.pink,
  PROCESSING: SURFACE.pink,

  CONFIRMED: SURFACE.purple,
  SHORTLISTED: SURFACE.purple,
  MATCHED: SURFACE.purple,

  REJECTED: "#9B5555",
  CANCELLED: "#9B5555",
  CLOSED: "#9B5555",
};

export function statusColor(status) {
  return (
    STATUS_COLORS[String(status || "").toUpperCase()] ||
    SURFACE.purple
  );
}

export function statusLabel(status) {
  const value = String(status || "OPEN").replaceAll("_", " ");

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function urgencyLabel(urgency) {
  const value = String(urgency || "").toUpperCase();

  if (!value) return "";

  return `${value.charAt(0)}${value.slice(1).toLowerCase()} urgency`;
}
