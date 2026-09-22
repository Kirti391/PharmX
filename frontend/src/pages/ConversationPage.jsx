import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Loader } from "../components/ui";
import { Button } from "../components/ui";
import { getSocket, useRealtimeEvent } from "../lib/socket";
import { format } from "date-fns";

export default function ConversationPage() {
  const { conversationId } = useParams();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    http.get(`/conversations/${conversationId}/messages`).then(setMessages).catch(() => setMessages([]));
    const socket = getSocket();
    socket?.emit("join:conversation", { conversationId });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useRealtimeEvent("message:new", (msg) => {
    if (msg.conversationId !== conversationId) return;
    setMessages((prev) => (prev ? [...prev, msg] : [msg]));
  });

  async function send(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const body = draft.trim();
    setDraft("");
    try {
      const msg = await http.post(`/conversations/${conversationId}/messages`, { body });
      setMessages((prev) => (prev ? [...prev.filter((m) => m.id !== msg.id), msg] : [msg]));
    } finally {
      setSending(false);
    }
  }

  if (!messages) return <Loader />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] -m-4 md:-m-8">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3">
        {messages.length === 0 && <p className="text-center text-taupe text-sm mt-10">Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "bg-navy text-white rounded-br-sm" : "bg-white text-navy shadow-sm rounded-bl-sm"
                }`}
              >
                <p>{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-white/50" : "text-taupe"}`}>{format(new Date(m.createdAt), "h:mm a")}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-taupedark/10 bg-white p-4 flex gap-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-taupedark/20 px-4 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
        <Button type="submit" loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
