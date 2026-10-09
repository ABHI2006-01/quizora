/**
 * PDF text extraction using pdf-parse.
 */

import type { ExtractionResult } from "./index";

export async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  // Dynamic import to avoid issues in edge environments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (await import("pdf-parse") as any).default ?? (await import("pdf-parse"));

  const data = await pdfParse(buffer);
  const text = data.text.trim();

  if (!text) {
    return {
      text: "",
      pageCount: data.numpages,
      warning: "No text found in PDF. It may be a scanned document — try uploading an image instead.",
    };
  }

  return {
    text,
    pageCount: data.numpages,
  };
}
