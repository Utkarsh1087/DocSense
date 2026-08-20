import { NextResponse } from "next/server";
import { readDocs, writeDocs, formatBytes } from "../../../../lib/docHelpers";
import { readUserSettings } from "../../../../lib/settingsHelpers";
import { incrementUserStats } from "../../../../lib/userHelpers";
import { getUserIdFromRequest, getPlanFromRequest } from "../../../../lib/auth";
import { ingestDocument } from "../../../../lib/ingestionPipeline";

export const maxDuration = 300; // 5 minutes

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  const userPlan = getPlanFromRequest(req);

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing PDF URL query payload." }, { status: 400 });
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

    if (!process.env.GEMINI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      return NextResponse.json(
        { error: "Server credentials missing. Set GEMINI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX_NAME." },
        { status: 500 }
      );
    }

    // ── SSRF Security Validation ─────────────────────────────────────────────
    const { validateSafeUrl } = await import("../../../../lib/ssrfValidator");
    const validation = validateSafeUrl(url);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error || "Security violation: Invalid or restricted URL." }, { status: 400 });
    }

    // ── Handle Google Drive / Dropbox / Direct Links ────────────────────────
    let downloadUrl = url;
    let filename = "URL_Document.pdf";

    if (url.includes("drive.google.com/file/d/")) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        filename = `Google_Drive_Doc_${match[1].substring(0, 6)}.pdf`;
      }
    } else if (url.includes("drive.google.com/open?id=")) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        filename = `Google_Drive_Doc_${match[1].substring(0, 6)}.pdf`;
      }
    } else {
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
        const lastPart = pathname.substring(pathname.lastIndexOf("/") + 1);
        if (lastPart.length > 0) {
          const decoded = decodeURIComponent(lastPart);
          filename = decoded.endsWith(".pdf") ? decoded : `${decoded}.pdf`;
        }
      } catch {
        // Keep default filename
      }
    }

    // ── Download File ─────────────────────────────────────────────────────────
    const downloadRes = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/pdf,application/octet-stream,*/*",
      },
    });

    if (!downloadRes.ok) {
      return NextResponse.json(
        { error: `Failed to download file from URL (HTTP ${downloadRes.status}). Ensure the link is publicly accessible.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    // Check PDF Magic Bytes: First 5 bytes must be '%PDF-'
    const magicHeader = buffer.slice(0, 5).toString("ascii");
    const isRealPdf = magicHeader.startsWith("%PDF");

    if (!isRealPdf) {
      // Check if it's an HTML error page (e.g. Google Drive auth page or Cloudflare challenge)
      const firstBytes = buffer.slice(0, 100).toString("utf8").toLowerCase();
      if (firstBytes.includes("<!doctype html") || firstBytes.includes("<html")) {
        return NextResponse.json(
          { error: "The provided link requires login or returned a webpage instead of raw PDF bytes. If using Google Drive, ensure link sharing is set to 'Anyone with the link can view'." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "The downloaded file does not have a valid PDF header format." },
        { status: 400 }
      );
    }


    // ── Load settings & run pipeline ──────────────────────────────────────────
    const config = await readUserSettings(userId);
    const result = await ingestDocument(buffer, filename, userId, config);

    // ── Save metadata ─────────────────────────────────────────────────────────
    const newDoc = {
      id: result.docId,
      name: filename,
      size: formatBytes(fileSize),
      date: new Date().toISOString(),
      status: "Indexed",
      tokens: result.estimatedTokens,
      vectorIds: result.vectorIds,
      chunkCount: result.chunkCount,
      pageCount: result.pageCount,
      parserMode: result.parserMode,
      userId,
    };

    const { insertDoc } = await import("../../../../lib/docHelpers");
    await insertDoc(newDoc);

    // Non-blocking stat updates

    incrementUserStats(userId, "documents", 1).catch(() => {});
    incrementUserStats(userId, "vectors", result.vectorIds.length).catch(() => {});

    return NextResponse.json(newDoc);
  } catch (error: any) {
    console.error("Failed to import URL PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to index link document." },
      { status: 500 }
    );
  }
}
