import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";

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
  const { settings, settingsLoaded, saveSettings } = useAppContext();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-lg font-bold">
            {(form.name || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{form.name || "SmartBite User"}</p>
            <span className="mt-0.5 inline-block rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
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
        <h3 className="text-sm font-semibold text-white/80">Dietary preferences</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIET_OPTIONS.map((option) => {
            const active = (form.dietary_preferences ?? []).includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDiet(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-purple-600 text-white" : "bg-white/5 text-white/50"
                }`}
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
        className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-sm font-semibold shadow-lg shadow-purple-900/40 disabled:opacity-50"
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
