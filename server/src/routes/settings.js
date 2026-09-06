import { Router } from "express";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";
import { computeCurrentStreak, STREAK_UNLOCK_DAYS } from "../services/streak.js";

const router = Router();

const FREE_COLORS = ["purple"];
const LOCKED_COLORS = ["white", "pink", "blue", "green", "red", "yellow"];
const ALL_COLORS = [...FREE_COLORS, ...LOCKED_COLORS];

function serializeAccount(row) {
  return {
    ...row,
    dietary_preferences: JSON.parse(row.dietary_preferences || "[]"),
  };
}

router.get("/", (req, res) => {
  const row = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
  if (!row) return res.status(404).json({ error: "Account not found" });
  res.json(serializeAccount(row));
});

router.put("/", (req, res) => {
  const current = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
  if (!current) return res.status(404).json({ error: "Account not found" });

  let accentColor = current.accent_color;
  if (req.body.accent_color && req.body.accent_color !== current.accent_color) {
    if (!ALL_COLORS.includes(req.body.accent_color)) {
      return res.status(400).json({ error: `accent_color must be one of ${ALL_COLORS.join(", ")}` });
    }
    const streak = computeCurrentStreak(DEFAULT_ACCOUNT_ID);
    if (LOCKED_COLORS.includes(req.body.accent_color) && streak < STREAK_UNLOCK_DAYS) {
      return res.status(403).json({
        error: `That color unlocks at a ${STREAK_UNLOCK_DAYS}-day streak (currently ${streak}).`,
      });
    }
    accentColor = req.body.accent_color;
  }

  const next = {
    name: req.body.name ?? current.name,
    email: req.body.email ?? current.email,
    plan: req.body.plan ?? current.plan,
    dietary_preferences: JSON.stringify(
      Array.isArray(req.body.dietary_preferences)
        ? req.body.dietary_preferences
        : JSON.parse(current.dietary_preferences || "[]")
    ),
    calorie_goal: Number.isFinite(req.body.calorie_goal) ? req.body.calorie_goal : current.calorie_goal,
    weekly_budget: Number.isFinite(req.body.weekly_budget) ? req.body.weekly_budget : current.weekly_budget,
    preferred_gym_mode: req.body.preferred_gym_mode ?? current.preferred_gym_mode,
    accent_color: accentColor,
  };

  db.prepare(
    `UPDATE accounts SET name = @name, email = @email, plan = @plan,
       dietary_preferences = @dietary_preferences, calorie_goal = @calorie_goal,
       weekly_budget = @weekly_budget, preferred_gym_mode = @preferred_gym_mode,
       accent_color = @accent_color
     WHERE id = @id`
  ).run({ ...next, id: DEFAULT_ACCOUNT_ID });

  const updated = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
  res.json(serializeAccount(updated));
});

export default router;
