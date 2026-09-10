import { Router } from "express";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";
import { generateMealPlan, isAnthropicConfigured } from "../services/anthropic.js";

const router = Router();

const insertMealPlan = db.prepare(
  `INSERT INTO meal_plans (account_id, plan_json, calorie_goal, weekly_budget)
   VALUES (@account_id, @plan_json, @calorie_goal, @weekly_budget)`
);

function serializePlanRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    calorieGoal: row.calorie_goal,
    weeklyBudget: row.weekly_budget,
    plan: JSON.parse(row.plan_json),
  };
}

router.get("/", (req, res) => {
  const row = db
    .prepare(
      `SELECT * FROM meal_plans WHERE account_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`
    )
    .get(DEFAULT_ACCOUNT_ID);
  res.json({ latest: serializePlanRow(row) });
});

router.post("/", async (req, res) => {
  try {
    if (!isAnthropicConfigured()) {
      return res.status(503).json({
        error: "AI meal planning is not configured. Set ANTHROPIC_API_KEY on the server.",
      });
    }

    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
    const calorieGoal = Number(req.body.calorieGoal) || account.calorie_goal;
    const weeklyBudget = Number(req.body.weeklyBudget) || account.weekly_budget;
    const dietaryPreferences = Array.isArray(req.body.dietaryPreferences)
      ? req.body.dietaryPreferences
      : JSON.parse(account.dietary_preferences || "[]");

    const plan = await generateMealPlan({ calorieGoal, weeklyBudget, dietaryPreferences });

    const result = insertMealPlan.run({
      account_id: DEFAULT_ACCOUNT_ID,
      plan_json: JSON.stringify(plan),
      calorie_goal: calorieGoal,
      weekly_budget: weeklyBudget,
    });

    const row = db.prepare("SELECT * FROM meal_plans WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(serializePlanRow(row));
  } catch (error) {
    console.error("[/api/meal-plan] error:", error.message);
    res.status(500).json({ error: "Failed to generate meal plan", detail: error.message });
  }
});

export default router;
