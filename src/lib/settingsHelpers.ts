import fs from "fs";
import path from "path";

const settingsFilePath = path.join(process.cwd(), "data", "settings.json");

export const DEFAULT_SETTINGS = {
  model: "gemini-3.6-flash",
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
  parserMode: "text",
  ignoredKeywords: "Confidential, Draft",
  retentionPolicy: "never",
  theme: "light",
};

export function readSettings() {
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

export function writeSettings(settings: any) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing settings.json:", error);
  }
}
