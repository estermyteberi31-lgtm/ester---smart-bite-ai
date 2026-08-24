import { Router } from "express";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";
import { generateWorkout, isAnthropicConfigured } from "../services/anthropic.js";

const router = Router();

const insertCompletedWorkout = db.prepare(
  `INSERT INTO workouts_completed (account_id, title, focus, mode, style)
   VALUES (@account_id, @title, @focus, @mode, @style)`
);

router.post("/", async (req, res) => {
  try {
    if (!isAnthropicConfigured()) {
      return res.status(503).json({
        error: "AI workout generation is not configured. Set ANTHROPIC_API_KEY on the server.",
      });
    }

    const mode = req.body.mode === "gym" ? "gym" : "home";
    const style = typeof req.body.style === "string" && req.body.style.trim().length > 0
      ? req.body.style.trim()
      : "Full Body Toning";
    const profile = req.body.profile ?? {};

    const workout = await generateWorkout({ mode, style, profile });
    res.json(workout);
  } catch (error) {
    console.error("[/api/workout] error:", error.message);
    res.status(500).json({ error: "Failed to generate workout", detail: error.message });
  }
});

router.post("/complete", (req, res) => {
  try {
    const { title, focus, mode, style } = req.body;
    if (!title || !mode || !style) {
      return res.status(400).json({ error: "title, mode, and style are required" });
    }
    const result = insertCompletedWorkout.run({
      account_id: DEFAULT_ACCOUNT_ID,
      title,
      focus: focus ?? "",
      mode,
      style,
    });
    const row = db
      .prepare("SELECT * FROM workouts_completed WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (error) {
    console.error("[/api/workout/complete] error:", error.message);
    res.status(500).json({ error: "Failed to log completed workout", detail: error.message });
  }
});

router.get("/history", (req, res) => {
  const rows = db
    .prepare(
      "SELECT * FROM workouts_completed WHERE account_id = ? ORDER BY completed_at DESC LIMIT 50"
    )
    .all(DEFAULT_ACCOUNT_ID);
  res.json(rows);
});

export default router;
