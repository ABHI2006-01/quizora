"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadedFile } from "./Step1Upload";
import type { QuizConfiguration } from "./Step2Configure";

interface Step3GeneratingProps {
  files: UploadedFile[];
  config: QuizConfiguration;
  onSuccess: (quizId: string) => void;
  onBack: () => void;
}

export default function Step3Generating({ files, config, onSuccess, onBack }: Step3GeneratingProps) {
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const PHASES = [
    "Compiling configuration...",
    "Sending documents to AI...",
    "Analyzing study material...",
    "Generating questions...",
    "Saving draft to database..."
  ];

  useEffect(() => {
    let isMounted = true;

    // Animate through phases visually while waiting for API
    const phaseInterval = setInterval(() => {
      setPhase(p => p < PHASES.length - 1 ? p + 1 : p);
    }, 2500);

    const generateQuiz = async () => {
      try {
        const response = await fetch("/api/quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config,
            files: files.filter(f => f.status === "success" && f.extractedText)
          }),
        });

        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate quiz");
        }

        // Complete animation immediately
        clearInterval(phaseInterval);
        setPhase(PHASES.length - 1);

        // Wait 1 second before transitioning
        setTimeout(() => {
          if (isMounted) onSuccess(data.quizId);
        }, 1000);

      } catch (err: any) {
        if (isMounted) {
          clearInterval(phaseInterval);
          setError(err.message || "An unexpected error occurred");
        }
      }
    };

    generateQuiz();

    return () => {
      isMounted = false;
      clearInterval(phaseInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-500">

      {!error ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-200 blur-xl opacity-50 rounded-full animate-pulse" />
            <div className="bg-indigo-600 p-6 rounded-3xl relative z-10 shadow-xl shadow-indigo-200">
              <Sparkles className="h-12 w-12 text-white animate-pulse" />
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-sm border border-slate-100">
              <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-2">Generating your Quiz</h2>
          <p className="text-slate-500 text-center max-w-md mb-8">
            Our AI is reading your materials and crafting high-quality questions based on your specifications.
          </p>

          <div className="w-full max-w-sm space-y-4">
            {PHASES.map((p, i) => {
              const isActive = phase === i;
              const isPast = phase > i;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-opacity duration-500
                    ${isPast ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-30'}`}
                >
                  {isPast ? (
                     <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isActive ? (
                     <Loader2 className="h-5 w-5 text-indigo-500 animate-spin shrink-0" />
                  ) : (
                     <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                    {p}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="bg-red-100 p-6 rounded-full inline-block mb-6">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Generation Failed</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">{error}</p>
          <Button onClick={onBack} variant="outline" size="lg">Review Configuration</Button>
        </div>
      )}
    </div>
  );
}