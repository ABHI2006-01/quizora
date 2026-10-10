export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Target, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const quizId = (await params).id;

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
        include: { question: true }
      }
    }
  });

  if (!attempt) redirect(`/student/join`);

  const { quiz, responses, totalScore, timeTakenSeconds } = attempt;

  // Basic stats
  const totalMarks = quiz.totalMarks;
  const percentage = (totalScore / totalMarks) * 100;
  const isPass = percentage >= quiz.passMarkPercent;

  const correctCount = responses.filter(r => r.isCorrect).length;
  const incorrectCount = responses.filter(r => r.isCorrect === false && !r.isSkipped).length;
  const skippedCount = responses.filter(r => r.isSkipped).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-900">{quiz.title} - Results</h1>
            <Button asChild variant="outline">
              <Link href="/student/dashboard"><Home className="mr-2 h-4 w-4"/> Dashboard</Link>
            </Button>
        </div>

        <Card className="text-center py-10 border-indigo-100 shadow-sm relative overflow-hidden">
          {/* Confetti element proxy */}
          {isPass && <div className="absolute inset-0 bg-green-50 z-0 opacity-50 pointer-events-none" />}

          <CardContent className="relative z-10">
            <Badge variant={isPass ? "default" : "destructive"} className={`mb-6 text-sm px-4 py-1 ${isPass ? 'bg-green-500 hover:bg-green-600' : ''}`}>
              {isPass ? "PASSED" : "FAILED"}
            </Badge>

            <div className="flex justify-center items-end gap-2 mb-2">
              <span className="text-7xl font-black text-slate-900 tracking-tighter">{Math.round(totalScore)}</span>
              <span className="text-3xl font-bold text-slate-400 mb-2">/ {totalMarks}</span>
            </div>

            <p className="text-slate-500 text-lg font-medium mb-8">Score: {percentage.toFixed(1)}%</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <Target className="h-5 w-5 text-indigo-500 mb-2 mx-auto" />
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Accuracy</p>
                  <p className="text-xl font-bold text-slate-900">{Math.round((correctCount / (correctCount + incorrectCount)) * 100 || 0)}%</p>
               </div>
               <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mb-2 mx-auto" />
                  <p className="text-xs text-green-700 uppercase font-semibold tracking-wider">Correct</p>
                  <p className="text-xl font-bold text-green-900">{correctCount}</p>
               </div>
               <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <XCircle className="h-5 w-5 text-red-500 mb-2 mx-auto" />
                  <p className="text-xs text-red-700 uppercase font-semibold tracking-wider">Incorrect</p>
                  <p className="text-xl font-bold text-red-900">{incorrectCount}</p>
               </div>
               <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <Clock className="h-5 w-5 text-slate-500 mb-2 mx-auto" />
                  <p className="text-xs text-slate-600 uppercase font-semibold tracking-wider">Time</p>
                  <p className="text-xl font-bold text-slate-900">{Math.floor((timeTakenSeconds||0)/60)}m {(timeTakenSeconds||0)%60}s</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Simplified Detailed Results List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Detailed Breakdown</h2>
          {responses.map((resp, i) => (
            <Card key={resp.id} className={resp.isCorrect ? "border-green-200 bg-green-50/30" : resp.isCorrect === false ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-slate-50/30"}>
               <CardContent className="p-4 flex gap-4">
                 <div className="shrink-0 flex items-start">
                   {resp.isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : resp.isCorrect === false ? <XCircle className="h-6 w-6 text-red-500" /> : <div className="h-6 w-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-500">-</div>}
                 </div>
                 <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1"><span className="text-slate-500 text-sm mr-2">Q{i+1}</span> {resp.question.text}</p>
                    <div className="flex flex-wrap gap-4 text-sm mt-3">
                       <div className="bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm text-slate-700 font-medium">
                         <span className="text-slate-400 text-xs uppercase mr-2 tracking-wider">Your Ans</span>
                         {resp.selectedOptions?.join(", ") || resp.answerText || (resp.isSkipped ? "Skipped" : "None")}
                       </div>
                       <div className="text-slate-500 px-3 py-1.5">
                         {resp.marksAwarded} / {resp.question.marks} marks
                       </div>
                    </div>
                 </div>
               </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}