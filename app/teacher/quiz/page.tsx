export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Edit, BarChart2, MoreVertical, Play, Clock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function MyQuizzesPage() {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  const quizzes = await prisma.quiz.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { attempts: true, questions: true } }
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Quizzes</h1>
          <p className="text-slate-500 mt-1">Manage your generated assessments and track performance.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/teacher/quiz/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Quiz
          </Link>
        </Button>
      </div>

      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input placeholder="Search quizzes..." className="pl-10" />
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
           <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
           <h3 className="text-xl font-medium text-slate-900 mb-2">No quizzes yet</h3>
           <p className="text-slate-500 mb-6">Create your first AI-generated quiz from your study materials.</p>
           <Button asChild>
             <Link href="/teacher/quiz/new">Generate Quiz</Link>
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={quiz.status === "PUBLISHED" ? "default" : quiz.status === "DRAFT" ? "secondary" : "outline"} className={quiz.status === "PUBLISHED" ? "bg-green-100 text-green-800" : ""}>
                    {quiz.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-1" title={quiz.title}>{quiz.title}</CardTitle>
                <div className="text-sm text-slate-500 line-clamp-1">{quiz.subject} • {quiz.topic}</div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1 text-slate-600">
                    <span className="flex items-center gap-1.5"><Play className="h-4 w-4 text-slate-400" /> Attempts: {quiz._count.attempts}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-slate-600">
                     <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" /> {quiz.durationMinutes} mins</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 pt-4 flex gap-2">
                {quiz.status === "PUBLISHED" ? (
                  <>
                    <Button asChild variant="outline" className="flex-1 bg-white">
                      <Link href={`/teacher/quiz/${quiz.id}/performance`}><BarChart2 className="mr-2 h-4 w-4" /> Reports</Link>
                    </Button>
                    <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 rounded-md font-mono text-sm tracking-widest text-indigo-700 font-bold">
                       {quiz.quizCode}
                    </div>
                  </>
                ) : (
                  <Button asChild variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href={`/teacher/quiz/${quiz.id}/review`}><Edit className="mr-2 h-4 w-4" /> Resume Review</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
