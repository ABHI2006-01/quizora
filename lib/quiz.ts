import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

// Characters that avoid visual ambiguity (no 0/O, 1/I/l)
const QUIZ_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const QUIZ_CODE_LENGTH = 6;

/**
 * Generate a random 6-character alphanumeric quiz code.
 * Retries until a unique code is found.
 */
export async function generateUniqueQuizCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = Array.from(
      { length: QUIZ_CODE_LENGTH },
      () => QUIZ_CODE_CHARS[Math.floor(Math.random() * QUIZ_CODE_CHARS.length)]
    ).join("");

    const existing = await prisma.quiz.findUnique({ where: { quizCode: code } });
    if (!existing) return code;
    attempts++;
  }
  // Fallback: use nanoid with custom alphabet
  return nanoid(6).toUpperCase();
}

/**
 * Validate a quiz code: exists, published, not closed.
 * Returns the quiz or null if invalid.
 */
export async function validateQuizCode(code: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { quizCode: code.toUpperCase() },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { questions: { where: { isApproved: true } } } },
    },
  });

  if (!quiz) return null;
  if (quiz.status !== "PUBLISHED") return null;

  return quiz;
}
