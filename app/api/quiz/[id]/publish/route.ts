import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueQuizCode } from "@/lib/quiz";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership and check approved questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: (await params).id },
      include: {
        questions: {
          where: { isApproved: true }
        }
      },
    });

    if (!quiz || quiz.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    if (quiz.questions.length < 5) {
      return NextResponse.json(
        { error: `You must approve at least 5 questions to publish a quiz. Currently approved: ${quiz.questions.length}` },
        { status: 400 }
      );
    }

    if (quiz.status === "PUBLISHED" && quiz.quizCode) {
      // Already published
      return NextResponse.json({ success: true, quizCode: quiz.quizCode });
    }

    // Generate code and publish
    const quizCode = await generateUniqueQuizCode();

    const updatedQuiz = await prisma.quiz.update({
      where: { id: (await params).id },
      data: {
        status: "PUBLISHED",
        quizCode
      }
    });

    return NextResponse.json({ success: true, quizCode: updatedQuiz.quizCode });
  } catch (error: any) {
    console.error("Publish Quiz API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}