import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Clock3,
  FileText,
  MessageCircle,
  Network,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import { Card, EmptyState, Loader, Button } from "../components/ui";
import { useRealtimeEvent } from "../lib/socket";
import { useAuthStore } from "../store/authStore";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#8C8496",
  background: "#FCFAF8",
  border: "#E9E2EA",
};

function normalizeNotificationType(notification) {
  return String(
    notification?.type ||
      notification?.category ||
      notification?.eventType ||
      ""
  )
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getNotificationCategory(notification) {
  const type = normalizeNotificationType(notification);

  if (
    type.includes("REQUIREMENT") ||
    type.includes("MATCH") ||
    type.includes("RESPONSE")
  ) {
    return "requirement";
  }

  if (
    type.includes("CONNECTION") ||
    type.includes("CONNECT")
  ) {
    return "connection";
  }

  if (
    type.includes("MESSAGE") ||
    type.includes("CHAT")
  ) {
    return "message";
  }

  if (
    type.includes("APPOINTMENT") ||
    type.includes("MEETING")
  ) {
    return "appointment";
  }

  if (
    type.includes("VERIFICATION") ||
    type.includes("KYC")
  ) {
    return "verification";
  }

  return "general";
}

function getCategoryLabel(category) {
  const labels = {
    requirement: "Requirements",
    connection: "Connections",
    message: "Messages",
    appointment: "Appointments",
    verification: "Account",
    general: "Updates",
  };

  return labels[category] || labels.general;
}

function getNotificationIcon(category) {
  const icons = {
    requirement: FileText,
    connection: Network,
    message: MessageCircle,
    appointment: CalendarDays,
    verification: ShieldCheck,
    general: Bell,
  };

  return icons[category] || Bell;
}

function getNotificationIconStyle(category, isAdmin) {
  if (isAdmin) {
    const styles = {
      requirement: { backgroundColor: "rgba(216, 63, 135, 0.18)", color: "#f081b5" },
      connection: { backgroundColor: "rgba(110, 88, 190, 0.22)", color: "#b9a9ff" },
      message: { backgroundColor: "rgba(233, 128, 116, 0.18)", color: "#f1a197" },
      appointment: { backgroundColor: "rgba(110, 88, 190, 0.22)", color: "#b9a9ff" },
      verification: { backgroundColor: "rgba(216, 63, 135, 0.16)", color: "#f081b5" },
      general: { backgroundColor: "rgba(164, 179, 182, 0.16)", color: "#c4bfd0" },
    };

    return styles[category] || styles.general;
  }

  const styles = {
    requirement: {
      backgroundColor: `${COLORS.primary}12`,
      color: COLORS.primary,
    },
    connection: {
      backgroundColor: `${COLORS.purple}12`,
      color: COLORS.purple,
    },
    message: {
      backgroundColor: `${COLORS.coral}15`,
      color: "#B65B50",
    },
    appointment: {
      backgroundColor: "#44318D12",
      color: COLORS.purple,
    },
    verification: {
      backgroundColor: "#2A1B3D10",
      color: COLORS.navy,
    },
    general: {
      backgroundColor: `${COLORS.muted}20`,
      color: COLORS.navy,
    },
  };

  return styles[category] || styles.general;
}

function getRelativeTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return formatDistanceToNow(date, { addSuffix: true });
}

function getRelatedLabel(notification) {
  return (
    notification?.requirement?.title ||
    notification?.requirementTitle ||
    notification?.appointment?.title ||
    notification?.appointmentTitle ||
    notification?.connection?.name ||
    notification?.relatedName ||
    null
  );
}

function NotificationIcon({ category, isAdmin }) {
  const Icon = getNotificationIcon(category);
  const iconStyle = getNotificationIconStyle(category, isAdmin);

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={iconStyle}
    >
      <Icon size={18} />
    </div>
  );
}

