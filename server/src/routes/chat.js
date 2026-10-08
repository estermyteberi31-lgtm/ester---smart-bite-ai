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
  `INSERT INTO chat_messages (account_id, conversation_id, role, content) VALUES (?, ?, ?, ?)`
);
const insertConversation = db.prepare(
  `INSERT INTO conversations (account_id, title) VALUES (?, ?)`
);
const touchConversation = db.prepare(
  `UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`
);
const setConversationTitle = db.prepare(
  `UPDATE conversations SET title = ? WHERE id = ? AND title = 'New chat'`
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

function titleFromMessage(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean || "New chat";
}

function ensureConversation(conversationId) {
  if (conversationId) {
    const existing = db
      .prepare(`SELECT * FROM conversations WHERE id = ? AND account_id = ?`)
      .get(conversationId, DEFAULT_ACCOUNT_ID);
    if (existing) return existing.id;
  }
  const result = insertConversation.run(DEFAULT_ACCOUNT_ID, "New chat");
  return result.lastInsertRowid;
}

router.get("/conversations", (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS preview
       FROM conversations c
       WHERE c.account_id = ?
       ORDER BY c.updated_at DESC
       LIMIT 100`
    )
    .all(DEFAULT_ACCOUNT_ID);
  res.json({ conversations: rows });
});

router.delete("/conversations/:id", (req, res) => {
  const conversation = db
    .prepare(`SELECT id FROM conversations WHERE id = ? AND account_id = ?`)
    .get(req.params.id, DEFAULT_ACCOUNT_ID);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  db.transaction(() => {
    db.prepare(`DELETE FROM chat_messages WHERE conversation_id = ?`).run(conversation.id);
    db.prepare(`DELETE FROM conversations WHERE id = ?`).run(conversation.id);
  })();
  res.status(204).end();
});

router.get("/conversations/:id/messages", (req, res) => {
  const conversation = db
    .prepare(`SELECT id FROM conversations WHERE id = ? AND account_id = ?`)
    .get(req.params.id, DEFAULT_ACCOUNT_ID);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const rows = db
    .prepare(
      `SELECT role, content, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 200`
    )
    .all(conversation.id);
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

    const conversationId = ensureConversation(req.body.conversationId);

    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
    const userProfile = buildUserProfile(account);

    const historyRows = db
      .prepare(`SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 40`)
      .all(conversationId);

    const reply = await chatWithNutritionAssistant({
      messages: [...historyRows, { role: "user", content: userMessage }],
      userProfile,
    });

    db.transaction(() => {
      insertMessage.run(DEFAULT_ACCOUNT_ID, conversationId, "user", userMessage);
      insertMessage.run(DEFAULT_ACCOUNT_ID, conversationId, "assistant", reply);
      setConversationTitle.run(titleFromMessage(userMessage), conversationId);
      touchConversation.run(conversationId);
    })();

    res.json({ reply, conversationId });
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
    const conversationId = ensureConversation(req.body.conversationId);

    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
    const userProfile = buildUserProfile(account);

    const historyRows = db
      .prepare(`SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 40`)
      .all(conversationId);

    const reply = await chatWithNutritionAssistantAboutImage({
      base64Image: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      caption,
      history: historyRows,
      userProfile,
    });

    const userContentLabel = caption ? `[Photo] ${caption}` : "[Photo]";

    db.transaction(() => {
      insertMessage.run(DEFAULT_ACCOUNT_ID, conversationId, "user", userContentLabel);
      insertMessage.run(DEFAULT_ACCOUNT_ID, conversationId, "assistant", reply);
      setConversationTitle.run(titleFromMessage(userContentLabel), conversationId);
      touchConversation.run(conversationId);
    })();

    res.json({ reply, conversationId });
  } catch (error) {
    console.error("[/api/chat/image] error:", error.message);
    res.status(500).json({ error: "Failed to analyze the photo", detail: error.message });
  }
});

export default router;
