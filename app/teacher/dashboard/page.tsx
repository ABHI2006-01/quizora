export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sparkles, BookOpen, Users, BarChart2, PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {session.user.name} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your quiz activity.</p>
      </div>

      {/* Quick stats placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Quizzes", value: "0", icon: Sparkles, color: "text-indigo-600 bg-indigo-100" },
          { label: "Published Quizzes", value: "0", icon: BookOpen, color: "text-green-600 bg-green-100" },
          { label: "Students Attempted", value: "0", icon: Users, color: "text-violet-600 bg-violet-100" },
          { label: "Avg. Score", value: "—", icon: BarChart2, color: "text-amber-600 bg-amber-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/teacher/quiz/new"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
      >
        <PlusCircle className="h-5 w-5" />
        Generate New Quiz
      </Link>
    </div>
  );
}
