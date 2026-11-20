export const PRODUCT_CATEGORIES = [
  "Dermatology",
  "Cardiology",
  "Pediatrics",
  "Neurology",
  "Oncology",
  "Diabetology",
  "Orthopedics",
  "Gynecology",
  "General Medicine",
  "Nutraceuticals",
];

export const MR_SUPPORT_REQUEST_OPTIONS = [
  { value: "PRODUCT_INFORMATION", label: "Product information" },
  { value: "PHARMACY_VISIT", label: "Pharmacy visit or meeting" },
  { value: "PRODUCT_PRESENTATION", label: "Product presentation" },
  { value: "OTHER_SUPPORT", label: "Other professional support" },
];

export function getMRSupportRequestLabel(requestType) {
  return (
    MR_SUPPORT_REQUEST_OPTIONS.find((option) => option.value === requestType)
      ?.label || "Professional support"
  );
}

export const DISRUPTION_REASONS = [
  "WEATHER",
  "HEALTH",
  "TRAVEL",
  "TRAFFIC",
  "EMERGENCY",
  "PREVIOUS_DELAY",
  "UNAVAILABLE",
  "OTHER",
];

export const ROLE_LABELS = {
  PHARMA_COMPANY: "Pharma Company",
  MR: "Medical Representative",
  INDEPENDENT_MR: "Independent MR",
  PHARMACY: "Pharmacy",
  STOCKIST: "Stockist",
  DISTRIBUTOR: "Distributor",
  DISTRIBUTOR_STOCKIST: "Distributor / Stockist",
  DOCTOR: "Doctor",
  ADMIN: "Admin",
};
