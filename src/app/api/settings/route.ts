import { NextResponse } from "next/server";
import { DEFAULT_SETTINGS, readUserSettings, writeUserSettings, AppSettings } from "../../../lib/settingsHelpers";
import { getUserIdFromRequest } from "../../../lib/auth";

// GET: Retrieve current settings for the authenticated user
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    const settings = await readUserSettings(userId);

    // Also return status of environment variables (without disclosing sensitive internal names)
    const envStatus = {
      geminiKeyLoaded: !!process.env.GEMINI_API_KEY,
      pineconeKeyLoaded: !!process.env.PINECONE_API_KEY,
      pineconeIndexLoaded: !!process.env.PINECONE_INDEX_NAME,
      stripeKeyLoaded: !!process.env.STRIPE_SECRET_KEY,
    };

    return NextResponse.json({ settings, envStatus });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update settings for the authenticated user
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    const newSettings = await req.json();

    // Validation & defaults binding
    const updated: AppSettings = {
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
      parserMode: (["standard", "layout", "table"].includes(newSettings.parserMode) ? newSettings.parserMode : DEFAULT_SETTINGS.parserMode) as "standard" | "layout" | "table",
      ignoredKeywords: typeof newSettings.ignoredKeywords === "string" ? newSettings.ignoredKeywords : DEFAULT_SETTINGS.ignoredKeywords,
      retentionPolicy: newSettings.retentionPolicy || DEFAULT_SETTINGS.retentionPolicy,
      theme: newSettings.theme || DEFAULT_SETTINGS.theme,
    };

    const saved = await writeUserSettings(userId, updated);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
