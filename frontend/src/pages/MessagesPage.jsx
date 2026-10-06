import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { apiErrorMessage, http } from "../lib/api";
import { EmptyState, ErrorState, Loader } from "../components/ui";

const COLORS = {
  ink: "#2A1B3D",
  muted: "#81788A",
  line: "#E8E3EE",
  purple: "#44318D",
  purpleSoft: "#EFEBF9",
  pink: "#D83F87",
  canvas: "#F5F3F8",
};

export default function MessagesPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [startError, setStartError] = useState("");
  const [startRetryCount, setStartRetryCount] = useState(0);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const startWith = search.get("with");

  useEffect(() => {
    let active = true;
    http
      .get("/conversations")
      .then((rows) => {
        if (active) setConversations(rows);
      })
      .catch((requestError) => {
        if (active) {
          setError(apiErrorMessage(requestError, "Unable to load your conversations."));
        }
      });
    return () => {
      active = false;
    };
  }, [loadRetryCount]);

  useEffect(() => {
    if (!startWith) return undefined;
    let active = true;
    http
      .post("/conversations", { participantId: startWith })
      .then((conversation) => {
        if (active) navigate(`/messages/${conversation.id}`, { replace: true });
      })
      .catch((requestError) => {
        if (active) {
          setStartError(apiErrorMessage(requestError, "Unable to start this conversation."));
        }
      });
    return () => {
      active = false;
    };
  }, [startWith, navigate, startRetryCount]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return conversations || [];
    return (conversations || []).filter((conversation) =>
      [
        conversation.otherParticipant?.name,
        conversation.otherParticipant?.role,
        conversation.lastMessage?.body,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [conversations, query]);

  if (startWith && !startError) return <Loader />;

  return (
    <main className="mx-auto max-w-[1180px] space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-[26px] px-6 py-8 text-white shadow-[0_18px_48px_rgba(42,27,61,0.14)] sm:px-9 sm:py-10" style={{ background: "linear-gradient(120deg, #2A1B3D 0%, #44318D 72%, #6542A1 100%)" }}>
        <span aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <span aria-hidden="true" className="absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/85">
              <MessageCircle size={13} /> Professional network
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Messages</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
              Thoughtful conversations with your professional connections, all in one place.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-2.5 text-xs text-white/85">
            <ShieldCheck size={15} /> Connection-protected
          </span>
        </div>
      </header>

      {startError && (
        <ErrorState
          title="Unable to start conversation"
          message={startError}
          onRetry={() => {
            setStartError("");
            setStartRetryCount((count) => count + 1);
          }}
        />
      )}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setConversations(null);
            setError("");
            setLoadRetryCount((count) => count + 1);
          }}
        />
      )}

      {!conversations ? (
        error ? null : <Loader />
      ) : (
        <section className="overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_38px_rgba(42,27,61,0.055)]" style={{ borderColor: COLORS.line }}>
          <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7" style={{ borderColor: COLORS.line }}>
            <div>
              <h2 className="font-display text-lg font-semibold" style={{ color: COLORS.ink }}>Your conversations</h2>
              <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                {conversations.length} {conversations.length === 1 ? "connection" : "connections"}
              </p>
            </div>
            <label className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border px-3.5 sm:max-w-xs" style={{ borderColor: COLORS.line, backgroundColor: COLORS.canvas }}>
              <Search size={16} style={{ color: COLORS.muted }} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9A929F]"
                style={{ color: COLORS.ink }}
              />
            </label>
          </div>

          {conversations.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState title="No conversations yet" subtitle="Start one from an accepted connection or an appointment." />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm" style={{ color: COLORS.muted }}>No conversations match that search.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: COLORS.line }}>
              {filteredConversations.map((conversation) => {
                const participant = conversation.otherParticipant;
                const name = participant?.name || "PharmX member";
                return (
                  <Link
                    key={conversation.id}
                    to={`/messages/${conversation.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FAF9FC] sm:px-7 sm:py-5"
                  >
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl font-display text-sm font-semibold" style={{ backgroundColor: COLORS.purpleSoft, color: COLORS.purple }}>
                      {participant?.imageUrl ? (
                        <img src={participant.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : name.charAt(0).toUpperCase()}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ backgroundColor: "#55A47B" }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="truncate font-medium" style={{ color: COLORS.ink }}>{name}</span>
                        {conversation.lastMessageAt && (
                          <time className="shrink-0 text-[10px]" style={{ color: COLORS.muted }}>
                            {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                          </time>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.1em]" style={{ color: COLORS.purple }}>
                        {participant?.role?.replaceAll("_", " ") || "Professional connection"}
                      </span>
                      <span className={`mt-2 block truncate text-xs ${conversation.lastMessage?.isDeleted ? "italic" : ""}`} style={{ color: COLORS.muted }}>
                        {conversation.lastMessage?.body || "No messages yet — say hello"}
                      </span>
                    </span>
                    <ArrowRight size={17} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: COLORS.pink }} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
