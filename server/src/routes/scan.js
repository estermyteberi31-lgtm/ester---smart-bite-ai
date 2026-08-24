import { Router } from "express";
import multer from "multer";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";
import { analyzeFoodImage, isAnthropicConfigured } from "../services/anthropic.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are supported"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

const insertNutritionLog = db.prepare(
  `INSERT INTO nutrition_logs (account_id, source, calories, protein_g, carbs_g, fat_g, nutrition_score, raw_json)
   VALUES (@account_id, 'scan', @calories, @protein_g, @carbs_g, @fat_g, @nutrition_score, @raw_json)`
);

const insertBudgetEntry = db.prepare(
  `INSERT INTO budget_entries (account_id, item_name, store, price_paid, amount_saved)
   VALUES (@account_id, @item_name, @store, @price_paid, @amount_saved)`
);

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!isAnthropicConfigured()) {
      return res.status(503).json({
        error: "AI scanning is not configured. Set ANTHROPIC_API_KEY on the server.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "An image file is required under the 'image' field." });
    }

    const chatMessage = typeof req.body.chatMessage === "string" ? req.body.chatMessage : "";
    const gymMode = req.body.gymMode === "gym" ? "gym" : "home";

    const result = await analyzeFoodImage({
      base64Image: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      chatMessage,
      gymMode,
    });

    const totals = result.totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

    insertNutritionLog.run({
      account_id: DEFAULT_ACCOUNT_ID,
      calories: Math.round(totals.calories ?? 0),
      protein_g: Math.round(totals.protein_g ?? 0),
      carbs_g: Math.round(totals.carbs_g ?? 0),
      fat_g: Math.round(totals.fat_g ?? 0),
      nutrition_score: Math.round(result.nutrition_score ?? 0),
      raw_json: JSON.stringify(result),
    });

    const priceComparison = Array.isArray(result.price_comparison) ? result.price_comparison : [];
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        insertBudgetEntry.run({
          account_id: DEFAULT_ACCOUNT_ID,
          item_name: row.item ?? "Item",
          store: row.cheaper_store ?? "Tesco",
          price_paid: Number(row.cheaper_store === "Aldi" ? row.aldi_price : row.tesco_price) || 0,
          amount_saved: Number(row.savings) || 0,
        });
      }
    });
    if (priceComparison.length > 0) insertMany(priceComparison);

    res.json({ ...result, gymMode, chatMessage });
  } catch (error) {
    console.error("[/api/scan] error:", error.message);
    res.status(500).json({ error: "Failed to analyze image", detail: error.message });
  }
});

export default router;
