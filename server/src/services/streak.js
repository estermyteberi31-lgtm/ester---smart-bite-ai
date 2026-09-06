import { db } from "../db/index.js";

const STREAK_UNLOCK_DAYS = 7;

const activeDaysStmt = db.prepare(`
  SELECT date(logged_at) AS day FROM hydration_logs WHERE account_id = ?
  UNION
  SELECT date(created_at) AS day FROM nutrition_logs WHERE account_id = ?
  UNION
  SELECT date(completed_at) AS day FROM workouts_completed WHERE account_id = ?
`);

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * A day counts toward the streak if the user logged hydration, scanned a meal,
 * or completed a workout on that day. The streak is "alive" through yesterday
 * even if today has no activity yet, so it doesn't reset the moment midnight hits.
 */
export function computeCurrentStreak(accountId) {
  const rows = activeDaysStmt.all(accountId, accountId, accountId);
  const activeDays = new Set(rows.map((row) => row.day));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let cursor = new Date(today);
  if (!activeDays.has(toDateOnly(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (activeDays.has(toDateOnly(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function hasUnlockedColors(accountId) {
  return computeCurrentStreak(accountId) >= STREAK_UNLOCK_DAYS;
}

export { STREAK_UNLOCK_DAYS };
