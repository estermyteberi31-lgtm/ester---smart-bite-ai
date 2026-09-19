import { Router } from "express";
import multer from "multer";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";
import {
  chatWithNutritionAssistant,
  chatWithNutritionAssistantAboutImage,
  isAnthropicConfigured,
} from "../services/anthropic.js";

const router = Router();

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

const insertMessage = db.prepare(
  `INSERT INTO chat_messages (account_id, role, content) VALUES (?, ?, ?)`
);

function buildUserProfile(account) {
  const dietaryPreferences = JSON.parse(account.dietary_preferences || "[]");
  const parts = [
    account.name ? `Name: ${account.name}` : null,
    account.goal ? `Main goal: ${account.goal}` : null,
    account.eating_habits ? `Eating habits: ${account.eating_habits}` : null,
    account.obstacles ? `Biggest obstacle: ${account.obstacles}` : null,
    dietaryPreferences.length > 0 ? `Dietary preferences: ${dietaryPreferences.join(", ")}` : null,
    account.calorie_goal ? `Daily calorie goal: ${account.calorie_goal} kcal` : null,
    account.weekly_budget ? `Weekly grocery budget: £${account.weekly_budget}` : null,
    account.custom_notes && account.custom_notes.trim() ? `In their own words: "${account.custom_notes.trim()}"` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(". ") : null;
}

router.get("/history", (req, res) => {
  const rows = db
    .prepare(
      `SELECT role, content, created_at FROM chat_messages WHERE account_id = ? ORDER BY id ASC LIMIT 100`
    )
    .all(DEFAULT_ACCOUNT_ID);
  res.json({ messages: rows });
});

router.post("/", async (req, res) => {
  try {
    if (!isAnthropicConfigured()) {
      return res.status(503).json({ error: "AI chat is not configured. Set ANTHROPIC_API_KEY on the server." });
    }

    const userMessage = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!userMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
    const userProfile = buildUserProfile(account);

    const historyRows = db
      .prepare(`SELECT role, content FROM chat_messages WHERE account_id = ? ORDER BY id ASC LIMIT 40`)
      .all(DEFAULT_ACCOUNT_ID);

    const reply = await chatWithNutritionAssistant({
      messages: [...historyRows, { role: "user", content: userMessage }],
      userProfile,
    });

    db.transaction(() => {
      insertMessage.run(DEFAULT_ACCOUNT_ID, "user", userMessage);
      insertMessage.run(DEFAULT_ACCOUNT_ID, "assistant", reply);
    })();

    res.json({ reply });
  } catch (error) {
    console.error("[/api/chat] error:", error.message);
    res.status(500).json({ error: "Failed to get a response", detail: error.message });
  }
});

router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!isAnthropicConfigured()) {
      return res.status(503).json({ error: "AI chat is not configured. Set ANTHROPIC_API_KEY on the server." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "An image file is required under the 'image' field." });
    }

    const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
    const userProfile = buildUserProfile(account);

    const historyRows = db
      .prepare(`SELECT role, content FROM chat_messages WHERE account_id = ? ORDER BY id ASC LIMIT 40`)
      .all(DEFAULT_ACCOUNT_ID);

    const reply = await chatWithNutritionAssistantAboutImage({
      base64Image: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      caption,
      history: historyRows,
      userProfile,
    });

    const userContentLabel = caption ? `[Photo] ${caption}` : "[Photo]";

    db.transaction(() => {
      insertMessage.run(DEFAULT_ACCOUNT_ID, "user", userContentLabel);
      insertMessage.run(DEFAULT_ACCOUNT_ID, "assistant", reply);
    })();

    res.json({ reply });
  } catch (error) {
    console.error("[/api/chat/image] error:", error.message);
    res.status(500).json({ error: "Failed to analyze the photo", detail: error.message });
  }
});

export default router;
