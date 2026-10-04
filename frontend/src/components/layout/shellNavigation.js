import {
  LayoutDashboard,
  UserCircle,
  Search,
  ClipboardList,
  Users,
  CalendarClock,
  MessageSquare,
  Bell,
  ShieldCheck,
  ClipboardCheck,
  BriefcaseBusiness,
  Building2,
  Stethoscope,
  Truck,
  History,
  FileKey2,
  Flag,
} from "lucide-react";

/* =========================================================
   PHARMUNIS APP SHELL — NAVIGATION MODEL
========================================================= */

const CATALOGUE_NAV = {
  href: "/catalogue",
  label: "Product catalogue",
  icon: ClipboardList,
  match: ["/catalogue"],
};

const PHARMACY_NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: ["/dashboard", "/"],
  },
  {
    href: "/requirements",
    label: "Requirements",
    icon: ClipboardList,
    match: ["/requirements"],
  },
  CATALOGUE_NAV,
  {
    href: "/discover/companies",
    label: "Companies",
    icon: Search,
    match: ["/discover/companies"],
  },
  {
    href: "/discover/mrs",
    label: "Medical representatives",
    icon: Stethoscope,
    match: ["/discover/mrs"],
  },
  {
    href: "/discover/stockists",
    label: "Distributors",
    icon: Truck,
    match: ["/discover/stockists"],
  },
  {
    href: "/connections",
    label: "Connections",
    icon: Users,
    match: ["/connections"],
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: CalendarClock,
    match: ["/appointments"],
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    match: ["/messages"],
  },
];

const LEADS_NAV = {
  href: "/leads",
  label: "Leads & follow-ups",
  icon: ClipboardCheck,
  match: ["/leads"],
};

const MR_NAV = [
  PHARMACY_NAV[0],
  {
    href: "/opportunities",
    label: "Company opportunities",
    icon: BriefcaseBusiness,
    match: ["/opportunities"],
  },
  LEADS_NAV,
  CATALOGUE_NAV,
  PHARMACY_NAV[1],
  {
    href: "/discover/pharmacies",
    label: "Pharmacies",
    icon: Search,
    match: ["/discover/pharmacies"],
  },
  {
    href: "/discover/companies",
    label: "Companies",
    icon: Building2,
    match: ["/discover/companies"],
  },
  {
    href: "/discover/stockists",
    label: "Distributors",
    icon: Truck,
    match: ["/discover/stockists"],
  },
  {
    href: "/discover/doctors",
    label: "Opted-in doctors",
    icon: Stethoscope,
    match: ["/discover/doctors"],
  },
  {
    href: "/authorizations",
    label: "Company authorizations",
    icon: ShieldCheck,
    match: ["/authorizations"],
  },
  ...PHARMACY_NAV.slice(6),
];

const COMPANY_NAV = [
  PHARMACY_NAV[0],
  {
    href: "/opportunities",
    label: "Opportunities",
    icon: BriefcaseBusiness,
    match: ["/opportunities"],
  },
  LEADS_NAV,
  CATALOGUE_NAV,
  PHARMACY_NAV[1],
  {
    href: "/discover/mrs",
    label: "Medical representatives",
    icon: Stethoscope,
    match: ["/discover/mrs"],
  },
  {
    href: "/discover/pharmacies",
    label: "Pharmacies",
    icon: Search,
    match: ["/discover/pharmacies"],
  },
  {
    href: "/discover/stockists",
    label: "Distributors",
    icon: Truck,
    match: ["/discover/stockists"],
  },
  {
    href: "/discover/doctors",
    label: "Opted-in doctors",
    icon: Stethoscope,
    match: ["/discover/doctors"],
  },
  {
    href: "/authorizations",
    label: "MR authorizations",
    icon: ShieldCheck,
    match: ["/authorizations"],
  },
  ...PHARMACY_NAV.slice(6),
];

