import { useRef, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { scanImage } from "../../lib/api.js";
import AnimatedNumber from "../AnimatedNumber.jsx";

export default function Home() {
  const { settings, gymMode, setGymMode, progressSeries, streak, setActiveTab, refreshProgressSeries } = useAppContext();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const today = progressSeries[progressSeries.length - 1] ?? null;
  const firstName = (settings.name || "there").split(" ")[0];

  function handleFileChange(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError(null);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleScan() {
    if (!file) {
      setError("Capture or choose a photo first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await scanImage({ file, chatMessage, gymMode });
      setResult(data);
      refreshProgressSeries();
    } catch (err) {
      setError(err.detail || err.message || "Failed to analyze the photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card-enter">
        <h1 className="text-xl font-semibold">Hi {firstName}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          What are we making today?
        </p>
      </section>

      <button
        type="button"
        onClick={() => setActiveTab("maker")}
        className="card-enter flex items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.98]"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--cta)", color: "var(--cta-contrast)" }}
      >
        <div>
          <p className="text-sm font-semibold">Ask Bite</p>
          <p className="mt-0.5 text-xs opacity-70">Photograph your fridge, get a recipe</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <section
        className="card-enter rounded-2xl border p-4"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <h2 className="text-sm font-semibold">Today</h2>
        {today ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="Nutrition" value={today.nutritionScore ?? 0} />
            <Stat label="Workouts" value={today.workoutsCompleted ?? 0} />
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className="flex flex-col items-center justify-center rounded-xl p-2 transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-muted)" }}
            >
              <span className="flex items-center gap-1 text-sm font-semibold">
                <span className={streak.currentStreak > 0 ? "flame-pulse" : ""}>🔥</span>
                {streak.currentStreak}
              </span>
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Day streak
              </span>
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            Nothing logged yet — scan a meal below to get started.
          </p>
        )}
      </section>

      <section
        className="card-enter rounded-2xl border p-4"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Log a meal</h2>
          <div className="flex items-center gap-2 rounded-full p-1 text-[11px]" style={{ backgroundColor: "var(--bg-muted)" }}>
            <button
              type="button"
              onClick={() => setGymMode("home")}
              className="rounded-full px-2.5 py-1 font-medium transition-all active:scale-90"
              style={
                gymMode === "home"
                  ? { backgroundColor: "var(--cta)", color: "var(--cta-contrast)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setGymMode("gym")}
              className="rounded-full px-2.5 py-1 font-medium transition-all active:scale-90"
              style={
                gymMode === "gym"
                  ? { backgroundColor: "var(--cta)", color: "var(--cta-contrast)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              Gym
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all active:scale-[0.98]"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Selected capture" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" style={{ color: "var(--accent)" }}>
                <path
                  d="M4 8l1.5-2h13L20 8M4 8h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span className="text-sm">Tap to capture a photo</span>
              <span className="text-[11px]" style={{ opacity: 0.7 }}>
                Meal, groceries, or a receipt
              </span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <textarea
          value={chatMessage}
          onChange={(event) => setChatMessage(event.target.value)}
          placeholder="Optional note, e.g. 'this is my post-workout dinner'"
          rows={2}
          className="input mt-3 resize-none"
        />

        <button
          type="button"
          onClick={handleScan}
          disabled={loading}
          className="glow-accent mt-3 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: "var(--cta)", color: "var(--cta-contrast)" }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Analyzing...
            </span>
          ) : (
            "Scan with SmartBite AI"
          )}
        </button>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </section>

      {loading && !result && <ScanSkeleton />}
      {result && <ScanResults result={result} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl p-2" style={{ backgroundColor: "var(--bg-muted)" }}>
      <p className="text-sm font-semibold">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}

function ScanSkeleton() {
  return (
    <section className="card-enter rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
      <div className="skeleton h-4 w-32 rounded" />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
      <div className="skeleton mt-4 h-2.5 rounded-full" />
      <div className="skeleton mt-4 h-10 rounded-lg" />
    </section>
  );
}

function ScanResults({ result }) {
  const totals = result.totals ?? {};
  const macros = result.macro_split ?? {};
  const items = Array.isArray(result.items) ? result.items : [];
  const prices = Array.isArray(result.estimated_prices) ? result.estimated_prices : [];

  return (
    <div className="flex flex-col gap-4">
      <section className="card-enter rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Nutrition summary</h3>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Score <AnimatedNumber value={result.nutrition_score ?? 0} />/100
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <MiniStat label="Calories" value={totals.calories ?? 0} />
          <MiniStat label="Protein" value={totals.protein_g ?? 0} suffix="g" />
          <MiniStat label="Carbs" value={totals.carbs_g ?? 0} suffix="g" />
          <MiniStat label="Fat" value={totals.fat_g ?? 0} suffix="g" />
        </div>

        <MacroBar macros={macros} />

        {items.length > 0 && (
          <ul className="mt-4 divide-y text-sm" style={{ borderColor: "var(--border-subtle)" }}>
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between py-2" style={{ borderColor: "var(--border-subtle)" }}>
                <span>
                  {item.name}
                  {item.quantity ? <span style={{ color: "var(--text-secondary)" }}> · {item.quantity}</span> : null}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>{item.calories ?? 0} kcal</span>
              </li>
            ))}
          </ul>
        )}

        {result.insight && (
          <p className="mt-3 rounded-lg p-3 text-xs" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}>
            {result.insight}
          </p>
        )}
      </section>

      {prices.length > 0 && (
        <section
          className="card-enter rounded-2xl border p-4"
          style={{ "--delay": "80ms", borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Estimated cost</h3>
            {typeof result.estimated_total_low === "number" && typeof result.estimated_total_high === "number" && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
              >
                £{result.estimated_total_low.toFixed(2)}–£{result.estimated_total_high.toFixed(2)}
              </span>
            )}
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {prices.map((row, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-xl p-3 text-sm"
                style={{ backgroundColor: "var(--bg-muted)" }}
              >
                <span className="font-medium">{row.item}</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  £{Number(row.price_low ?? 0).toFixed(2)}–£{Number(row.price_high ?? 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px]" style={{ color: "var(--text-secondary)" }}>
            Rough estimates — not pulled from live prices.
          </p>
        </section>
      )}
    </div>
  );
}

function MiniStat({ label, value, suffix = "" }) {
  return (
    <div className="rounded-xl py-2" style={{ backgroundColor: "var(--bg-muted)" }}>
      <p className="text-sm font-semibold">
        <AnimatedNumber value={value} formatter={(n) => `${Math.round(n)}${suffix}`} />
      </p>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}

function MacroBar({ macros }) {
  const protein = Number(macros.protein_pct) || 0;
  const carbs = Number(macros.carbs_pct) || 0;
  const fat = Number(macros.fat_pct) || 0;
  const total = protein + carbs + fat || 1;

  return (
    <div className="mt-4">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
        <div
          className="transition-all duration-700 ease-out"
          style={{ width: `${(protein / total) * 100}%`, backgroundColor: "var(--accent)" }}
        />
        <div className="bg-amber-500 transition-all duration-700 ease-out" style={{ width: `${(carbs / total) * 100}%` }} />
        <div className="bg-stone-400 transition-all duration-700 ease-out" style={{ width: `${(fat / total) * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: "var(--text-secondary)" }}>
        <span>Protein {protein}%</span>
        <span>Carbs {carbs}%</span>
        <span>Fat {fat}%</span>
      </div>
    </div>
  );
}
