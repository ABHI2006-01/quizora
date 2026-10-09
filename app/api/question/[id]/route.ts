import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, marks, difficulty, cognitiveLevel, explanation, topicTag, isApproved, options, meta } = body;

    // Verify ownership
    const question = await prisma.question.findUnique({
      where: { id: (await params).id },
      include: { quiz: true },
    });

    if (!question || question.quiz.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: (await params).id },
      data: {
        text: text !== undefined ? text : undefined,
        marks: marks !== undefined ? marks : undefined,
        difficulty: difficulty !== undefined ? difficulty : undefined,
        cognitiveLevel: cognitiveLevel !== undefined ? cognitiveLevel : undefined,
        explanation: explanation !== undefined ? explanation : undefined,
        topicTag: topicTag !== undefined ? topicTag : undefined,
        isApproved: isApproved !== undefined ? isApproved : undefined,

        // If options are provided, update them. The simplest way is to delete old and create new.
        ...(options ? {
          options: {
            deleteMany: {},
            create: options.map((opt: any, i: number) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              orderIndex: i
            }))
          }
        } : {}),

        // If meta is provided, update or create it.
        ...(meta !== undefined ? {
          meta: {
            upsert: {
              create: {
                correctAnswer: meta?.correctAnswer,
                tolerance: meta?.tolerance,
                modelAnswer: meta?.modelAnswer,
                rubric: meta?.rubric
              },
              update: {
                correctAnswer: meta?.correctAnswer,
                tolerance: meta?.tolerance,
                modelAnswer: meta?.modelAnswer,
                rubric: meta?.rubric
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

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error: any) {
    console.error("PUT Question API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const question = await prisma.question.findUnique({
      where: { id: (await params).id },
      include: { quiz: true },
    });

    if (!question || question.quiz.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Delete question
    await prisma.question.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Question API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}