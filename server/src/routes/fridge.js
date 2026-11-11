import { Router } from "express";
import multer from "multer";
import { db, DEFAULT_ACCOUNT_ID } from "../db/index.js";
import { analyzeFridgeForRecipes, isAnthropicConfigured } from "../services/anthropic.js";
import { buildUserProfile } from "../lib/userProfile.js";

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

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!isAnthropicConfigured()) {
      return res.status(503).json({
        error: "AI is not configured. Set ANTHROPIC_API_KEY on the server.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "An image file is required under the 'image' field." });
    }

    const userNote = typeof req.body.note === "string" ? req.body.note : "";
    const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(DEFAULT_ACCOUNT_ID);
    const userProfile = buildUserProfile(account);

    const result = await analyzeFridgeForRecipes({
      base64Image: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      userNote,
      userProfile,
    });

    res.json(result);
  } catch (error) {
    console.error("[/api/fridge] error:", error.message);
    res.status(500).json({ error: "Failed to analyze your photo", detail: error.message });
  }
});

export default router;
