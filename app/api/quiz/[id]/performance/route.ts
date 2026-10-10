import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizId = (await params).id;

    // Must be owner
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, teacherId: session.user.id }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get all SUBMITTED attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
        isFinal: true // Only count the final scores per student according to strategy
      },
      include: {
        student: {
           include: { studentProfile: true }
        }
      },
      orderBy: { totalScore: "desc" }
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalStudents: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passPercentage: 0
        },
        students: []
      });
    }

    const scores = attempts.map(a => a.totalScore);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passCount = scores.filter(s => (s / quiz.totalMarks) * 100 >= quiz.passMarkPercent).length;

    const stats = {
      totalStudents: attempts.length, // representing submitted final attempts
      averageScore,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passPercentage: (passCount / attempts.length) * 100
    };

    // Flatten for student table
    const students = attempts.map(a => ({
      attemptId: a.id,
      studentId: a.studentId,
      name: a.student.name,
      rollNumber: a.student.studentProfile?.rollNumber || "Unknown",
      score: a.totalScore,
      percentage: (a.totalScore / quiz.totalMarks) * 100,
      timeTakenSeconds: a.timeTakenSeconds,
      submittedAt: a.submittedAt
    }));

    return NextResponse.json({ success: true, stats, students });

  } catch (error: any) {
    console.error("Teacher Performance API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}