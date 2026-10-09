"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

export interface QuizConfiguration {
  title: string;
  subject: string;
  topic: string;
  description: string;
  durationMinutes: number;
  attemptsAllowed: number;
  scoreStrategy: "BEST" | "LATEST" | "AVERAGE";
  passMarkPercent: number;

  // AI Config
  numberOfQuestions: number;
  totalMarks: number;
  questionTypes: string[];
  difficultyLevel: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  cognitiveLevels: string[];
}

interface Step2ConfigureProps {
  config: QuizConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<QuizConfiguration>>;
  onNext: () => void;
  onBack: () => void;
}

const QUESTION_TYPES = [
  { id: "MCQ_SINGLE", label: "Single Choice (MCQ)" },
  { id: "MCQ_MULTIPLE", label: "Multiple Choice" },
  { id: "TRUE_FALSE", label: "True / False" },
  { id: "NUMERICAL", label: "Numerical" },
  { id: "SHORT_ANSWER", label: "Short Answer" },
  { id: "DESCRIPTIVE", label: "Descriptive / Essay" },
];

const COGNITIVE_LEVELS = [
  { id: "REMEMBER", label: "Remember" },
  { id: "UNDERSTAND", label: "Understand" },
  { id: "APPLY", label: "Apply" },
  { id: "ANALYZE", label: "Analyze" },
  { id: "EVALUATE", label: "Evaluate" },
];

export default function Step2Configure({ config, setConfig, onNext, onBack }: Step2ConfigureProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof QuizConfiguration, string>>>({});

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleTypeToggle = (id: string, checked: boolean) => {
    setConfig(prev => {
      const types = checked
        ? [...prev.questionTypes, id]
        : prev.questionTypes.filter(t => t !== id);
      return { ...prev, questionTypes: types };
    });
  };

  const handleCogToggle = (id: string, checked: boolean) => {
    setConfig(prev => {
      const levels = checked
        ? [...prev.cognitiveLevels, id]
        : prev.cognitiveLevels.filter(l => l !== id);
      return { ...prev, cognitiveLevels: levels };
    });
  };

  const validate = () => {
    const newErrors: any = {};
    if (!config.title.trim()) newErrors.title = "Required";
    if (!config.subject.trim()) newErrors.subject = "Required";
    if (!config.topic.trim()) newErrors.topic = "Required";
    if (config.questionTypes.length === 0) newErrors.questionTypes = "Select at least one type";
    if (config.numberOfQuestions < 1) newErrors.numberOfQuestions = "Must be > 0";
    if (config.totalMarks < 1) newErrors.totalMarks = "Must be > 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configure Quiz</h2>
          <p className="text-slate-500 mt-1">Set the parameters for your quiz generation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" value={config.title} onChange={handleTextChange} placeholder="e.g. Midterm Algorithms Assessment" />
                {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                  <Input id="subject" name="subject" value={config.subject} onChange={handleTextChange} placeholder="e.g. Computer Science" />
                  {errors.subject && <span className="text-red-500 text-sm">{errors.subject}</span>}
                </div>
                <div>
                  <Label htmlFor="topic">Topic <span className="text-red-500">*</span></Label>
                  <Input id="topic" name="topic" value={config.topic} onChange={handleTextChange} placeholder="e.g. Data Trees" />
                  {errors.topic && <span className="text-red-500 text-sm">{errors.topic}</span>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" value={config.description} onChange={handleTextChange} placeholder="Instructions for students..." rows={3} />
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b">Quiz Rules</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="durationMinutes">Duration (Minutes)</Label>
                  <Input id="durationMinutes" name="durationMinutes" type="number" min={5} value={config.durationMinutes} onChange={handleNumberChange} />
                </div>
                <div>
                  <Label htmlFor="attemptsAllowed">Attempts Allowed</Label>
                  <Input id="attemptsAllowed" name="attemptsAllowed" type="number" min={1} value={config.attemptsAllowed} onChange={handleNumberChange} />
                </div>
                <div>
                  <Label htmlFor="passMarkPercent">Pass Mark (%)</Label>
                  <Input id="passMarkPercent" name="passMarkPercent" type="number" min={1} max={100} value={config.passMarkPercent} onChange={handleNumberChange} />
                </div>
                <div>
                  <Label htmlFor="scoreStrategy">Scoring Strategy</Label>
                  <select
                    id="scoreStrategy"
                    name="scoreStrategy"
                    value={config.scoreStrategy}
                    onChange={handleTextChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="BEST">Best Attempt</option>
                    <option value="LATEST">Latest Attempt</option>
                    <option value="AVERAGE">Average Score</option>
                  </select>
                </div>
             </div>
          </div>
        </div>

        {/* AI Config */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b">AI Generation Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="numberOfQuestions">Total Questions <span className="text-red-500">*</span></Label>
                <Input id="numberOfQuestions" name="numberOfQuestions" type="number" min={1} max={100} value={config.numberOfQuestions} onChange={handleNumberChange} />
                {errors.numberOfQuestions && <span className="text-red-500 text-sm">{errors.numberOfQuestions}</span>}
              </div>
              <div>
                <Label htmlFor="totalMarks">Total Marks <span className="text-red-500">*</span></Label>
                <Input id="totalMarks" name="totalMarks" type="number" min={1} value={config.totalMarks} onChange={handleNumberChange} />
                {errors.totalMarks && <span className="text-red-500 text-sm">{errors.totalMarks}</span>}
              </div>

              <div className="col-span-2">
                <Label htmlFor="difficultyLevel">Overall Difficulty</Label>
                <select
                  id="difficultyLevel"
                  name="difficultyLevel"
                  value={config.difficultyLevel}
                  onChange={handleTextChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="MIXED">Mixed (Balanced)</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <Label className="mb-3 block">Question Types Included <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {QUESTION_TYPES.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox id={`type-${type.id}`} checked={config.questionTypes.includes(type.id)} onCheckedChange={(c) => handleTypeToggle(type.id, c as boolean)} />
                    <Label htmlFor={`type-${type.id}`} className="font-normal cursor-pointer">{type.label}</Label>
                  </div>
                ))}
              </div>
              {errors.questionTypes && <span className="text-red-500 text-sm block mt-2">{errors.questionTypes}</span>}
            </div>

            <div>
              <Label className="mb-3 block">Cognitive Levels (Bloom's Taxonomy) - Optional</Label>
              <div className="grid grid-cols-2 gap-3 border bg-slate-50 p-4 rounded-lg">
                {COGNITIVE_LEVELS.map(level => (
                  <div key={level.id} className="flex items-center space-x-2">
                    <Checkbox id={`cog-${level.id}`} checked={config.cognitiveLevels.includes(level.id)} onCheckedChange={(c) => handleCogToggle(level.id, c as boolean)} />
                    <Label htmlFor={`cog-${level.id}`} className="font-normal cursor-pointer text-slate-700">{level.label}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Leave all unchecked to allow any mix of cognitive levels.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 mt-8">
        <Button
          size="lg"
          onClick={() => { if(validate()) onNext(); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Generate Questions
        </Button>
      </div>
    </div>
  );
}