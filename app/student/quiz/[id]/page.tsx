export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuizInterfaceClient from "./QuizInterfaceClient";

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const quizId = (await params).id;

  // Retrieve the quiz with questions and active attempt
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, status: "PUBLISHED" },
    include: {
      questions: {
        include: {
          options: {
             select: { id: true, text: true, orderIndex: true } // Omit isCorrect so it's not sent to client
          }
        },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!quiz) redirect("/student/dashboard");

  // Get active attempt
  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      quizId,
      studentId: session.user.id,
      status: "IN_PROGRESS"
    },
    include: {
      responses: true
    }
  });

  if (!attempt) {
    // If no active attempt, they shouldn't bypass the start screen.
    // They must click "Start" from the Join screen.
    redirect("/student/join");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* We pass the full quiz and the attempt to the client component that manages timer, state, autosave */}
      <QuizInterfaceClient
        quiz={quiz}
        initialAttempt={attempt}
        initialResponses={attempt.responses}
      />
    </div>
  );
}