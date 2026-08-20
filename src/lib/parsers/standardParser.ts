/**
 * standardParser.ts — Standard sequential text extraction with page markers.
 * Uses pdf-parse with async page rendering for best performance baseline.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");

export interface ParsedPage {
  pageContent: string;
  pageNumber: number;
  section?: string;
  isTable?: boolean;
}

export async function parseStandard(buffer: Buffer): Promise<ParsedPage[]> {
  const pages: ParsedPage[] = [];
  let pageCountTracker = 0;

  const renderPage = (pageData: any): Promise<string> => {
    const currentPage = ++pageCountTracker;
    return pageData.getTextContent().then((textContent: any) => {
      let lastY = 0;
      let text = `---PAGE_NUM:${currentPage}---`;
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
  const pdfData = await pdfParser(buffer, { pagerender: renderPage });

  // Parse the page-numbered text block
  const sections = pdfData.text.split(/---PAGE_NUM:(\d+)---/);
  for (let i = 1; i < sections.length; i += 2) {
    const pageNum = parseInt(sections[i], 10);
    const pageContent = (sections[i + 1] || "").trim();
    if (pageContent.length > 0) {
      pages.push({ pageContent, pageNumber: pageNum });
    }
  }

  return pages;
}
