import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateFinalScore } from "@/lib/grading/auto";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const responseId = (await params).id;
    const body = await req.json();
    const { teacherOverrideScore, teacherOverrideNote } = body;

    if (teacherOverrideScore < 0) {
      return NextResponse.json({ error: "Score cannot be negative" }, { status: 400 });
    }

    const studentResponse = await prisma.studentResponse.findUnique({
      where: { id: responseId },
      include: {
        attempt: {
          include: { quiz: true }
        }
      }
    });

    if (!studentResponse) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    if (studentResponse.attempt.quiz.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const previousMarks = studentResponse.marksAwarded;

    await prisma.studentResponse.update({
      where: { id: responseId },
      data: {
        teacherOverrideScore,
        teacherOverrideNote,
        marksAwarded: teacherOverrideScore,
        isCorrect: teacherOverrideScore > 0 // Optional logic depending on maxMarks
      }
    });

    // Update attempt total score
    const newTotal = studentResponse.attempt.totalScore - previousMarks + teacherOverrideScore;

    await prisma.quizAttempt.update({
      where: { id: studentResponse.attemptId },
      data: { totalScore: newTotal }
    });

    await updateFinalScore(studentResponse.attempt.quizId, studentResponse.attempt.studentId);

    return NextResponse.json({ success: true, newTotal });

  } catch (error: any) {
    console.error("Override API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}