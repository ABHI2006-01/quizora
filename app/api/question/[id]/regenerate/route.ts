import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { regenerateQuestion } from "@/lib/ai/generate";
import type { QuizConfig } from "@/types";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reason } = body;

    // Verify ownership and get the contextual information needed
    const question = await prisma.question.findUnique({
      where: { id: (await params).id },
      include: {
        quiz: {
          include: { materials: true }
        }
      },
    });

    if (!question || question.quiz.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const combinedText = question.quiz.materials
      .map((m) => m.extractedText)
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (!combinedText.trim()) {
      return NextResponse.json({ error: "No study material found to regenerate question." }, { status: 400 });
    }

    // Reconstruct a strict QuizConfig for generation (dummy properties for unrelated fields)
    const config: QuizConfig = {
      title: question.quiz.title,
      subject: question.quiz.subject,
      topic: question.quiz.topic,
      numberOfQuestions: 1,
      questionTypes: [question.type],
      difficultyLevel: question.difficulty,
      totalMarks: question.marks
    };

    const result = await regenerateQuestion(combinedText, config, question.type, reason);

    const q = result.question;

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: (await params).id },
      data: {
        text: q.text,
        marks: q.marks,
        difficulty: q.difficulty,
        cognitiveLevel: q.cognitiveLevel,
        topicTag: q.topicTag,
        explanation: q.explanation,
        isApproved: false,
        ...(q.options && q.options.length > 0 ? {
          options: {
            deleteMany: {},
            create: q.options.map((opt, i) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              orderIndex: i
            }))
          }
        } : {}),
        ...((q.correctAnswer || q.modelAnswer || q.rubric) ? {
          meta: {
            upsert: {
              create: {
                correctAnswer: q.correctAnswer,
                tolerance: q.tolerance,
                modelAnswer: q.modelAnswer,
                rubric: q.rubric
              },
              update: {
                correctAnswer: q.correctAnswer,
                tolerance: q.tolerance,
                modelAnswer: q.modelAnswer,
                rubric: q.rubric
              }
            }
          }
        } : {})
      },
      include: {
        options: true,
        meta: true
      }
    });

    // Log the success
    await prisma.aIGenerationLog.create({
      data: {
        quizId: question.quizId,
        provider: result.provider,
        promptUsed: `Regenerate question ${question.id}. Reason: ${reason || "none"}`,
        status: "success",
      }
    });

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error: any) {
    console.error("Regenerate Question API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}