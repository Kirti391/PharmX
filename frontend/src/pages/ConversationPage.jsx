import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  MessageCircle,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import { apiErrorMessage, http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, ErrorState, Loader } from "../components/ui";
import { getSocket, useRealtimeEvent } from "../lib/socket";

const SURFACE = {
  canvas: "#F5F3F8",
  paper: "#FFFFFF",
  ink: "#2A1B3D",
  muted: "#81788A",
  line: "#E8E3EE",
  purple: "#44318D",
  purpleSoft: "#EFEBF9",
  pink: "#D83F87",
};

function sortMessages(rows) {
  return [...rows].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() -
      new Date(second.createdAt).getTime()
  );
}

function dateLabel(value) {
  const date = new Date(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMMM yyyy");
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState(null);
  const [loadedConversationId, setLoadedConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      http.get(`/conversations/${conversationId}`),
      http.get(`/conversations/${conversationId}/messages`),
    ])
      .then(([conversationData, rows]) => {
        if (!active) return;
        setConversation(conversationData);
        setMessages(sortMessages(rows));
        setLoadedConversationId(conversationId);
        setLoadError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setLoadError(
          apiErrorMessage(requestError, "Unable to load this conversation.")
        );
      });

    getSocket()?.emit("join:conversation", { conversationId });
    return () => {
      active = false;
    };
  }, [conversationId, reloadCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useRealtimeEvent("message:new", (message) => {
    if (message.conversationId !== conversationId) return;
    setMessages((current) =>
      current
        ? sortMessages([
            ...current.filter((item) => item.id !== message.id),
            message,
          ])
        : [message]
    );
  });

  useRealtimeEvent("message:updated", (message) => {
    if (message.conversationId !== conversationId) return;
    setMessages((current) =>
      current?.map((item) => (item.id === message.id ? message : item)) ?? null
    );
  });

  useRealtimeEvent("message:deleted", (message) => {
    if (message.conversationId !== conversationId) return;
    setMessages((current) =>
      current?.map((item) => (item.id === message.id ? message : item)) ?? null
    );
  });

  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await http.post(
        `/conversations/${conversationId}/messages`,
        { body }
      );
      setMessages((current) =>
        sortMessages([
          ...(current || []).filter((item) => item.id !== message.id),
          message,
        ])
      );
      setConversation((current) =>
        current
          ? {
              ...current,
              lastMessage: { body: message.body, senderId: message.senderId },
              lastMessageAt: message.createdAt,
            }
          : current
      );
      setDraft("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to send this message."));
    } finally {
      setSending(false);
    }
  }

  function startEditing(message) {
    setEditingId(message.id);
    setEditDraft(message.body);
    setError("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    const body = editDraft.trim();
    if (!body || !editingId || savingEdit) return;
    setSavingEdit(true);
    setError("");
    try {
      const message = await http.patch(
        `/conversations/${conversationId}/messages/${editingId}`,
        { body }
      );
      setMessages((current) =>
        current?.map((item) => (item.id === message.id ? message : item)) ?? null
      );
      setEditingId(null);
      setEditDraft("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to edit this message."));
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteMessage(message) {
    if (!window.confirm("Delete this message for everyone in the conversation?")) {
      return;
    }
    setDeletingId(message.id);
    setError("");
    try {
      const deletedMessage = await http.delete(
        `/conversations/${conversationId}/messages/${message.id}`
      );
      setMessages((current) =>
        current?.map((item) =>
          item.id === deletedMessage.id ? deletedMessage : item
        ) ?? null
      );
      if (messages?.at(-1)?.id === message.id) {
        const latest = [...(messages || [])]
          .filter((item) => item.id !== message.id && !item.isDeleted)
          .at(-1);
        setConversation((current) =>
          current
            ? {
                ...current,
                lastMessage: latest
                  ? { body: latest.body, senderId: latest.senderId }
                  : null,
                lastMessageAt: latest?.createdAt || null,
              }
            : current
        );
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to delete this message."));
    } finally {
      setDeletingId(null);
    }
  }

  if (loadedConversationId !== conversationId && loadError) {
    return (
      <ErrorState
        message={loadError}
        onRetry={() => {
          setLoadError("");
          setReloadCount((count) => count + 1);
        }}
      />
    );
  }
  if (!messages || loadedConversationId !== conversationId || !conversation) {
    return <Loader />;
  }

  const other = conversation.otherParticipant;

  return (
    <main
      className="mx-auto flex h-[calc(100dvh-76px)] min-h-[500px] max-w-[1500px] flex-col overflow-hidden rounded-2xl border shadow-[0_18px_55px_rgba(42,27,61,0.09)] sm:h-[calc(100dvh-92px)] lg:flex-row"
      style={{ borderColor: SURFACE.line, backgroundColor: SURFACE.paper }}
    >
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-3 border-b px-4 py-3.5 sm:px-6"
          style={{ borderColor: SURFACE.line, backgroundColor: SURFACE.paper }}
        >
          <Link
            to="/messages"
            aria-label="Back to messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-[#F5F2F8] lg:hidden"
            style={{ color: SURFACE.purple }}
          >
            <ArrowLeft size={19} />
          </Link>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold"
            style={{ backgroundColor: SURFACE.purpleSoft, color: SURFACE.purple }}
          >
            {other?.imageUrl ? (
              <img src={other.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (other?.name || "P").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-semibold" style={{ color: SURFACE.ink }}>
              {other?.name || "Professional contact"}
            </h1>
            <p className="mt-0.5 truncate text-xs" style={{ color: SURFACE.muted }}>
              {other?.role?.replaceAll("_", " ") || "PharmX member"}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium sm:inline-flex" style={{ backgroundColor: SURFACE.purpleSoft, color: SURFACE.purple }}>
            <ShieldCheck size={13} />
            Professional conversation
          </span>
        </header>

        <div
          className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
          style={{ backgroundColor: SURFACE.canvas }}
        >
          {messages.length === 0 ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: SURFACE.purpleSoft, color: SURFACE.purple }}>
                <MessageCircle size={25} />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold" style={{ color: SURFACE.ink }}>Start the conversation</h2>
              <p className="mt-1 max-w-xs text-sm leading-6" style={{ color: SURFACE.muted }}>Send a professional message to continue your connection.</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const mine = message.senderId === user?.id;
              const previous = messages[index - 1];
              const needsDateDivider =
                !previous ||
                new Date(previous.createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();

              return (
                <div key={message.id}>
                  {needsDateDivider && (
                    <div className="mb-5 flex justify-center">
                      <span className="rounded-full border px-3 py-1 text-[10px] font-medium" style={{ borderColor: SURFACE.line, backgroundColor: SURFACE.paper, color: SURFACE.muted }}>
                        {dateLabel(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <article
                      className={`group max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[76%] ${
                        mine ? "rounded-br-md" : "rounded-bl-md border"
                      }`}
                      style={mine
                        ? { backgroundColor: SURFACE.purple, color: "white" }
                        : { borderColor: SURFACE.line, backgroundColor: SURFACE.paper, color: SURFACE.ink }}
                    >
                      {editingId === message.id ? (
                        <form onSubmit={saveEdit}>
                          <textarea
                            autoFocus
                            rows={Math.min(6, Math.max(2, editDraft.split("\n").length))}
                            maxLength={5000}
                            value={editDraft}
                            onChange={(event) => setEditDraft(event.target.value)}
                            className="min-h-20 w-full resize-y rounded-lg border border-white/25 bg-white/10 p-2 text-sm leading-6 text-white outline-none focus:border-white/60"
                            aria-label="Edit message"
                          />
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-white/80 hover:bg-white/10">
                              <X size={14} /> Cancel
                            </button>
                            <button type="submit" disabled={!editDraft.trim() || savingEdit} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ color: SURFACE.purple }}>
                              <Check size={14} /> Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className={`whitespace-pre-wrap break-words text-sm leading-6 ${message.isDeleted ? "italic opacity-70" : ""}`}>
                            {message.body}
                          </p>
                          <div className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-white/70" : ""}`} style={!mine ? { color: SURFACE.muted } : undefined}>
                            {message.editedAt && !message.isDeleted && <span>Edited</span>}
                            <time dateTime={message.createdAt}>{format(new Date(message.createdAt), "h:mm a")}</time>
                          </div>
                          {mine && !message.isDeleted && (
                            <div className="mt-2 flex justify-end gap-1 border-t border-white/15 pt-2">
                              <button
                                type="button"
                                onClick={() => startEditing(message)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] text-white/85 transition hover:bg-white/10"
                                aria-label="Edit message"
                              >
                                <Pencil size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMessage(message)}
                                disabled={deletingId === message.id}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] text-white/85 transition hover:bg-white/10 disabled:opacity-50"
                                aria-label="Delete message for everyone"
                              >
                                <Trash2 size={13} /> {deletingId === message.id ? "Deleting" : "Delete"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:px-6">
            {error}
          </p>
        )}
        <form onSubmit={send} className="border-t px-3 py-3 sm:px-5 sm:py-4" style={{ borderColor: SURFACE.line }}>
          <div className="flex items-end gap-2 rounded-2xl border p-2 shadow-sm transition focus-within:ring-2" style={{ borderColor: SURFACE.line, backgroundColor: SURFACE.paper, "--tw-ring-color": `${SURFACE.purple}22` }}>
            <textarea
              rows={1}
              maxLength={5000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Write a professional message…"
              disabled={sending}
              aria-label="Write a message"
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-[#9A929F]"
              style={{ color: SURFACE.ink }}
            />
            <span className="hidden shrink-0 items-center gap-1 px-2 pb-2 text-[10px] sm:inline-flex" style={{ color: SURFACE.muted }}>
              <Clock3 size={12} /> Enter to send
            </span>
            <Button type="submit" loading={sending} disabled={!draft.trim()} className="min-h-10 rounded-xl px-4" aria-label="Send message">
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="mt-2 px-1 text-[10px]" style={{ color: SURFACE.muted }}>
            Keep messages professional. Use Shift + Enter for a new line.
          </p>
        </form>
      </section>
    </main>
  );
}
