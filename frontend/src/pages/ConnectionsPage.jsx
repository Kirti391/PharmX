import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  Clock3,
  MessageCircle,
  Network,
  RefreshCw,
  Store,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import { Card, EmptyState, Loader, Button } from "../components/ui";
import { useAuthStore } from "../store/authStore";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#A4B3B6",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

function normalizeRole(role) {
  if (!role) return "";

  const normalized = String(role).toUpperCase();

  if (
    normalized === "DISTRIBUTOR" ||
    normalized === "STOCKIST" ||
    normalized === "DISTRIBUTOR_STOCKIST"
  ) {
    return "DISTRIBUTOR_STOCKIST";
  }

  if (
    normalized === "COMPANY" ||
    normalized === "PHARMA_COMPANY"
  ) {
    return "COMPANY";
  }

  if (normalized === "MR" || normalized === "MEDICAL_REPRESENTATIVE") {
    return "MR";
  }

  if (normalized === "PHARMACY") {
    return "PHARMACY";
  }

  return normalized;
}

function getRoleLabel(role) {
  const normalized = normalizeRole(role);

  const labels = {
    COMPANY: "Pharma Company",
    MR: "Medical Representative",
    DISTRIBUTOR_STOCKIST: "Distributor / Stockist",
    PHARMACY: "Pharmacy",
  };

  return labels[normalized] || String(role || "Healthcare professional")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOtherParty(connection, currentUser) {
  if (!connection) return null;

  const requester = connection.requester;
  const recipient = connection.recipient;

  if (!currentUser?.id) {
    return connection.other || requester || recipient || null;
  }

  const requesterUserId = requester?.userId;
  const recipientUserId = recipient?.userId;

  if (
    requesterUserId &&
    String(requesterUserId) === String(currentUser.id)
  ) {
    return recipient;
  }

  if (
    recipientUserId &&
    String(recipientUserId) === String(currentUser.id)
  ) {
    return requester;
  }

  return connection.other || requester || recipient || null;
}

function getDisplayName(party) {
  return (
    party?.name ||
    party?.fullName ||
    party?.companyName ||
    party?.businessName ||
    "Healthcare partner"
  );
}

function getInitials(name) {
  const value = String(name || "HP").trim();

  if (!value) return "HP";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getRequirementTitle(connection) {
  return (
    connection?.requirement?.title ||
    connection?.requirementTitle ||
    connection?.requirement?.name ||
    null
  );
}

function getConnectionMessage(connection) {
  return connection?.message || connection?.note || null;
}

function getConnectionStatus(connection) {
  return String(connection?.status || "").toUpperCase();
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function RoleIcon({ role }) {
  const normalized = normalizeRole(role);

  if (normalized === "COMPANY") {
    return <Building2 size={20} />;
  }

  if (normalized === "MR") {
    return <UserRound size={20} />;
  }

  if (normalized === "DISTRIBUTOR_STOCKIST") {
    return <Store size={20} />;
  }

  return <Users size={20} />;
}

function ConnectionCard({
  connection,
  tab,
  currentUser,
  onRespond,
  respondingId,
}) {
  const other = getOtherParty(connection, currentUser);
  const name = getDisplayName(other);
  const role = getRoleLabel(other?.role);
  const message = getConnectionMessage(connection);
  const requirementTitle = getRequirementTitle(connection);
  const createdDate = formatDate(
    connection?.createdAt || connection?.requestedAt
  );

  const otherUserId = other?.userId || other?.id;

  const isResponding = respondingId === connection?.id;

  return (
    <Card>
      <div className="p-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${COLORS.purple}12`,
                color: COLORS.purple,
              }}
            >
              <RoleIcon role={other?.role} />
            </div>

            <div className="min-w-0">
              <p
                className="font-display text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                {name}
              </p>

              <p
                className="mt-0.5 text-xs font-medium"
                style={{ color: COLORS.purple }}
              >
                {role}
              </p>

              {message && (
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "#4F4A41" }}
                >
                  “{message}”
                </p>
              )}

              {requirementTitle && (
                <div
                  className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
                  style={{
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.background,
                    color: COLORS.navy,
                  }}
                >
                  <Network size={13} />
                  <span className="truncate">
                    Requirement: {requirementTitle}
                  </span>
                </div>
              )}

              {createdDate && (
                <p
                  className="mt-2 flex items-center gap-1.5 text-xs"
                  style={{ color: COLORS.muted }}
                >
                  <Clock3 size={12} />
                  {tab === "requests" ? "Requested" : "Connected"} {createdDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pt-1">
            {tab === "requests" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onRespond(connection.id, "accept")}
                  disabled={isResponding}
                >
                  <Check size={15} className="mr-1.5" />
                  Accept
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRespond(connection.id, "decline")}
                  disabled={isResponding}
                >
                  <X size={15} className="mr-1.5" />
                  Decline
                </Button>
              </>
            ) : otherUserId ? (
              <Link to={`/messages?with=${otherUserId}`}>
                <Button size="sm" variant="ghost">
                  <MessageCircle size={15} className="mr-1.5" />
                  Message
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ConnectionsPage() {
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState("requests");
  const [connections, setConnections] = useState(null);
  const [requests, setRequests] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);

  async function loadAll({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [connectionResult, requestResult] = await Promise.allSettled([
        http.get("/connections"),
        http.get("/connections/requests"),
      ]);

      if (connectionResult.status === "fulfilled") {
        setConnections(Array.isArray(connectionResult.value) ? connectionResult.value : []);
      } else {
        setConnections([]);
      }

      if (requestResult.status === "fulfilled") {
        setRequests(Array.isArray(requestResult.value) ? requestResult.value : []);
      } else {
        setRequests([]);
      }

      if (
        connectionResult.status === "rejected" &&
        requestResult.status === "rejected"
      ) {
        setError(
          apiErrorMessage(
            connectionResult.reason,
            "Unable to load your connections right now."
          )
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function respond(id, action) {
    if (!id || respondingId) return;

    setRespondingId(id);
    setError("");

    try {
      await http.patch(`/connections/${id}/${action}`);
      await loadAll({ silent: true });
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          action === "accept"
            ? "Unable to accept this connection request."
            : "Unable to decline this connection request."
        )
      );
    } finally {
      setRespondingId(null);
    }
  }

  const list = tab === "connections" ? connections : requests;

  const requestCount = useMemo(
    () => (Array.isArray(requests) ? requests.length : 0),
    [requests]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div
            className="h-8 w-48 animate-pulse rounded-lg"
            style={{ backgroundColor: COLORS.border }}
          />
          <div
            className="mt-2 h-4 w-80 max-w-full animate-pulse rounded"
            style={{ backgroundColor: COLORS.border }}
          />
        </div>
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${COLORS.primary}12`,
                color: COLORS.primary,
              }}
            >
              <Network size={20} />
            </div>

            <h1
              className="font-display text-2xl font-bold"
              style={{ color: COLORS.navy }}
            >
              Connections
            </h1>
          </div>

          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{ color: "#6E6658" }}
          >
            Manage your professional relationships with pharma companies,
            medical representatives, and distributors & stockists.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAll({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border bg-white px-3.5 py-2 text-sm font-medium transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: COLORS.border,
            color: COLORS.navy,
          }}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Workflow explanation */}
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          borderColor: COLORS.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${COLORS.purple}10`,
              color: COLORS.purple,
            }}
          >
            <Users size={17} />
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.navy }}
            >
              Build procurement relationships
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "#6E6658" }}
            >
              Connect with relevant suppliers and healthcare partners,
              then continue the conversation through Messages and
              coordinate meetings through Appointments.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: `${COLORS.coral}55`,
            backgroundColor: `${COLORS.coral}10`,
            color: "#7A3F38",
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2 rounded-2xl border p-2"
        style={{
          borderColor: COLORS.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <button
          type="button"
          onClick={() => setTab("requests")}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          style={
            tab === "requests"
              ? {
                  backgroundColor: COLORS.navy,
                  color: "#FFFFFF",
                }
              : {
                  color: "#6E6658",
                  backgroundColor: "transparent",
                }
          }
        >
          <span className="inline-flex items-center gap-2">
            <Clock3 size={15} />
            Pending Requests
            {requestCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  backgroundColor:
                    tab === "requests" ? `${COLORS.primary}` : `${COLORS.primary}15`,
                  color: tab === "requests" ? "#FFFFFF" : COLORS.primary,
                }}
              >
                {requestCount}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("connections")}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          style={
            tab === "connections"
              ? {
                  backgroundColor: COLORS.navy,
                  color: "#FFFFFF",
                }
              : {
                  color: "#6E6658",
                  backgroundColor: "transparent",
                }
          }
        >
          <span className="inline-flex items-center gap-2">
            <Network size={15} />
            My Connections
            {Array.isArray(connections) && connections.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  backgroundColor:
                    tab === "connections"
                      ? `${COLORS.primary}`
                      : `${COLORS.primary}15`,
                  color:
                    tab === "connections" ? "#FFFFFF" : COLORS.primary,
                }}
              >
                {connections.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* List */}
      {!list ? (
        <Loader />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            title={
              tab === "requests"
                ? "No pending connection requests"
                : "No procurement connections yet"
            }
            subtitle={
              tab === "requests"
                ? "When a pharma company, medical representative, or distributor/stockist sends you a connection request, it will appear here."
                : "Discover relevant healthcare partners and connect with them to continue your procurement conversations."
            }
          />

          <div className="mt-5 flex justify-center">
            <Link to="/discover/companies">
              <Button>
                Discover Partners
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              tab={tab}
              currentUser={user}
              onRespond={respond}
              respondingId={respondingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}