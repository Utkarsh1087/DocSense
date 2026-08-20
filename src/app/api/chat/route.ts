/**
 * /api/chat — SSE Streaming RAG Chat Route
 * 
 * Performance pipeline:
 *   1. Embed query → Pinecone vector search (<150ms target)
 *   2. Stream Gemini tokens back via SSE (<500ms TTFT target)
 * 
 * SSE format per event: data: { token?, citations?, done, vectorMs?, model? }
 */
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readUserSettings } from "../../../lib/settingsHelpers";
import { readDocs } from "../../../lib/docHelpers";
import { getUserIdFromRequest, getPlanFromRequest } from "../../../lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "../../../lib/rateLimiter";
import { incrementUserStats, recordQueryLatency } from "../../../lib/userHelpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Helper to send an SSE event
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  const userPlan = getPlanFromRequest(req);

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(userId, userPlan);
  const rlHeaders = getRateLimitHeaders(rl);

  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: `Rate limit exceeded. You have ${rl.limit} queries/min on ${userPlan} plan. Retry in ${Math.ceil(rl.resetInMs / 1000)}s.` }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      }
    );
  }

  const startTime = Date.now();

  try {
    const { message, history = [], documentName } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !pineconeKey || !indexName) {
      return new Response(
        JSON.stringify({ error: "Server credentials missing." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Load per-user settings ─────────────────────────────────────────────
    const config = await readUserSettings(userId);

    let systemInstruction = config.systemInstruction;
    if (userPlan === "Starter") {
      systemInstruction += "\nIMPORTANT: The user is on the Starter tier. Keep answers concise and focused strictly on the query.";
    }

    // ── Pinecone Vector Retrieval ──────────────────────────────────────────
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: "gemini-embedding-001",
    });

    const pinecone = new Pinecone({ apiKey: pineconeKey });
    const pineconeIndex = pinecone.Index(indexName);

    // Get user's documents
    const allDocs = await readDocs();
    const userDocs = allDocs.filter((d: any) => d.userId === userId);
    const userFilenames = userDocs.map((d: any) => d.name);

    if (userFilenames.length === 0) {
      // Stream a single "no documents" message
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              sseEvent({
                token: "It looks like you haven't uploaded any documents yet! Please go to your library dashboard to upload a PDF.",
                done: false,
              })
            )
          );
          controller.enqueue(
            new TextEncoder().encode(sseEvent({ citations: [], done: true, vectorMs: 0 }))
          );
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...rlHeaders,
        },
      });
    }

    // Embed the query
    const vectorStart = Date.now();
    const rawVector = await embeddings.embedQuery(message);
    const queryVector = rawVector.slice(0, 768);

    // Build Pinecone filter
    let filter: any = { userId: { $eq: userId } }; // primary isolation by userId
    if (documentName) {
      const isOwner = userFilenames.includes(documentName);
      if (!isOwner) {
        return new Response(
          JSON.stringify({ error: "Document not found or unauthorized access." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      filter = { userId: { $eq: userId }, filename: { $eq: documentName } };
    } else {
      // Filter to user's filenames for backward compatibility
      filter = { filename: { $in: userFilenames } };
    }

    let topK = config.topK || 5;
    if (userPlan === "Starter") topK = Math.min(topK, 3);

    const queryResult = await pineconeIndex.query({
      topK,
      vector: queryVector,
      includeMetadata: true,
      filter,
    });
    const vectorMs = Date.now() - vectorStart;

    // ── Build context + citations ──────────────────────────────────────────
    const similarityThreshold = config.similarityThreshold ?? 0.4;
    const matches = (queryResult.matches || []).filter(
      (m) => m.score !== undefined && m.score >= similarityThreshold
    );

    const context = matches
      .map((m) => {
        const meta = m.metadata as any;
        const sectionPrefix = meta?.section ? `[Section: ${meta.section}] ` : "";
        return sectionPrefix + (meta?.text || "");
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    // Deduplicate citations
    const citations: any[] = [];
    const seenCitations = new Set<string>();
    for (const match of matches) {
      const meta = match.metadata as any;
      const filename = meta?.filename || "Unknown";
      const pageNumber = meta?.pageNumber || "N/A";
      const key = `${filename}_p${pageNumber}`;
      if (!seenCitations.has(key)) {
        seenCitations.add(key);
        citations.push({ id: match.id, score: match.score, filename, pageNumber });
      }
    }

    // ── Gemini Streaming ───────────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model || "gemini-1.5-flash",
      systemInstruction,
    });

    const prompt = `Context:\n${context || "No relevant context found."}\n\nQuestion: ${message}`;
    const contents = [
      ...history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.parts?.[0]?.text || h.text || "" }],
      })),
      { role: "user", parts: [{ text: prompt }] },
    ];

    // SSE Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send vector latency metadata immediately
          controller.enqueue(
            encoder.encode(sseEvent({ vectorMs, done: false, model: config.model || "gemini-1.5-flash" }))
          );

          const result = await model.generateContentStream({
            contents,
            generationConfig: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens || 1024,
            },
          });

          for await (const chunk of result.stream) {
            const tokenText = chunk.text();
            if (tokenText) {
              controller.enqueue(encoder.encode(sseEvent({ token: tokenText, done: false })));
            }
          }

          // Final event with citations and timing
          const totalMs = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(sseEvent({ citations, done: true, vectorMs, totalMs }))
          );

          // Record stats (non-blocking)
          incrementUserStats(userId, "queries", 1).catch(() => {});
          recordQueryLatency(userId, totalMs).catch(() => {});
        } catch (err: any) {
          console.error("Streaming error:", err);
          controller.enqueue(
            encoder.encode(sseEvent({ error: err.message || "Streaming failed", done: true }))
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-RateLimit-Remaining": rlHeaders["X-RateLimit-Remaining"],
        "X-RateLimit-Limit": rlHeaders["X-RateLimit-Limit"],
      },
    });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred during chat processing." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
