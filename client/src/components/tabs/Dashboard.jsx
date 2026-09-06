import { useRef, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { scanImage } from "../../lib/api.js";

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
      <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Scan food or receipt</h2>
          <div className="flex items-center gap-2 rounded-full bg-black/5 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setGymMode("home")}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                gymMode === "home" ? "bg-black text-white" : "text-black/50"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setGymMode("gym")}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                gymMode === "gym" ? "bg-black text-white" : "text-black/50"
              }`}
            >
              Gym
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-black/[0.03] text-black/60 transition-colors active:border-black"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Selected capture" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-black">
                <path
                  d="M4 8l1.5-2h13L20 8M4 8h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span className="text-sm">Tap to capture a photo</span>
              <span className="text-[11px] text-black/40">Meal, groceries, or a receipt</span>
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
          className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm placeholder:text-black/30 focus:border-black focus:outline-none"
        />

        <button
          type="button"
          onClick={handleScan}
          disabled={loading}
          className="mt-3 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-opacity disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Scan with Myteberi"}
        </button>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </section>

      {result && <ScanResults result={result} />}
    </div>
  );
}

function ScanResults({ result }) {
  const totals = result.totals ?? {};
  const macros = result.macro_split ?? {};
  const items = Array.isArray(result.items) ? result.items : [];
  const prices = Array.isArray(result.price_comparison) ? result.price_comparison : [];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black/80">Nutrition summary</h3>
          <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
            Score {result.nutrition_score ?? 0}/100
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="Calories" value={totals.calories ?? 0} />
          <Stat label="Protein" value={`${totals.protein_g ?? 0}g`} />
          <Stat label="Carbs" value={`${totals.carbs_g ?? 0}g`} />
          <Stat label="Fat" value={`${totals.fat_g ?? 0}g`} />
        </div>

        <MacroBar macros={macros} />

        {items.length > 0 && (
          <ul className="mt-4 divide-y divide-black/5 text-sm">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between py-2">
                <span className="text-black/80">
                  {item.name}
                  {item.quantity ? <span className="text-black/40"> · {item.quantity}</span> : null}
                </span>
                <span className="text-black/50">{item.calories ?? 0} kcal</span>
              </li>
            ))}
          </ul>
        )}

        {result.insight && (
          <p className="mt-3 rounded-lg bg-black/[0.04] p-3 text-xs text-black/70">{result.insight}</p>
        )}
      </section>

      {prices.length > 0 && (
        <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black/80">Tesco vs Aldi</h3>
            {typeof result.estimated_total_savings === "number" && (
              <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                Save £{result.estimated_total_savings.toFixed(2)}
              </span>
            )}
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {prices.map((row, idx) => (
              <li key={idx} className="rounded-xl border border-black/10 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-black/80">{row.item}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      row.cheaper_store === "Aldi" ? "bg-black text-white" : "border border-black/20 text-black/70"
                    }`}
                  >
                    Cheaper at {row.cheaper_store}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-xs text-black/50">
                  <span>Tesco £{Number(row.tesco_price ?? 0).toFixed(2)}</span>
                  <span>Aldi £{Number(row.aldi_price ?? 0).toFixed(2)}</span>
                  <span className="font-semibold text-black">Save £{Number(row.savings ?? 0).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white py-2">
      <p className="text-sm font-semibold text-black">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-black/40">{label}</p>
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
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div className="bg-black" style={{ width: `${(protein / total) * 100}%` }} />
        <div className="bg-black/50" style={{ width: `${(carbs / total) * 100}%` }} />
        <div className="bg-black/25" style={{ width: `${(fat / total) * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-black/40">
        <span>Protein {protein}%</span>
        <span>Carbs {carbs}%</span>
        <span>Fat {fat}%</span>
      </div>
    </div>
  );
}
