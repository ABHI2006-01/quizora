"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Step1Upload, { UploadedFile } from "./Step1Upload";
import Step2Configure, { QuizConfiguration } from "./Step2Configure";
import Step3Generating from "./Step3Generating";
import { Sparkles, ArrowLeft, Layers, UploadCloud, Settings, Eye, CheckCircle2 } from "lucide-react";

export default function WizardContainer() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [config, setConfig] = useState<QuizConfiguration>({
    title: "",
    subject: "",
    topic: "",
    description: "",
    durationMinutes: 30,
    attemptsAllowed: 1,
    scoreStrategy: "BEST",
    passMarkPercent: 40,
    numberOfQuestions: 10,
    totalMarks: 10,
    questionTypes: ["MCQ_SINGLE", "TRUE_FALSE"],
    difficultyLevel: "MIXED",
    cognitiveLevels: [],
  });

  const steps = [
    { id: 1, name: "Upload", icon: UploadCloud },
    { id: 2, name: "Configure", icon: Settings },
    { id: 3, name: "Generate", icon: Sparkles },
    { id: 4, name: "Review", icon: Eye },
    { id: 5, name: "Publish", icon: CheckCircle2 },
  ];

  const handleGenerationSuccess = (quizId: string) => {
    // Jump straight to the Review page (which will act as Step 4 & 5 sequentially)
    router.push(`/teacher/quiz/${quizId}/review`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Layers className="h-8 w-8 text-indigo-600" />
          Generate AI Quiz
        </h1>
        <p className="text-slate-500 mt-2">
          Transform your study materials into a comprehensive quiz intelligently.
        </p>
      </div>

      {/* Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0 pointer-events-none" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white
                    ${isCompleted ? "bg-indigo-600 border-indigo-600 text-white" :
                      isCurrent ? "border-indigo-600 text-indigo-600" :
                      "border-slate-300 text-slate-400"}`}
                >
                  <step.icon className={`h-5 w-5 ${isCompleted ? "text-white" : ""}`} />
                </div>
                <span className={`text-xs font-semibold mt-2 absolute top-12 whitespace-nowrap
                  ${isCurrent || isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-16">
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <Step1Upload
              files={files}
              setFiles={setFiles}
              onNext={() => setCurrentStep(2)}
            />
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <Step2Configure
              config={config}
              setConfig={setConfig}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
            />
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <Step3Generating
              files={files}
              config={config}
              onBack={() => setCurrentStep(2)}
              onSuccess={handleGenerationSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}