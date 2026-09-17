import { useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import Logo from "../components/Logo.jsx";

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

const QUESTION_STEPS = ["name", "diet", "calories", "budget", "notes"];
const STEPS = ["welcome", ...QUESTION_STEPS, "done"];

export default function OnboardingQuiz() {
  const { settings, saveSettings } = useAppContext();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    name: settings.name || "",
    dietary_preferences: settings.dietary_preferences || [],
    calorie_goal: settings.calorie_goal || 2200,
    weekly_budget: settings.weekly_budget || 60,
    custom_notes: settings.custom_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = step === "done";
  const questionIndex = QUESTION_STEPS.indexOf(step);

  function toggleDiet(option) {
    setForm((prev) => {
      const has = prev.dietary_preferences.includes(option);
      return {
        ...prev,
        dietary_preferences: has
          ? prev.dietary_preferences.filter((item) => item !== option)
          : [...prev.dietary_preferences, option],
      };
    });
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await saveSettings({
        name: form.name,
        dietary_preferences: form.dietary_preferences,
        calorie_goal: Number(form.calorie_goal),
        weekly_budget: Number(form.weekly_budget),
        custom_notes: form.custom_notes,
        onboarding_completed: true,
      });
    } catch (err) {
      setError(err.message || "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      await saveSettings({ onboarding_completed: true });
    } catch (err) {
      setError(err.message || "Failed to skip.");
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((idx) => idx + 1);
  }

  function goBack() {
    if (isFirst) return;
    setStepIndex((idx) => idx - 1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0b1a] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {questionIndex !== -1 && (
          <div className="mb-8 flex justify-center gap-1.5">
            {QUESTION_STEPS.map((s, idx) => (
              <span
                key={s}
                className="h-1.5 w-6 rounded-full transition-colors"
                style={{ backgroundColor: idx <= questionIndex ? "var(--accent)" : "rgba(255,255,255,0.1)" }}
              />
            ))}
          </div>
        )}

        <div className="flex-1">
          {step === "welcome" && (
            <div className="card-enter flex flex-col items-center text-center">
              <div className="glow-accent mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black">
                <Logo className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-bold">Welcome to SmartBite AI</h1>
              <p className="mt-2 text-sm text-white/50">
                Let's set up your profile so meal plans, scans, and chat are personalised to you. Takes under a
                minute.
              </p>
            </div>
          )}

          {step === "name" && (
            <QuizStep title="What should we call you?" subtitle="Your name, used across the app.">
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Your name"
                className="input"
                autoFocus
              />
            </QuizStep>
          )}

          {step === "diet" && (
            <QuizStep title="Any dietary preferences?" subtitle="Select all that apply — you can change this later.">
              <div className="flex flex-wrap gap-2">
                {DIET_OPTIONS.map((option) => {
                  const active = form.dietary_preferences.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleDiet(option)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95"
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
            </QuizStep>
          )}

          {step === "calories" && (
            <QuizStep title="Daily calorie goal" subtitle="A rough target — you can fine-tune this anytime in Settings.">
              <input
                type="number"
                min="0"
                value={form.calorie_goal}
                onChange={(event) => setForm((prev) => ({ ...prev, calorie_goal: event.target.value }))}
                className="input"
                autoFocus
              />
            </QuizStep>
          )}

          {step === "budget" && (
            <QuizStep title="Weekly grocery budget" subtitle="Helps us compare Tesco vs Aldi prices for you.">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weekly_budget}
                  onChange={(event) => setForm((prev) => ({ ...prev, weekly_budget: event.target.value }))}
                  className="input pl-7"
                  autoFocus
                />
              </div>
            </QuizStep>
          )}

          {step === "notes" && (
            <QuizStep
              title="Tell the AI about you"
              subtitle="Age, training schedule, foods you hate, intolerances — anything."
            >
              <textarea
                value={form.custom_notes}
                onChange={(event) => setForm((prev) => ({ ...prev, custom_notes: event.target.value }))}
                rows={5}
                maxLength={2000}
                placeholder={"e.g. I'm 19, trying to lose weight, I hate fish, I train 4x a week, I'm lactose intolerant..."}
                className="input resize-none"
                autoFocus
              />
            </QuizStep>
          )}

          {step === "done" && (
            <div className="card-enter flex flex-col items-center text-center">
              <div
                className="glow-accent mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">You're all set</h1>
              <p className="mt-2 text-sm text-white/50">
                We'll use this to personalise your scans, meal plans, and chat.
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={goBack}
                disabled={saving}
                className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white/70 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={saving}
              className="glow-accent flex-1 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              {saving ? "Saving..." : isLast ? "Get started" : step === "welcome" ? "Let's go" : "Next"}
            </button>
          </div>
          {questionIndex !== -1 && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-center text-xs text-white/30 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizStep({ title, subtitle, children }) {
  return (
    <div className="card-enter flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-white/40">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
