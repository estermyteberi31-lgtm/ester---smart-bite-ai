import { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { generateWorkout, completeWorkout } from "../../lib/api.js";

const STYLES = ["Weight Lifting", "Cardio / Running", "Full Body Toning"];

export default function Workouts() {
  const { gymMode, setGymMode, settings, workoutHistory, refreshWorkoutHistory, refreshProgressSeries } =
    useAppContext();
  const [style, setStyle] = useState(STYLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCompleted(false);
    try {
      const data = await generateWorkout({
        mode: gymMode,
        style,
        profile: {
          calorieGoal: settings.calorie_goal,
          dietaryPreferences: settings.dietary_preferences,
        },
      });
      setWorkout(data);
    } catch (err) {
      setError(err.message || "Failed to generate a workout.");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!workout) return;
    setCompleting(true);
    try {
      await completeWorkout({
        title: workout.title,
        focus: workout.focus_phrase,
        mode: workout.mode ?? gymMode,
        style: workout.style ?? style,
      });
      setCompleted(true);
      refreshWorkoutHistory();
      refreshProgressSeries();
    } catch (err) {
      setError(err.message || "Failed to log workout.");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold">Today's workout</h2>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 p-1">
          <ToggleOption
            label="Home Mode"
            sub="No Equipment"
            active={gymMode === "home"}
            onClick={() => setGymMode("home")}
          />
          <ToggleOption
            label="Gym Mode"
            sub="Full Equipment"
            active={gymMode === "gym"}
            onClick={() => setGymMode("gym")}
          />
        </div>

        <label className="mt-4 block text-xs font-medium text-white/50" htmlFor="workout-style">
          Target workout style
        </label>
        <select
          id="workout-style"
          value={style}
          onChange={(event) => setStyle(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm focus:border-purple-500 focus:outline-none"
        >
          {STYLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-sm font-semibold shadow-lg shadow-purple-900/40 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Workout Today"}
        </button>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </section>

      {workout && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-base font-semibold text-purple-300">{workout.title}</h3>
          <p className="mt-1 text-xs text-white/50">{workout.focus_phrase}</p>

          <div className="mt-2 flex gap-3 text-[11px] text-white/40">
            {workout.estimated_duration_minutes ? <span>~{workout.estimated_duration_minutes} min</span> : null}
            {workout.estimated_calories_burned ? <span>~{workout.estimated_calories_burned} kcal burned</span> : null}
          </div>

          <ol className="mt-4 flex flex-col gap-2.5">
            {(workout.steps ?? []).map((step, idx) => (
              <li key={idx} className="rounded-xl bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {idx + 1}. {step.name}
                  </span>
                  <span className="text-xs text-white/50">
                    {step.sets} × {step.reps}
                  </span>
                </div>
                {step.form_tip && <p className="mt-1 text-[11px] text-white/40">{step.form_tip}</p>}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={handleComplete}
            disabled={completing || completed}
            className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
              completed ? "bg-green-600/30 text-green-300" : "bg-green-600 text-white"
            } disabled:opacity-70`}
          >
            {completed ? "Workout logged ✓" : completing ? "Logging..." : "Mark Workout Complete"}
          </button>
        </section>
      )}

      {workoutHistory.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white/80">Recent workouts</h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs text-white/50">
            {workoutHistory.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between">
                <span className="text-white/70">{entry.title}</span>
                <span>{new Date(entry.completed_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ToggleOption({ label, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center rounded-lg py-2.5 transition-colors ${
        active ? "bg-purple-600 text-white" : "text-white/50"
      }`}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span className="text-[10px] opacity-70">{sub}</span>
    </button>
  );
}
