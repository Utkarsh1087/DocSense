/**
 * tableParser.ts — Table-aware PDF extraction.
 * Uses X/Y coordinate clustering to detect grid structures and reconstruct
 * them as Markdown pipe tables. Falls back to standard text for non-tabular pages.
 * 100% free — no external OCR or API calls required.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");

import type { ParsedPage } from "./standardParser";

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

// Cluster tolerance in PDF points (~1px = 0.75pt)
const COL_TOLERANCE = 20;
const ROW_TOLERANCE = 8;

/**
 * Detect if a page has a table structure.
 * Heuristic: ≥3 distinct X clusters each with ≥3 items at similar Y positions.
 */
function detectTableStructure(items: TextItem[]): boolean {
  if (items.length < 9) return false;

  const xCoords = items.map((i) => Math.round(i.transform[4]));
  const xClusters = new Map<number, number>();

  for (const x of xCoords) {
    let matched = false;
    for (const [cx] of xClusters) {
      if (Math.abs(cx - x) <= COL_TOLERANCE) {
        xClusters.set(cx, (xClusters.get(cx) || 0) + 1);
        matched = true;
        break;
      }
    }
    if (!matched) xClusters.set(x, 1);
  }

  const columnCount = [...xClusters.values()].filter((count) => count >= 3).length;
  return columnCount >= 3;
}

/**
 * Convert table items to Markdown pipe table format.
 */
function renderAsMarkdownTable(items: TextItem[]): string {
  // Group items by Y coordinate (rows)
  const rows = new Map<number, Map<number, string>>();
  const colCenters: number[] = [];

  for (const item of items) {
    const y = Math.round(item.transform[5]);
    const x = Math.round(item.transform[4]);

    if (!rows.has(y)) rows.set(y, new Map());
    const rowMap = rows.get(y)!;

    // Find nearest column center
    let col = colCenters.find((c) => Math.abs(c - x) <= COL_TOLERANCE);
    if (col === undefined) {
      colCenters.push(x);
      col = x;
    }

    const existing = rowMap.get(col) || "";
    rowMap.set(col, (existing + " " + item.str).trim());
  }

  colCenters.sort((a, b) => a - b);
  const sortedRows = [...rows.entries()].sort((a, b) => b[0] - a[0]); // top-to-bottom

  if (sortedRows.length < 2) return "";

  const tableRows = sortedRows.map(([, cellMap]) => {
    const cells = colCenters.map((col) => {
      const nearest = [...cellMap.entries()].find(([x]) => Math.abs(x - col) <= COL_TOLERANCE);
      return nearest?.[1]?.replace(/\|/g, "\\|") || "";
    });
    return `| ${cells.join(" | ")} |`;
  });

  // Insert separator after header row
  const separator = `| ${colCenters.map(() => "---").join(" | ")} |`;
  tableRows.splice(1, 0, separator);

  return tableRows.join("\n");
}

export async function parseTable(buffer: Buffer): Promise<ParsedPage[]> {
  const pageResults: Array<{ pageNumber: number; items: TextItem[] }> = [];
  let pageCount = 0;

  const renderPage = (pageData: any): Promise<string> => {
    const currentPage = ++pageCount;
    return pageData.getTextContent().then((textContent: any) => {
      pageResults.push({
        pageNumber: currentPage,
        items: textContent.items as TextItem[],
      });
      return textContent.items.map((i: TextItem) => i.str).join(" ");
    });
  };

  const pdfParser = typeof pdf === "function" ? pdf : (pdf as any).default;
  await pdfParser(buffer, { pagerender: renderPage });

  const pages: ParsedPage[] = [];

  for (const { pageNumber, items } of pageResults) {
    if (items.length === 0) continue;

    const hasTable = detectTableStructure(items);

    if (hasTable) {
      const tableMarkdown = renderAsMarkdownTable(items);
      if (tableMarkdown) {
        pages.push({
          pageContent: tableMarkdown,
          pageNumber,
          isTable: true,
        });
        continue;
      }
    }

    // Fallback: standard text reconstruction
    let lastY = 0;
    let text = "";
    for (const item of items) {
      if (!item.str.trim()) continue;
      if (lastY === item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += "\n" + item.str;
      }
      lastY = item.transform[5];
    }

    if (text.trim()) {
      pages.push({ pageContent: text.trim(), pageNumber, isTable: false });
    }
  }

  return pages;
}
