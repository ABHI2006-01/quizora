import { prisma } from "@/lib/prisma";
import { evaluateAnswer } from "@/lib/ai/evaluate";
import { updateFinalScore } from "./auto";
import { classifyAnswerWithML, getEnsembleScoreWithML } from "@/lib/ml";

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
      // 1. Get classical AI evaluation (Claude/Gemini) -> this serves as our "rule_score" component
      const aiResult = await evaluateAnswer(
        q.text,
        q.meta?.modelAnswer || "No model answer provided",
        q.meta?.rubric || null,
        response.answerText!,
        q.marks
      );

      // 2. Try the ML Microservice for semantic similarity and ensemble scoring (if running)
      let finalAssignedScore = aiResult.score;
      let finalReasoning = aiResult.reasoning;

      const classification = await classifyAnswerWithML(
        q.text, 
        q.meta?.modelAnswer || "", 
        response.answerText!
      );

      if (classification) {
        // We have ML signals! Let's pass them to the Ensemble endpoint
        // Keyword match ratio: simple heuristic (how many model answer words appear in student answer)
        const modelWords = new Set((q.meta?.modelAnswer || "").toLowerCase().split(/\s+/));
        const studentWords = new Set((response.answerText || "").toLowerCase().split(/\s+/));
        const matchCount = [...modelWords].filter(w => studentWords.has(w)).length;
        const kwRatio = modelWords.size > 0 ? matchCount / modelWords.size : 0;

        const ruleScoreNorm = q.marks > 0 ? aiResult.score / q.marks : 0;

        const ensemble = await getEnsembleScoreWithML(
          classification.similarity_score,
          kwRatio,
          ruleScoreNorm,
          q.marks
        );

        if (ensemble) {
           finalAssignedScore = ensemble.ensemble_final_score;
           finalReasoning += ` | [ML Ensemble Override applied based on Semantic Similarity: ${(classification.similarity_score*100).toFixed(1)}%]`;
        }
      }

      newTotal += finalAssignedScore;
      
      const isCorrect = finalAssignedScore >= (q.marks * 0.5);

      await prisma.studentResponse.update({
        where: { id: response.id },
        data: {
           marksAwarded: finalAssignedScore,
           isCorrect,
           aiScore: aiResult.score, // Base AI score
           aiConfidence: aiResult.confidence,
           aiReasoning: finalReasoning,
           gradedAt: new Date()
        }
      });
    } catch (e) {
      console.error(`Subjective evaluation failed for response ${response.id}:`, e);
    }
  }

  if (newTotal !== attempt.totalScore) {
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { totalScore: newTotal }
    });
    
    await updateFinalScore(attempt.quizId, attempt.studentId);
  }
}
