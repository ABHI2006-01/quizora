/**
 * AI question generation with Claude (primary) and Gemini (fallback).
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuizConfig, GeneratedQuestion } from "@/types";
import {
  buildGenerationSystemPrompt,
  buildGenerationPrompt,
  buildRegenerationPrompt,
} from "./prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate questions using Claude (claude-opus-5-5).
 */
async function generateWithClaude(
  extractedText: string,
  config: QuizConfig
): Promise<GeneratedQuestion[]> {
  const response = await anthropic.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 8192,
    system: buildGenerationSystemPrompt(),
    messages: [
      { role: "user", content: buildGenerationPrompt(extractedText, config) },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  return parseQuestionsJSON(content.text);
}

/**
 * Generate questions using Gemini (gemini-1.5-pro) as fallback.
 */
async function generateWithGemini(
  extractedText: string,
  config: QuizConfig
): Promise<GeneratedQuestion[]> {
  const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt =
    buildGenerationSystemPrompt() +
    "\n\n" +
    buildGenerationPrompt(extractedText, config);

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseQuestionsJSON(text);
}

/**
 * Parse the JSON array of questions from AI response text.
 * Strips markdown code fences if present.
 */
function parseQuestionsJSON(text: string): GeneratedQuestion[] {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("AI response is not a JSON array");
  return parsed as GeneratedQuestion[];
}

/**
 * Main entry point: generate questions with automatic fallback.
 * Returns questions + which provider was used.
 */
export async function generateQuestions(
  extractedText: string,
  config: QuizConfig
): Promise<{ questions: GeneratedQuestion[]; provider: "claude" | "gemini" }> {
  try {
    const questions = await generateWithClaude(extractedText, config);
    return { questions, provider: "claude" };
  } catch (claudeError) {
    console.warn("Claude generation failed, falling back to Gemini:", claudeError);
    try {
      const questions = await generateWithGemini(extractedText, config);
      return { questions, provider: "gemini" };
    } catch (geminiError) {
      console.error("Gemini generation also failed:", geminiError);
      throw new Error("Both AI providers failed to generate questions.");
    }
  }
}

/**
 * Regenerate a single question with automatic fallback.
 */
export async function regenerateQuestion(
  extractedText: string,
  config: QuizConfig,
  questionType: string,
  reason?: string
): Promise<{ question: GeneratedQuestion; provider: "claude" | "gemini" }> {
  const prompt = buildRegenerationPrompt(extractedText, config, questionType, reason);

  async function withClaude() {
    const response = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2048,
      system: buildGenerationSystemPrompt(),
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    const cleaned = content.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as GeneratedQuestion;
  }

  async function withGemini() {
    const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as GeneratedQuestion;
  }

  try {
    const question = await withClaude();
    return { question, provider: "claude" };
  } catch {
    const question = await withGemini();
    return { question, provider: "gemini" };
  }
}
