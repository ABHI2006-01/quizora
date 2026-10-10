"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BarChart2, CheckCircle2, TrendingUp, TrendingDown, Clock, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function PerformancePageClient({ quiz, initialData }: { quiz: any, initialData: any }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");

  const filteredStudents = data.students.filter((s: any) =>
     s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 mb-20 animate-in fade-in">
      <div className="mb-8">
        <Button asChild variant="ghost" className="pl-0 text-slate-500 hover:text-slate-900 mb-4">
           <Link href="/teacher/quiz">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
           </Link>
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">{quiz.title}</h1>
        <p className="text-slate-500 mt-1">Class performance and analytics.</p>
      </div>

      {data.stats.totalStudents === 0 ? (
         <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            No submissions yet. Share the code <strong className="text-slate-900 font-mono tracking-widest bg-slate-100 px-2 py-1 rounded">{quiz.quizCode}</strong> with your students to get started.
         </div>
      ) : (
         <>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
             <Card className="border-slate-200 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-medium text-slate-500 mb-1">Submissions</p>
                     <p className="text-3xl font-bold text-slate-900">{data.stats.totalStudents}</p>
                   </div>
                   <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Users className="h-5 w-5" /></div>
                 </div>
               </CardContent>
             </Card>
             <Card className="border-slate-200 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-medium text-slate-500 mb-1">Avg Score</p>
                     <p className="text-3xl font-bold text-slate-900">
                       {Math.round(data.stats.averageScore)}
                       <span className="text-lg font-semibold text-slate-400">/{quiz.totalMarks}</span>
                     </p>
                   </div>
                   <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><BarChart2 className="h-5 w-5" /></div>
                 </div>
               </CardContent>
             </Card>
             <Card className="border-slate-200 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-medium text-slate-500 mb-1">High Score</p>
                     <p className="text-3xl font-bold text-green-600">{data.stats.highestScore}</p>
                   </div>
                   <div className="bg-green-50 p-2 rounded-lg text-green-600"><TrendingUp className="h-5 w-5" /></div>
                 </div>
               </CardContent>
             </Card>
             <Card className="border-slate-200 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-medium text-slate-500 mb-1">Pass Rate</p>
                     <p className="text-3xl font-bold text-slate-900">{Math.round(data.stats.passPercentage)}%</p>
                   </div>
                   <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                 </div>
               </CardContent>
             </Card>
           </div>

           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="border-b bg-slate-50/50 pb-4">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <CardTitle className="text-lg">Student Leaderboard</CardTitle>
                 <div className="relative w-full sm:w-64 border border-input rounded-md overflow-hidden bg-white">
                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <input
                      type="text"
                      placeholder="Search name or roll..."
                      className="w-full bg-transparent w-full h-9 pl-9 pr-3 text-sm focus:outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                   />
                 </div>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-500 uppercase bg-white border-b">
                     <tr>
                       <th className="px-6 py-4 font-semibold">Rank</th>
                       <th className="px-6 py-4 font-semibold">Student Name</th>
                       <th className="px-6 py-4 font-semibold">Roll No.</th>
                       <th className="px-6 py-4 font-semibold text-right">Score</th>
                       <th className="px-6 py-4 font-semibold text-center">%</th>
                       <th className="px-6 py-4 font-semibold text-right">Time Taken</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredStudents.map((s: any, idx: number) => (
                       <tr key={s.attemptId} className="bg-white border-b hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-medium text-slate-900">#{idx + 1}</td>
                         <td className="px-6 py-4 font-medium text-indigo-700">{s.name}</td>
                         <td className="px-6 py-4 text-slate-500 font-mono">{s.rollNumber}</td>
                         <td className="px-6 py-4 font-semibold text-slate-900 text-right">{s.score}</td>
                         <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${s.percentage >= quiz.passMarkPercent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {Math.round(s.percentage)}%
                            </span>
                         </td>
                         <td className="px-6 py-4 text-slate-500 text-right">
                           <span className="flex items-center justify-end gap-1.5"><Clock className="h-3 w-3" /> {Math.floor((s.timeTakenSeconds||0)/60)}m {(s.timeTakenSeconds||0)%60}s</span>
                         </td>
                       </tr>
                     ))}
                     {filteredStudents.length === 0 && (
                       <tr>
                         <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No students match your search.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </CardContent>
           </Card>
         </>
      )}
    </div>
  );
}