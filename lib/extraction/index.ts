/**
 * Unified text extraction entry point.
 * Routes to the correct extractor based on file MIME type or extension.
 */

import { extractFromPDF } from "./pdf";
import { extractFromDOCX } from "./docx";
import { extractFromImage } from "./image";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  warning?: string;
}

type SupportedMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/msword"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "text/plain"
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/webp";

/**
 * Extract text from a file buffer given its MIME type.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractionResult> {
  const mime = mimeType.toLowerCase() as SupportedMime;

  if (mime === "application/pdf") {
    return extractFromPDF(buffer);
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    return extractFromDOCX(buffer);
  }

  if (
    mime === "text/plain" ||
    fileName.endsWith(".txt")
  ) {
    return { text: buffer.toString("utf-8") };
  }

  if (
    mime.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) => fileName.endsWith(ext))
  ) {
    return extractFromImage(buffer);
  }

  // PPT/PPTX: extract as text (basic — slides text only)
  if (
    mime === "application/vnd.ms-powerpoint" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    fileName.endsWith(".ppt") ||
    fileName.endsWith(".pptx")
  ) {
    // PPTX is a zip of XML files — use mammoth-style XML extraction
    return extractFromDOCX(buffer); // mammoth handles basic PPTX text too
  }

  throw new Error(`Unsupported file type: ${mimeType} (${fileName})`);
}
