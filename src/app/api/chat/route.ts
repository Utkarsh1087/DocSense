import { NextResponse } from "next/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readSettings } from "../../../lib/settingsHelpers";
import { readDocs } from "../../../lib/docHelpers";

export async function POST(req: Request) {
  try {
    const { message, history = [], documentName } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !pineconeKey || !indexName) {
      return NextResponse.json(
        { error: "Server credentials missing. Make sure GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX_NAME are configured." },
        { status: 500 }
      );
    }

    const config = readSettings();
    const userPlan = req.headers.get("x-user-plan") || "Starter";

    let systemInstruction = config.systemInstruction;
    if (userPlan === "Starter") {
      systemInstruction += "\nIMPORTANT: The user is on a Starter tier. Keep answers very brief, concise, and focused strictly on the query.";
    }

    // 1. Initialize Gemini & Pinecone
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model || "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: "gemini-embedding-001",
    });

    const pinecone = new Pinecone({ apiKey: pineconeKey });
    const pineconeIndex = pinecone.Index(indexName);

    const userId = req.headers.get("x-user-id") || "default_user";
    const userDocs = (await readDocs()).filter((d: any) => d.userId === userId);
    const userFilenames = userDocs.map((d: any) => d.name);

    if (userFilenames.length === 0) {
      return NextResponse.json({ 
        answer: "It looks like you haven't uploaded or indexed any documents yet! Please go to your library dashboard to upload a PDF.", 
        citations: [] 
      });
    }

    // 2. Generate Query Vector
    const rawVector = await embeddings.embedQuery(message);
    const queryVector = rawVector.slice(0, 768);

    // 3. Query Pinecone (with filter isolated to user's filenames)
    let filter: any = { filename: { $in: userFilenames } };
    if (documentName) {
      const isOwner = userFilenames.includes(documentName);
      if (!isOwner) {
        return NextResponse.json({ error: "Document not found or unauthorized access." }, { status: 403 });
      }
      filter = { filename: { $eq: documentName } };
    }

    let topK = config.topK || 5;
    if (userPlan === "Starter") {
      topK = Math.min(topK, 3); // Restrict search context matches to 3 for Starter
    }

    const queryResult = await pineconeIndex.query({
      topK: topK,
      vector: queryVector,
      includeMetadata: true,
      filter: filter,
    });

    // 4. Construct Context & Source Citations
    const similarityThreshold = config.similarityThreshold ?? 0.4;
    const matches = (queryResult.matches || []).filter(
      (match) => match.score !== undefined && match.score >= similarityThreshold
    );
    const context = matches
      .map((match) => (match.metadata as any)?.text)
      .filter(Boolean)
      .join("\n\n---\n\n");

    // Deduplicate citations by filename + pageNumber
    const citations: any[] = [];
    const seenCitations = new Set<string>();

    for (const match of matches) {
      const filename = (match.metadata as any)?.filename || "Unknown Document";
      const pageNumber = (match.metadata as any)?.pageNumber || "N/A";
      const key = `${filename}_page_${pageNumber}`;

      if (!seenCitations.has(key)) {
        seenCitations.add(key);
        citations.push({
          id: match.id,
          score: match.score,
          filename,
          pageNumber,
        });
      }
    }

    // 5. Send payload to Gemini Flash LLM
    const prompt = `Context: ${context || "No context found."}\n\nQuestion: ${message}`;
    
    // Format history matching Gemini format
    const contents = [
      ...history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.parts?.[0]?.text || h.text || "" }]
      })),
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ];

    let responseText = "";
    let retries = 3;
    while (retries > 0) {
      try {
        const result = await model.generateContent({
          contents,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens || 1024,
          }
        });
        responseText = result.response.text();
        break;
      } catch (e: any) {
        if (retries > 1 && (e.message.includes("503") || e.message.includes("429"))) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw e;
        }
      }
    }

    return NextResponse.json({
      answer: responseText,
      citations: citations,
    });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: error.message || "An error occurred during chat processing." }, { status: 500 });
  }
}
