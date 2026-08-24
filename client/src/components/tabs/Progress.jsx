import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import ProgressChart from "../ProgressChart.jsx";
import { fetchBudget } from "../../lib/api.js";

export default function Progress() {
  const { progressSeries, hydrationToday, logHydration } = useAppContext();
  const [totalSaved, setTotalSaved] = useState(0);
  const [dropletBusy, setDropletBusy] = useState(false);

  useEffect(() => {
    fetchBudget()
      .then((data) => setTotalSaved(data.totalSaved ?? 0))
      .catch(() => {});
  }, [progressSeries]);

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
    moneySaved: 0,
    workoutsCompleted: 0,
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold">Your trends</h2>
        <p className="text-xs text-white/40">Last {progressSeries.length || 14} days</p>
        <div className="mt-3">
          <ProgressChart series={progressSeries} />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <MiniStat color="#a855f7" label="Nutrition" value={latest.nutritionScore} />
        <MiniStat color="#22c55e" label="Saved" value={`£${Number(totalSaved).toFixed(2)}`} />
        <MiniStat color="#3b82f6" label="Workouts" value={latest.workoutsCompleted} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Hydration</h3>
            <p className="text-xs text-white/40">{hydrationToday} glasses today</p>
          </div>
          <button
            type="button"
            onClick={handleDroplet}
            disabled={dropletBusy}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 transition-transform active:scale-90 disabled:opacity-60"
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

function MiniStat({ color, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-lg font-semibold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}
