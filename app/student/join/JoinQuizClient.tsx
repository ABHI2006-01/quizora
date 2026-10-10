"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, BookOpen, Clock, Loader2, PlayCircle, Target, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function JoinQuizClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("Quiz code must be exactly 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/quiz/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to validate code.");

      setPreviewData(data.quiz);
      setIsModalOpen(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!previewData) return;

    setIsStarting(true);
    try {
      const res = await fetch(`/api/quiz/${previewData.id}/start`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to start quiz.");

      toast.success(data.resumed ? "Resuming existing attempt..." : "Attempt started!");
      router.push(`/student/quiz/${previewData.id}`);
    } catch (error: any) {
      toast.error(error.message);
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 animate-in fade-in zoom-in-95 duration-500">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="text-center pb-8 border-b bg-slate-50 rounded-t-xl">
          <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-110">
            <Target className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Join a Quiz</CardTitle>
          <CardDescription className="text-slate-500 mt-2 text-base">
            Enter the 6-character code provided by your teacher.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="text-center text-4xl font-mono tracking-[0.5em] py-8 uppercase focus-visible:ring-violet-500"
                maxLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg"
              disabled={code.length !== 6 || isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => !isStarting && setIsModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
              {previewData?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Hosted by {previewData?.teacherName || "your instructor"}
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="py-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <div className="flex items-center text-slate-700 text-sm">
                  <BookOpen className="h-4 w-4 mr-3 text-violet-500" />
                  <span className="font-medium w-24">Subject:</span>
                  <span className="truncate">{previewData.subject} • {previewData.topic}</span>
                </div>
                <div className="flex items-center text-slate-700 text-sm">
                  <Target className="h-4 w-4 mr-3 text-violet-500" />
                  <span className="font-medium w-24">Questions:</span>
                  <span>{previewData.questionCount}</span>
                </div>
                <div className="flex items-center text-slate-700 text-sm">
                  <Clock className="h-4 w-4 mr-3 text-violet-500" />
                  <span className="font-medium w-24">Duration:</span>
                  <span>{previewData.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center text-slate-700 text-sm">
                  <Users className="h-4 w-4 mr-3 text-violet-500" />
                  <span className="font-medium w-24">Attempts:</span>
                  <span>
                    {previewData.attemptsAllowed > 0
                      ? `${previewData.previousAttempts} / ${previewData.attemptsAllowed} used`
                      : "Unlimited"}
                  </span>
                </div>
              </div>

              {previewData.description && (
                <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <span className="font-semibold text-blue-900 block mb-1">Instructions:</span>
                  {previewData.description}
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
                 <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                 <div>
                   <p className="font-medium mb-1">Ready to begin?</p>
                   <p className="text-amber-700/90 text-xs">Once started, the timer cannot be paused. Ensure you have a stable internet connection.</p>
                 </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isStarting}>
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-none"
            >
              {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
              Start Attempt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}