"use client";

import React, { useState } from "react";
import Step1Upload, { UploadedFile } from "./Step1Upload";
import { Sparkles, ArrowLeft, Layers, UploadCloud, Settings, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WizardContainer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const steps = [
    { id: 1, name: "Upload", icon: UploadCloud },
    { id: 2, name: "Configure", icon: Settings },
    { id: 3, name: "Generate", icon: Sparkles },
    { id: 4, name: "Review", icon: Eye },
    { id: 5, name: "Publish", icon: CheckCircle2 },
  ];

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
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                    ${isCompleted ? "bg-indigo-600 border-indigo-600 text-white" : 
                      isCurrent ? "bg-white border-indigo-600 text-indigo-600" : 
                      "bg-white border-slate-300 text-slate-400"}`}
                >
                  <step.icon className={`h-5 w-5 ${isCompleted ? "text-white" : ""}`} />
                </div>
                <span className={`text-xs font-semibold mt-2 absolute top-12
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

        {/* Step 2 (Placeholder) */}
        {currentStep === 2 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-900">Configure Quiz (Coming in Phase 5)</h2>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-8 text-center rounded-xl">
              <p className="text-slate-500 mb-4">You have successfully uploaded {files.filter(f => f.status === "success").length} file(s).</p>
              <Button onClick={() => setCurrentStep(1)}>Go Back to Upload</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
