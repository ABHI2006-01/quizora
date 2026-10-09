"use client";

import React from "react";
import { CheckCircle2, Copy, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export default function Step5Publish({ quizCode, quizId }: { quizCode: string, quizId: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(quizCode);
    toast.success("Quiz code copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Published Successfully!</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        Your quiz is now live. Share the code below with your students so they can join and begin their attempt.
      </p>

      <Card className="w-full max-w-sm mb-8 bg-indigo-50 border-indigo-100">
        <CardContent className="p-6">
          <p className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2">Quiz Join Code</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-5xl font-black text-indigo-700 tracking-widest font-mono">
              {quizCode}
            </span>
            <Button variant="ghost" size="icon" onClick={handleCopy} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100">
              <Copy className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild variant="outline" size="lg">
          <Link href="/teacher/dashboard">
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
          <Link href={`/teacher/quiz/${quizId}/performance`}>
             View Performance <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
