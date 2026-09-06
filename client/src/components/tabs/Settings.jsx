import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { NEON_COLORS } from "../../lib/colors.js";

const DIET_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Halal",
  "Kosher",
];

export default function Settings() {
  const { settings, settingsLoaded, saveSettings, streak } = useAppContext();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const [colorError, setColorError] = useState(null);
  const [pickingColor, setPickingColor] = useState(null);

  useEffect(() => {
    if (settingsLoaded) setForm(settings);
  }, [settingsLoaded, settings]);

  function toggleDiet(option) {
    setForm((prev) => {
      const current = prev.dietary_preferences ?? [];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, dietary_preferences: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveSettings({
        name: form.name,
        email: form.email,
        dietary_preferences: form.dietary_preferences,
        calorie_goal: Number(form.calorie_goal),
        weekly_budget: Number(form.weekly_budget),
        preferred_gym_mode: form.preferred_gym_mode,
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickColor(colorKey) {
    setColorError(null);
    setPickingColor(colorKey);
    try {
      await saveSettings({ accent_color: colorKey });
    } catch (err) {
      setColorError(err.message || "Couldn't switch colors.");
    } finally {
      setPickingColor(null);
    }
  }

  const daysToGo = Math.max(streak.unlockAt - streak.currentStreak, 0);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            {(form.name || "M").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{form.name || "Myteberi User"}</p>
            <span
              className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              {form.plan || "Free"} plan
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Field label="Name">
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="input"
              placeholder="you@example.com"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Neon color</h3>
          <span className="text-xs text-white/40">🔥 {streak.currentStreak}-day streak</span>
        </div>

        <p className="mt-1 text-xs text-white/40">
          {streak.colorsUnlocked
            ? "All colors unlocked — nice streak!"
            : `Keep a daily streak going for ${daysToGo} more day${daysToGo === 1 ? "" : "s"} to unlock every color.`}
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          {NEON_COLORS.map((color) => {
            const locked = !color.free && !streak.colorsUnlocked;
            const active = form.accent_color === color.key;
            return (
              <button
                key={color.key}
                type="button"
                disabled={locked || pickingColor === color.key}
                onClick={() => handlePickColor(color.key)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform active:scale-90 disabled:active:scale-100"
                style={{
                  backgroundColor: color.hex,
                  borderColor: active ? "#ffffff" : "rgba(255,255,255,0.15)",
                  opacity: locked ? 0.35 : 1,
                }}
                aria-label={`${color.label}${locked ? " (locked)" : ""}`}
                title={locked ? `Unlocks at a ${streak.unlockAt}-day streak` : color.label}
              >
                {locked && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <rect x="5" y="11" width="14" height="9" rx="1.5" fill="#0f0b1a" fillOpacity="0.85" />
                    <path
                      d="M8 11V8a4 4 0 1 1 8 0v3"
                      stroke="#ffffff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        {colorError && <p className="mt-2 text-xs text-red-400">{colorError}</p>}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold text-white/80">Dietary preferences</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIET_OPTIONS.map((option) => {
            const active = (form.dietary_preferences ?? []).includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDiet(option)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                    : { color: "rgba(255,255,255,0.5)", backgroundColor: "rgba(255,255,255,0.05)" }
                }
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold text-white/80">Goals</h3>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Daily calorie goal">
            <input
              type="number"
              min="0"
              value={form.calorie_goal ?? 0}
              onChange={(event) => setForm((prev) => ({ ...prev, calorie_goal: event.target.value }))}
              className="input"
            />
          </Field>
          <Field label="Weekly grocery budget (£)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.weekly_budget ?? 0}
              onChange={(event) => setForm((prev) => ({ ...prev, weekly_budget: event.target.value }))}
              className="input"
            />
          </Field>
          <Field label="Preferred training mode">
            <select
              value={form.preferred_gym_mode ?? "home"}
              onChange={(event) => setForm((prev) => ({ ...prev, preferred_gym_mode: event.target.value }))}
              className="input"
            >
              <option value="home">Home Mode (No Equipment)</option>
              <option value="gym">Gym Mode (Full Equipment)</option>
            </select>
          </Field>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl py-3 text-sm font-semibold shadow-lg disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
      {savedAt && !error && <p className="text-center text-xs text-green-400">Settings saved.</p>}
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-white/50">{label}</span>
      {children}
    </label>
  );
}
