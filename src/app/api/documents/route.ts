import { NextResponse } from "next/server";
import { readDocs, writeDocs, formatBytes } from "../../../lib/docHelpers";
import { readUserSettings } from "../../../lib/settingsHelpers";
import { incrementUserStats } from "../../../lib/userHelpers";
import { checkRateLimit, getRateLimitHeaders } from "../../../lib/rateLimiter";
import { getUserIdFromRequest, getPlanFromRequest } from "../../../lib/auth";
import { ingestDocument } from "../../../lib/ingestionPipeline";

export const maxDuration = 300; // 5 minutes — large PDF ingestion

// ─── GET: Retrieve user's documents ───────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    const docs = await readDocs();
    const userDocs = docs.filter((d: any) => d.userId === userId);
    return NextResponse.json(userDocs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Upload and index a PDF ─────────────────────────────────────────────

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  const userPlan = getPlanFromRequest(req);

  try {
    // Rate limit uploads (counts against same pool as queries)
    const rl = checkRateLimit(`upload_${userId}`, userPlan);
    const rlHeaders = getRateLimitHeaders(rl);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Upload rate limit exceeded. Retry in ${Math.ceil(rl.resetInMs / 1000)}s.` },
        { status: 429, headers: rlHeaders }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported currently." }, { status: 400 });
    }

    // Starter plan document count limit
    if (userPlan === "Starter") {
      const currentDocs = await readDocs();
      const userDocs = currentDocs.filter((d: any) => d.userId === userId);
      if (userDocs.length >= 3) {
        return NextResponse.json(
          { error: "Upload limit reached. The Starter plan allows 3 documents. Upgrade to Pro for unlimited uploads." },
          { status: 403 }
        );
      }
    }

    // Validate required env vars
    if (!process.env.GEMINI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      return NextResponse.json(
        { error: "Server credentials missing. Set GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX_NAME." },
        { status: 500 }
      );
    }

    const filename = file.name;
    const sizeStr = formatBytes(file.size);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Load per-user settings from MongoDB
    const config = await readUserSettings(userId);

    // Run the parallel ingestion pipeline
    const result = await ingestDocument(buffer, filename, userId, config);

    // Save document metadata atomically to MongoDB
    const newDoc = {
      id: result.docId,
      name: filename,
      size: sizeStr,
      date: new Date().toISOString(),
      status: "Indexed",
      tokens: result.estimatedTokens,
      vectorIds: result.vectorIds,
      chunkCount: result.chunkCount,
      pageCount: result.pageCount,
      parserMode: result.parserMode,
      userId,
    };

    const { insertDoc, deleteDocById } = await import("../../../lib/docHelpers");
    await insertDoc(newDoc);

    // Update user stats (non-blocking)
    incrementUserStats(userId, "documents", 1).catch(() => {});
    incrementUserStats(userId, "vectors", result.vectorIds.length).catch(() => {});

    return NextResponse.json(newDoc, { headers: rlHeaders });
  } catch (error: any) {
    console.error("Failed to upload/index document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to index document." },
      { status: 500 }
    );
  }
}

// ─── DELETE: Remove document and its Pinecone vectors ─────────────────────────

export async function DELETE(req: Request) {
  try {
    const { url } = req;
    const { searchParams } = new URL(url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    const pineconeKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!pineconeKey || !indexName) {
      return NextResponse.json(
        { error: "Server credentials missing. Set PINECONE_API_KEY and PINECONE_INDEX_NAME." },
        { status: 500 }
      );
    }

    const userId = getUserIdFromRequest(req);
    const userDocs = await readDocs(userId);
    const docToDelete = userDocs.find((d: any) => d.id === id);

    if (!docToDelete) {
      return NextResponse.json({ error: "Document not found or unauthorized access." }, { status: 404 });
    }

    // Delete vectors from Pinecone
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pinecone = new Pinecone({ apiKey: pineconeKey });
    const pineconeIndex = pinecone.Index(indexName);

    if (docToDelete.vectorIds && docToDelete.vectorIds.length > 0) {
      // Delete in batches of 1000 (Pinecone limit)
      const batchSize = 1000;
      for (let i = 0; i < docToDelete.vectorIds.length; i += batchSize) {
        const batch = docToDelete.vectorIds.slice(i, i + batchSize);
        await pineconeIndex.deleteMany(batch);
      }
    }

    // Remove atomically from MongoDB
    const { deleteDocById } = await import("../../../lib/docHelpers");
    await deleteDocById(id, userId);


    // Update stats (non-blocking)
    incrementUserStats(userId, "documents", -1).catch(() => {});
    incrementUserStats(userId, "vectors", -(docToDelete.vectorIds?.length || 0)).catch(() => {});

    return NextResponse.json({ success: true, message: `Successfully deleted document: ${docToDelete.name}` });
  } catch (error: any) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: error.message || "Failed to delete document." }, { status: 500 });
  }
}
