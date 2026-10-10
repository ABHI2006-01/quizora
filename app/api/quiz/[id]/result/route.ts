import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizId = (await params).id;

    // Get the final or latest attempt for this quiz and student
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: session.user.id,
        status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
      },
      orderBy: [
        { isFinal: "desc" },
        { startedAt: "desc" }
      ],
      include: {
        quiz: true,
        responses: {
          include: {
            question: {
              include: { options: true, meta: true }
            }
          },
          orderBy: { question: { orderIndex: "asc" } }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "No completed attempt found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, attempt });

  } catch (error: any) {
    console.error("Result API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}