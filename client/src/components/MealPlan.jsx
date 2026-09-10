import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import { fetchMealPlan, generateMealPlan } from "../lib/api.js";
import AnimatedNumber from "./AnimatedNumber.jsx";

export default function MealPlan() {
  const { settings } = useAppContext();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMealPlan()
      .then((data) => setPlan(data.latest))
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateMealPlan({
        calorieGoal: settings.calorie_goal,
        weeklyBudget: settings.weekly_budget,
        dietaryPreferences: settings.dietary_preferences,
      });
      setPlan(data);
    } catch (err) {
      setError(err.message || "Failed to generate a meal plan.");
    } finally {
      setLoading(false);
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

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="glow-accent mt-3 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Planning your week...
          </span>
        ) : plan ? (
          "Regenerate meal plan"
        ) : (
          "Generate this week's plan"
        )}
      </button>

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
                      <div className="flex items-center justify-between text-white/40">
                        <span>{meal.type}</span>
                        <span
                          className="rounded px-1 text-[9px] font-semibold"
                          style={{
                            backgroundColor: meal.store === "Aldi" ? "#3b82f6" : "#f97316",
                            color: "#0f0b1a",
                          }}
                        >
                          {meal.store}
                        </span>
                      </div>
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
