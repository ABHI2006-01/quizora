"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface QuestionPaletteProps {
  questions: any[];
  responses: any[]; // Using robust response matching
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function QuestionPalette({ questions, responses, currentIndex, onSelect }: QuestionPaletteProps) {

  const getStatus = (questionId: string) => {
    const r = responses.find((r) => r.questionId === questionId);
    if (!r) return "NOT_VISITED";
    if (r.isSkipped) return "SKIPPED";
    if (r.selectedOptions?.length > 0 || (r.answerText && r.answerText.trim() !== "")) return "ANSWERED";
    return "NOT_VISITED";
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Question Palette</h3>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
        {questions.map((q, index) => {
          const status = getStatus(q.id);
          const isCurrent = index === currentIndex;

          let bgColor = "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"; // NOT_VISITED
          if (status === "ANSWERED") bgColor = "bg-green-100 border-green-200 text-green-800 hover:bg-green-200";
          if (status === "SKIPPED") bgColor = "bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200";

          if (isCurrent) {
            bgColor = "bg-indigo-600 border-indigo-700 text-white shadow-md ring-2 ring-indigo-200 ring-offset-1";
          }

          return (
            <Button
              key={q.id}
              variant="outline"
              className={`h-10 w-10 p-0 font-medium transition-all ${bgColor}`}
              onClick={() => onSelect(index)}
            >
              {index + 1}
            </Button>
          );
        })}
      </div>

      <div className="mt-6 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
           <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
           Answered
        </div>
        <div className="flex items-center gap-2 text-slate-600">
           <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
           Skipped
        </div>
        <div className="flex items-center gap-2 text-slate-600">
           <div className="w-3 h-3 rounded bg-white border border-slate-200"></div>
           Not Visited (or Blank)
        </div>
      </div>
    </div>
  );
}