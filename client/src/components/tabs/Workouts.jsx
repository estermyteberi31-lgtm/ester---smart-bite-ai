import { useEffect, useRef, useState } from "react";
import {
  fetchConversations,
  fetchConversationMessages,
  deleteConversation,
  sendChatMessage,
  sendChatImage,
} from "../../lib/api.js";

const SpeechRecognitionApi =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function Workouts() {
  const [view, setView] = useState("chat"); // "chat" | "history"
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingHistoryList, setLoadingHistoryList] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setError(null);
    setView("chat");
  }

  async function openHistory() {
    setView("history");
    setLoadingHistoryList(true);
    try {
      const data = await fetchConversations();
      setConversations(data.conversations ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingHistoryList(false);
    }
  }

  async function openConversation(id) {
    setError(null);
    try {
      const data = await fetchConversationMessages(id);
      setMessages(data.messages ?? []);
      setConversationId(id);
      setView("chat");
    } catch (err) {
      setError(err.detail || err.message || "Couldn't load that conversation.");
    }
  }

  async function handleDeleteConversation(event, id) {
    event.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) startNewChat();
    } catch {
      // ignore
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const { reply, conversationId: returnedId } = await sendChatMessage(trimmed, conversationId);
      setConversationId(returnedId);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.detail || err.message || "Failed to get a response.");
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

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || sending) return;
    setError(null);
    const caption = input.trim();
    const localImageUrl = URL.createObjectURL(file);
    setMessages((prev) => [...prev, { role: "user", content: caption, localImageUrl }]);
    setInput("");
    setSending(true);
    try {
      const { reply, conversationId: returnedId } = await sendChatImage(file, caption, conversationId);
      setConversationId(returnedId);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.detail || err.message || "Failed to analyze the photo.");
    } finally {
      setSending(false);
    }
  }

  function handleToggleListening() {
    if (!SpeechRecognitionApi || sending) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  if (view === "history") {
    return (
      <HistoryPanel
        conversations={conversations}
        loading={loadingHistoryList}
        onBack={() => setView("chat")}
        onSelect={openConversation}
        onDelete={handleDeleteConversation}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Nutrition chat</h2>
            <p className="text-xs text-white/40">Ask about food, meals, calories, or your goals.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openHistory}
              title="Chat history"
              aria-label="Chat history"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-all active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                <path
                  d="M12 8v5l3 2M4 12a8 8 0 1 1 2.6 5.9M4 12v5m0-5h5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={startNewChat}
              title="New chat"
              aria-label="New chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-all active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div
        ref={scrollRef}
        className="card-enter h-[55vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        style={{ "--delay": "40ms" }}
      >
        {messages.length === 0 ? (
          <p className="mt-6 text-center text-xs text-white/30">
            Say hi! Try "What should I eat before a run?" or snap a photo of your meal.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <ChatBubble key={idx} role={msg.role} content={msg.content} imageUrl={msg.localImageUrl} />
            ))}
            {sending && <TypingBubble />}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Send a photo"
          aria-label="Send a photo"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-all active:scale-90 disabled:opacity-40"
          style={{ color: "var(--accent)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M4 8l1.5-2h13L20 8M4 8h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </button>

        {SpeechRecognitionApi && (
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={sending}
            title={listening ? "Stop listening" : "Speak your message"}
            aria-label={listening ? "Stop listening" : "Speak your message"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-40"
            style={
              listening
                ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                : { backgroundColor: "rgba(255,255,255,0.05)", color: "var(--accent)" }
            }
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
              <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={listening ? "Listening..." : "Ask about food, meals, or calories..."}
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

function HistoryPanel({ conversations, loading, onBack, onSelect, onDelete }) {
  return (
    <div className="flex flex-col gap-3">
      <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to chat"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-all active:scale-90"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h2 className="text-base font-semibold">Chat history</h2>
            <p className="text-xs text-white/40">Past conversations</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col gap-2">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="mt-6 text-center text-xs text-white/30">No past conversations yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(conversation.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(conversation.id);
              }}
              className="card-enter flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">{conversation.title}</p>
                {conversation.preview && (
                  <p className="mt-1 truncate text-xs text-white/40">{conversation.preview}</p>
                )}
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                  {formatRelativeDate(conversation.updated_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => onDelete(event, conversation.id)}
                aria-label="Delete conversation"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 transition-all hover:text-red-400 active:scale-90"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M4 6h16M8 6V4h8v2m-9 0 1 14h8l1-14"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelativeDate(isoString) {
  if (!isoString) return "";
  const date = new Date(`${isoString.replace(" ", "T")}Z`);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChatBubble({ role, content, imageUrl }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[80%] flex-col gap-2 rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser ? "" : "bg-black/20 text-white/90"
        }`}
        style={isUser ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" } : undefined}
      >
        {imageUrl && <img src={imageUrl} alt="Sent to chat" className="h-44 w-52 max-w-full rounded-xl object-cover" />}
        {content && <span className="whitespace-pre-wrap">{content}</span>}
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
