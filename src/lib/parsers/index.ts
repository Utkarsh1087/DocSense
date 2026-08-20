/**
 * parsers/index.ts — Unified parser API.
 * Routes to the appropriate parser engine based on mode.
 */
export type { ParsedPage } from "./standardParser";
export { parseStandard } from "./standardParser";
export { parseLayout } from "./layoutParser";
export { parseTable } from "./tableParser";

import { parseStandard, ParsedPage } from "./standardParser";
import { parseLayout } from "./layoutParser";
import { parseTable } from "./tableParser";

export type ParserMode = "standard" | "layout" | "table";

/**
 * Parse a PDF buffer using the specified engine mode.
 * @param buffer   - Raw PDF bytes
 * @param mode     - "standard" (default) | "layout" (section-aware) | "table" (table detection)
 * @returns Array of parsed pages with content and metadata
 */
export async function parseDocument(
  buffer: Buffer,
  mode: ParserMode = "standard"
): Promise<ParsedPage[]> {
  switch (mode) {
    case "layout":
      return parseLayout(buffer);
    case "table":
      return parseTable(buffer);
    case "standard":
    default:
      return parseStandard(buffer);
  }
}
