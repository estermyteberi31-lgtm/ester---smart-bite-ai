import DatabaseConstructor from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "smartbite.sqlite");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseConstructor(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Myteberi User',
    email TEXT,
    plan TEXT NOT NULL DEFAULT 'Free',
    dietary_preferences TEXT NOT NULL DEFAULT '[]',
    calorie_goal INTEGER NOT NULL DEFAULT 2200,
    weekly_budget REAL NOT NULL DEFAULT 60,
    preferred_gym_mode TEXT NOT NULL DEFAULT 'home',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hydration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    logged_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS budget_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    item_name TEXT NOT NULL,
    store TEXT NOT NULL,
    price_paid REAL NOT NULL DEFAULT 0,
    amount_saved REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts_completed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    title TEXT NOT NULL,
    focus TEXT,
    mode TEXT NOT NULL,
    style TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS nutrition_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    source TEXT NOT NULL DEFAULT 'scan',
    calories INTEGER NOT NULL DEFAULT 0,
    protein_g INTEGER NOT NULL DEFAULT 0,
    carbs_g INTEGER NOT NULL DEFAULT 0,
    fat_g INTEGER NOT NULL DEFAULT 0,
    nutrition_score INTEGER NOT NULL DEFAULT 0,
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function ensureDefaultAccount() {
  const existing = db.prepare("SELECT id FROM accounts ORDER BY id ASC LIMIT 1").get();
  if (existing) return existing.id;
  const result = db
    .prepare(
      `INSERT INTO accounts (name, email, plan, dietary_preferences, calorie_goal, weekly_budget, preferred_gym_mode)
       VALUES (@name, @email, @plan, @dietary_preferences, @calorie_goal, @weekly_budget, @preferred_gym_mode)`
    )
    .run({
      name: "Myteberi User",
      email: null,
      plan: "Free",
      dietary_preferences: JSON.stringify([]),
      calorie_goal: 2200,
      weekly_budget: 60,
      preferred_gym_mode: "home",
    });
  return result.lastInsertRowid;
}

export const DEFAULT_ACCOUNT_ID = ensureDefaultAccount();
