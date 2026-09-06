import confetti from "canvas-confetti";

/**
 * A celebratory burst for "finished" moments (workout complete, streaks, etc).
 * Uses the app's current neon accent color plus white/gray for contrast.
 */
export function celebrate() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#a855f7";

  const shared = { colors: [accent, "#ffffff", "#9ca3af"], zIndex: 9999 };
  confetti({ ...shared, particleCount: 70, spread: 65, origin: { x: 0.3, y: 0.6 } });
  confetti({ ...shared, particleCount: 70, spread: 65, origin: { x: 0.7, y: 0.6 } });
  confetti({ ...shared, particleCount: 40, spread: 100, startVelocity: 45, origin: { y: 0.4 } });
}
