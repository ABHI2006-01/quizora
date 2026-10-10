import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt } from "@/lib/timer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizId = (await params).id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, status: "PUBLISHED" },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found or not currently active." }, { status: 404 });
    }

    // Check for any IN_PROGRESS attempt
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: session.user.id,
        status: "IN_PROGRESS"
      },
      include: {
        responses: true
      }
    });

    if (existingAttempt) {
      // Resume existing attempt
      return NextResponse.json({ success: true, attempt: existingAttempt, resumed: true });
    }

    // Check if new attempt is allowed
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        quizId,
        studentId: session.user.id
      }
    });

    if (attemptCount >= quiz.attemptsAllowed && quiz.attemptsAllowed > 0) {
      return NextResponse.json({ error: `Maximum attempts (${quiz.attemptsAllowed}) reached.` }, { status: 403 });
    }

    // Start new attempt
    const startedAt = new Date();
    const expiresAt = computeExpiresAt(startedAt, quiz.durationMinutes);

    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: session.user.id,
        attemptNumber: attemptCount + 1,
        startedAt,
        expiresAt,
        status: "IN_PROGRESS"
      },
      include: {
        responses: true
      }
    });

    return NextResponse.json({ success: true, attempt: newAttempt, resumed: false });

  } catch (error: any) {
    console.error("Quiz Start API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}