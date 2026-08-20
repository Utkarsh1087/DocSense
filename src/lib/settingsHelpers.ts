import fs from "fs";
import path from "path";
import { getDb } from "./mongodb";

const settingsFilePath = path.join(process.cwd(), "data", "settings.json");

export const DEFAULT_SETTINGS = {
  model: "gemini-1.5-flash",
  systemInstruction: "You are a Document Expert. Answer questions based ONLY on the provided context. If the answer is not in the context, say 'I could not find the answer in the provided document.' Keep answers concise, clear, and educational.",
  temperature: 0.2,
  maxTokens: 1024,
  responsePreset: "balanced",
  chunkSize: 1500,
  chunkOverlap: 300,
  topK: 5,
  similarityThreshold: 0.4,
  retrievalStrategy: "standard",
  ocrEnabled: false,
  parserMode: "standard" as "standard" | "layout" | "table",
  ignoredKeywords: "Confidential, Draft",
  retentionPolicy: "never",
  theme: "light",
};

export type AppSettings = typeof DEFAULT_SETTINGS;

// ─── Global File-Based Settings (backward compatible) ──────────────────────────

export function readSettings(): AppSettings {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      return DEFAULT_SETTINGS;
    }
    const data = fs.readFileSync(settingsFilePath, "utf8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data || "{}") };
  } catch (error) {
    console.error("Error reading settings.json:", error);
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: Partial<AppSettings>) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const merged = { ...readSettings(), ...settings };
    fs.writeFileSync(settingsFilePath, JSON.stringify(merged, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing settings.json:", error);
  }
}

// ─── Per-User MongoDB Settings ─────────────────────────────────────────────────

/**
 * Read settings for a specific user from MongoDB.
 * Falls back to global file-based defaults if no user-specific settings exist.
 */
export async function readUserSettings(userId: string): Promise<AppSettings> {
  try {
    const db = await getDb();
    const userSettings = await db.collection("settings").findOne({ userId });
    if (userSettings) {
      const { _id, userId: _uid, ...settings } = userSettings as any;
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    // Fall back to global file-based defaults
    return readSettings();
  } catch (error) {
    console.error("Error reading user settings from MongoDB:", error);
    return readSettings();
  }
}

/**
 * Write settings for a specific user to MongoDB (upsert).
 */
export async function writeUserSettings(userId: string, settings: Partial<AppSettings>): Promise<AppSettings> {
  const db = await getDb();
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  await db.collection("settings").updateOne(
    { userId },
    { $set: { ...merged, userId, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  return merged;
}

