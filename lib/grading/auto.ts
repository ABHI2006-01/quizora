/**
 * Auto-grading for objective question types:
 * MCQ Single, MCQ Multiple, True/False, Numerical.
 */

import { prisma } from "@/lib/prisma";

interface GradeResult {
  marksAwarded: number;
  isCorrect: boolean;
}

/**
 * Grade MCQ Single Correct — exact match on the single correct option.
 */
export function gradeMCQSingle(
  selectedOptionIds: string[],
  correctOptionIds: string[],
  maxMarks: number
): GradeResult {
  if (selectedOptionIds.length !== 1) {
    return { marksAwarded: 0, isCorrect: false };
  }
  const isCorrect = selectedOptionIds[0] === correctOptionIds[0];
  return { marksAwarded: isCorrect ? maxMarks : 0, isCorrect };
}

/**
 * Grade MCQ Multiple Correct — all correct options must be selected, no wrong ones.
 */
export function gradeMCQMultiple(
  selectedOptionIds: string[],
  correctOptionIds: string[],
  maxMarks: number,
  proportional = false
): GradeResult {
  const correctSet = new Set(correctOptionIds);
  const selectedSet = new Set(selectedOptionIds);

  // Check for any wrong selections
  const hasWrong = [...selectedSet].some((id) => !correctSet.has(id));
  if (hasWrong) return { marksAwarded: 0, isCorrect: false };

  const correctCount = [...selectedSet].filter((id) => correctSet.has(id)).length;
  const isCorrect = correctCount === correctSet.size;

  if (proportional && !isCorrect) {
    const marks = Math.round((correctCount / correctSet.size) * maxMarks * 10) / 10;
    return { marksAwarded: marks, isCorrect: false };
  }

  return { marksAwarded: isCorrect ? maxMarks : 0, isCorrect };
}

/**
 * Grade Numerical — exact value within ±tolerance.
 */
export function gradeNumerical(
  answerText: string,
  correctAnswer: string,
  tolerance: number,
  maxMarks: number
): GradeResult {
  const student = parseFloat(answerText);
  const correct = parseFloat(correctAnswer);

  if (isNaN(student) || isNaN(correct)) {
    return { marksAwarded: 0, isCorrect: false };
  }

  const isCorrect = Math.abs(student - correct) <= Math.abs(tolerance);
  return { marksAwarded: isCorrect ? maxMarks : 0, isCorrect };
}

/**
 * Grade all auto-gradable responses in a quiz attempt.
 * Updates StudentResponse records and returns the total auto-grade score.
 */
export async function gradeAttempt(attemptId: string): Promise<number> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: {
            include: {
              options: true,
              meta: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);

  let totalScore = 0;

  for (const response of attempt.responses) {
    const { question } = response;
    const type = question.type;
    const maxMarks = question.marks;

    if (response.isSkipped) continue;

    let result: GradeResult = { marksAwarded: 0, isCorrect: false };

    if (type === "MCQ_SINGLE" || type === "TRUE_FALSE") {
      const correctIds = question.options
        .filter((o: { isCorrect: boolean }) => o.isCorrect)
        .map((o: { id: string }) => o.id);
      result = gradeMCQSingle(response.selectedOptions, correctIds, maxMarks);
    } else if (type === "MCQ_MULTIPLE") {
      const correctIds = question.options
        .filter((o: { isCorrect: boolean }) => o.isCorrect)
        .map((o: { id: string }) => o.id);
      result = gradeMCQMultiple(response.selectedOptions, correctIds, maxMarks);
    } else if (type === "NUMERICAL" && question.meta) {
      result = gradeNumerical(
        response.answerText ?? "",
        question.meta.correctAnswer ?? "0",
        question.meta.tolerance ?? 0,
        maxMarks
      );
    } else {
      // SHORT_ANSWER / DESCRIPTIVE — handled by AI evaluation separately
      continue;
    }

    totalScore += result.marksAwarded;

    await prisma.studentResponse.update({
      where: { id: response.id },
      data: {
        marksAwarded: result.marksAwarded,
        isCorrect: result.isCorrect,
        gradedAt: new Date(),
      },
    });
  }

  return totalScore;
}
