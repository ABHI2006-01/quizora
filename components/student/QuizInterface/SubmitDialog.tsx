"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  unansweredCount: number;
  totalCount: number;
}

export default function SubmitDialog({ open, onOpenChange, onSubmit, isSubmitting, unansweredCount, totalCount }: SubmitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">Submit Quiz?</DialogTitle>
          <DialogDescription className="text-slate-500 mt-2">
            Are you sure you want to finish your attempt? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {unansweredCount > 0 ? (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800 text-sm mb-1">Unanswered Questions</p>
                <p className="text-amber-700/90 text-sm">
                  You have <strong>{unansweredCount}</strong> out of {totalCount} questions left blank or skipped. You can still go back and answer them.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <p className="font-medium text-green-800 text-sm">You have answered all questions. Great job!</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Continue Quiz
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-none"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Yes, Submit Final Answers"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}