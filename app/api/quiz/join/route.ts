import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateQuizCode } from "@/lib/quiz";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json({ error: "Invalid quiz code." }, { status: 400 });
    }

    const quiz = await validateQuizCode(code.trim().toUpperCase());

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found or not currently active." }, { status: 404 });
    }

    // Check attempts
    const attempts = await prisma.quizAttempt.count({
      where: {
        quizId: quiz.id,
        studentId: session.user.id
      }
    });

    if (attempts >= quiz.attemptsAllowed && quiz.attemptsAllowed > 0) {
      return NextResponse.json({
        error: `You have reached the maximum allowed attempts (${quiz.attemptsAllowed}) for this quiz.`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        description: quiz.description,
        totalMarks: quiz.totalMarks,
        durationMinutes: quiz.durationMinutes,
        attemptsAllowed: quiz.attemptsAllowed,
        previousAttempts: attempts,
        teacherName: (quiz as any).teacher?.name,
        questionCount: (quiz as any)._count?.questions
      }
    });

  } catch (error: any) {
    console.error("Quiz Join API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}