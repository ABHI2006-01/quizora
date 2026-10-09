/**
 * AI answer evaluation for subjective questions (Short Answer / Descriptive).
 * Primary: Claude. Fallback: Gemini.
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIEvaluationResult } from "@/types";
import { buildEvaluationPrompt } from "./prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function parseEvaluationJSON(text: string): AIEvaluationResult {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as AIEvaluationResult;
}

async function evaluateWithClaude(
  questionText: string,
  modelAnswer: string,
  rubric: string | null,
  studentAnswer: string,
  maxMarks: number
): Promise<AIEvaluationResult> {
  const response = await anthropic.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildEvaluationPrompt(
          questionText,
          modelAnswer,
          rubric,
          studentAnswer,
          maxMarks
        ),
      },
    ],
  });
  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return parseEvaluationJSON(content.text);
}

async function evaluateWithGemini(
  questionText: string,
  modelAnswer: string,
  rubric: string | null,
  studentAnswer: string,
  maxMarks: number
): Promise<AIEvaluationResult> {
  const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent(
    buildEvaluationPrompt(questionText, modelAnswer, rubric, studentAnswer, maxMarks)
  );
  return parseEvaluationJSON(result.response.text());
}

/**
 * Evaluate a subjective answer with automatic fallback.
 * Clamps returned score to [0, maxMarks].
 */
export async function evaluateAnswer(
  questionText: string,
  modelAnswer: string,
  rubric: string | null,
  studentAnswer: string,
  maxMarks: number
): Promise<AIEvaluationResult & { provider: "claude" | "gemini" }> {
  let result: AIEvaluationResult;
  let provider: "claude" | "gemini";

  try {
    result = await evaluateWithClaude(
      questionText,
      modelAnswer,
      rubric,
      studentAnswer,
      maxMarks
    );
    provider = "claude";
  } catch (claudeError) {
    console.warn("Claude evaluation failed, falling back to Gemini:", claudeError);
    result = await evaluateWithGemini(
      questionText,
      modelAnswer,
      rubric,
      studentAnswer,
      maxMarks
    );
    provider = "gemini";
  }

  // Clamp score to valid range
  result.score = Math.max(0, Math.min(maxMarks, result.score));
  result.confidence = Math.max(0, Math.min(1, result.confidence));

  return { ...result, provider };
}
