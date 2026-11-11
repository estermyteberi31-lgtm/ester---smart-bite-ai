import { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import ProgressChart from "../ProgressChart.jsx";
import AnimatedNumber from "../AnimatedNumber.jsx";

export default function Calendar() {
  const { progressSeries, hydrationToday, logHydration, streak } = useAppContext();
  const [dropletBusy, setDropletBusy] = useState(false);

  async function handleDroplet() {
    setDropletBusy(true);
    try {
      await logHydration();
    } finally {
      setDropletBusy(false);
    }
  }

  const latest = progressSeries[progressSeries.length - 1] ?? {
    nutritionScore: 0,
    workoutsCompleted: 0,
  };

  const daysToGo = Math.max(streak.unlockAt - streak.currentStreak, 0);

  return (
    <div className="flex flex-col gap-4">
      <section
        className="card-enter relative overflow-hidden rounded-2xl border p-5"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--cta)", color: "var(--cta-contrast)" }}
      >
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
          <span className={streak.currentStreak > 0 ? "flame-pulse" : ""}>🔥</span>
          <span className="text-sm font-semibold">{streak.currentStreak}</span>
        </div>
        <p className="text-xs opacity-70">Day streak</p>
        <p className="mt-1 text-2xl font-bold">
          {streak.currentStreak} day{streak.currentStreak === 1 ? "" : "s"}
        </p>
        <p className="mt-2 text-xs opacity-70">
          {streak.colorsUnlocked
            ? "Reward unlocked — keep it going!"
            : `${daysToGo} more day${daysToGo === 1 ? "" : "s"} for a free week of Premium`}
        </p>
      </section>

      <section
        className="card-enter rounded-2xl border p-4"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <h2 className="text-base font-semibold">Your trends</h2>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Last {progressSeries.length || 14} days
        </p>
        <div className="mt-3">
          <ProgressChart series={progressSeries} />
        </div>
      </section>

      <section className="card-enter grid grid-cols-2 gap-2" style={{ "--delay": "70ms" }}>
        <MiniStat label="Nutrition" value={latest.nutritionScore} />
        <MiniStat label="Workouts" value={latest.workoutsCompleted} />
      </section>

      <section
        className="card-enter rounded-2xl border p-4"
        style={{ "--delay": "140ms", borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Hydration</h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {hydrationToday} glasses today
            </p>
          </div>
          <button
            type="button"
            onClick={handleDroplet}
            disabled={dropletBusy}
            className="flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
            aria-label="Log a glass of water"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M12 2.5s6.5 7.2 6.5 12A6.5 6.5 0 1 1 5.5 14.5c0-4.8 6.5-12 6.5-12z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, formatter }) {
  return (
    <div className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
      <p className="text-lg font-semibold" style={{ color: "var(--accent)" }}>
        <AnimatedNumber value={value} formatter={formatter ? (n) => formatter(n) : undefined} duration={800} />
      </p>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}
