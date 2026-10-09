import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/ai/generate";
import { QuizConfig } from "@/types";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { config, files } = body;

    if (!config || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Combine all extracted text for the prompt
    // For large files, we might need a cap, but the prompt helper slices to 12000 chars anyway
    const combinedText = files
      .map((f: any) => f.extractedText)
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (!combinedText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the uploaded files to generate questions." },
        { status: 400 }
      );
    }

    // 1. Create the DRAFT Quiz in the database
    const quiz = await prisma.quiz.create({
      data: {
        teacherId: session.user.id,
        title: config.title,
        subject: config.subject,
        topic: config.topic,
        description: config.description || null,
        totalMarks: config.totalMarks,
        durationMinutes: config.durationMinutes,
        attemptsAllowed: config.attemptsAllowed,
        scoreStrategy: config.scoreStrategy,
        passMarkPercent: config.passMarkPercent,
        status: "DRAFT",
      },
    });

    // 2. Save Uploaded Materials
    if (files.length > 0) {
      const materialPromises = files.map((file: any) =>
        prisma.uploadedMaterial.create({
          data: {
            quizId: quiz.id,
            teacherId: session.user.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileUrl: file.fileUrl || "",
            extractedText: file.extractedText || null,
          }
        })
      );
      await Promise.all(materialPromises);
    }

    // 3. Generate Questions using AI
    const aiConfig: QuizConfig = {
      title: config.title,
      subject: config.subject,
      topic: config.topic,
      numberOfQuestions: config.numberOfQuestions,
      questionTypes: config.questionTypes,
      difficultyLevel: config.difficultyLevel,
      cognitiveLevels: config.cognitiveLevels.length > 0 ? config.cognitiveLevels : undefined,
      totalMarks: config.totalMarks
    };

    let generatedData;
    try {
      generatedData = await generateQuestions(combinedText, aiConfig);
    } catch (aiError: any) {
      console.error("AI Generation failed:", aiError);

      // Log the failure
      await prisma.aIGenerationLog.create({
        data: {
          quizId: quiz.id,
          provider: "unknown",
          promptUsed: "Generation attempt failed inside generator wrapper",
          status: "failed",
          rawResponse: aiError.message,
        }
      });

      return NextResponse.json(
        { error: "AI failed to generate questions. The draft quiz was saved, but without questions." },
        { status: 500 }
      );
    }

    // AI succeeded.
    // Log the success
    await prisma.aIGenerationLog.create({
      data: {
        quizId: quiz.id,
        provider: generatedData.provider,
        promptUsed: "System + User parameters",
        status: "success",
      }
    });

    // 4. Save Questions to DB
    const questionsToInsert = generatedData.questions.map((q, index) => {
      return prisma.question.create({
        data: {
          quizId: quiz.id,
          type: q.type,
          text: q.text,
          marks: q.marks,
          difficulty: q.difficulty,
          cognitiveLevel: q.cognitiveLevel,
          topicTag: q.topicTag,
          explanation: q.explanation,
          orderIndex: index,
          isApproved: false, // Teacher must review and approve
          // create Options if present
          ...(q.options && q.options.length > 0 ? {
             options: {
               create: q.options.map((opt, i) => ({
                 text: opt.text,
                 isCorrect: opt.isCorrect,
                 orderIndex: i
               }))
             }
          } : {}),
          // create Meta if present
          ...((q.correctAnswer || q.modelAnswer || q.rubric) ? {
            meta: {
              create: {
                correctAnswer: q.correctAnswer,
                tolerance: q.tolerance,
                modelAnswer: q.modelAnswer,
                rubric: q.rubric
              }
            }
          } : {})
        }
      });
    });

    await Promise.all(questionsToInsert);

    // Done. Return the new quiz ID so the frontend can redirect to the review page.
    return NextResponse.json({ success: true, quizId: quiz.id });

  } catch (error: any) {
    console.error("Quiz Generate API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during generation" },
      { status: 500 }
    );
  }
}