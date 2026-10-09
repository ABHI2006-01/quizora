"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Edit, RefreshCw, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Step4Review({ quiz, questions, setQuestions, onPublish }: any) {
  const approvedCount = questions.filter((q: any) => q.isApproved).length;

  const toggleApproval = async (id: string, current: boolean) => {
    // Optimistic update
    setQuestions(questions.map((q: any) => q.id === id ? { ...q, isApproved: !current } : q));
    
    try {
      await fetch(`/api/question/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !current })
      });
    } catch (e) {
      // Revert if failed
      setQuestions(questions.map((q: any) => q.id === id ? { ...q, isApproved: current } : q));
    }
  };

  const deleteQuestion = async (id: string) => {
    setQuestions(questions.filter((q: any) => q.id !== id));
    await fetch(`/api/question/${id}`, { method: "DELETE" });
  };

  const regenerateQuestion = async (id: string) => {
    // simplified loading state
    const res = await fetch(`/api/question/${id}/regenerate`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ reason: "Needed better question" })
    });
    if (res.ok) {
      const data = await res.json();
      setQuestions(questions.map((q: any) => q.id === id ? data.question : q));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold text-slate-900">Review Questions</h2>
           <p className="text-slate-500">Approve at least 5 questions to publish.</p>
         </div>
         <div className="flex items-center gap-4">
           <Badge variant={approvedCount >= 5 ? "default" : "secondary"} className="text-sm py-1">
             {approvedCount} / {questions.length} Approved
           </Badge>
           <Button disabled={approvedCount < 5} onClick={onPublish} className="bg-indigo-600 hover:bg-indigo-700">
             Publish Quiz
           </Button>
         </div>
      </div>

      <div className="space-y-4">
        {questions.map((q: any) => (
          <div key={q.id} className={`p-4 border rounded-xl flex gap-4 ${q.isApproved ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
            <div className="pt-1 cursor-grab text-slate-400">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="mb-2">{q.type.replace("_", " ")}</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => toggleApproval(q.id, q.isApproved)}>
                    {q.isApproved ? <CheckCircle className="h-5 w-5 text-green-600" /> : <CheckCircle className="h-5 w-5 text-slate-300 hover:text-green-600" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => regenerateQuestion(q.id)}>
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)}>
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                  </Button>
                </div>
              </div>
              <p className="font-medium text-slate-900">{q.text}</p>
              
              {q.options && q.options.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {q.options.map((opt: any) => (
                    <li key={opt.id} className={`text-sm p-2 rounded-lg ${opt.isCorrect ? "bg-green-100 text-green-800 font-medium" : "bg-slate-50 text-slate-600 border"}`}>
                      {opt.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
