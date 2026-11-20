import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "../ui";
import { API_URL, http, apiErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

const TABS = [
  { href: "/discover/companies", label: "Pharma Companies", role: "PHARMA_COMPANY" },
  { href: "/discover/mrs", label: "Medical Reps", role: "MR" },
  { href: "/discover/pharmacies", label: "Pharmacies", role: "PHARMACY" },
  { href: "/discover/stockists", label: "Stockists & Distributors", role: "DISTRIBUTOR_STOCKIST" },
];

const CONNECTION_ROLES = {
  PHARMACY: ["PHARMA_COMPANY", "MR", "DISTRIBUTOR_STOCKIST"],
  MR: ["PHARMACY", "PHARMA_COMPANY", "DISTRIBUTOR_STOCKIST"],
  PHARMA_COMPANY: ["PHARMACY", "MR", "DISTRIBUTOR_STOCKIST"],
  DISTRIBUTOR_STOCKIST: ["PHARMACY", "PHARMA_COMPANY", "MR"],
};

function normalizeRole(role) {
  const normalized = String(role || "").toUpperCase();
  if (["COMPANY", "PHARMA_COMPANY"].includes(normalized)) {
    return "PHARMA_COMPANY";
  }
  if (["STOCKIST", "DISTRIBUTOR"].includes(normalized)) {
    return "DISTRIBUTOR_STOCKIST";
  }
  return normalized;
}

function getImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const source = value.trim();
    const path =
      /^[a-z][a-z\d+.-]*:/i.test(source) || source.startsWith("/")
        ? source
        : `/${source}`;
    const url = new URL(path, new URL(API_URL, window.location.origin));
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function DiscoveryAvatar({
  src,
  initials,
  fit = "cover",
  className = "",
  style,
}) {
  const imageUrl = getImageUrl(src);
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = imageUrl && failedUrl !== imageUrl;

  return (
    <div className={`overflow-hidden ${className}`} style={style}>
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={`h-full w-full ${fit === "contain" ? "rounded-lg bg-white object-contain p-1" : "object-cover"}`}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export function DiscoverTabs() {
  const location = useLocation();
  const userRole = useAuthStore((state) => state.user?.role);
  const allowedRoles = CONNECTION_ROLES[normalizeRole(userRole)] || [];
  const visibleTabs = TABS.filter((tab) => allowedRoles.includes(tab.role));

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-[#E9E2EA] bg-white p-1.5 pb-2 shadow-[0_4px_16px_rgba(42,27,61,0.03)]">
      {visibleTabs.map((t) => (
        <Link
          key={t.href}
          to={t.href}
          className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            location.pathname === t.href ? "bg-primary text-white shadow-sm" : "text-[#6E6658] hover:bg-[#FCFAF8] hover:text-navy"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function ConnectButton({
  recipientUserId,
  recipientRole,
  recipientVerified = true,
  requesterVerified = true,
  connectionStatus = null,
}) {
  const requesterRole = useAuthStore((state) => state.user?.role);
  const [requestState, setRequestState] = useState(null);
  const [message, setMessage] = useState(null);
  const state =
    connectionStatus ||
    (requestState?.recipientUserId === recipientUserId
      ? requestState.status
      : "idle");
  const canConnect = (CONNECTION_ROLES[normalizeRole(requesterRole)] || [])
    .includes(normalizeRole(recipientRole));

  async function connect() {
    setRequestState({ recipientUserId, status: "loading" });
    try {
      await http.post("/connections", { recipientId: recipientUserId });
      setRequestState({ recipientUserId, status: "PENDING_OUTGOING" });
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      const knownStatus = {
        ALREADY_CONNECTED: "ACCEPTED",
        CONNECTION_REQUEST_RECEIVED: "PENDING_INCOMING",
        CONNECTION_REQUEST_DECLINED: "DECLINED",
        ALREADY_EXISTS: "PENDING_OUTGOING",
      }[code];
      if (knownStatus) {
        setRequestState({ recipientUserId, status: knownStatus });
        return;
      }
      setRequestState({ recipientUserId, status: "error" });
      setMessage(apiErrorMessage(err, "Failed to send request"));
    }
  }

  if (!canConnect) return null;
  if (state === "ACCEPTED") {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled
        className="min-w-[136px] justify-start whitespace-nowrap"
        style={{
          borderColor: "#D5E9DF",
          backgroundColor: "#F5FBF7",
          color: "#32734D",
          opacity: 1,
          cursor: "default",
        }}
      >
        <CheckCircle2 size={15} />
        Already connected
      </Button>
    );
  }
  if (state === "PENDING_OUTGOING") {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled
        className="min-w-[136px] justify-start whitespace-nowrap"
        style={{
          borderColor: "#DFD5F2",
          backgroundColor: "#F4F0FB",
          color: "#44318D",
          opacity: 1,
          cursor: "default",
        }}
      >
        <Clock3 size={15} />
        Request sent
      </Button>
    );
  }
  if (state === "PENDING_INCOMING") {
    return (
      <Link
        to="/connections"
        className="inline-flex min-w-[136px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-purple px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#382778]"
      >
        Review request
        <ArrowRight size={14} />
      </Link>
    );
  }
  if (state === "DECLINED") {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled
        className="min-w-[136px] justify-start whitespace-nowrap"
        style={{
          borderColor: "#E9E2EA",
          backgroundColor: "#F8F6F8",
          color: "#8C8496",
          opacity: 1,
          cursor: "default",
        }}
      >
        <XCircle size={15} />
        Request declined
      </Button>
    );
  }
  if (!recipientVerified || !requesterVerified) {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled
        className="min-w-[136px] justify-start whitespace-nowrap"
        style={{
          borderColor: "#E9E2EA",
          backgroundColor: "#F8F6F8",
          color: "#8C8496",
          opacity: 1,
          cursor: "default",
        }}
      >
        <ShieldCheck size={15} />
        Verification required
      </Button>
    );
  }
  if (state === "error") return <span className="text-red-500 text-xs">{message}</span>;

  return (
    <Button size="sm" variant="secondary" onClick={connect} loading={state === "loading"}>
      Connect
    </Button>
  );
}
