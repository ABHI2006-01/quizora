export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewQuizClient from "./ReviewQuizClient";

export default async function ReviewQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  const quizId = (await params).id;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, teacherId: session.user.id },
    include: {
      questions: {
        include: { options: true, meta: true },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!quiz) redirect("/teacher/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <ReviewQuizClient initialQuiz={quiz} initialQuestions={quiz.questions} />
    </div>
  );
}