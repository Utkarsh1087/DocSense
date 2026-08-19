import { NextResponse } from "next/server";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { readSettings } from "../../../../lib/settingsHelpers";
import { readDocs, writeDocs, formatBytes } from "../../../../lib/docHelpers";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing PDF URL query payload." }, { status: 400 });
    }

    const userPlan = req.headers.get("x-user-plan") || "Starter";
    const userId = req.headers.get("x-user-id") || "default_user";

    if (userPlan === "Starter") {
      const currentDocs = await readDocs();
      const userDocs = currentDocs.filter((d: any) => d.userId === userId);
      if (userDocs.length >= 3) {
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

    // 1. Resolve and download the PDF from the URL link
    let downloadUrl = url;
    let filename = "URL_Document.pdf";

    if (url.includes("drive.google.com/file/d/")) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        filename = `Google_Drive_Doc_${match[1].substring(0, 6)}.pdf`;
      }
    } else {
      // Parse filename from standard URL path
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
        const lastPart = pathname.substring(pathname.lastIndexOf("/") + 1);
        if (lastPart.toLowerCase().endsWith(".pdf") && lastPart.length > 4) {
          filename = decodeURIComponent(lastPart);
        }
      } catch (err) {
        // Keep default
      }
    }

    const downloadRes = await fetch(downloadUrl);
    if (!downloadRes.ok) {
      return NextResponse.json({ error: `Failed to download file from URL (status ${downloadRes.status}).` }, { status: 400 });
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    // 3. Parse PDF page-by-page
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

    // 4. Chunk text page-by-page
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
      return NextResponse.json({ error: "The downloaded PDF appears to have no indexable text." }, { status: 400 });
    }

    // 5. Initialize Pinecone and Embeddings
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

    // 6. Save metadata locally
    const newDoc = {
      id: docId,
      name: filename,
      size: formatBytes(fileSize),
      date: "Just now",
      status: "Indexed",
      tokens: `${docsToEmbed.length * 250} est.`,
      vectorIds,
      chunkCount: docsToEmbed.length,
      userId, // Keyed by user ID!
    };

    const currentDocs = await readDocs();
    currentDocs.unshift(newDoc);
    await writeDocs(currentDocs);

    return NextResponse.json(newDoc);
  } catch (error: any) {
    console.error("Failed to import URL PDF:", error);
    return NextResponse.json({ error: error.message || "Failed to index link document." }, { status: 500 });
  }
}
