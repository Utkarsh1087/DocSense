import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

function writeSettings(settings: any) {
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

// GET: Retrieve current settings
export async function GET() {
  try {
    const settings = readSettings();
    
    // Also return status of environment variables
    const envStatus = {
      geminiKeyLoaded: !!process.env.GEMINI_API_KEY,
      pineconeKeyLoaded: !!process.env.PINECONE_API_KEY,
      pineconeIndexLoaded: !!process.env.PINECONE_INDEX_NAME,
      pineconeIndexName: process.env.PINECONE_INDEX_NAME || "",
    };

    return NextResponse.json({ settings, envStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update settings
export async function POST(req: Request) {
  try {
    const newSettings = await req.json();
    
    // Validation & defaults binding
    const updated = {
      model: newSettings.model || DEFAULT_SETTINGS.model,
      systemInstruction: newSettings.systemInstruction || DEFAULT_SETTINGS.systemInstruction,
      temperature: typeof newSettings.temperature === "number" ? newSettings.temperature : DEFAULT_SETTINGS.temperature,
      maxTokens: typeof newSettings.maxTokens === "number" ? newSettings.maxTokens : DEFAULT_SETTINGS.maxTokens,
      responsePreset: newSettings.responsePreset || DEFAULT_SETTINGS.responsePreset,
      chunkSize: typeof newSettings.chunkSize === "number" ? newSettings.chunkSize : DEFAULT_SETTINGS.chunkSize,
      chunkOverlap: typeof newSettings.chunkOverlap === "number" ? newSettings.chunkOverlap : DEFAULT_SETTINGS.chunkOverlap,
      topK: typeof newSettings.topK === "number" ? newSettings.topK : DEFAULT_SETTINGS.topK,
      similarityThreshold: typeof newSettings.similarityThreshold === "number" ? newSettings.similarityThreshold : DEFAULT_SETTINGS.similarityThreshold,
      retrievalStrategy: newSettings.retrievalStrategy || DEFAULT_SETTINGS.retrievalStrategy,
      ocrEnabled: typeof newSettings.ocrEnabled === "boolean" ? newSettings.ocrEnabled : DEFAULT_SETTINGS.ocrEnabled,
      parserMode: newSettings.parserMode || DEFAULT_SETTINGS.parserMode,
      ignoredKeywords: typeof newSettings.ignoredKeywords === "string" ? newSettings.ignoredKeywords : DEFAULT_SETTINGS.ignoredKeywords,
      retentionPolicy: newSettings.retentionPolicy || DEFAULT_SETTINGS.retentionPolicy,
      theme: newSettings.theme || DEFAULT_SETTINGS.theme,
    };

    writeSettings(updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
