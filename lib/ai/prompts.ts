/**
 * All prompt templates for AI question generation and answer evaluation.
 */

import type { QuizConfig } from "@/types";

/**
 * Build the system prompt for question generation.
 */
export function buildGenerationSystemPrompt(): string {
  return `You are Quizora's expert question generator. Your job is to create high-quality,
realistic exam questions from the provided study material.

Rules:
- Questions must be directly based on the provided material — no external knowledge
- Questions must be unambiguous, grammatically correct, and professionally worded
- Do NOT make questions that look obviously AI-generated
- Vary question formats and difficulty as instructed
- For MCQ: always provide exactly 4 options, exactly one (or more for multi-correct) correct
- For numerical: provide exact correct answer and a reasonable tolerance (e.g., ±0.01 for decimals)
- For short answer / descriptive: provide a clear model answer and rubric
- Tag each question with a topic from the material
- Return ONLY valid JSON — no markdown, no explanation outside JSON`;
}

/**
 * Build the user prompt for question generation.
 */
export function buildGenerationPrompt(
  extractedText: string,
  config: QuizConfig
): string {
  return `Generate ${config.numberOfQuestions} exam questions from the study material below.

QUIZ CONFIGURATION:
- Subject: ${config.subject}
- Topic: ${config.topic}
- Question types requested: ${config.questionTypes.join(", ")}
- Difficulty: ${config.difficultyLevel}
- Cognitive levels: ${config.cognitiveLevels?.join(", ") ?? "Any"}
- Total marks to distribute: ${config.totalMarks}

STUDY MATERIAL:
${extractedText.slice(0, 12000)}

Return a JSON array of question objects. Each object must have:
{
  "type": "MCQ_SINGLE" | "MCQ_MULTIPLE" | "TRUE_FALSE" | "NUMERICAL" | "SHORT_ANSWER" | "DESCRIPTIVE",
  "text": "Question text here",
  "marks": number,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "cognitiveLevel": "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE",
  "topicTag": "specific topic from material",
  "explanation": "Brief explanation of the correct answer",

  // For MCQ_SINGLE, MCQ_MULTIPLE, TRUE_FALSE:
  "options": [
    { "text": "Option text", "isCorrect": true/false }
  ],

  // For NUMERICAL:
  "correctAnswer": "42.5",
  "tolerance": 0.1,

  // For SHORT_ANSWER, DESCRIPTIVE:
  "modelAnswer": "Expected answer here",
  "rubric": "Scoring criteria: 1 mark for X, 1 mark for Y..."
}

Return ONLY the JSON array, nothing else.`;
}

/**
 * Build the prompt for regenerating a single question.
 */
export function buildRegenerationPrompt(
  extractedText: string,
  config: QuizConfig,
  questionType: string,
  reason?: string
): string {
  return `Generate 1 new ${questionType} question from the study material below.

CONTEXT:
- Subject: ${config.subject}
- Topic: ${config.topic}
- Difficulty: ${config.difficultyLevel}
${reason ? `- Reason for regeneration: ${reason}` : ""}

STUDY MATERIAL:
${extractedText.slice(0, 8000)}

Return a JSON object (not array) for a single question using the same schema as before.
Return ONLY the JSON object, nothing else.`;
}

/**
 * Build the evaluation prompt for a subjective answer.
 */
export function buildEvaluationPrompt(
  questionText: string,
  modelAnswer: string,
  rubric: string | null,
  studentAnswer: string,
  maxMarks: number
): string {
  return `Evaluate this student's answer for the following exam question.

QUESTION:
${questionText}

MODEL ANSWER:
${modelAnswer}

${rubric ? `RUBRIC:\n${rubric}\n` : ""}

STUDENT'S ANSWER:
${studentAnswer}

MAX MARKS: ${maxMarks}

Evaluate the student's answer fairly and objectively. Consider:
- Accuracy of key concepts
- Completeness of the answer
- Relevance to the question
- For numerical-style reasoning: correct method even if minor arithmetic error

Return a JSON object:
{
  "score": number (0 to ${maxMarks}, can be decimal like 1.5),
  "confidence": number (0 to 1, how confident you are in this score),
  "reasoning": "Brief explanation of why this score was given"
}

Return ONLY the JSON object, nothing else.`;
}
