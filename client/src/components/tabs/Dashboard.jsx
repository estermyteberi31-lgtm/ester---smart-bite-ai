import { useRef, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { scanImage } from "../../lib/api.js";
import AnimatedNumber from "../AnimatedNumber.jsx";

export default function Dashboard() {
  const { gymMode, setGymMode, refreshProgressSeries } = useAppContext();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
      setError(err.message || "Failed to analyze the photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Scan food or receipt</h2>
          <div className="flex items-center gap-2 rounded-full bg-white/5 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setGymMode("home")}
              className="rounded-full px-2.5 py-1 font-medium transition-all active:scale-90"
              style={
                gymMode === "home"
                  ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                  : { color: "rgba(255,255,255,0.5)" }
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
                  ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                  : { color: "rgba(255,255,255,0.5)" }
              }
            >
              Gym
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-black/20 text-white/60 transition-all active:scale-[0.98]"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Selected capture" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" style={{ color: "var(--accent)" }}>
                <path
                  d="M4 8l1.5-2h13L20 8M4 8h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span className="text-sm">Tap to capture a photo</span>
              <span className="text-[11px] text-white/30">Meal, groceries, or a receipt</span>
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
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
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

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </section>

      {loading && !result && <ScanSkeleton />}
      {result && <ScanResults result={result} />}
    </div>
  );
}

function ScanSkeleton() {
  return (
    <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
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
  const prices = Array.isArray(result.price_comparison) ? result.price_comparison : [];

  return (
    <div className="flex flex-col gap-4">
      <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Nutrition summary</h3>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Score <AnimatedNumber value={result.nutrition_score ?? 0} />/100
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="Calories" value={totals.calories ?? 0} />
          <Stat label="Protein" value={totals.protein_g ?? 0} suffix="g" />
          <Stat label="Carbs" value={totals.carbs_g ?? 0} suffix="g" />
          <Stat label="Fat" value={totals.fat_g ?? 0} suffix="g" />
        </div>

        <MacroBar macros={macros} />

        {items.length > 0 && (
          <ul className="mt-4 divide-y divide-white/5 text-sm">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between py-2">
                <span className="text-white/80">
                  {item.name}
                  {item.quantity ? <span className="text-white/40"> · {item.quantity}</span> : null}
                </span>
                <span className="text-white/50">{item.calories ?? 0} kcal</span>
              </li>
            ))}
          </ul>
        )}

        {result.insight && (
          <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-white/70">{result.insight}</p>
        )}
      </section>

      {prices.length > 0 && (
        <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4" style={{ "--delay": "80ms" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Tesco vs Aldi</h3>
            {typeof result.estimated_total_savings === "number" && (
              <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-300">
                Save £{result.estimated_total_savings.toFixed(2)}
              </span>
            )}
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {prices.map((row, idx) => (
              <li key={idx} className="rounded-xl bg-black/20 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white/80">{row.item}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      row.cheaper_store === "Aldi" ? "bg-blue-500/20 text-blue-300" : "bg-orange-500/20 text-orange-300"
                    }`}
                  >
                    Cheaper at {row.cheaper_store}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-xs text-white/50">
                  <span>Tesco £{Number(row.tesco_price ?? 0).toFixed(2)}</span>
                  <span>Aldi £{Number(row.aldi_price ?? 0).toFixed(2)}</span>
                  <span className="text-green-400">Save £{Number(row.savings ?? 0).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, suffix = "" }) {
  return (
    <div className="rounded-xl bg-black/20 py-2">
      <p className="text-sm font-semibold">
        <AnimatedNumber value={value} formatter={(n) => `${Math.round(n)}${suffix}`} />
      </p>
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
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
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="transition-all duration-700 ease-out"
          style={{ width: `${(protein / total) * 100}%`, backgroundColor: "var(--accent)" }}
        />
        <div className="bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${(carbs / total) * 100}%` }} />
        <div className="bg-amber-500 transition-all duration-700 ease-out" style={{ width: `${(fat / total) * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-white/40">
        <span>Protein {protein}%</span>
        <span>Carbs {carbs}%</span>
        <span>Fat {fat}%</span>
      </div>
    </div>
  );
}