function NotificationCard({ notification, onRead, isAdmin }) {
  const category = getNotificationCategory(notification);
  const isRead = Boolean(notification?.readAt);
  const relatedLabel = getRelatedLabel(notification);
  const relativeTime = getRelativeTime(notification?.createdAt);
  const mutedText = isAdmin ? "#a7a1b6" : COLORS.muted;
  const bodyText = isAdmin ? "#c4bfd0" : "#4F4A41";
  const primaryText = isAdmin ? "#f4f0f8" : COLORS.navy;
  const categoryText = isAdmin ? "#b9a9ff" : COLORS.purple;

  return (
    <Card
      className="transition"
      style={{
        borderColor: isAdmin
          ? isRead ? "rgba(255, 255, 255, 0.09)" : "rgba(216, 63, 135, 0.5)"
          : isRead ? COLORS.border : `${COLORS.primary}55`,
        backgroundColor: isAdmin
          ? isRead ? "#191b28" : "#211b2b"
          : isRead ? "#FFFFFF" : "#FFFCFE",
      }}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => !isRead && onRead(notification.id)}
      >
        <div className="flex items-start gap-3">
          <NotificationIcon category={category} isAdmin={isAdmin} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: primaryText }}
                  >
                    {notification?.title || "PharmUnis update"}
                  </p>

                  {!isRead && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: isAdmin
                          ? "rgba(216, 63, 135, 0.18)"
                          : `${COLORS.primary}15`,
                        color: isAdmin ? "#f081b5" : COLORS.primary,
                      }}
                    >
                      New
                    </span>
                  )}
                </div>

                <span
                  className="mt-1 inline-block text-[11px] font-medium"
                  style={{ color: categoryText }}
                >
                  {getCategoryLabel(category)}
                </span>
              </div>

              {relativeTime && (
                <span
                  className="flex shrink-0 items-center gap-1 text-xs"
                  style={{ color: mutedText }}
                >
                  <Clock3 size={12} />
                  {relativeTime}
                </span>
              )}
            </div>

            <p
              className="mt-2 text-sm leading-6"
              style={{ color: bodyText }}
            >
              {notification?.body || "You have a new update on PharmUnis."}
            </p>

            {relatedLabel && (
              <div
                className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
                style={{
                  borderColor: isAdmin ? "rgba(255, 255, 255, 0.12)" : COLORS.border,
                  backgroundColor: isAdmin ? "#141722" : COLORS.background,
                  color: primaryText,
                }}
              >
                {category === "appointment" ? (
                  <CalendarDays size={13} />
                ) : category === "connection" ? (
                  <Network size={13} />
                ) : (
                  <FileText size={13} />
                )}

                <span className="truncate">{relatedLabel}</span>
              </div>
            )}
          </div>

          {!isRead && (
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS.primary }}
              aria-label="Unread"
            />
          )}
        </div>
      </button>
    </Card>
  );
}

