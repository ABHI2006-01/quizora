/**
 * Image OCR using Tesseract.js.
 */

import Tesseract from "tesseract.js";
import type { ExtractionResult } from "./index";

export async function extractFromImage(buffer: Buffer): Promise<ExtractionResult> {
  const {
    data: { text, confidence },
  } = await Tesseract.recognize(buffer, "eng", {
    logger: () => {}, // suppress progress logs
  });

  const trimmed = text.trim();

  if (!trimmed) {
    return {
      text: "",
      warning: "No text detected in image. Please ensure the image is clear and readable.",
    };
  }

  if (confidence < 60) {
    return {
      text: trimmed,
      warning: `Low OCR confidence (${Math.round(confidence)}%). Please verify the extracted text.`,
    };
  }

  return { text: trimmed };
}
