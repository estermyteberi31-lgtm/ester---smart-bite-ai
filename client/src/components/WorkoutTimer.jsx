import { useEffect, useRef, useState } from "react";
import { celebrate } from "../lib/confetti.js";

const PRESETS_SEC = [30, 60, 90, 180, 300, 600];

function formatTime(totalMs) {
  const totalSeconds = Math.max(0, Math.round(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function WorkoutTimer() {
  const [mode, setMode] = useState("stopwatch");
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [countdownTargetMs, setCountdownTargetMs] = useState(60 * 1000);
  const [finished, setFinished] = useState(false);

  const startRef = useRef(null);
  const accumulatedRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();

    function tick() {
      const elapsed = accumulatedRef.current + (performance.now() - startRef.current);

      if (mode === "countdown") {
        const remaining = countdownTargetMs - elapsed;
        if (remaining <= 0) {
          setElapsedMs(countdownTargetMs);
          setRunning(false);
          setFinished(true);
          celebrate();
          return;
        }
        setElapsedMs(elapsed);
      } else {
        setElapsedMs(elapsed);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, countdownTargetMs]);

  function handleStartPause() {
    if (running) {
      accumulatedRef.current = elapsedMs;
      setRunning(false);
    } else {
      if (finished) {
        accumulatedRef.current = 0;
        setElapsedMs(0);
      }
      setFinished(false);
      setRunning(true);
    }
  }

  function handleReset() {
    setRunning(false);
    setFinished(false);
    accumulatedRef.current = 0;
    setElapsedMs(0);
  }

  function handleModeChange(nextMode) {
    handleReset();
    setMode(nextMode);
  }

  function handlePreset(seconds) {
    if (running) return;
    setCountdownTargetMs(seconds * 1000);
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setFinished(false);
  }

  const displayMs = mode === "countdown" ? Math.max(countdownTargetMs - elapsedMs, 0) : elapsedMs;

  return (
    <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Workout timer</h2>
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => handleModeChange("stopwatch")}
            className="rounded-full px-2.5 py-1 font-medium transition-all active:scale-90"
            style={
              mode === "stopwatch"
                ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                : { color: "rgba(255,255,255,0.5)" }
            }
          >
            Stopwatch
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("countdown")}
            className="rounded-full px-2.5 py-1 font-medium transition-all active:scale-90"
            style={
              mode === "countdown"
                ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                : { color: "rgba(255,255,255,0.5)" }
            }
          >
            Timer
          </button>
        </div>
      </div>

      {mode === "countdown" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS_SEC.map((seconds) => (
            <button
              key={seconds}
              type="button"
              disabled={running}
              onClick={() => handlePreset(seconds)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-all active:scale-90 disabled:opacity-40"
              style={
                countdownTargetMs === seconds * 1000
                  ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                  : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col items-center">
        <p
          className="font-mono text-5xl font-bold tabular-nums"
          style={{ color: finished ? "var(--accent)" : "#ffffff" }}
        >
          {formatTime(displayMs)}
        </p>
        {finished && <p className="mt-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>Time's up! 🎉</p>}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/70 transition-all active:scale-95"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleStartPause}
            className="glow-accent rounded-xl px-8 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            {running ? "Pause" : finished ? "Start" : elapsedMs > 0 ? "Resume" : "Start"}
          </button>
        </div>
      </div>
    </section>
  );
}
