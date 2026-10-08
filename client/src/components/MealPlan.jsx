import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppContext } from "../context/AppContext.jsx";
import { fetchMealPlan, generateMealPlan } from "../lib/api.js";
import AnimatedNumber from "./AnimatedNumber.jsx";

const isNative = Capacitor.isNativePlatform();

export default function MealPlan() {
  const { settings } = useAppContext();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyNotes, setWeeklyNotes] = useState("");
  const [listening, setListening] = useState(false);
  const latestTranscriptRef = useRef("");

  useEffect(() => {
    fetchMealPlan()
      .then((data) => setPlan(data.latest))
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (!isNative) return;
    let SpeechRecognition;
    import("@capacitor-community/speech-recognition").then((mod) => {
      SpeechRecognition = mod.SpeechRecognition;
    });
    return () => {
      SpeechRecognition?.removeAllListeners();
    };
  }, []);

  async function handleGenerate(notesOverride) {
    const notes = notesOverride ?? weeklyNotes;
    setLoading(true);
    setError(null);
    try {
      const data = await generateMealPlan({
        calorieGoal: settings.calorie_goal,
        weeklyBudget: settings.weekly_budget,
        dietaryPreferences: settings.dietary_preferences,
        weeklyNotes: notes,
      });
      setPlan(data);
      setWeeklyNotes("");
    } catch (err) {
      setError(err.detail || err.message || "Failed to generate a meal plan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMicDown() {
    if (!isNative || loading || listening) return;
    setError(null);
    try {
      const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
      const { available } = await SpeechRecognition.available();
      if (!available) {
        setError("Speech recognition isn't available on this device.");
        return;
      }
      const permission = await SpeechRecognition.checkPermissions();
      if (permission.speechRecognition !== "granted") {
        const requested = await SpeechRecognition.requestPermissions();
        if (requested.speechRecognition !== "granted") {
          setError("Microphone/speech permission was denied. You can still type below.");
          return;
        }
      }

      latestTranscriptRef.current = "";
      await SpeechRecognition.addListener("partialResults", (data) => {
        if (Array.isArray(data.matches) && data.matches.length > 0) {
          latestTranscriptRef.current = data.matches[0];
        }
      });

      setListening(true);
      await SpeechRecognition.start({
        language: "en-US",
        maxResults: 1,
        partialResults: true,
        popup: false,
      });
    } catch (err) {
      setListening(false);
      setError(err.message || "Couldn't start listening.");
    }
  }

  async function handleMicUp() {
    if (!isNative || !listening) return;
    setListening(false);
    try {
      const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
      await SpeechRecognition.stop();
      await SpeechRecognition.removeAllListeners();
      const transcript = latestTranscriptRef.current.trim();
      if (transcript) {
        setWeeklyNotes(transcript);
        handleGenerate(transcript);
      }
    } catch (err) {
      setError(err.message || "Couldn't process what you said.");
    }
  }

  const overBudget = plan && plan.plan.total_estimated_cost > plan.weeklyBudget;

  return (
    <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4" style={{ "--delay": "40ms" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Weekly meal plan</h2>
          <p className="text-xs text-white/40">Fits your calorie goal and grocery budget</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        {isNative && (
          <>
            <p className="text-sm font-medium text-white/80">Tell us about your week</p>
            <button
              type="button"
              onPointerDown={handleMicDown}
              onPointerUp={handleMicUp}
              onPointerLeave={handleMicUp}
              disabled={loading}
              aria-label="Hold to speak"
              className={`glow-accent mt-4 flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-50 ${
                listening ? "flame-pulse" : ""
              }`}
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
                <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <p className="mt-3 text-xs text-white/40">
              {listening ? "Listening..." : "Hold to speak, release to generate"}
            </p>
          </>
        )}

        <div className="mt-4 flex w-full items-center gap-2">
          <input
            type="text"
            value={weeklyNotes}
            onChange={(event) => setWeeklyNotes(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleGenerate();
            }}
            placeholder={isNative ? "...or type instead" : "Optional: anything about this week?"}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className="glow-accent shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            {loading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : plan ? (
              "Redo"
            ) : (
              "Go"
            )}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {(loading || initialLoading) && !plan && <MealPlanSkeleton />}

      {!loading && !initialLoading && !plan && (
        <p className="mt-4 text-xs text-white/40">
          No plan yet — tap above to build 7 days of meals that hit £{settings.weekly_budget} and{" "}
          {settings.calorie_goal} kcal/day.
        </p>
      )}

      {plan && !loading && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-black/20 py-2">
              <p className="text-sm font-semibold" style={{ color: overBudget ? "#f87171" : "#4ade80" }}>
                £<AnimatedNumber value={plan.plan.total_estimated_cost ?? 0} formatter={(n) => n.toFixed(2)} />
              </p>
              <p className="text-[10px] uppercase tracking-wide text-white/40">
                of £{plan.weeklyBudget} budget
              </p>
            </div>
            <div className="rounded-xl bg-black/20 py-2">
              <p className="text-sm font-semibold">
                <AnimatedNumber value={plan.plan.average_daily_calories ?? 0} /> kcal
              </p>
              <p className="text-[10px] uppercase tracking-wide text-white/40">avg / day</p>
            </div>
          </div>

          {plan.plan.insight && (
            <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-white/70">{plan.plan.insight}</p>
          )}

          <div className="no-scrollbar mt-4 -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {(plan.plan.days ?? []).map((day, idx) => (
              <div
                key={idx}
                className="w-44 shrink-0 rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <p className="text-xs font-semibold text-white/80">{day.day}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {(day.meals ?? []).map((meal, mealIdx) => (
                    <li key={mealIdx} className="text-[11px]">
                      <p className="text-white/40">{meal.type}</p>
                      <p className="text-white/80">{meal.name}</p>
                      <p className="text-white/40">
                        {meal.calories} kcal · £{Number(meal.estimated_cost ?? 0).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MealPlanSkeleton() {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
      </div>
      <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="skeleton h-40 w-44 shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
