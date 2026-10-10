"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import Timer from "@/components/student/QuizInterface/Timer";
import QuestionPalette from "@/components/student/QuizInterface/QuestionPalette";
import SubmitDialog from "@/components/student/QuizInterface/SubmitDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function QuizInterfaceClient({ quiz, initialAttempt, initialResponses }: { quiz: any; initialAttempt: any, initialResponses: any[] }) {
  const router = useRouter();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>(initialResponses || []);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);

  // Derive current question
  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  // Helper to find response
  const currentResponse = responses.find((r) => r.questionId === currentQuestion?.id) || {
    questionId: currentQuestion?.id,
    selectedOptions: [],
    answerText: "",
    isSkipped: false
  };

  // Sync back to array
  const updateResponse = (updates: any) => {
    setResponses((prev) => {
      const exists = prev.find((r) => r.questionId === updates.questionId);
      if (exists) {
        return prev.map((r) => (r.questionId === updates.questionId ? { ...r, ...updates } : r));
      }
      return [...prev, updates];
    });
  };

  // Auto-save logic (every 30 seconds if changes)
  const lastSavedLength = useRef(responses.length);
  useEffect(() => {
    const interval = setInterval(() => {
       // Simple heuristic: just push current state
       if (responses.length > 0) {
         saveResponses();
       }
    }, 30000);
    return () => clearInterval(interval);
  }, [responses]);

  const saveResponses = async () => {
    setIsAutosaving(true);
    try {
      await fetch(`/api/quiz/${quiz.id}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: initialAttempt.id,
          responses
        })
      });
      console.log("Autosaved at", new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Autosave failed", e);
    } finally {
      setIsAutosaving(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(idx => idx + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(idx => idx - 1);
  };

  const handleSkip = () => {
    updateResponse({ ...currentResponse, isSkipped: true });
    handleNext();
  };

  const handleClear = () => {
    updateResponse({ ...currentResponse, selectedOptions: [], answerText: "", isSkipped: false });
  };

  const finalizeSubmission = async (autoSubmit: boolean = false) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: initialAttempt.id,
          responses,
          autoSubmit
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(autoSubmit ? "Time's up! Quiz auto-submitted." : "Quiz submitted successfully.");
      router.push(`/student/quiz/${quiz.id}/result`);

    } catch (e: any) {
      toast.error(e.message);
      setIsSubmitting(false); // only re-enable if failed
    }
  };

  if (!currentQuestion) return <div>Loading...</div>;

  // Render proper input
  const renderInput = () => {
    const type = currentQuestion.type;

    if (type === "MCQ_SINGLE" || type === "TRUE_FALSE") {
      return (
        <RadioGroup
          value={currentResponse.selectedOptions[0] || ""}
          onValueChange={(val) => updateResponse({ ...currentResponse, selectedOptions: [val], isSkipped: false })}
          className="space-y-3 mt-6"
        >
          {currentQuestion.options?.map((opt: any) => (
            <div key={opt.id} className="flex items-center space-x-3 bg-white border border-slate-200 p-4 rounded-xl hover:border-violet-300 transition-colors">
              <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
              <label htmlFor={`opt-${opt.id}`} className="text-slate-700 text-sm font-medium leading-none cursor-pointer flex-1">
                {opt.text}
              </label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (type === "MCQ_MULTIPLE") {
      return (
        <div className="space-y-3 mt-6">
          {currentQuestion.options?.map((opt: any) => {
            const isChecked = currentResponse.selectedOptions.includes(opt.id);
            return (
              <div key={opt.id} className="flex items-center space-x-3 bg-white border border-slate-200 p-4 rounded-xl hover:border-violet-300 transition-colors">
                <Checkbox
                  id={`opt-${opt.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const newOpts = checked
                      ? [...currentResponse.selectedOptions, opt.id]
                      : currentResponse.selectedOptions.filter((o: string) => o !== opt.id);
                    updateResponse({ ...currentResponse, selectedOptions: newOpts, isSkipped: false });
                  }}
                />
                <label htmlFor={`opt-${opt.id}`} className="text-slate-700 text-sm font-medium leading-none cursor-pointer flex-1">
                  {opt.text}
                </label>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === "NUMERICAL") {
      return (
        <div className="mt-6">
           <Input
             type="text" // numeric input via text for precision/decimals
             placeholder="Enter your numerical answer..."
             value={currentResponse.answerText || ""}
             onChange={(e) => updateResponse({ ...currentResponse, answerText: e.target.value, isSkipped: false })}
             className="text-lg py-6"
           />
        </div>
      );
    }

    if (type === "SHORT_ANSWER") {
      return (
        <div className="mt-6">
           <Textarea
             placeholder="Write your answer concisely..."
             value={currentResponse.answerText || ""}
             onChange={(e) => updateResponse({ ...currentResponse, answerText: e.target.value, isSkipped: false })}
             rows={4}
             className="text-base"
           />
        </div>
      );
    }

    if (type === "DESCRIPTIVE") {
      return (
        <div className="mt-6">
           <Textarea
             placeholder="Write a detailed descriptive answer here..."
             value={currentResponse.answerText || ""}
             onChange={(e) => updateResponse({ ...currentResponse, answerText: e.target.value, isSkipped: false })}
             rows={10}
             className="text-base"
           />
        </div>
      );
    }

    return <p className="text-slate-500 mt-6">Unsupported question type.</p>;
  };

  const unansweredCount = questions.length - responses.filter(r => (r.selectedOptions?.length > 0 || (r.answerText && r.answerText.trim() !== "")) && !r.isSkipped).length;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">

        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
           <div>
             <h1 className="font-bold text-slate-900 text-lg truncate w-48 sm:w-64 md:w-auto">{quiz.title}</h1>
             <p className="text-xs text-slate-500">{quiz.subject} • {quiz.topic}</p>
           </div>
           <div className="flex items-center gap-4">
             {isAutosaving && <span className="text-xs text-slate-400 flex items-center"><Save className="h-3 w-3 mr-1 animate-pulse" /> Saving</span>}
             <Timer expiresAt={initialAttempt.expiresAt} onExpire={() => finalizeSubmission(true)} />
           </div>
        </header>

        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center mb-6">
               <span className="text-sm font-semibold text-slate-500 tracking-wider">QUESTION {currentIndex + 1} OF {questions.length}</span>
               <div className="flex gap-2">
                 <Badge variant="secondary" className="bg-violet-100 text-violet-800 hover:bg-violet-200">
                   {currentQuestion.marks} Marks
                 </Badge>
                 <Badge variant="outline" className="text-slate-500">
                   {currentQuestion.type.replace("_", " ")}
                 </Badge>
               </div>
             </div>

             <h2 className="text-2xl font-medium text-slate-900 leading-snug">
               {currentQuestion.text}
             </h2>

             {renderInput()}
          </div>
        </main>

        {/* Bottom Bar Options */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shrink-0 flex items-center justify-between z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
           <div className="flex gap-2">
             <Button variant="outline" onClick={handleClear}>Clear Answer</Button>
             <Button variant="ghost" onClick={handleSkip} className="text-slate-500 hover:text-amber-600 hover:bg-amber-50">Skip</Button>
           </div>
           <div className="flex gap-4">
             <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
               <ChevronLeft className="mr-1 h-4 w-4" /> Prev
             </Button>

             {currentIndex === questions.length - 1 ? (
               <Button onClick={() => setIsSubmitOpen(true)} className="bg-green-600 hover:bg-green-700">
                 <Send className="mr-2 h-4 w-4" /> Submit Quiz
               </Button>
             ) : (
               <Button onClick={handleNext} className="bg-violet-600 hover:bg-violet-700">
                 Next <ChevronRight className="ml-1 h-4 w-4" />
               </Button>
             )}
           </div>
        </div>

      </div>

      {/* Side Palette Panel */}
      <div className="w-full md:w-80 bg-white border-l border-slate-200 shrink-0 p-6 flex flex-col overflow-y-auto hidden md:flex">
         <QuestionPalette
           questions={questions}
           responses={responses}
           currentIndex={currentIndex}
           onSelect={setCurrentIndex}
         />

         <div className="mt-auto pt-8 flex items-center justify-center">
            <Button onClick={() => setIsSubmitOpen(true)} size="lg" className="w-full bg-green-600 hover:bg-green-700 shadow-md shadow-green-200">
              <Send className="mr-2 h-5 w-5" /> Submit Quiz
            </Button>
         </div>
      </div>

      {/* Mobile Palette Drawer could be added here, omitting for brevity */}

      <SubmitDialog
        open={isSubmitOpen}
        onOpenChange={setIsSubmitOpen}
        onSubmit={() => finalizeSubmission(false)}
        isSubmitting={isSubmitting}
        unansweredCount={unansweredCount}
        totalCount={questions.length}
      />
    </div>
  );
}