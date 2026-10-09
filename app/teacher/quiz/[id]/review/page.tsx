export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ReviewQuizPage({
  params,
}: {
  params: { id: string };
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  const quizId = params.id;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, teacherId: session.user.id },
    include: { questions: true }
  });

  if (!quiz) redirect("/teacher/dashboard");

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Generated Quiz</h1>
      <p className="text-slate-500 mb-8">Generated successfully. Review coming in Phase 6.</p>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-xl font-semibold mb-4">{quiz.title}</h2>
        <p className="text-sm text-slate-600 mb-6">Generated {quiz.questions.length} questions.</p>
        
        <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(quiz.questions, null, 2)}
        </pre>
      </div>
    </div>
  );
}
