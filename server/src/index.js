import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { isAnthropicConfigured } from "./services/anthropic.js";
import scanRouter from "./routes/scan.js";
import workoutRouter from "./routes/workout.js";
import progressRouter from "./routes/progress.js";
import settingsRouter from "./routes/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    anthropicConfigured: isAnthropicConfigured(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/scan", scanRouter);
app.use("/api/workout", workoutRouter);
app.use("/api/progress", progressRouter);
app.use("/api/settings", settingsRouter);

// Serve the built React client in production.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`SmartBite AI server listening on http://localhost:${PORT}`);
  if (!isAnthropicConfigured()) {
    console.warn(
      "ANTHROPIC_API_KEY is not set. /api/scan and /api/workout will return 503 until it is configured."
    );
  }
});
