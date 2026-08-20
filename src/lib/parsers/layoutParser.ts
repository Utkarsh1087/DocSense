/**
 * layoutParser.ts — Layout-Aware text extraction.
 * Groups text items by their Y-coordinate position to reconstruct
 * logical paragraph blocks and detect section headers.
 * Preserves document structure for better semantic chunking.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");

import type { ParsedPage } from "./standardParser";

// Y-coordinate tolerance for grouping items on the same "line"
const LINE_TOLERANCE = 5;
// Minimum font size ratio threshold to detect headings (relative to body text)
const HEADING_SIZE_MULTIPLIER = 1.3;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface TextLine {
  y: number;
  items: TextItem[];
  avgHeight: number;
  text: string;
}

function groupItemsIntoLines(items: TextItem[]): TextLine[] {
  const lines: TextLine[] = [];

  for (const item of items) {
    if (!item.str.trim()) continue;

    const y = Math.round(item.transform[5]);
    const existingLine = lines.find((l) => Math.abs(l.y - y) <= LINE_TOLERANCE);

    if (existingLine) {
      existingLine.items.push(item);
      existingLine.text += item.str;
      existingLine.avgHeight = existingLine.items.reduce((s, i) => s + i.height, 0) / existingLine.items.length;
    } else {
      lines.push({
        y,
        items: [item],
        avgHeight: item.height,
        text: item.str,
      });
    }
  }

  // Sort lines top-to-bottom (higher Y = higher on page in PDF coordinates)
  return lines.sort((a, b) => b.y - a.y);
}

function detectHeadings(lines: TextLine[]): { line: TextLine; isHeading: boolean }[] {
  if (lines.length === 0) return [];

  // Calculate modal (most common) font height = body text size
  const heights = lines.map((l) => Math.round(l.avgHeight));
  const heightFreq = new Map<number, number>();
  for (const h of heights) heightFreq.set(h, (heightFreq.get(h) || 0) + 1);
  const bodyHeight = [...heightFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 10;

  return lines.map((line) => ({
    line,
    isHeading: line.avgHeight >= bodyHeight * HEADING_SIZE_MULTIPLIER && line.text.trim().length < 120,
  }));
}

export async function parseLayout(buffer: Buffer): Promise<ParsedPage[]> {
  const pageResults: Array<{ pageNumber: number; items: TextItem[] }> = [];
  let pageCount = 0;

  const renderPage = (pageData: any): Promise<string> => {
    const currentPage = ++pageCount;
    return pageData.getTextContent().then((textContent: any) => {
      pageResults.push({
        pageNumber: currentPage,
        items: textContent.items as TextItem[],
      });
      // Return minimal text to satisfy pdf-parse internal requirements
      return textContent.items.map((i: TextItem) => i.str).join(" ");
    });
  };

  const pdfParser = typeof pdf === "function" ? pdf : (pdf as any).default;
  await pdfParser(buffer, { pagerender: renderPage });

  const pages: ParsedPage[] = [];
  let currentSection = "";

  for (const { pageNumber, items } of pageResults) {
    if (items.length === 0) continue;

    const lines = groupItemsIntoLines(items);
    const annotatedLines = detectHeadings(lines);

    const paragraphs: string[] = [];
    let currentParagraph = "";

    for (const { line, isHeading } of annotatedLines) {
      const text = line.text.trim();
      if (!text) continue;

      if (isHeading) {
        // Flush current paragraph
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = "";
        }
        // Update current section and add as section marker
        currentSection = text;
        paragraphs.push(`## ${text}`);
      } else {
        // Detect paragraph breaks: large Y gap between lines
        currentParagraph += (currentParagraph ? " " : "") + text;
      }
    }

    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    if (paragraphs.length > 0) {
      pages.push({
        pageContent: paragraphs.join("\n\n"),
        pageNumber,
        section: currentSection || undefined,
      });
    }
  }

  return pages;
}
