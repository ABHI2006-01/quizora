"use client";

import React, { useState } from "react";
import Step4Review from "@/components/teacher/GenerateWizard/Step4Review";
import Step5Publish from "@/components/teacher/GenerateWizard/Step5Publish";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReviewQuizClient({ initialQuiz, initialQuestions }: { initialQuiz: any, initialQuestions: any[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [published, setPublished] = useState(initialQuiz.status === "PUBLISHED");
  const [quizCode, setQuizCode] = useState(initialQuiz.quizCode || "");
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/quiz/${initialQuiz.id}/publish`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      
      setQuizCode(data.quizCode);
      setPublished(true);
      toast.success("Quiz published successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (published) {
    return <Step5Publish quizCode={quizCode} quizId={initialQuiz.id} />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 mb-20 animate-in fade-in">
      <div className="mb-6">
        <Button asChild variant="ghost" className="pl-0 text-slate-500 hover:text-slate-900 mb-4">
           <Link href="/teacher/dashboard">
             <ArrowLeft className="mr-2 h-4 w-4" /> Exit to Dashboard
           </Link>
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">{initialQuiz.title}</h1>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <Step4Review 
          quiz={initialQuiz} 
          questions={questions} 
          setQuestions={setQuestions} 
          onPublish={handlePublish} 
        />
      </div>
    </div>
  );
}
