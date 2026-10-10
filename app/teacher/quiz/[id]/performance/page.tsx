export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PerformancePageClient from "@/components/teacher/PerformancePageClient";

export default async function TeacherPerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  const quizId = (await params).id;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, teacherId: session.user.id }
  });

  if (!quiz) redirect("/teacher/dashboard");

  // Fetch initial data exactly like the API
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId,
      status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
      isFinal: true
    },
    include: {
      student: { include: { studentProfile: true } }
    },
    orderBy: { totalScore: "desc" }
  });

  const scores = attempts.map(a => a.totalScore);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const passCount = scores.filter(s => (s / quiz.totalMarks) * 100 >= quiz.passMarkPercent).length;

  const initialData = {
    stats: Object.keys(attempts).length > 0 ? {
      totalStudents: attempts.length,
      averageScore,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passPercentage: (passCount / attempts.length) * 100
    } : { totalStudents: 0, averageScore: 0, highestScore: 0, lowestScore: 0, passPercentage: 0 },
    students: attempts.map(a => ({
      attemptId: a.id,
      studentId: a.studentId,
      name: a.student.name,
      rollNumber: a.student.studentProfile?.rollNumber || "Unknown",
      score: a.totalScore,
      percentage: (a.totalScore / quiz.totalMarks) * 100,
      timeTakenSeconds: a.timeTakenSeconds,
      submittedAt: a.submittedAt
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <PerformancePageClient quiz={quiz} initialData={initialData} />
    </div>
  );
}