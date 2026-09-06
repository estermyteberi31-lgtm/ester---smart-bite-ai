// Neon accent palette. "free" colors are available immediately; the rest
// unlock once the user hits a 7-day activity streak (see the server's
// STREAK_UNLOCK_DAYS). `contrast` is the text color to use on top of a
// solid button/badge filled with this color.
export const NEON_COLORS = [
  { key: "purple", label: "Purple", hex: "#a855f7", contrast: "#ffffff", free: true },
  { key: "white", label: "White", hex: "#ffffff", contrast: "#000000", free: false },
  { key: "pink", label: "Pink", hex: "#ec4899", contrast: "#ffffff", free: false },
  { key: "blue", label: "Blue", hex: "#3b82f6", contrast: "#ffffff", free: false },
  { key: "green", label: "Green", hex: "#22c55e", contrast: "#000000", free: false },
  { key: "red", label: "Red", hex: "#ef4444", contrast: "#ffffff", free: false },
  { key: "yellow", label: "Yellow", hex: "#eab308", contrast: "#000000", free: false },
];

const COLOR_MAP = Object.fromEntries(NEON_COLORS.map((c) => [c.key, c]));

export function getNeonColor(key) {
  return COLOR_MAP[key] ?? COLOR_MAP.purple;
}

export function applyAccentColor(key) {
  const color = getNeonColor(key);
  const root = document.documentElement;
  root.style.setProperty("--accent", color.hex);
  root.style.setProperty("--accent-contrast", color.contrast);
}
