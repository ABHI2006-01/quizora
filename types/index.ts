// Shared TypeScript types for Quizora

export type Role = "TEACHER" | "STUDENT";
export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type QuestionType =
  | "MCQ_SINGLE"
  | "MCQ_MULTIPLE"
  | "TRUE_FALSE"
  | "NUMERICAL"
  | "SHORT_ANSWER"
  | "DESCRIPTIVE";
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "MIXED";
export type CognitiveLevel =
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE";
export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "EXPIRED";
export type ScoreStrategy = "BEST" | "LATEST" | "AVERAGE";
export type AIProvider = "claude" | "gemini";

// Quiz configuration passed to AI for generation
export interface QuizConfig {
  title: string;
  subject: string;
  topic: string;
  numberOfQuestions: number;
  questionTypes: QuestionType[];
  difficultyLevel: DifficultyLevel;
  cognitiveLevels?: CognitiveLevel[];
  totalMarks: number;
}

// Single AI-generated question (before saving to DB)
export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  cognitiveLevel?: CognitiveLevel;
  topicTag?: string;
  explanation?: string;
  options?: { text: string; isCorrect: boolean }[]; // MCQ / T/F
  correctAnswer?: string;   // numerical
  tolerance?: number;       // numerical
  modelAnswer?: string;     // short answer / descriptive
  rubric?: string;          // descriptive
}

// AI evaluation result for a subjective answer
export interface AIEvaluationResult {
  score: number;
  confidence: number;
  reasoning: string;
}

// Student answer submission per question
export interface QuestionAnswer {
  questionId: string;
  selectedOptions?: string[]; // option IDs for MCQ
  answerText?: string;        // numerical / short / descriptive
  isSkipped: boolean;
}

// Dashboard stats for teacher
export interface TeacherDashboardStats {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalStudentsAttempted: number;
  overallAverageScore: number;
}

// Dashboard stats for student
export interface StudentDashboardStats {
  quizzesCompleted: number;
  averageScore: number;
  highestScore: number;
  overallAccuracy: number;
}

// Topic performance entry
export interface TopicPerformance {
  topic: string;
  accuracy: number;       // 0-100
  correct: number;
  total: number;
}

// Quiz performance summary (teacher view)
export interface QuizPerformanceSummary {
  totalStudents: number;
  submitted: number;
  notSubmitted: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
}

// Student row in performance table
export interface StudentPerformanceRow {
  studentId: string;
  name: string;
  rollNumber: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timeTakenSeconds: number | null;
  status: AttemptStatus;
  attemptNumber: number;
}
