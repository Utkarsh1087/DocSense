import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { readSettings } from "../settings/route";

const dataFilePath = path.join(process.cwd(), "data", "documents.json");

export function readDocs() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const data = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading documents db:", error);
    return [];
  }
}

export function writeDocs(docs: any[]) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(docs, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing documents db:", error);
  }
}

// Format file size helper
export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// GET: Retrieve all documents
export async function GET() {
  try {
    const docs = readDocs();
    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upload and index a PDF document
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported currently." }, { status: 400 });
    }

    const userPlan = req.headers.get("x-user-plan") || "Starter";
    if (userPlan === "Starter") {
      const currentDocs = readDocs();
      if (currentDocs.length >= 3) {
        return NextResponse.json(
          { error: "Upload limit reached. The Starter plan is limited to 3 documents. Please upgrade to Pro in Settings to upload unlimited files." },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !pineconeKey || !indexName) {
      return NextResponse.json(
        { error: "Server credentials missing. Set GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX_NAME." },
        { status: 500 }
      );
    }

    const filename = file.name;
    const sizeStr = formatBytes(file.size);
    const dateStr = "Just now";

    // 1. Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Parse PDF page-by-page using custom page-renderer to retain page numbers
    let pageCountTracker = 0;
    const renderPageHelper = (pageData: any) => {
      pageCountTracker++;
      return pageData.getTextContent().then((textContent: any) => {
        let lastY = 0;
        let text = `---PAGE_NUM:${pageCountTracker}---`;
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }
        return text;
      });
    };

    const pdfParser = typeof pdf === "function" ? pdf : (pdf as any).default;
    const pdfData = await pdfParser(buffer, { pagerender: renderPageHelper });

    const config = readSettings();

    // 3. Chunk text page-by-page
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize || 1500,
      chunkOverlap: config.chunkOverlap || 300,
    });

    const ignoredWords = (config.ignoredKeywords || "")
      .split(",")
      .map((w: string) => w.trim().toLowerCase())
      .filter(Boolean);

    const docsToEmbed: { pageContent: string; metadata: { filename: string; pageNumber: number } }[] = [];
    const sections = pdfData.text.split(/---PAGE_NUM:(\d+)---/);
    
    for (let i = 1; i < sections.length; i += 2) {
      const pageNumStr = sections[i];
      const pageContent = sections[i + 1] || "";
      const pageNum = parseInt(pageNumStr, 10);

      if (pageContent.trim().length === 0) continue;

      const pageChunks = await textSplitter.splitText(pageContent);
      for (const chunk of pageChunks) {
        if (chunk.trim().length === 0) continue;

        // Filter out chunks containing any ignored keywords
        const lowerChunk = chunk.toLowerCase();
        const hasIgnoredWord = ignoredWords.some((w: string) => lowerChunk.includes(w));
        if (hasIgnoredWord) continue;

        docsToEmbed.push({
          pageContent: chunk,
          metadata: {
            filename,
            pageNumber: pageNum,
          },
        });
      }
    }

    if (docsToEmbed.length === 0) {
      return NextResponse.json({ error: "The uploaded PDF appears to have no indexable text." }, { status: 400 });
    }

    // 4. Initialize Pinecone and Embeddings
    const pinecone = new Pinecone({ apiKey: pineconeKey });
    const pineconeIndex = pinecone.Index(indexName);
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: "gemini-embedding-001",
    });

    const docId = `doc_${Date.now()}`;
    const vectorIds: string[] = [];
    const batchSize = 10;

    // Index batches to Pinecone
    for (let i = 0; i < docsToEmbed.length; i += batchSize) {
      const batch = docsToEmbed.slice(i, i + batchSize);
      const textsToEmbed = batch.map((d) => d.pageContent);
      const embeds = await embeddings.embedDocuments(textsToEmbed);

      const vectors = batch.map((doc, index) => {
        const values = embeds[index]?.slice(0, 768) || [];
        if (values.length === 0) return null;

        const vectorId = `${docId}_c${i + index}`;
        vectorIds.push(vectorId);

        return {
          id: vectorId,
          values,
          metadata: {
            filename: doc.metadata.filename,
            pageNumber: doc.metadata.pageNumber,
            text: doc.pageContent,
          },
        };
      }).filter(Boolean) as any[];

      if (vectors.length > 0) {
        await pineconeIndex.upsert(vectors);
      }
    }

    // 5. Save metadata locally
    const newDoc = {
      id: docId,
      name: filename,
      size: sizeStr,
      date: dateStr,
      status: "Indexed",
      tokens: `${docsToEmbed.length * 250} est.`, // rough approximation for display
      vectorIds,
      chunkCount: docsToEmbed.length,
    };

    const currentDocs = readDocs();
    currentDocs.unshift(newDoc);
    writeDocs(currentDocs);

    return NextResponse.json(newDoc);
  } catch (error: any) {
    console.error("Failed to upload/index document:", error);
    return NextResponse.json({ error: error.message || "Failed to index document." }, { status: 500 });
  }
}

// DELETE: Delete a document and its vectors from Pinecone
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

    const currentDocs = readDocs();
    const docToDelete = currentDocs.find((d: any) => d.id === id);

    if (!docToDelete) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // 1. Delete vectors from Pinecone
    const pinecone = new Pinecone({ apiKey: pineconeKey });
    const pineconeIndex = pinecone.Index(indexName);

    if (docToDelete.vectorIds && docToDelete.vectorIds.length > 0) {
      // Pinecone delete API takes string IDs in batches or list
      await pineconeIndex.deleteMany(docToDelete.vectorIds);
    }

    // 2. Remove entry from local metadata database
    const updatedDocs = currentDocs.filter((d: any) => d.id !== id);
    writeDocs(updatedDocs);

    return NextResponse.json({ success: true, message: `Successfully deleted document: ${docToDelete.name}` });
  } catch (error: any) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: error.message || "Failed to delete document." }, { status: 500 });
  }
}
