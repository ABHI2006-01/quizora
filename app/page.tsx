import Link from "next/link";
import { GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-indigo-100 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          <span className="text-2xl font-bold text-indigo-700 tracking-tight">Quizora</span>
        </div>
        <p className="text-sm text-slate-500 hidden sm:block">Generate. Assess. Improve.</p>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Quiz Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          Smarter Quizzes,<br />
          <span className="text-indigo-600">Better Learning</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mb-12">
          Upload your study material and let AI generate exam-ready questions in seconds.
          Evaluate, publish, and track student performance — all in one place.
        </p>

        {/* Login cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Teacher card */}
          <Card className="border-2 border-indigo-100 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">I&apos;m a Teacher</CardTitle>
              <CardDescription>
                Create quizzes, review AI-generated questions, and track student performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href="/teacher/login">Login as Teacher</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Link href="/teacher/register">Create Teacher Account</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Student card */}
          <Card className="border-2 border-violet-100 hover:border-violet-400 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3 group-hover:bg-violet-200 transition-colors">
                <GraduationCap className="h-6 w-6 text-violet-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">I&apos;m a Student</CardTitle>
              <CardDescription>
                Join quizzes with a code, answer questions, and track your topic-wise performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                <Link href="/student/login">Login as Student</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-violet-200 text-violet-700 hover:bg-violet-50">
                <Link href="/student/register">Create Student Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-sm text-slate-400">
          Trusted by educators · AI-evaluated · Secure & private
        </p>
      </section>
    </main>
  );
}
