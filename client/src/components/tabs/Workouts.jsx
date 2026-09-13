import { useEffect, useRef, useState } from "react";
import { fetchChatHistory, sendChatMessage } from "../../lib/api.js";

export default function Workouts() {
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchChatHistory()
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await sendChatMessage(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Failed to get a response.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold">Nutrition chat</h2>
        <p className="text-xs text-white/40">Ask about food, meals, calories, or your goals.</p>
      </section>

      <div
        ref={scrollRef}
        className="card-enter h-[55vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        style={{ "--delay": "40ms" }}
      >
        {loadingHistory ? (
          <div className="flex flex-col gap-2">
            <div className="skeleton h-10 w-2/3 rounded-2xl" />
            <div className="skeleton ml-auto h-10 w-1/2 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <p className="mt-6 text-center text-xs text-white/30">
            Say hi! Try "What should I eat before a run?" or "Is this snack good for my goal?"
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <ChatBubble key={idx} role={msg.role} content={msg.content} />
            ))}
            {sending && <TypingBubble />}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about food, meals, or calories..."
          className="input max-h-24 flex-1 resize-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="glow-accent shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser ? "" : "bg-black/20 text-white/90"
        }`}
        style={isUser ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" } : undefined}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-black/20 px-4 py-3">
        {[0, 1, 2].map((idx) => (
          <span
            key={idx}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
            style={{ animationDelay: `${idx * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
