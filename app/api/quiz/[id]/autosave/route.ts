import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizId = (await params).id;
    const body = await req.json();
    const { attemptId, responses } = body;

    if (!attemptId || !responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify attempt belongs to user and is IN_PROGRESS
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt || attempt.studentId !== session.user.id || attempt.quizId !== quizId) {
       return NextResponse.json({ error: "Attempt not found or unauthorized" }, { status: 404 });
    }

    if (attempt.status !== "IN_PROGRESS") {
       return NextResponse.json({ error: "Attempt is already submitted or closed." }, { status: 400 });
    }

    // Bulk upsert responses
    // Prisma does not have a direct bulk upsert, so we loop over the responses.
    // This is autosave, so it shouldn't hold a massive array, mostly just the currently modified ones if optimized,
    // or the full array if small. We will handle full array safely with a transaction.
    const upserts = responses.map((r: any) =>
      prisma.studentResponse.upsert({
        where: {
          id: r.responseId || "new-dummy-id", // Prisma issue: upsert requires unique where, but we don't naturally have a unique per (attemptId, questionId).
          // Wait! We don't have @@unique([attemptId, questionId]) on StudentResponse in schema.
          // Since we might not have it, let's just find first or create.
        },
        create: {
          attemptId: attempt.id,
          questionId: r.questionId,
          selectedOptions: r.selectedOptions || [],
          answerText: r.answerText || null,
          isSkipped: r.isSkipped || false
        },
        update: {
          selectedOptions: r.selectedOptions || [],
          answerText: r.answerText || null,
          isSkipped: r.isSkipped || false
        }
      })
    );

    // This won't work cleanly because we don't have `responseId` uniquely from the client necessarily unless we pass it.
    // Instead, since it's autosave... let's just update based on questionId manually.
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

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error("Quiz Autosave API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}