export default function NotificationsPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const [items, setItems] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [readingId, setReadingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setItems(null);
    }

    setError("");

    try {
      const result = await http.get("/notifications");

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setItems([]);
      setError(
        apiErrorMessage(
          err,
          "Unable to load notifications right now."
        )
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useRealtimeEvent("notification:new", (notification) => {
    if (!notification) return;

    setItems((previous) => {
      if (!previous) return [notification];

      const existing = previous.some(
        (item) => item?.id === notification?.id
      );

      if (existing) return previous;

      return [notification, ...previous];
    });
  });

  async function markAllRead() {
    if (loadingAction) return;

    setLoadingAction(true);
    setError("");

    try {
      await http.patch("/notifications/read-all");

      setItems((previous) =>
        previous?.map((notification) => ({
          ...notification,
          readAt:
            notification.readAt || new Date().toISOString(),
        })) ?? []
      );
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Unable to mark notifications as read."
        )
      );
    } finally {
      setLoadingAction(false);
    }
  }

  async function markRead(id) {
    if (!id || readingId) return;

    setReadingId(id);
    setError("");

    try {
      await http.patch(`/notifications/${id}/read`);

      setItems(
        (previous) =>
          previous?.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  readAt: new Date().toISOString(),
                }
              : notification
          ) ?? null
      );
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Unable to mark this notification as read."
        )
      );
    } finally {
      setReadingId(null);
    }
  }

  const unreadCount = useMemo(
    () =>
      Array.isArray(items)
        ? items.filter((notification) => !notification?.readAt).length
        : 0,
    [items]
  );

  const categoryCounts = useMemo(() => {
    if (!Array.isArray(items)) return {};

    return items.reduce((result, notification) => {
      const category = getNotificationCategory(notification);
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});
  }, [items]);

  if (!items) {
    return (
      <div className={`space-y-6 ${isAdmin ? "admin-notifications" : ""}`}>
        <div>
          <div
            className="h-8 w-48 animate-pulse rounded-lg"
            style={{ backgroundColor: isAdmin ? "#292b3a" : COLORS.border }}
          />
          <div
            className="mt-2 h-4 w-80 max-w-full animate-pulse rounded"
            style={{ backgroundColor: isAdmin ? "#292b3a" : COLORS.border }}
          />
        </div>

        <Loader />
      </div>
    );
  }

  return (
    <div className={`space-y-7 ${isAdmin ? "admin-notifications" : ""}`}>
      {/* Header */}
      <div
        className="flex flex-col gap-4 rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-7"
        style={isAdmin ? {
          borderColor: "rgba(255, 255, 255, 0.09)",
          background: "linear-gradient(118deg, #2a1b3d 0%, #44318d 100%)",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.24)",
        } : undefined}
      >
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: isAdmin ? "rgba(216, 63, 135, 0.2)" : `${COLORS.primary}12`,
                color: isAdmin ? "#f081b5" : COLORS.primary,
              }}
            >
              <Bell size={20} />
            </div>

            <div>
              <h1
                className="font-display text-2xl font-semibold sm:text-3xl"
                style={{ color: isAdmin ? "#ffffff" : COLORS.navy }}
              >
                Notifications
              </h1>

              {unreadCount > 0 && (
                <p
                  className="mt-0.5 text-xs font-medium"
                  style={{ color: isAdmin ? "#f081b5" : COLORS.primary }}
                >
                  {unreadCount} unread{" "}
                  {unreadCount === 1 ? "notification" : "notifications"}
                </p>
              )}
            </div>
          </div>

          <p
            className="mt-2 max-w-2xl text-xs leading-6"
            style={{ color: isAdmin ? "#d0cbd9" : "#6E6658" }}
          >
            Stay updated on your requirements, supplier connections,
            messages, appointments, and account activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load({ silent: true })}
            disabled={refreshing}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium transition hover:border-[#D83F87]/30 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${isAdmin ? "bg-[#211b2b] hover:bg-[#2a1b3d]" : "bg-white"}`}
            style={{
              borderColor: isAdmin ? "rgba(255, 255, 255, 0.18)" : COLORS.border,
              color: isAdmin ? "#ffffff" : COLORS.navy,
            }}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              disabled={loadingAction}
              className={isAdmin ? "!border-white/20 !text-white hover:!bg-white/10 hover:!text-white" : ""}
            >
              <CheckCheck size={15} className="mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Requirements",
              key: "requirement",
              icon: FileText,
            },
            {
              label: "Connections",
              key: "connection",
              icon: Network,
            },
            {
              label: "Messages",
              key: "message",
              icon: MessageCircle,
            },
            {
              label: "Appointments",
              key: "appointment",
              icon: CalendarDays,
            },
          ].map((item) => {
            const Icon = item.icon;
            const count = categoryCounts[item.key] || 0;

            return (
              <div
                key={item.key}
                className={`rounded-2xl border p-4 ${isAdmin ? "bg-[#191b28]" : "bg-white"}`}
                style={{ borderColor: isAdmin ? "rgba(255, 255, 255, 0.09)" : COLORS.border }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: isAdmin ? "rgba(110, 88, 190, 0.22)" : `${COLORS.purple}10`,
                      color: isAdmin ? "#b9a9ff" : COLORS.purple,
                    }}
                  >
                    <Icon size={15} />
                  </div>

                  <span
                    className="font-display text-lg font-bold"
                    style={{ color: isAdmin ? "#f4f0f8" : COLORS.navy }}
                  >
                    {count}
                  </span>
                </div>

                <p
                  className="mt-2 text-xs font-medium"
                  style={{ color: isAdmin ? "#c4bfd0" : "#6E6658" }}
                >
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: isAdmin ? "rgba(233, 128, 116, 0.4)" : `${COLORS.coral}55`,
            backgroundColor: isAdmin ? "rgba(127, 29, 29, 0.22)" : `${COLORS.coral}10`,
            color: isAdmin ? "#fecaca" : "#7A3F38",
          }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications */}
      {items.length === 0 ? (
        <Card
          style={isAdmin ? {
            borderColor: "rgba(255, 255, 255, 0.09)",
            backgroundColor: "#191b28",
          } : undefined}
        >
          {isAdmin ? (
            <div className="py-12 text-center text-[#c4bfd0]">
              <p className="font-display font-medium text-[#f4f0f8]">You're all caught up</p>
              <p className="mt-1 text-sm">Updates about requirements, connections, messages, appointments, and account activity will appear here.</p>
            </div>
          ) : (
            <EmptyState
              title="You're all caught up"
              subtitle="Updates about requirements, connections, messages, appointments, and account activity will appear here."
            />
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={markRead}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}