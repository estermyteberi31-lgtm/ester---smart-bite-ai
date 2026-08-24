import { Router } from "express";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";

const router = Router();

const insertHydration = db.prepare(
  `INSERT INTO hydration_logs (account_id) VALUES (?)`
);

router.post("/hydration", (req, res) => {
  insertHydration.run(DEFAULT_ACCOUNT_ID);
  const today = db
    .prepare(
      `SELECT COUNT(*) AS count FROM hydration_logs
       WHERE account_id = ? AND date(logged_at) = date('now')`
    )
    .get(DEFAULT_ACCOUNT_ID);
  res.status(201).json({ todayCount: today.count });
});

router.get("/hydration/today", (req, res) => {
  const today = db
    .prepare(
      `SELECT COUNT(*) AS count FROM hydration_logs
       WHERE account_id = ? AND date(logged_at) = date('now')`
    )
    .get(DEFAULT_ACCOUNT_ID);
  res.json({ todayCount: today.count });
});

router.get("/budget", (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM budget_entries WHERE account_id = ? ORDER BY created_at DESC LIMIT 50`
    )
    .all(DEFAULT_ACCOUNT_ID);
  const totalSaved = db
    .prepare(`SELECT COALESCE(SUM(amount_saved), 0) AS total FROM budget_entries WHERE account_id = ?`)
    .get(DEFAULT_ACCOUNT_ID);
  res.json({ entries: rows, totalSaved: totalSaved.total });
});

router.post("/budget", (req, res) => {
  const { item_name, store, price_paid, amount_saved } = req.body;
  if (!item_name || !store) {
    return res.status(400).json({ error: "item_name and store are required" });
  }
  const result = db
    .prepare(
      `INSERT INTO budget_entries (account_id, item_name, store, price_paid, amount_saved)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(DEFAULT_ACCOUNT_ID, item_name, store, Number(price_paid) || 0, Number(amount_saved) || 0);
  const row = db.prepare("SELECT * FROM budget_entries WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

function lastNDates(n) {
  const dates = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

router.get("/series", (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
  const dates = lastNDates(days);

  const nutritionRows = db
    .prepare(
      `SELECT date(created_at) AS day, ROUND(AVG(nutrition_score)) AS avg_score
       FROM nutrition_logs WHERE account_id = ? GROUP BY day`
    )
    .all(DEFAULT_ACCOUNT_ID);
  const savedRows = db
    .prepare(
      `SELECT date(created_at) AS day, ROUND(SUM(amount_saved), 2) AS total_saved
       FROM budget_entries WHERE account_id = ? GROUP BY day`
    )
    .all(DEFAULT_ACCOUNT_ID);
  const workoutRows = db
    .prepare(
      `SELECT date(completed_at) AS day, COUNT(*) AS total_workouts
       FROM workouts_completed WHERE account_id = ? GROUP BY day`
    )
    .all(DEFAULT_ACCOUNT_ID);

  const nutritionByDay = Object.fromEntries(nutritionRows.map((r) => [r.day, r.avg_score]));
  const savedByDay = Object.fromEntries(savedRows.map((r) => [r.day, r.total_saved]));
  const workoutsByDay = Object.fromEntries(workoutRows.map((r) => [r.day, r.total_workouts]));

  const series = dates.map((day) => ({
    day,
    nutritionScore: nutritionByDay[day] ?? 0,
    moneySaved: savedByDay[day] ?? 0,
    workoutsCompleted: workoutsByDay[day] ?? 0,
  }));

  res.json({ series });
});

export default router;
