/**
 * DOCX text extraction using mammoth.
 */

import mammoth from "mammoth";
import type { ExtractionResult } from "./index";

export async function extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });

  const text = result.value.trim();
  const warnings = result.messages
    .filter((m) => m.type === "warning")
    .map((m) => m.message)
    .join("; ");

  if (!text) {
    return {
      text: "",
      warning: "No text found in DOCX file.",
    };
  }

  return {
    text,
    warning: warnings || undefined,
  };
}