const DISTRIBUTOR_NAV = [
  PHARMACY_NAV[0],
  PHARMACY_NAV[1],
  LEADS_NAV,
  CATALOGUE_NAV,
  {
    href: "/discover/pharmacies",
    label: "Pharmacies",
    icon: Search,
    match: ["/discover/pharmacies"],
  },
  {
    href: "/discover/companies",
    label: "Companies",
    icon: Building2,
    match: ["/discover/companies"],
  },
  {
    href: "/discover/mrs",
    label: "Medical representatives",
    icon: Stethoscope,
    match: ["/discover/mrs"],
  },
  ...PHARMACY_NAV.slice(6),
];

const DOCTOR_NAV = [
  PHARMACY_NAV[0],
  {
    href: "/appointments",
    label: "Professional requests",
    icon: CalendarClock,
    match: ["/appointments"],
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    match: ["/messages"],
  },
];

export const ACCOUNT_NAV = [
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    match: ["/profile"],
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    match: ["/notifications"],
    badge: "notifications",
  },
];

export const ADMIN_NAV = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: ["/admin/dashboard"],
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    match: ["/admin/users"],
  },
  {
    href: "/admin/verifications",
    label: "Verifications",
    icon: ShieldCheck,
    match: ["/admin/verifications"],
  },
  {
    href: "/admin/authorizations",
    label: "Company authorizations",
    icon: FileKey2,
    match: ["/admin/authorizations"],
  },
  {
    href: "/admin/reports",
    label: "Reports & safety",
    icon: Flag,
    match: ["/admin/reports"],
  },
  {
    href: "/admin/audit",
    label: "Audit trail",
    icon: History,
    match: ["/admin/audit"],
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    match: ["/notifications"],
    badge: "notifications",
  },
  {
    href: "/admin/profile",
    label: "My admin profile",
    icon: UserCircle,
    match: ["/admin/profile"],
  },
];

const ROLE_NAVIGATION = {
  PHARMACY: PHARMACY_NAV,
  MR: MR_NAV,
  INDEPENDENT_MR: MR_NAV,
  PHARMA_COMPANY: COMPANY_NAV,
  DISTRIBUTOR_STOCKIST: DISTRIBUTOR_NAV,
  COMPANY: COMPANY_NAV,
  DISTRIBUTOR: DISTRIBUTOR_NAV,
  STOCKIST: DISTRIBUTOR_NAV,
  DOCTOR: DOCTOR_NAV,
};

export function getNavigationForRole(role) {
  const normalizedRole = String(role || "").toUpperCase();

  if (normalizedRole === "ADMIN") {
    return {
      primary: ADMIN_NAV,
      secondary: [],
      workspaceLabel: "Administration",
    };
  }

  const workspaceLabels = {
    PHARMACY: "Pharmacy",
    MR: "Medical representative",
    INDEPENDENT_MR: "Independent representative",
    PHARMA_COMPANY: "Pharma company",
    COMPANY: "Pharma company",
    DISTRIBUTOR_STOCKIST: "Distributor / stockist",
    DISTRIBUTOR: "Distributor",
    STOCKIST: "Stockist",
    DOCTOR: "Healthcare professional",
  };

  return {
    primary: ROLE_NAVIGATION[normalizedRole] || PHARMACY_NAV,
    secondary: ACCOUNT_NAV,
    workspaceLabel: workspaceLabels[normalizedRole] || "Workspace",
  };
}

/* =========================================================
   HELPERS
========================================================= */

/**
 * True when the current path belongs to a navigation entry.
 * The `/` match is exact so the landing page is not treated
 * as a nested dashboard route.
 */
export function isNavigationActive(pathname, item) {
  const patterns = item.match || [item.href];

  return patterns.some((pattern) => {
    if (pattern === "/") {
      return pathname === "/";
    }

    return (
      pathname === pattern ||
      pathname.startsWith(`${pattern}/`)
    );
  });
}

export function userInitials(value) {
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
