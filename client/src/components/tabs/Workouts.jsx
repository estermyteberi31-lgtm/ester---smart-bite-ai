import { useEffect, useRef, useState } from "react";
import { fetchChatHistory, sendChatMessage, sendChatImage } from "../../lib/api.js";

const SpeechRecognitionApi =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function Workouts() {
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

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

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

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
      const { reply } = await sendChatImage(file, caption);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Failed to analyze the photo.");
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

  return (
    <div className="flex flex-col gap-3">
      <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold">Nutrition chat</h2>
        <p className="text-xs text-white/40">Ask about food, meals, calories, or your goals. Snap a photo or use your voice too.</p>
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
