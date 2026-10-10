import { prisma } from "@/lib/prisma";
import { evaluateAnswer } from "@/lib/ai/evaluate";
import { updateFinalScore } from "./auto";

export async function evaluateAttemptSubjective(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: {
            include: { meta: true }
          }
        }
      }
    }
  });

  if (!attempt) throw new Error("Attempt not found");

  const subjectiveResponses = attempt.responses.filter(
    (r) => (r.question.type === "SHORT_ANSWER" || r.question.type === "DESCRIPTIVE") && !r.isSkipped && r.answerText
  );

  let newTotal = attempt.totalScore;

  for (const response of subjectiveResponses) {
    const q = response.question;
    try {
      const result = await evaluateAnswer(
        q.text,
        q.meta?.modelAnswer || "No model answer provided",
        q.meta?.rubric || null,
        response.answerText!,
        q.marks
      );

      newTotal += result.score;
      
      const isCorrect = result.score >= (q.marks * 0.5); // Threshold for partial credit marked as correct

      await prisma.studentResponse.update({
        where: { id: response.id },
        data: {
           marksAwarded: result.score,
           isCorrect,
           aiScore: result.score,
           aiConfidence: result.confidence,
           aiReasoning: result.reasoning,
           gradedAt: new Date()
        }
      });
    } catch (e) {
      console.error(`Subjective evaluation failed for response ${response.id}:`, e);
    }
  }

  // Update total score if it changed
  if (newTotal !== attempt.totalScore) {
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { totalScore: newTotal }
    });
    
    await updateFinalScore(attempt.quizId, attempt.studentId);
  }
}
