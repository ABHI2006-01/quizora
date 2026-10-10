import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubmissionValid } from "@/lib/timer";
import { gradeAttempt } from "@/lib/grading/auto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizId = (await params).id;
    const body = await req.json();
    const { attemptId, responses, autoSubmit } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID required" }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt || attempt.studentId !== session.user.id || attempt.quizId !== quizId) {
       return NextResponse.json({ error: "Attempt not found or unauthorized" }, { status: 404 });
    }

    if (attempt.status !== "IN_PROGRESS") {
       return NextResponse.json({ error: "Attempt is already submitted or closed." }, { status: 400 });
    }

    const submittedAt = new Date();

    // Verify time constraint (server-side check)
    // isSubmissionValid includes a 10 second grace period
    const isValid = isSubmissionValid(submittedAt, attempt.expiresAt);
    if (!autoSubmit && !isValid) {
       // If it's expired and not an auto-submit triggered by the client timer, we still accept it but flag as AUTO_SUBMITTED
       console.warn(`Late submission for attempt ${attemptId}. Forcing AUTO_SUBMITTED.`);
    }

    const finalStatus = autoSubmit ? "AUTO_SUBMITTED" : (!isValid ? "AUTO_SUBMITTED" : "SUBMITTED");

    // Calculate time taken
    const timeTakenSeconds = Math.max(0, Math.floor((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000));

    // Save final responses
    if (responses && Array.isArray(responses)) {
      for (const r of responses) {
        const existingResponse = await prisma.studentResponse.findFirst({
          where: { attemptId: attempt.id, questionId: r.questionId }
        });

        if (existingResponse) {
           await prisma.studentResponse.update({
             where: { id: existingResponse.id },
             data: {
               selectedOptions: r.selectedOptions || [],
               answerText: r.answerText || null,
               isSkipped: r.isSkipped || false
             }
           });
        } else {
           await prisma.studentResponse.create({
             data: {
               attemptId: attempt.id,
               questionId: r.questionId,
               selectedOptions: r.selectedOptions || [],
               answerText: r.answerText || null,
               isSkipped: r.isSkipped || false
             }
           });
        }
      }
    }

    // Mark as submitted
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: finalStatus,
        submittedAt,
        timeTakenSeconds
      }
    });

    // Fire-and-forget background grading for auto-gradable questions
    gradeAttempt(attempt.id).catch(err => {
      console.error(`Failed to auto-grade attempt ${attempt.id}:`, err);
    });

    return NextResponse.json({ success: true, attemptId: attempt.id });

  } catch (error: any) {
    console.error("Quiz Submit API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}