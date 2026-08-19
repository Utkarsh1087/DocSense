import { NextResponse } from "next/server";
import { DEFAULT_SETTINGS, readSettings, writeSettings } from "../../../lib/settingsHelpers";

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
